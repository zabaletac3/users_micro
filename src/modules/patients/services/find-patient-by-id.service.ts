import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';
import { FindPatientByIdDto } from '@shared/dto/find-patient-by-id.dto';
import { FindPatientByIdResponseDto } from '@shared/dto/find-patient-by-id-response.dto';

@Injectable()
export class FindPatientByIdService {
  constructor(
    @InjectModel(Schemas.User.name) private readonly userModel: Model<Schemas.UserDocument>,
  ) {}

  async execute(id: string, dto: FindPatientByIdDto): Promise<FindPatientByIdResponseDto> {
    const { companyId, patientHistorySearch, documentSearch } = dto;

    const patientHistoryLimit = Math.max(1, Math.floor(Number(dto.patientHistoryLimit) || 10));
    const patientHistorySkip = Math.max(0, Math.floor(Number(dto.patientHistorySkip) || 0));
    const documentLimit = Math.max(1, Math.floor(Number(dto.documentLimit) || 10));
    const documentSkip = Math.max(0, Math.floor(Number(dto.documentSkip) || 0));

    if (!companyId || !Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('COMPANY_REQUIRED_OR_INVALID');
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('PATIENT_REQUIRED_OR_INVALID');
    }

    const companyObjectId = new Types.ObjectId(companyId);
    const patientObjectId = new Types.ObjectId(id);

    const result = await this.userModel.aggregate([
      { $match: { _id: patientObjectId, companies: companyObjectId } },
      {
        $lookup: {
          from: 'user_affiliations',
          localField: '_id',
          foreignField: 'patientId',
          as: 'affiliation',
          pipeline: [
            { $match: { companyId: companyObjectId, isCurrent: true } },
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
            {
              $project: {
                _id: 1,
                agreementType: 1,
                regime: 1,
                affiliationType: 1,
                startDate: 1,
                payerId: 1,
              },
            },
            { $limit: 1 },
          ],
        },
      },
      {
        $unwind: { path: '$affiliation', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'documents',
          localField: 'documents',
          foreignField: '_id',
          as: 'documents',
          pipeline: [
            ...(documentSearch
              ? [
                  {
                    $match: {
                      $or: [
                        { $regexMatch: { input: '$name', regex: documentSearch, options: 'i' } },
                        {
                          $regexMatch: {
                            input: '$description',
                            regex: documentSearch,
                            options: 'i',
                          },
                        },
                      ],
                    },
                  },
                ]
              : []),
            {
              $project: {
                _id: 1,
                name: 1,
                description: 1,
                invoiceNumber: 1,
                justification: 1,
                link: 1,
                size: 1,
                isPinned: 1,
                pinnedAt: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          documentsTotal: { $size: '$documents' },
          documentsPages: {
            $cond: {
              if: { $gt: [{ $size: '$documents' }, 0] },
              then: { $ceil: { $divide: [{ $size: '$documents' }, documentLimit] } },
              else: 0,
            },
          },
          documents: {
            $slice: ['$documents', documentSkip, documentLimit],
          },
        },
      },
      {
        $addFields: {
          patientHistory: patientHistorySearch
            ? {
                $filter: {
                  input: { $ifNull: ['$patientHistory', []] },
                  as: 'entry',
                  cond: {
                    $or: [
                      {
                        $regexMatch: {
                          input: '$$entry.description',
                          regex: patientHistorySearch,
                          options: 'i',
                        },
                      },
                      {
                        $regexMatch: {
                          input: '$$entry.eventType',
                          regex: patientHistorySearch,
                          options: 'i',
                        },
                      },
                    ],
                  },
                },
              }
            : { $ifNull: ['$patientHistory', []] },
        },
      },
      {
        $addFields: {
          patientHistoryTotal: { $size: '$patientHistory' },
          patientHistoryPages: {
            $cond: {
              if: { $gt: [{ $size: '$patientHistory' }, 0] },
              then: { $ceil: { $divide: [{ $size: '$patientHistory' }, patientHistoryLimit] } },
              else: 0,
            },
          },
          patientHistory: {
            $slice: ['$patientHistory', patientHistorySkip, patientHistoryLimit],
          },
        },
      },
      {
        $unset: [
          '__v',
          'password',
          'refreshToken',
          'requestMailChange',
          'historyApps',
          'favoriteApps',
          'changePasswordRequested',
          'hasTwoFactorAuth',
          'position',
          'permissions',
          'loginHistory',
        ],
      },
    ]);

    if (!result[0]) {
      throw new NotFoundException('PATIENT_NOT_FOUND');
    }

    return result[0];
  }
}
