import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Schemas, Enums } from 'lideris-commoms-microservice';
import { ImportPatientDto } from '@shared/dto/import-patient.dto';
import { FindPatientByIdResponseDto } from '@shared/dto/find-patient-by-id-response.dto';

import { FindPatientByIdService } from './find-patient-by-id.service';

@Injectable()
export class ImportPatientService {
  constructor(
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
    @InjectModel(Schemas.UserAffiliation.name)
    private readonly userAffiliationModel: Model<Schemas.UserAffiliationDocument>,
    @InjectModel(Schemas.UserClinicalProfile.name)
    private readonly userClinicalProfileModel: Model<Schemas.UserClinicalProfileDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly findPatientByIdService: FindPatientByIdService,
  ) {}

  async execute(
    id: string,
    companyId: string,
    dto: ImportPatientDto,
    userId: string,
  ): Promise<FindPatientByIdResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('PATIENT_REQUIRED_OR_INVALID');
    }

    if (!companyId || !Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('COMPANY_REQUIRED_OR_INVALID');
    }

    if (!Types.ObjectId.isValid(dto.targetPatientId)) {
      throw new BadRequestException('TARGET_PATIENT_REQUIRED_OR_INVALID');
    }

    const patientObjectId = new Types.ObjectId(id);
    const companyObjectId = new Types.ObjectId(companyId);
    const targetObjectId = new Types.ObjectId(dto.targetPatientId);

    if (patientObjectId.equals(targetObjectId)) {
      throw new BadRequestException('CANNOT_IMPORT_PATIENT_WITH_ITSELF');
    }

    const [nnPatient, targetPatient] = await Promise.all([
      this.userModel.findOne(
        { _id: patientObjectId, companies: companyObjectId },
        { _id: 1, documentType: 1, patientHistory: 1 },
      ),
      this.userModel.findOne({ _id: targetObjectId }, { _id: 1, documentType: 1, companies: 1 }),
    ]);

    if (!nnPatient) throw new NotFoundException('PATIENT_NOT_FOUND');
    if (!targetPatient) throw new NotFoundException('TARGET_PATIENT_NOT_FOUND');

    if (targetPatient.documentType === Enums.PatientDocumentType.NN) {
      throw new BadRequestException('TARGET_PATIENT_IS_NN');
    }

    const alreadyInCompany = targetPatient.companies.some((c) =>
      new Types.ObjectId(c).equals(companyObjectId),
    );

    if (alreadyInCompany) {
      throw new BadRequestException('TARGET_PATIENT_ALREADY_IN_COMPANY');
    }

    // Find current affiliation from any of the patient's existing companies
    const sourceAffiliation = await this.userAffiliationModel.findOne(
      { patientId: targetObjectId, isCurrent: true },
      { agreementType: 1, payerId: 1, regime: 1, affiliationType: 1, startDate: 1 },
    );

    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      // Link target patient to this company
      await this.userModel.updateOne(
        { _id: targetObjectId },
        {
          $addToSet: { companies: companyObjectId },
          $push: {
            patientHistory: {
              $each: [
                ...(nnPatient.patientHistory ?? []),
                {
                  eventType: Enums.PatientHistoryEventTypeEnum.IMPORTED,
                  timestamp: new Date(),
                  performedBy: new Types.ObjectId(userId),
                  description: 'Patient imported from another IPS',
                  metadata: { sourcePatientId: patientObjectId },
                },
              ],
            },
          },
        },
        { session },
      );

      // Create new affiliation for this company (copied from source)
      let newAffiliationId: Types.ObjectId | undefined;

      if (sourceAffiliation) {
        const [created] = await this.userAffiliationModel.create(
          [
            {
              companyId: companyObjectId,
              patientId: targetObjectId,
              agreementType: sourceAffiliation.agreementType,
              payerId: sourceAffiliation.payerId,
              regime: sourceAffiliation.regime,
              affiliationType: sourceAffiliation.affiliationType,
              startDate: sourceAffiliation.startDate,
            },
          ],
          { session },
        );

        newAffiliationId = created._id;
      }

      // Create clinical profile for this company
      await this.userClinicalProfileModel.create(
        [
          {
            companyId: companyObjectId,
            userId: targetObjectId,
            ...(newAffiliationId ? { userAffiliationId: newAffiliationId } : {}),
          },
        ],
        { session },
      );

      // Deactivate NN patient
      await this.userModel.updateOne(
        { _id: patientObjectId },
        { $set: { isActive: false } },
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

    return this.findPatientByIdService.execute(dto.targetPatientId, { companyId });
  }
}
