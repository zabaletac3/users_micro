import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';

@Injectable()
export class FindJudicialAuthorityNoticeByIdService {
  constructor(
    @InjectModel(Schemas.JudicialAuthorityNotice.name)
    private readonly judicialNoticeModel: Model<Schemas.JudicialAuthorityNoticeDocument>,
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
  ) {}

  async execute(
    patientId: string,
    companyId: string,
    noticeId: string,
  ): Promise<Schemas.JudicialAuthorityNoticeDocument> {
    if (!Types.ObjectId.isValid(patientId) || !Types.ObjectId.isValid(noticeId)) {
      throw new BadRequestException('PATIENT_OR_NOTICE_ID_INVALID');
    }

    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('COMPANY_REQUIRED_OR_INVALID');
    }

    const patientObjectId = new Types.ObjectId(patientId);
    const companyObjectId = new Types.ObjectId(companyId);
    const noticeObjectId = new Types.ObjectId(noticeId);

    const patient = await this.userModel.findOne(
      { _id: patientObjectId, companies: companyObjectId },
      { _id: 1 },
    );

    if (!patient) {
      throw new NotFoundException('PATIENT_NOT_FOUND');
    }

    const doc = await this.judicialNoticeModel
      .findOne({
        _id: noticeObjectId,
        patientId: patientObjectId,
        companyId: companyObjectId,
      })
      .exec();

    if (!doc) {
      throw new NotFoundException('JUDICIAL_AUTHORITY_NOTICE_NOT_FOUND');
    }

    return doc;
  }
}
