import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';

import { CreateCommunicationDto } from './create-communication.dto';
import { CommunicationStatusEnum, RequirementTypeEnum } from './communication.enums';

@Injectable()
export class CreateCommunicationService {
  constructor(
    @InjectModel(Schemas.PatientCommunication.name)
    private readonly communicationModel: Model<Schemas.PatientCommunicationDocument>,
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
  ) {}

  async execute(
    patientId: string,
    companyId: string,
    dto: CreateCommunicationDto,
    performedBy: string,
  ): Promise<Schemas.PatientCommunicationDocument> {
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

    const payload = this.buildPayload(dto, patientObjectId, companyObjectId, performedBy);

    return this.communicationModel.create(payload);
  }

  private buildPayload(
    dto: CreateCommunicationDto,
    patientObjectId: Types.ObjectId,
    companyObjectId: Types.ObjectId,
    performedBy: string,
  ) {
    const base = {
      patientId: patientObjectId,
      companyId: companyObjectId,
      applicantRelationship: dto.applicantRelationship,
      applicantName: dto.applicantName,
      communicationChannel: dto.communicationChannel,
      requirementType: dto.requirementType,
      phone: dto.phone,
      email: dto.email,
      status: CommunicationStatusEnum.PENDING,
      createdBy: new Types.ObjectId(performedBy),
    };

    switch (dto.requirementType) {
      case RequirementTypeEnum.CLINICAL_RECORD:
        return {
          ...base,
          communicationMedium: dto.communicationMedium,
          clinicalRecordIds: dto.clinicalRecordIds.map((id) => new Types.ObjectId(id)),
        };

      case RequirementTypeEnum.REDIRECTION:
        return {
          ...base,
          destinationArea: dto.destinationArea,
          redirectionReason: dto.redirectionReason,
        };

      case RequirementTypeEnum.PATIENT_INFORMATION:
        return {
          ...base,
          requestReason: dto.requestReason,
          description: dto.description,
        };

      case RequirementTypeEnum.PQRS:
        return {
          ...base,
          pqrsType: dto.pqrsType,
          relatedArea: dto.relatedArea,
          subject: dto.subject,
          caseDescription: dto.caseDescription,
        };
    }
  }
}
