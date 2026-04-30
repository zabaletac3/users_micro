import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Schemas, Enums } from 'lideris-commoms-microservice';
import { FindPatientByIdResponseDto } from '@shared/dto/find-patient-by-id-response.dto';
import { IdentifyPatientDto } from '@shared/dto/identify-patient.dto';

import { FindPatientByIdService } from './find-patient-by-id.service';

@Injectable()
export class IdentifyPatientService {
  constructor(
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
    @InjectModel(Schemas.UserAffiliation.name)
    private readonly userAffiliationModel: Model<Schemas.UserAffiliationDocument>,
    @InjectModel(Schemas.UserClinicalProfile.name)
    private readonly userClinicalProfileModel: Model<Schemas.UserClinicalProfileDocument>,
    @InjectModel(Schemas.Payer.name)
    private readonly payerModel: Model<Schemas.PayerDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly findPatientByIdService: FindPatientByIdService,
  ) {}

  async execute(
    id: string,
    companyId: string,
    dto: IdentifyPatientDto,
    userId: string,
  ): Promise<FindPatientByIdResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('PATIENT_REQUIRED_OR_INVALID');
    }

    if (!companyId || !Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('COMPANY_REQUIRED_OR_INVALID');
    }

    const patientObjectId = new Types.ObjectId(id);
    const companyObjectId = new Types.ObjectId(companyId);

    const patient = await this.userModel.findOne(
      { _id: patientObjectId, companies: companyObjectId },
      { _id: 1, documentType: 1 },
    );

    if (!patient) throw new NotFoundException('PATIENT_NOT_FOUND');

    if (patient.documentType !== Enums.PatientDocumentType.NN) {
      throw new BadRequestException('PATIENT_IS_NOT_NN');
    }

    if (dto.documentType === Enums.PatientDocumentType.NN) {
      throw new BadRequestException('DOCUMENT_TYPE_NN_NOT_ALLOWED');
    }

    if (dto.affiliation.payerId) {
      const payerExists = await this.payerModel.exists({
        _id: new Types.ObjectId(dto.affiliation.payerId),
      });

      if (!payerExists) throw new NotFoundException('PAYER_NOT_FOUND');
    }

    const { affiliation, ...basicFields } = dto;

    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      await this.userModel.updateOne(
        { _id: patientObjectId },
        {
          $set: basicFields,
          $push: {
            patientHistory: {
              eventType: Enums.PatientHistoryEventTypeEnum.IDENTIFIED,
              timestamp: new Date(),
              performedBy: new Types.ObjectId(userId),
              description: 'NN patient identified',
            },
          },
        },
        { session },
      );

      const [created] = await this.userAffiliationModel.create(
        [
          {
            companyId: companyObjectId,
            patientId: patientObjectId,
            agreementType: affiliation.agreementType,
            payerId: affiliation.payerId ? new Types.ObjectId(affiliation.payerId) : undefined,
            regime: affiliation.regime,
            affiliationType: affiliation.affiliationType,
            startDate: affiliation.startDate,
          },
        ],
        { session },
      );

      await this.userClinicalProfileModel.updateOne(
        { userId: patientObjectId, companyId: companyObjectId },
        { $set: { userAffiliationId: created._id } },
        { session },
      );

      await session.commitTransaction();
    } catch (e) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw e;
    } finally {
      session.endSession();
    }

    return this.findPatientByIdService.execute(id, { companyId });
  }
}
