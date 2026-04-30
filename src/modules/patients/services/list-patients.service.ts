import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Schemas, Utils } from 'lideris-commoms-microservice';
import { FindAllPatientsDto } from '@shared/dto/find-all-patient.dto';
import { ListPatientsResponseDto, PatientMetricsDto } from '@shared/dto/list-patient-response.dto';
import { Enums } from 'lideris-commoms-microservice';

@Injectable()
export class ListPatientsService {
  private readonly logger = new Logger(ListPatientsService.name);

  constructor(
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
  ) {}

  async execute(dto: FindAllPatientsDto): Promise<ListPatientsResponseDto> {
    const {
      companyId,
      documentNumber,
      search,
      agreementType,
      documentType,
      payerId,
      startDate,
      endDate,
      name,
    } = dto;

    const limit = Number(dto.limit) || 10;
    const skip = Number(dto.skip) || 0;

    this.logger.log({
      limit,
      skip,
      companyId,
      documentNumber,
      name,
      agreementType,
      documentType,
      payerId,
      startDate,
      endDate,
    });

    if (!companyId || !Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('COMPANY_REQUIRED_OR_INVALID');
    }

    const companyObjectId = new Types.ObjectId(companyId);

    const matchUser: FilterQuery<Schemas.UserDocument> = {
      companies: companyObjectId,
    };

    if (documentNumber) {
      matchUser.documentNumber = documentNumber;
    }

    if (documentType) {
      matchUser.documentType = documentType;
    }

    if (startDate && endDate) {
      matchUser.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (name) {
      matchUser.$or = [
        { fullName: { $regex: `^${name}`, $options: 'i' } },
        { name: { $regex: `^${name}`, $options: 'i' } },
        { lastName: { $regex: `^${name}`, $options: 'i' } },
      ];
    }

    const agreementTypeMatchStage = agreementType
      ? [{ $match: { 'affiliation.agreementType': agreementType } }]
      : [];

    const searchOrClauses = search
      ? [
          { serial: { $regex: search, $options: 'i' } },
          { documentNumber: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'affiliation.payerId.legalName': { $regex: search, $options: 'i' } },
          { 'affiliation.payerId.displayName': { $regex: search, $options: 'i' } },
        ]
      : null;

    const payerMatchStage =
      payerId && Types.ObjectId.isValid(payerId)
        ? [{ $match: { 'affiliation.payerId._id': new Types.ObjectId(payerId) } }]
        : [];

    const [result, metrics] = await Promise.all([
      this.userModel.aggregate([
        { $match: matchUser },
        {
          $lookup: {
            from: 'user_clinical_profiles',
            localField: '_id',
            foreignField: 'userId',
            as: 'clinicalProfile',
            pipeline: [
              { $match: { companyId: companyObjectId } },
              {
                $lookup: {
                  from: 'user_affiliations',
                  localField: 'userAffiliationId',
                  foreignField: '_id',
                  as: 'affiliation',
                  pipeline: [
                    { $match: { isCurrent: true } },
                    {
                      $lookup: {
                        from: 'payers',
                        localField: 'payerId',
                        foreignField: '_id',
                        as: 'payerId',
                        pipeline: [{ $project: { _id: 1, legalName: 1, displayName: 1, type: 1 } }],
                      },
                    },
                    { $unwind: { path: '$payerId', preserveNullAndEmptyArrays: true } },
                  ],
                },
              },
              { $unwind: { path: '$affiliation', preserveNullAndEmptyArrays: true } },
              { $limit: 1 },
            ],
          },
        },
        { $unwind: '$clinicalProfile' },
        {
          $addFields: {
            affiliation: { $ifNull: ['$clinicalProfile.affiliation', null] },
          },
        },
        { $unset: 'clinicalProfile' },
        ...payerMatchStage,
        ...agreementTypeMatchStage,
        ...(searchOrClauses ? [{ $match: { $or: searchOrClauses } }] : []),
        {
          $facet: {
            data: [
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  serial: 1,
                  companies: 1,
                  _id: 1,
                  fullName: 1,
                  name: 1,
                  lastName: 1,
                  middleName: 1,
                  secondLastName: 1,
                  documentType: 1,
                  documentNumber: 1,
                  email: 1,
                  isActive: 1,
                  affiliation: {
                    _id: 1,
                    agreementType: 1,
                    regime: 1,
                    affiliationType: 1,
                    startDate: 1,
                    payerId: 1,
                  },
                },
              },
            ],
            total: [{ $count: 'count' }],
          },
        },
      ]),
      this.calculateMetrics(companyObjectId),
    ]);

    const paginated = Utils.paginateDataUtil(result[0].data, result[0].total[0]?.count ?? 0, dto);

    return { ...paginated, items: paginated.items as any, metrics };
  }

  private async calculateMetrics(companyObjectId: Types.ObjectId): Promise<PatientMetricsDto> {
    const companyFilter: FilterQuery<Schemas.UserDocument> = { companies: companyObjectId };

    const [totalPatients, totalNN] = await Promise.all([
      this.userModel.countDocuments({
        ...companyFilter,
        documentType: { $nin: [Enums.PatientDocumentType.NN] },
      }),
      this.userModel.countDocuments({
        ...companyFilter,
        documentType: Enums.PatientDocumentType.NN,
      }),
    ]);

    return {
      totalPatients,
      totalNN,
      totalInClinic: 0,
    };
  }
}
