import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';
import { I18nKeys } from '@shared/constants/i18n-keys.constants';

import { EMPLOYEE_PROJECTION, EMPLOYEE_POPULATE } from './employees.constants';

@Injectable()
export class FindEmployeeByIdService {
  constructor(
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
  ) {}

  async findById(id: string, companyId: string): Promise<Schemas.UserDocument> {
    const employee = await this.userModel
      .findOne(
        {
          _id: id,
          companies: { $in: [new Types.ObjectId(companyId)] },
          deletedAt: null,
        },
        EMPLOYEE_PROJECTION,
      )
      .populate(EMPLOYEE_POPULATE)
      .lean();

    if (!employee) {
      throw new NotFoundException(`${I18nKeys.EMPLOYEE_NOT_FOUND}: ${id}`);
    }

    return employee;
  }
}
