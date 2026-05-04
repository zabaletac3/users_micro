import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';

export interface ListJudicialAuthorityNoticesResult {
  items: Schemas.JudicialAuthorityNoticeDocument[];
}

@Injectable()
export class ListJudicialAuthorityNoticesService {
  constructor(
    @InjectModel(Schemas.JudicialAuthorityNotice.name)
    private readonly judicialNoticeModel: Model<Schemas.JudicialAuthorityNoticeDocument>,
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
  ) {}

  async execute(
    patientId: string,
    companyId: string,
    soatCaseId?: string,
  ): Promise<ListJudicialAuthorityNoticesResult> {
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

    const filter: Record<string, unknown> = {
      patientId: patientObjectId,
      companyId: companyObjectId,
    };

    if (soatCaseId != null && soatCaseId !== '') {
      if (!Types.ObjectId.isValid(soatCaseId)) {
        throw new BadRequestException('SOAT_CASE_ID_INVALID');
      }
      filter.soatCaseId = new Types.ObjectId(soatCaseId);
    }

    const items = await this.judicialNoticeModel.find(filter).sort({ createdAt: -1 }).exec();

    return { items };
  }
}
