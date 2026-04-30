import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';
import { CreateJudicialAuthorityNoticeDto } from '@shared/dto/judicial-authority-notice.dto';

import { resolveSoatCaseIdForNotice } from './judicial-authority-notice-soat-validation';

@Injectable()
export class CreateJudicialAuthorityNoticeService {
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
    dto: CreateJudicialAuthorityNoticeDto,
  ): Promise<Schemas.JudicialAuthorityNoticeDocument> {
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

    let soatCaseObjectId: Types.ObjectId | undefined;

    if (dto.soatCaseId != null && dto.soatCaseId !== '') {
      soatCaseObjectId = await resolveSoatCaseIdForNotice(
        this.patientSoatCaseModel,
        dto.soatCaseId,
        patientObjectId,
        companyObjectId,
      );
    }

    const created = await this.judicialNoticeModel.create({
      companyId: companyObjectId,
      patientId: patientObjectId,
      ...(soatCaseObjectId !== undefined ? { soatCaseId: soatCaseObjectId } : {}),
      patientAdmissionDate: dto.patientAdmissionDate,
      patientAdmissionTime: dto.patientAdmissionTime,
      victimReferredFromAnotherIps: dto.victimReferredFromAnotherIps,
      referringIps: dto.referringIps,
      careDetails: dto.careDetails,
      injuriesOrConditionDescription: dto.injuriesOrConditionDescription,
      treatmentsPerformed: dto.treatmentsPerformed,
      policeContactEmail: dto.policeContactEmail,
      prosecutorContactEmail: dto.prosecutorContactEmail,
      noticeResponsibleName: dto.noticeResponsibleName,
      noticeResponsiblePosition: dto.noticeResponsiblePosition,
      ipsSignatureAndSeal: dto.ipsSignatureAndSeal,
    });

    return created;
  }
}
