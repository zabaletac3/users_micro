import { Injectable, NotFoundException } from '@nestjs/common';
import { Types, UpdateQuery } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';
import * as EmployeeDtos from '@shared/dto/employees';
import { I18nKeys } from '@shared/constants/i18n-keys.constants';

import { OrganizationGrpcClientService } from './organization-grpc-client.service';
import { EmployeesKafkaService } from './employees-kafka.service';

@Injectable()
export class HandlePositionService {
  constructor(
    private readonly organizationGrpc: OrganizationGrpcClientService,
    private readonly employeesKafka: EmployeesKafkaService,
  ) {}

  async handle(
    companyId: string,
    employeeId: string,
    dto: EmployeeDtos.HandlePositionDto,
  ): Promise<Partial<UpdateQuery<Schemas.UserDocument>>> {
    const positionId = dto.positionId ? new Types.ObjectId(dto.positionId) : null;
    const oldPositionId = dto.oldPositionId ? new Types.ObjectId(dto.oldPositionId) : null;

    if (dto.action === 'add' && dto.positionId) {
      const posValidation = await this.organizationGrpc.validateEntities({
        companyId,
        positionIds: [dto.positionId],
        departmentIds: [],
        areaIds: [],
      });

      if (posValidation.missingPositions.length > 0) {
        throw new NotFoundException(
          `${I18nKeys.POSITION_NOT_FOUND}: ${posValidation.missingPositions.join(', ')}`,
        );
      }

      this.employeesKafka.emitPositionAssigned({
        userId: employeeId,
        positionId: dto.positionId,
        action: 'ADD',
      });

      return { $addToSet: { position: positionId! } };
    }

    if (dto.action === 'remove' && dto.positionId) {
      this.employeesKafka.emitPositionAssigned({
        userId: employeeId,
        positionId: dto.positionId,
        action: 'REMOVE',
      });

      return { $pull: { position: positionId! } };
    }

    if (dto.action === 'replace' && dto.positionId) {
      const posValidation = await this.organizationGrpc.validateEntities({
        companyId,
        positionIds: [dto.positionId],
        departmentIds: [],
        areaIds: [],
      });

      if (posValidation.missingPositions.length > 0) {
        throw new NotFoundException(
          `${I18nKeys.POSITION_NOT_FOUND}: ${posValidation.missingPositions.join(', ')}`,
        );
      }

      this.employeesKafka.emitPositionAssigned({
        userId: employeeId,
        positionId: dto.positionId,
        oldPositionId: dto.oldPositionId,
        action: 'REPLACE',
      });

      const result: Partial<UpdateQuery<Schemas.UserDocument>> = {};

      if (oldPositionId && positionId) {
        result.$pull = { position: oldPositionId };
        result.$addToSet = { position: positionId };
      }

      return result;
    }

    return {};
  }
}
