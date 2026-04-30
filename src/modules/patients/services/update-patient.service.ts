import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Schemas, Enums } from 'lideris-commoms-microservice';
import { UpdatePatientDto } from '@shared/dto/update-patient.dto';
import { FindPatientByIdResponseDto } from '@shared/dto/find-patient-by-id-response.dto';

import { FindPatientByIdService } from './find-patient-by-id.service';

@Injectable()
export class UpdatePatientService {
  constructor(
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
    @InjectModel(Schemas.UserAffiliation.name)
    private readonly userAffiliationModel: Model<Schemas.UserAffiliationDocument>,
    @InjectModel(Schemas.UserClinicalProfile.name)
    private readonly userClinicalProfileModel: Model<Schemas.UserClinicalProfileDocument>,
    @InjectModel(Schemas.Payer.name)
    private readonly payerModel: Model<Schemas.PayerDocument>,
    @InjectModel(Schemas.Document.name)
    private readonly documentModel: Model<Schemas.DocumentDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly findPatientByIdService: FindPatientByIdService,
  ) {}

  async execute(
    id: string,
    companyId: string,
    dto: UpdatePatientDto,
    userId: string,
  ): Promise<FindPatientByIdResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('PATIENT_REQUIRED_OR_INVALID');
    }

    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('COMPANY_REQUIRED_OR_INVALID');
    }

    const patientObjectId = new Types.ObjectId(id);
    const companyObjectId = new Types.ObjectId(companyId);

    const patient = await this.userModel.findOne(
      { _id: patientObjectId, companies: companyObjectId },
      { _id: 1, documentType: 1 },
    );

    if (!patient) throw new NotFoundException('PATIENT_NOT_FOUND');

    if (
      (dto.documentType !== undefined || dto.documentNumber !== undefined) &&
      patient.documentType !== Enums.PatientDocumentType.NEWBORN
    ) {
      throw new BadRequestException('DOCUMENT_UPDATE_NOT_ALLOWED');
    }

    const { affiliation, addOrRemoveDocuments, addOrRemoveSecondaryContacts, ...basicFields } = dto;

    // ── Step 1: Basic info ──────────────────────────────────────────────────────

    if (Object.keys(basicFields).length > 0) {
      await this.userModel.updateOne(
        { _id: patientObjectId },
        {
          $set: basicFields,
          $push: {
            patientHistory: {
              eventType: Enums.PatientHistoryEventTypeEnum.UPDATED,
              timestamp: new Date(),
              performedBy: new Types.ObjectId(userId),
              description: 'Patient information updated',
            },
          },
        },
      );
    }

    // ── Step 2: Affiliation ─────────────────────────────────────────────────────

    if (affiliation) {
      await this.updateAffiliation(patientObjectId, companyObjectId, affiliation, userId);
    }

    // ── Step 3: Documents ───────────────────────────────────────────────────────

    if (addOrRemoveDocuments) {
      await this.handleAddOrRemoveDocuments(patientObjectId, addOrRemoveDocuments, userId);
    }

    // ── Step 4: Secondary contacts ──────────────────────────────────────────────

    if (addOrRemoveSecondaryContacts) {
      await this.handleAddOrRemoveSecondaryContacts(
        patientObjectId,
        addOrRemoveSecondaryContacts,
        userId,
      );
    }

    return this.findPatientByIdService.execute(id, { companyId });
  }

  // ── Private: affiliation ────────────────────────────────────────────────────

  private async updateAffiliation(
    patientObjectId: Types.ObjectId,
    companyObjectId: Types.ObjectId,
    affiliation: NonNullable<UpdatePatientDto['affiliation']>,
    userId: string,
  ): Promise<void> {
    if (affiliation.payerId) {
      const payerExists = await this.payerModel.exists({
        _id: new Types.ObjectId(affiliation.payerId),
      });

      if (!payerExists) throw new NotFoundException('PAYER_NOT_FOUND');
    }

    const existing = await this.userAffiliationModel.findOne(
      { patientId: patientObjectId, companyId: companyObjectId, isCurrent: true },
      { _id: 1 },
    );

    if (existing) {
      const updateFields: Partial<Schemas.UserAffiliation> = {};

      if (affiliation.agreementType !== undefined)
        updateFields.agreementType = affiliation.agreementType;
      if (affiliation.payerId !== undefined)
        updateFields.payerId = affiliation.payerId
          ? new Types.ObjectId(affiliation.payerId)
          : undefined;
      if (affiliation.regime !== undefined) updateFields.regime = affiliation.regime;
      if (affiliation.affiliationType !== undefined)
        updateFields.affiliationType = affiliation.affiliationType;
      if (affiliation.startDate !== undefined) updateFields.startDate = affiliation.startDate;

      await this.userAffiliationModel.updateOne({ _id: existing._id }, { $set: updateFields });

      await this.userModel.updateOne(
        { _id: patientObjectId },
        {
          $push: {
            patientHistory: {
              eventType: Enums.PatientHistoryEventTypeEnum.UPDATED,
              timestamp: new Date(),
              performedBy: new Types.ObjectId(userId),
              description: 'Affiliation updated',
            },
          },
        },
      );
    } else {
      if (!affiliation.agreementType) {
        throw new BadRequestException('AGREEMENT_TYPE_REQUIRED_TO_CREATE_AFFILIATION');
      }

      const session = await this.connection.startSession();

      try {
        session.startTransaction();

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

        await this.userModel.updateOne(
          { _id: patientObjectId },
          {
            $push: {
              patientHistory: {
                eventType: Enums.PatientHistoryEventTypeEnum.UPDATED,
                timestamp: new Date(),
                performedBy: new Types.ObjectId(userId),
                description: 'Affiliation created',
              },
            },
          },
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
    }
  }

  // ── Private: documents ──────────────────────────────────────────────────────

  private async handleAddOrRemoveDocuments(
    patientObjectId: Types.ObjectId,
    payload: NonNullable<UpdatePatientDto['addOrRemoveDocuments']>,
    userId: string,
  ): Promise<void> {
    const { action, documentIds } = payload;
    const documentObjectIds = documentIds.map((docId: string) => new Types.ObjectId(docId));

    if (action === Enums.AddOrRemoveQuery.ADD) {
      const found = await this.documentModel.find({ _id: { $in: documentObjectIds } }, { _id: 1 });

      if (found.length !== documentIds.length) {
        const foundIds = found.map((d) => d._id.toString());
        const missing = documentIds.filter((docId: string) => !foundIds.includes(docId));

        throw new NotFoundException(`DOCUMENTS_NOT_FOUND: ${missing.join(', ')}`);
      }

      await this.userModel.updateOne(
        { _id: patientObjectId },
        {
          $addToSet: { documents: { $each: documentObjectIds } },
          $push: {
            patientHistory: {
              eventType: Enums.PatientHistoryEventTypeEnum.UPDATED,
              timestamp: new Date(),
              performedBy: new Types.ObjectId(userId),
              description: `Documents added (${documentIds.length})`,
            },
          },
        },
      );

      return;
    }

    if (action === Enums.AddOrRemoveQuery.REMOVE) {
      await this.userModel.updateOne(
        { _id: patientObjectId },
        {
          $pull: { documents: { $in: documentObjectIds } },
          $push: {
            patientHistory: {
              eventType: Enums.PatientHistoryEventTypeEnum.UPDATED,
              timestamp: new Date(),
              performedBy: new Types.ObjectId(userId),
              description: `Documents removed (${documentIds.length})`,
            },
          },
        },
      );
    }
  }

  // ── Private: secondary contacts ─────────────────────────────────────────────

  private async handleAddOrRemoveSecondaryContacts(
    patientObjectId: Types.ObjectId,
    payload: NonNullable<UpdatePatientDto['addOrRemoveSecondaryContacts']>,
    userId: string,
  ): Promise<void> {
    const { action, contacts } = payload;

    if (action === Enums.AddOrRemoveQuery.ADD) {
      await this.userModel.updateOne(
        { _id: patientObjectId },
        {
          $push: {
            secondaryContacts: { $each: contacts },
            patientHistory: {
              eventType: Enums.PatientHistoryEventTypeEnum.UPDATED,
              timestamp: new Date(),
              performedBy: new Types.ObjectId(userId),
              description: `Secondary contacts added (${contacts.length})`,
            },
          },
        },
      );

      return;
    }

    if (action === Enums.AddOrRemoveQuery.REMOVE) {
      const phones = contacts.map((c) => c.phone).filter(Boolean);

      if (!phones.length) {
        throw new BadRequestException('PHONE_REQUIRED_TO_REMOVE_SECONDARY_CONTACT');
      }

      await this.userModel.updateOne(
        { _id: patientObjectId },
        {
          $pull: { secondaryContacts: { phone: { $in: phones } } },
          $push: {
            patientHistory: {
              eventType: Enums.PatientHistoryEventTypeEnum.UPDATED,
              timestamp: new Date(),
              performedBy: new Types.ObjectId(userId),
              description: `Secondary contacts removed (${phones.length})`,
            },
          },
        },
      );
    }

    if (action === Enums.AddOrRemoveQuery.UPDATE) {
      for (const contact of contacts) {
        if (!contact.oldPhone) {
          throw new BadRequestException('OLD_PHONE_REQUIRED_TO_UPDATE_SECONDARY_CONTACT');
        }

        const setFields: Record<string, unknown> = {};

        if (contact.name !== undefined) setFields['secondaryContacts.$[elem].name'] = contact.name;
        if (contact.lastName !== undefined)
          setFields['secondaryContacts.$[elem].lastName'] = contact.lastName;
        if (contact.phone !== undefined)
          setFields['secondaryContacts.$[elem].phone'] = contact.phone;
        if (contact.email !== undefined)
          setFields['secondaryContacts.$[elem].email'] = contact.email;
        if (contact.relationship !== undefined)
          setFields['secondaryContacts.$[elem].relationship'] = contact.relationship;

        await this.userModel.updateOne(
          { _id: patientObjectId },
          { $set: setFields },
          { arrayFilters: [{ 'elem.phone': contact.oldPhone }] },
        );
      }

      await this.userModel.updateOne(
        { _id: patientObjectId },
        {
          $push: {
            patientHistory: {
              eventType: Enums.PatientHistoryEventTypeEnum.UPDATED,
              timestamp: new Date(),
              performedBy: new Types.ObjectId(userId),
              description: `Secondary contacts updated (${contacts.length})`,
            },
          },
        },
      );
    }
  }
}
