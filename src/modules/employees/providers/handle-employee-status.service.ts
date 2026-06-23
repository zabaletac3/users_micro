import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';
import * as EmployeeDtos from '@shared/dto/employees';
import {
  StatusChangeHistory,
  StatusChangeHistoryDocument,
} from '@shared/schemas/status-change-history.schema';
import { I18nKeys } from '@shared/constants/i18n-keys.constants';

@Injectable()
export class HandleEmployeeStatusService {
  constructor(
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
    @InjectModel(Schemas.Document.name)
    private readonly documentModel: Model<Schemas.DocumentDocument>,
    @InjectModel(StatusChangeHistory.name)
    private readonly statusChangeHistoryModel: Model<StatusChangeHistoryDocument>,
  ) {}

  async handle(
    companyId: string,
    id: string,
    dto: EmployeeDtos.HandleEmployeeStatusDto,
    userId: string,
  ): Promise<{ messageKey: string; data: Schemas.UserDocument }> {
    const employee = await this.userModel
      .findOne(
        { _id: id, companies: { $in: [new Types.ObjectId(companyId)] } },
        { _id: 1, isActive: 1 },
      )
      .lean();

    if (!employee) throw new NotFoundException(`${I18nKeys.EMPLOYEE_NOT_FOUND}: ${id}`);

    const isActive = dto.action === EmployeeDtos.EmployeeStatusAction.ACTIVATE;

    if (employee.isActive === isActive) {
      throw new BadRequestException(
        isActive ? I18nKeys.EMPLOYEE_ALREADY_ACTIVATED : I18nKeys.EMPLOYEE_ALREADY_DEACTIVATED,
      );
    }

    if (dto.documents?.length) {
      const docsExist = await this.documentModel.exists({
        _id: { $in: dto.documents.map((doc) => new Types.ObjectId(doc)) },
      });

      if (!docsExist) {
        throw new NotFoundException(I18nKeys.DOCUMENT_NOT_FOUND);
      }
    }

    const statusChangeRecord = await this.statusChangeHistoryModel.create({
      action: dto.action,
      justification: dto.justification,
      documents: dto.documents?.map((doc) => new Types.ObjectId(doc)) ?? [],
      changedBy: new Types.ObjectId(userId),
      changedAt: new Date(),
      previousStatus: employee.isActive,
      newStatus: isActive,
      historyType: 'StatusChangeHistory',
    });

    const updatedEmployee = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { isActive }, $push: { statusHistory: statusChangeRecord._id } },
      { new: true },
    );

    return {
      messageKey: isActive
        ? I18nKeys.EMPLOYEE_ACTIVATED_SUCCESS
        : I18nKeys.EMPLOYEE_DEACTIVATED_SUCCESS,
      data: updatedEmployee!,
    };
  }
}
