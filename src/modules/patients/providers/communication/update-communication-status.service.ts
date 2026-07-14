import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';

import { CommunicationStatusEnum } from './communication.enums';

export interface UpdateCommunicationStatusDto {
  status: CommunicationStatusEnum;
  observations?: string;
}

@Injectable()
export class UpdateCommunicationStatusService {
  constructor(
    @InjectModel(Schemas.PatientCommunication.name)
    private readonly communicationModel: Model<Schemas.PatientCommunicationDocument>,
  ) {}

  async execute(
    communicationId: string,
    patientId: string,
    companyId: string,
    dto: UpdateCommunicationStatusDto,
    performedBy: string,
  ): Promise<Schemas.PatientCommunicationDocument> {
    if (!Types.ObjectId.isValid(communicationId)) {
      throw new BadRequestException('COMMUNICATION_REQUIRED_OR_INVALID');
    }

    const record = await this.communicationModel.findOne({
      _id: new Types.ObjectId(communicationId),
      patientId: new Types.ObjectId(patientId),
      companyId: new Types.ObjectId(companyId),
    });

    if (!record) {
      throw new NotFoundException('COMMUNICATION_NOT_FOUND');
    }

    record.status = dto.status;

    if (dto.observations) {
      record.observations = dto.observations;
    }

    record.updatedBy = new Types.ObjectId(performedBy);
    record.updatedAt = new Date();

    return record.save();
  }
}
