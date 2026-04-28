import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';

export interface ListPatientSoatCasesResult {
  items: Schemas.PatientSoatCaseDocument[];
}

@Injectable()
export class ListPatientSoatCasesService {
  constructor(
    @InjectModel(Schemas.PatientSoatCase.name)
    private readonly patientSoatCaseModel: Model<Schemas.PatientSoatCaseDocument>,
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
  ) {}

  async execute(patientId: string, companyId: string): Promise<ListPatientSoatCasesResult> {
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

    const items = await this.patientSoatCaseModel
      .find({ patientId: patientObjectId, companyId: companyObjectId })
      .sort({ createdAt: -1 })
      .exec();

    return { items };
  }
}
