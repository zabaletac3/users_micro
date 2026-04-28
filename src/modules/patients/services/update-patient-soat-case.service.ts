import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';
import { UpdatePatientSoatCaseDto } from '@shared/dto/patient-soat-case.dto';

@Injectable()
export class UpdatePatientSoatCaseService {
  constructor(
    @InjectModel(Schemas.PatientSoatCase.name)
    private readonly patientSoatCaseModel: Model<Schemas.PatientSoatCaseDocument>,
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
  ) {}

  async execute(
    patientId: string,
    companyId: string,
    soatCaseId: string,
    dto: UpdatePatientSoatCaseDto,
  ): Promise<Schemas.PatientSoatCaseDocument> {
    if (!Types.ObjectId.isValid(patientId) || !Types.ObjectId.isValid(soatCaseId)) {
      throw new BadRequestException('PATIENT_OR_CASE_ID_INVALID');
    }

    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('COMPANY_REQUIRED_OR_INVALID');
    }

    const patientObjectId = new Types.ObjectId(patientId);
    const companyObjectId = new Types.ObjectId(companyId);
    const caseObjectId = new Types.ObjectId(soatCaseId);

    const patient = await this.userModel.findOne(
      { _id: patientObjectId, companies: companyObjectId },
      { _id: 1 },
    );

    if (!patient) {
      throw new NotFoundException('PATIENT_NOT_FOUND');
    }

    const existing = await this.patientSoatCaseModel
      .findOne({
        _id: caseObjectId,
        patientId: patientObjectId,
        companyId: companyObjectId,
      })
      .exec();

    if (!existing) {
      throw new NotFoundException('PATIENT_SOAT_CASE_NOT_FOUND');
    }

    const $set: Record<string, unknown> = {};

    if (dto.status !== undefined) {
      $set.status = dto.status;
    }

    if (dto.form !== undefined) {
      $set.form = dto.form;
    }

    const updated = await this.patientSoatCaseModel
      .findOneAndUpdate(
        { _id: caseObjectId, patientId: patientObjectId, companyId: companyObjectId },
        { $set },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('PATIENT_SOAT_CASE_NOT_FOUND');
    }

    return updated;
  }
}
