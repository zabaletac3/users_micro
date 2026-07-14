import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';

import {
  CreateCommunicationDto,
  CreateClinicalRecordCommunicationDto,
  CreateRedirectionCommunicationDto,
  CreatePatientInformationCommunicationDto,
  CreatePqrsCommunicationDto,
} from '@shared/dto/patient-communication.dto';
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
      case RequirementTypeEnum.CLINICAL_RECORD: {
        const typed = dto as CreateClinicalRecordCommunicationDto;
        return {
          ...base,
          communicationMedium: typed.communicationMedium,
          clinicalRecordIds: typed.clinicalRecordIds.map((id) => new Types.ObjectId(id)),
        };
      }

      case RequirementTypeEnum.REDIRECTION: {
        const typed = dto as CreateRedirectionCommunicationDto;
        return {
          ...base,
          destinationArea: typed.destinationArea,
          redirectionReason: typed.redirectionReason,
        };
      }

      case RequirementTypeEnum.PATIENT_INFORMATION: {
        const typed = dto as CreatePatientInformationCommunicationDto;
        return {
          ...base,
          requestReason: typed.requestReason,
          description: typed.description,
        };
      }

      case RequirementTypeEnum.PQRS: {
        const typed = dto as CreatePqrsCommunicationDto;
        return {
          ...base,
          pqrsType: typed.pqrsType,
          relatedArea: typed.relatedArea,
          subject: typed.subject,
          caseDescription: typed.caseDescription,
        };
      }
    }
  }
}
