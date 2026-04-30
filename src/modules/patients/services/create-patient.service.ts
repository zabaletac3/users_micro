import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Schemas, Enums } from 'lideris-commoms-microservice';
import { Connection, Model, Types } from 'mongoose';
import { CreatePatientDto } from '@shared/dto/create-patient.dto';
import { FindPatientByIdResponseDto } from '@shared/dto/find-patient-by-id-response.dto';

import { FindPatientByIdService } from './find-patient-by-id.service';

@Injectable()
export class CreatePatientService {
  constructor(
    @InjectModel(Schemas.Company.name)
    private readonly companyModel: Model<Schemas.CompanyDocument>,
    @InjectModel(Schemas.Payer.name)
    private readonly payerModel: Model<Schemas.PayerDocument>,
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
    @InjectModel(Schemas.UserAffiliation.name)
    private readonly userAffiliationModel: Model<Schemas.UserAffiliationDocument>,
    @InjectModel(Schemas.Document.name)
    private readonly documentModel: Model<Schemas.DocumentDocument>,
    @InjectModel(Schemas.UserClinicalProfile.name)
    private readonly userClinicalProfileModel: Model<Schemas.UserClinicalProfileDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly findPatientByIdService: FindPatientByIdService,
  ) {}

  async execute(dto: CreatePatientDto, userId: string): Promise<FindPatientByIdResponseDto> {
    let patient: Schemas.UserDocument;

    if (dto.documentType === Enums.PatientDocumentType.NN) {
      patient = await this.createNNPatient(dto, userId);
    } else if (dto.documentType === Enums.PatientDocumentType.NEWBORN) {
      patient = await this.createNewbornPatient(dto, userId);
    } else {
      patient = await this.createIdentifiedPatient(dto, userId);
    }

    return this.findPatientByIdService.execute(patient._id.toString(), {
      companyId: dto.companyId,
    });
  }

  // ── Identified patient ─────────────────────────────────────────────────────

  private async createIdentifiedPatient(
    dto: CreatePatientDto,
    userId: string,
  ): Promise<Schemas.UserDocument> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const { company } = await this.validateReferences(
        dto.companyId,
        dto?.affiliation?.payerId,
        dto?.documents,
      );

      const patientHistory: Schemas.CommonHistory = {
        eventType: Enums.PatientHistoryEventTypeEnum.CREATED,
        timestamp: new Date(),
        performedBy: new Types.ObjectId(userId),
        description: 'Patient created',
        metadata: { companyName: company.name },
      };

      const patient = await this.userModel.create(
        [
          {
            ...dto,
            companies: [new Types.ObjectId(dto.companyId)],
            companySelected: new Types.ObjectId(dto.companyId),
            createdBy: new Types.ObjectId(userId),
            patientHistory: [patientHistory],
          },
        ],
        { session },
      );

      const affiliation: Schemas.UserAffiliation = {
        companyId: new Types.ObjectId(dto.companyId),
        patientId: patient[0]._id,
        agreementType: dto?.affiliation?.agreementType ?? Enums.AgreementTypeEnum.PARTICULAR,
        payerId: dto?.affiliation?.payerId
          ? new Types.ObjectId(dto.affiliation.payerId)
          : undefined,
        regime: dto?.affiliation?.regime,
        affiliationType: dto?.affiliation?.affiliationType,
        startDate: dto?.affiliation?.startDate,
      };

      const [createdAffiliation] = await this.userAffiliationModel.create([affiliation], {
        session,
      });

      await this.userClinicalProfileModel.create(
        [
          {
            companyId: new Types.ObjectId(dto.companyId),
            userId: patient[0]._id,
            userAffiliationId: createdAffiliation._id,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return patient[0];
    } catch (e) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw e;
    } finally {
      session.endSession();
    }
  }

  // ── NN patient ─────────────────────────────────────────────────────────────

  private async createNNPatient(
    dto: CreatePatientDto,
    userId: string,
  ): Promise<Schemas.UserDocument> {
    const company = await this.companyModel.findById(dto.companyId, { _id: 1, name: 1 });

    if (!company) throw new NotFoundException('COMPANY_NOT_FOUND');

    const patientHistory: Schemas.CommonHistory = {
      eventType: Enums.PatientHistoryEventTypeEnum.CREATED,
      timestamp: new Date(),
      performedBy: new Types.ObjectId(userId),
      description: 'NN patient created',
      metadata: { companyName: company.name },
    };

    const nnId = new Types.ObjectId();

    const patient = await this.userModel.create({
      _id: nnId,
      ...dto,
      name: this.resolveNNName(dto.gender),
      serial: `NN-${nnId.toString().slice(-4).toUpperCase()}`,
      companies: [new Types.ObjectId(dto.companyId)],
      companySelected: new Types.ObjectId(dto.companyId),
      createdBy: new Types.ObjectId(userId),
      patientHistory: [patientHistory],
    });

    await this.userClinicalProfileModel.create({
      companyId: new Types.ObjectId(dto.companyId),
      userId: patient._id,
    });

    return patient;
  }

