import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas, Enums } from 'lideris-commoms-microservice';
import { CreatePatientSoatCaseDto } from '@shared/dto/patient-soat-case.dto';

@Injectable()
export class CreatePatientSoatCaseService {
  constructor(
    @InjectModel(Schemas.PatientSoatCase.name)
    private readonly patientSoatCaseModel: Model<Schemas.PatientSoatCaseDocument>,
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
  ) {}

  async execute(
    patientId: string,
    companyId: string,
    dto: CreatePatientSoatCaseDto,
  ): Promise<Schemas.PatientSoatCaseDocument> {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new BadRequestException('PATIENT_REQUIRED_OR_INVALID');
    }

    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('COMPANY_REQUIRED_OR_INVALID');
    }

    const patientObjectId = new Types.ObjectId(patientId);
    const companyObjectId = new Types.ObjectId(companyId);

    const patient = await this.userModel.findOne(
      { _id: patientObjectId, companies: companyObjectId },
      { _id: 1 },
    );

    if (!patient) {
      throw new NotFoundException('PATIENT_NOT_FOUND');
    }

    const status: Enums.PatientSoatCaseStatusEnum =
      dto.status ?? Enums.PatientSoatCaseStatusEnum.DRAFT;

    const created = await this.patientSoatCaseModel.create({
      companyId: companyObjectId,
      patientId: patientObjectId,
      status,
      form: dto.form,
    });

    return created;
  }
}
