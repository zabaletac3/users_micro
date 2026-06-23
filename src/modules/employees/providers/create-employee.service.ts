import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas, Utils } from 'lideris-commoms-microservice';
import { ResendProvider } from '@shared/providers/resend.provider';
import * as EmployeeDtos from '@shared/dto/employees';
import { I18nKeys } from '@shared/constants/i18n-keys.constants';

import { OrganizationGrpcClientService } from './organization-grpc-client.service';
import { EmployeesKafkaService } from './employees-kafka.service';

@Injectable()
export class CreateEmployeeService {
  private readonly logger = new Logger(CreateEmployeeService.name);

  constructor(
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
    @InjectModel(Schemas.Document.name)
    private readonly documentModel: Model<Schemas.DocumentDocument>,
    private readonly organizationGrpc: OrganizationGrpcClientService,
    private readonly employeesKafka: EmployeesKafkaService,
    private readonly resendProvider: ResendProvider,
  ) {}

  async create(
    dto: EmployeeDtos.CreateEmployeeDto,
    companyId: string,
  ): Promise<{ messageKey: string; data: Schemas.UserDocument }> {
    // gRPC validation of related entities
    const validation = await this.organizationGrpc.validateEntities({
      companyId,
      positionIds: dto.position ? [dto.position] : [],
      departmentIds: dto.departmentIds ?? [],
      areaIds: dto.areaIds ?? [],
    });

    if (!validation.valid) {
      const parts: string[] = [];

      if (validation.company) parts.push(`${I18nKeys.COMPANY_NOT_FOUND}: ${validation.company}`);
      if (validation.missingPositions.length)
        parts.push(`${I18nKeys.POSITION_NOT_FOUND}: ${validation.missingPositions.join(', ')}`);
      if (validation.missingDepartments.length)
        parts.push(`${I18nKeys.DEPARTMENT_NOT_FOUND}: ${validation.missingDepartments.join(', ')}`);
      if (validation.missingAreas.length)
        parts.push(`${I18nKeys.AREA_NOT_FOUND}: ${validation.missingAreas.join(', ')}`);
      if (validation.departmentsNotInPosition?.length)
        parts.push(
          `${I18nKeys.DEPARTMENT_NOT_IN_POSITION}: ${validation.departmentsNotInPosition.join(', ')}`,
        );
      if (validation.areasNotInPosition?.length)
        parts.push(`${I18nKeys.AREA_NOT_IN_POSITION}: ${validation.areasNotInPosition.join(', ')}`);
      throw new BadRequestException(parts.join('; '));
    }

    // Check documentNumber uniqueness
    const existingDoc = await this.userModel.findOne({
      documentNumber: dto.documentNumber,
      deletedAt: null,
    });

    if (existingDoc) {
      throw new ConflictException(
        `${I18nKeys.EMPLOYEE_DOCUMENT_NUMBER_EXISTS}: ${dto.documentNumber}`,
      );
    }

    // Check email uniqueness
    const existingEmail = await this.userModel.findOne({ email: dto.email, deletedAt: null });

    if (existingEmail) {
      throw new ConflictException(`${I18nKeys.EMPLOYEE_EMAIL_EXISTS}: ${dto.email}`);
    }

    const customPassword = `${dto.name.toLowerCase()[0]}.${dto.lastName.toLowerCase()[0]}.${dto.documentNumber}`;

    this.logger.log('Generated password for new employee');

    const hashedPassword = await Utils.hashPassword(customPassword);

    const employee = new this.userModel({
      ...dto,
      userName: `${dto.name.toLowerCase()}.${dto.lastName.toLowerCase()}`,
      password: hashedPassword,
      companies: [companyId],
      companySelected: companyId,
      departmentIds: dto.departmentIds?.length
        ? dto.departmentIds.map((id) => new Types.ObjectId(id))
        : [],
      areaIds: dto.areaIds?.length ? dto.areaIds.map((id) => new Types.ObjectId(id)) : [],
      position: dto.position ? [new Types.ObjectId(dto.position)] : [],
    });

    await employee.save();

    // Send welcome email
    try {
      await this.resendProvider.sendGenericEmail({
        email: dto.email,
        html: `<p>Welcome ${dto.name} ${dto.lastName}! Your account has been created. Your temporary password is: <strong>${customPassword}</strong></p>`,
        subject: 'Welcome - Account Created',
      });
    } catch (emailError) {
      this.logger.error('Failed to send welcome email', emailError);
    }

    // Emit Kafka event
    const fullName = [dto.name, dto.lastName].filter(Boolean).join(' ');

    this.employeesKafka.emitEmployeeCreated({
      userId: employee._id.toString(),
      companyId,
      email: dto.email,
      fullName,
      positionIds: dto.position ? [dto.position] : [],
    });

    const result = employee.toObject
      ? (employee.toObject() as Schemas.UserDocument)
      : (employee as unknown as Schemas.UserDocument);

    return { messageKey: I18nKeys.EMPLOYEE_CREATED_SUCCESS, data: result };
  }
}