  // ── Newborn patient ────────────────────────────────────────────────────────

  private async createNewbornPatient(
    dto: CreatePatientDto,
    userId: string,
  ): Promise<Schemas.UserDocument> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const [company, mother, payer] = await Promise.all([
        this.companyModel.findById(dto.companyId, { _id: 1, name: 1 }),
        this.userModel.findOne(
          { _id: dto.motherId, companies: new Types.ObjectId(dto.companyId) },
          { _id: 1, name: 1, lastName: 1, documentNumber: 1, documentType: 1 },
        ),
        dto.affiliation?.payerId
          ? this.payerModel.findById(dto.affiliation.payerId, { _id: 1 })
          : Promise.resolve(null),
      ]);

      if (!company) throw new NotFoundException('COMPANY_NOT_FOUND');
      if (!mother) throw new NotFoundException('MOTHER_NOT_FOUND');
      if (dto.affiliation?.payerId && !payer) throw new NotFoundException('PAYER_NOT_FOUND');

      const rnId = new Types.ObjectId();
      const rnName = this.resolveNewbornName(mother, dto.gender);

      const patientHistory: Schemas.CommonHistory = {
        eventType: Enums.PatientHistoryEventTypeEnum.CREATED,
        timestamp: new Date(),
        performedBy: new Types.ObjectId(userId),
        description: 'Newborn patient created',
        metadata: { companyName: company.name },
      };

      const newborn = await this.userModel.create(
        [
          {
            _id: rnId,
            ...dto,
            name: rnName,
            motherId: new Types.ObjectId(dto.motherId),
            serial: `RN-${rnId.toString().slice(-4).toUpperCase()}`,
            companies: [new Types.ObjectId(dto.companyId)],
            companySelected: new Types.ObjectId(dto.companyId),
            createdBy: new Types.ObjectId(userId),
            patientHistory: [patientHistory],
          },
        ],
        { session },
      );

      let userAffiliationId: Types.ObjectId | undefined;

      if (dto.affiliation) {
        const affiliation: Schemas.UserAffiliation = {
          companyId: new Types.ObjectId(dto.companyId),
          patientId: newborn[0]._id,
          agreementType: dto.affiliation.agreementType,
          payerId: dto.affiliation.payerId
            ? new Types.ObjectId(dto.affiliation.payerId)
            : undefined,
          regime: dto.affiliation.regime,
          affiliationType: dto.affiliation.affiliationType,
          startDate: dto.affiliation.startDate,
        };

        const [createdAffiliation] = await this.userAffiliationModel.create([affiliation], {
          session,
        });

        userAffiliationId = createdAffiliation._id;
      }

      await this.userClinicalProfileModel.create(
        [
          {
            companyId: new Types.ObjectId(dto.companyId),
            userId: newborn[0]._id,
            ...(userAffiliationId && { userAffiliationId }),
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return newborn[0];
    } catch (e) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw e;
    } finally {
      session.endSession();
    }
  }

  // ── Shared helpers ─────────────────────────────────────────────────────────

  private async validateReferences(companyId: string, payerId?: string, documents?: string[]) {
    const [company, payer, documentsExists] = await Promise.all([
      this.companyModel.findById(companyId, { _id: 1, name: 1 }),
      payerId ? this.payerModel.findById(payerId, { _id: 1 }) : Promise.resolve(null),
      documents?.length
        ? this.documentModel.find({ _id: { $in: documents } }, { _id: 1 })
        : Promise.resolve([]),
    ]);

    if (!company) throw new NotFoundException('COMPANY_NOT_FOUND');
    if (payerId && !payer) throw new NotFoundException('PAYER_NOT_FOUND');

    if (documents?.length && documents.length !== documentsExists.length) {
      const missingIds = documents.filter(
        (d) => !documentsExists.map((doc) => doc._id.toString()).includes(d),
      );

      throw new NotFoundException(`DOCUMENTS_NOT_FOUND: ${missingIds.join(', ')}`);
    }

    return { company, payer, documents: documentsExists };
  }

  private resolveNNName(gender?: Enums.Gender): string {
    if (gender === Enums.Gender.FEMALE) return 'NN Femenino';
    if (gender === Enums.Gender.MALE) return 'NN Masculino';

    return 'NN';
  }

  private resolveNewbornName(
    mother: { name?: string; lastName?: string; documentType?: string; documentNumber?: string },
    gender?: Enums.Gender,
  ): string {
    const genderLabel = gender === Enums.Gender.FEMALE ? 'Hija' : 'Hijo';
    const motherName = [mother.name, mother.lastName].filter(Boolean).join(' ');
    const docRef = mother.documentNumber
      ? `${mother.documentType ?? ''}${mother.documentNumber}`
      : '';

    return `RN ${genderLabel} de ${motherName} ${docRef}`.trim();
  }
}
