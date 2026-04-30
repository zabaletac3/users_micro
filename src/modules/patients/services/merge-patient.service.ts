import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Schemas, Enums } from 'lideris-commoms-microservice';
import { MergePatientDto } from '@shared/dto/merge-patient.dto';
import { FindPatientByIdResponseDto } from '@shared/dto/find-patient-by-id-response.dto';

import { FindPatientByIdService } from './find-patient-by-id.service';

@Injectable()
export class MergePatientService {
  constructor(
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly findPatientByIdService: FindPatientByIdService,
  ) {}

  async execute(
    id: string,
    companyId: string,
    dto: MergePatientDto,
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
      throw new BadRequestException('CANNOT_MERGE_PATIENT_WITH_ITSELF');
    }

    const [nnPatient, targetPatient] = await Promise.all([
      this.userModel.findOne(
        { _id: patientObjectId, companies: companyObjectId },
        { _id: 1, documentType: 1, patientHistory: 1 },
      ),
      this.userModel.findOne(
        { _id: targetObjectId, companies: companyObjectId },
        { _id: 1, documentType: 1 },
      ),
    ]);

    if (!nnPatient) throw new NotFoundException('PATIENT_NOT_FOUND');
    if (!targetPatient) throw new NotFoundException('TARGET_PATIENT_NOT_FOUND');

    if (nnPatient.documentType !== Enums.PatientDocumentType.NN) {
      throw new BadRequestException('PATIENT_IS_NOT_NN');
    }

    if (targetPatient.documentType === Enums.PatientDocumentType.NN) {
      throw new BadRequestException('TARGET_PATIENT_IS_NN');
    }

    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      // Copy NN patientHistory to target + push MERGED event
      await this.userModel.updateOne(
        { _id: targetObjectId },
        {
          $push: {
            patientHistory: {
              $each: [
                ...(nnPatient.patientHistory ?? []),
                {
                  eventType: Enums.PatientHistoryEventTypeEnum.MERGED,
                  timestamp: new Date(),
                  performedBy: new Types.ObjectId(userId),
                  description: 'NN patient profile merged successfully',
                  metadata: { nnPatientId: patientObjectId },
                },
              ],
            },
          },
        },
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
