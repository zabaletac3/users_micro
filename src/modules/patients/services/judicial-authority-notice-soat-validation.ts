import { BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';

/**
 * Valida que el expediente SOAT exista y pertenezca al mismo paciente e IPS que el aviso judicial.
 */
export async function resolveSoatCaseIdForNotice(
  patientSoatCaseModel: Model<Schemas.PatientSoatCaseDocument>,
  soatCaseId: string,
  patientObjectId: Types.ObjectId,
  companyObjectId: Types.ObjectId,
): Promise<Types.ObjectId> {
  if (!Types.ObjectId.isValid(soatCaseId)) {
    throw new BadRequestException('SOAT_CASE_ID_INVALID');
  }

  const soatCaseObjectId = new Types.ObjectId(soatCaseId);

  const found = await patientSoatCaseModel
    .findOne(
      {
        _id: soatCaseObjectId,
        patientId: patientObjectId,
        companyId: companyObjectId,
      },
      { _id: 1 },
    )
    .exec();

  if (!found) {
    throw new BadRequestException('SOAT_CASE_DOES_NOT_MATCH_PATIENT_OR_COMPANY');
  }

  return soatCaseObjectId;
}
