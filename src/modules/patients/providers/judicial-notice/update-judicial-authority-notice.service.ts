import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';
import { UpdateJudicialAuthorityNoticeDto } from '@shared/dto/judicial-authority-notice.dto';

import { resolveSoatCaseIdForNotice } from './judicial-authority-notice-soat-validation';

@Injectable()
export class UpdateJudicialAuthorityNoticeService {
  constructor(
    @InjectModel(Schemas.JudicialAuthorityNotice.name)
    private readonly judicialNoticeModel: Model<Schemas.JudicialAuthorityNoticeDocument>,
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
    @InjectModel(Schemas.PatientSoatCase.name)
    private readonly patientSoatCaseModel: Model<Schemas.PatientSoatCaseDocument>,
  ) {}

  async execute(
    patientId: string,
    companyId: string,
    noticeId: string,
    dto: UpdateJudicialAuthorityNoticeDto,
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

    const existing = await this.judicialNoticeModel
      .findOne({
        _id: noticeObjectId,
        patientId: patientObjectId,
        companyId: companyObjectId,
      })
      .exec();

    if (!existing) {
      throw new NotFoundException('JUDICIAL_AUTHORITY_NOTICE_NOT_FOUND');
    }

    const $set: Record<string, unknown> = {};

    if (dto.soatCaseId !== undefined) {
      if (dto.soatCaseId === null || dto.soatCaseId === '') {
        $set.soatCaseId = null;
      } else {
        $set.soatCaseId = await resolveSoatCaseIdForNotice(
          this.patientSoatCaseModel,
          dto.soatCaseId,
          patientObjectId,
          companyObjectId,
        );
      }
    }

    const dtoKeys = Object.keys(dto) as (keyof UpdateJudicialAuthorityNoticeDto)[];

    for (const key of dtoKeys) {
      if (key === 'soatCaseId') {
        continue;
      }
      const v = dto[key];

      if (v !== undefined) {
        $set[key] = v;
      }
    }

    const updated = await this.judicialNoticeModel
      .findOneAndUpdate(
        { _id: noticeObjectId, patientId: patientObjectId, companyId: companyObjectId },
        { $set },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('JUDICIAL_AUTHORITY_NOTICE_NOT_FOUND');
    }

    return updated;
  }
}
