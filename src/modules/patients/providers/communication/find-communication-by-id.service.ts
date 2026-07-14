import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';

@Injectable()
export class FindCommunicationByIdService {
  constructor(
    @InjectModel(Schemas.PatientCommunication.name)
    private readonly communicationModel: Model<Schemas.PatientCommunicationDocument>,
  ) {}

  async execute(
    communicationId: string,
    patientId: string,
    companyId: string,
  ): Promise<Schemas.PatientCommunicationDocument> {
    if (!Types.ObjectId.isValid(communicationId)) {
      throw new BadRequestException('COMMUNICATION_REQUIRED_OR_INVALID');
    }

    if (!Types.ObjectId.isValid(patientId)) {
      throw new BadRequestException('PATIENT_REQUIRED_OR_INVALID');
    }

    const record = await this.communicationModel.findOne({
      _id: new Types.ObjectId(communicationId),
      patientId: new Types.ObjectId(patientId),
      companyId: new Types.ObjectId(companyId),
    });

    if (!record) {
      throw new NotFoundException('COMMUNICATION_NOT_FOUND');
    }

    return record;
  }
}
