import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';

export interface ListCommunicationsQuery {
  patientId: string;
  companyId: string;
  page?: number;
  limit?: number;
  search?: string;
}

@Injectable()
export class ListCommunicationsService {
  constructor(
    @InjectModel(Schemas.PatientCommunication.name)
    private readonly communicationModel: Model<Schemas.PatientCommunicationDocument>,
  ) {}

  async execute(query: ListCommunicationsQuery) {
    const { patientId, companyId, page = 1, limit = 100, search } = query;

    if (!Types.ObjectId.isValid(patientId)) {
      throw new BadRequestException('PATIENT_REQUIRED_OR_INVALID');
    }

    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('COMPANY_REQUIRED_OR_INVALID');
    }

    const filter: Record<string, unknown> = {
      patientId: new Types.ObjectId(patientId),
      companyId: new Types.ObjectId(companyId),
    };

    if (search) {
      filter['$or'] = [
        { requirementType: { $regex: search, $options: 'i' } },
        { applicantName: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.communicationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.communicationModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }
}
