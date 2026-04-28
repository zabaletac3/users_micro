import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';
import {
  SearchPatientQueryDto,
  SearchPatientResponseItemDto,
} from '@shared/dto/search-patient.dto';

@Injectable()
export class SearchPatientService {
  constructor(
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
  ) {}

  async execute(dto: SearchPatientQueryDto): Promise<SearchPatientResponseItemDto[]> {
    const { companyId, documentType, documentNumber } = dto;

    if (!companyId || !Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('COMPANY_REQUIRED_OR_INVALID');
    }

    if (!documentNumber) {
      throw new BadRequestException('DOCUMENT_NUMBER_REQUIRED');
    }

    const results = await this.userModel
      .find(
        { ...(documentType && { documentType }), documentNumber },
        {
          _id: 1,
          serial: 1,
          name: 1,
          middleName: 1,
          lastName: 1,
          secondLastName: 1,
          fullName: 1,
          documentType: 1,
          documentNumber: 1,
          companies: 1,
        },
      )
      .lean();

    return results as unknown as SearchPatientResponseItemDto[];
  }
}
