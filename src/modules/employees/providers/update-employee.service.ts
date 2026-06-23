import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';
import * as EmployeeDtos from '@shared/dto/employees';
import * as I18nKeys from '@shared/constants/i18n-keys.constants';

import { OrganizationGrpcClientService } from './organization-grpc-client.service';
import { HandleDocumentService } from './handle-document.service';
import { HandleProfileImageService } from './handle-profile-image.service';
import { HandlePositionService } from './handle-position.service';
import { EMPLOYEE_PROJECTION } from './employees.constants';

@Injectable()
export class UpdateEmployeeService {
  constructor(
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
    private readonly organizationGrpc: OrganizationGrpcClientService,
    private readonly handleDocument: HandleDocumentService,
    private readonly handleProfileImage: HandleProfileImageService,
    private readonly handlePosition: HandlePositionService,
  ) {}

  async update(
    companyId: string,
    id: string,
    dto: EmployeeDtos.UpdateEmployeeDto,
  ): Promise<{ messageKey: string; data: Schemas.UserDocument }> {
    const {
      addOrRemoveDocuments,
      handleProfileImages,
      handlePosition,
      addDepartmentIds,
      removeDepartmentIds,
      addAreaIds,
      removeAreaIds,
      ...simpleFields
    } = dto;

    const updateOperation: UpdateQuery<Schemas.UserDocument> = {};

    if (Object.keys(simpleFields).length > 0) {
      updateOperation.$set = simpleFields as Record<string, unknown>;
    }

    // Delegate to helpers
    if (addOrRemoveDocuments) {
      const docOp = await this.handleDocument.handle(
        addOrRemoveDocuments.action as 'add' | 'remove',
        addOrRemoveDocuments.documentIds ?? [],
      );

      Object.assign(updateOperation, docOp);
    }

    if (handleProfileImages) {
      const imgOp = this.handleProfileImage.handle(
        handleProfileImages.action as 'add' | 'remove' | 'replace',
        handleProfileImages.imageUrl,
        handleProfileImages.oldImageUrl,
      );

      Object.assign(updateOperation, imgOp);
    }

    if (handlePosition) {
      const posOp = await this.handlePosition.handle(companyId, id, handlePosition);

      Object.assign(updateOperation, posOp);
    }

    // Handle departments
    if (addDepartmentIds?.length || removeDepartmentIds?.length) {
      const employee = await this.userModel.findById(id, { _id: 1, departmentIds: 1 }).lean();

      if (!employee) throw new NotFoundException(`${I18nKeys.EMPLOYEE_NOT_FOUND}: ${id}`);

      const currentDeptIds =
        (employee.departmentIds as Types.ObjectId[])?.map((d) => d.toString()) ?? [];

      if (addDepartmentIds?.length) {
        const validation = await this.organizationGrpc.validateEntities({
          companyId,
          positionIds: [],
          departmentIds: addDepartmentIds,
          areaIds: [],
        });

        if (validation.missingDepartments.length > 0) {
          throw new NotFoundException(
            `${I18nKeys.DEPARTMENT_NOT_FOUND}: ${validation.missingDepartments.join(', ')}`,
          );
        }
      }

      if (removeDepartmentIds?.length) {
        const notAssigned = removeDepartmentIds.filter((dId) => !currentDeptIds.includes(dId));

        if (notAssigned.length) {
          throw new BadRequestException(
            `${I18nKeys.DEPARTMENT_NOT_ASSIGNED}: ${notAssigned.join(', ')}`,
          );
        }
      }

      if (addDepartmentIds?.length && removeDepartmentIds?.length) {
        const final = [
          ...currentDeptIds.filter((dId) => !removeDepartmentIds.includes(dId)),
          ...addDepartmentIds,
        ].map((id) => new Types.ObjectId(id));

        if (!updateOperation.$set) updateOperation.$set = {};
        (updateOperation.$set as Record<string, unknown>).departmentIds = final;
      } else if (addDepartmentIds?.length) {
        updateOperation.$addToSet = {
          ...(updateOperation.$addToSet as Record<string, unknown>),
          departmentIds: { $each: addDepartmentIds.map((id) => new Types.ObjectId(id)) },
        };
      } else if (removeDepartmentIds?.length) {
        updateOperation.$pull = {
          ...(updateOperation.$pull as Record<string, unknown>),
          departmentIds: { $in: removeDepartmentIds.map((id) => new Types.ObjectId(id)) },
        };
      }
    }

    // Handle areas
    if (addAreaIds?.length || removeAreaIds?.length) {
      const employee = await this.userModel.findById(id, { _id: 1, areaIds: 1 }).lean();

      if (!employee) throw new NotFoundException(`${I18nKeys.EMPLOYEE_NOT_FOUND}: ${id}`);

      const currentAreaIds = (employee.areaIds as Types.ObjectId[])?.map((a) => a.toString()) ?? [];

      if (addAreaIds?.length) {
        const validation = await this.organizationGrpc.validateEntities({
          companyId,
          positionIds: [],
          departmentIds: [],
          areaIds: addAreaIds,
        });

        if (validation.missingAreas.length > 0) {
          throw new NotFoundException(
            `${I18nKeys.AREA_NOT_FOUND}: ${validation.missingAreas.join(', ')}`,
          );
        }
      }

      if (removeAreaIds?.length) {
        const notAssigned = removeAreaIds.filter((aId) => !currentAreaIds.includes(aId));

        if (notAssigned.length) {
          throw new BadRequestException(`${I18nKeys.AREA_NOT_ASSIGNED}: ${notAssigned.join(', ')}`);
        }
      }

      if (addAreaIds?.length && removeAreaIds?.length) {
        const final = [
          ...currentAreaIds.filter((aId) => !removeAreaIds.includes(aId)),
          ...addAreaIds,
        ].map((id) => new Types.ObjectId(id));

        if (!updateOperation.$set) updateOperation.$set = {};
        (updateOperation.$set as Record<string, unknown>).areaIds = final;
      } else if (addAreaIds?.length) {
        updateOperation.$addToSet = {
          ...(updateOperation.$addToSet as Record<string, unknown>),
          areaIds: { $each: addAreaIds.map((id) => new Types.ObjectId(id)) },
        };
      } else if (removeAreaIds?.length) {
        updateOperation.$pull = {
          ...(updateOperation.$pull as Record<string, unknown>),
          areaIds: { $in: removeAreaIds.map((id) => new Types.ObjectId(id)) },
        };
      }
    }

    const employee = await this.userModel.findOneAndUpdate(
      { _id: id, companies: { $in: [new Types.ObjectId(companyId)] } },
      updateOperation,
      { new: true, projection: EMPLOYEE_PROJECTION },
    );

    if (!employee) {
      throw new NotFoundException(`${I18nKeys.EMPLOYEE_NOT_FOUND}: ${id}`);
    }

    return { messageKey: I18nKeys.EMPLOYEE_UPDATED_SUCCESS, data: employee };
  }
}
