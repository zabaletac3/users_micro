import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schemas } from 'lideris-commoms-microservice';
import { buildCriteria, paginate, HybridPaginatedResponse } from '@shared/criteria';

import { employeesCriteria } from '../employees.criteria';

import { EMPLOYEE_PROJECTION, EMPLOYEE_POPULATE } from './employees.constants';
import { OrganizationGrpcClientService } from './organization-grpc-client.service';

type UserLean = Schemas.UserDocument & Record<string, unknown>;

@Injectable()
export class FindAllEmployeesService {
  private readonly logger = new Logger(FindAllEmployeesService.name);

  constructor(
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
    @InjectModel(Schemas.MedicalSpecialty.name)
    private readonly medicalSpecialtyModel: Model<Schemas.MedicalSpecialtyDocument>,
    private readonly organizationGrpc: OrganizationGrpcClientService,
  ) {}

  async findAll(
    query: Record<string, unknown>,
    companyId: string,
    abacFilter?: Record<string, unknown>,
  ): Promise<HybridPaginatedResponse<Schemas.UserDocument>> {
    const criteria = buildCriteria(query, employeesCriteria);

    Object.assign(criteria.filter, {
      ...(abacFilter?.filter ?? {}),
      companies: { $in: [new Types.ObjectId(companyId)] },
      deletedAt: null,
      documentType: { $ne: 'NN' },
    });

    // Resolve positionTypes to position IDs via gRPC
    const positionTypes = query.positionTypes as string | undefined;

    if (positionTypes) {
      const types = positionTypes
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (types.length > 0) {
        const resolved = await this.organizationGrpc.resolvePositionIds({
          companyId,
          positionTypes: types,
        });

        this.logger.log(
          `positionTypes resolved: [${types.join(', ')}] → ${resolved.positionIds.length} position IDs: ${resolved.positionIds.join(', ') || 'none'}`,
        );

        if (resolved.positionIds.length > 0) {
          criteria.filter.position = {
            $in: resolved.positionIds.map((id: string) => new Types.ObjectId(id)),
          };
        } else {
          return {
            items: [],
            pagination: { pageSize: criteria.pageSize, nextCursor: null, mode: 'cursor' },
          };
        }
      }
    }

    this.logger.log(`findAll filter: ${JSON.stringify(criteria.filter)}`);

    const result = await paginate<Schemas.UserDocument>(
      this.userModel as unknown as Model<Schemas.UserDocument>,
      criteria,
      { projection: EMPLOYEE_PROJECTION, lean: true },
    );

    result.items = await this.userModel.populate(
      result.items as Schemas.UserDocument[],
      EMPLOYEE_POPULATE,
    );

    // Populate subSpecialtyIds manually (not in User schema)
    const allSpecIds = [
      ...new Set(
        (result.items as UserLean[]).flatMap((doc) => {
          const raw = doc['subSpecialtyIds'];

          return Array.isArray(raw) ? raw.map(String) : [];
        }),
      ),
    ];

    if (allSpecIds.length > 0) {
      const specObjectIds = allSpecIds.map((id) => new Types.ObjectId(id));
      const specs = await this.medicalSpecialtyModel
        .find({ _id: { $in: specObjectIds } }, { name: 1 })
        .lean();

      const specMap = new Map(specs.map((s) => [s._id.toString(), s.name]));

      for (const doc of result.items as UserLean[]) {
        const raw = doc['subSpecialtyIds'];
        const ids: string[] = Array.isArray(raw) ? raw.map(String) : [];

        doc['subSpecialtyIds'] = ids.map((id) => ({
          _id: id,
          name: specMap.get(id) ?? null,
        }));
      }
    }

    this.logger.log(`findAll returned ${result.items.length} items`);

    return result;
  }
}
