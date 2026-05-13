import { Injectable, Logger } from '@nestjs/common';

import { PatientStreamGateway } from '../gateways/patient-stream.gateway';

import { PatientStreamStore } from './patient-stream.store';

@Injectable()
export class PatientStreamService {
  private readonly logger = new Logger(PatientStreamService.name);

  constructor(
    private readonly store: PatientStreamStore,
    private readonly gateway: PatientStreamGateway,
  ) {}

  /**
   * Enrich a paginated result with patient attention status from Redis.
   * Registers the user's current view for real-time fan-out.
   * Preserves the input item type T — only requires items to have _id and an optional status.
   */
  async enrichAndRegisterView<T extends { _id: unknown; status?: string | null }>(
    result: { items: T[] },
    userId: string,
  ): Promise<T[]> {
    if (!result?.items?.length) return [];

    const patientIds = result.items.map((item) => String(item._id));
    const statusMap = await this.store.getStatuses(patientIds);

    this.gateway.registerUserView(userId, patientIds);

    return result.items.map((item) => {
      const cached = statusMap.get(String(item._id));

      return Object.assign({}, item, { status: cached?.status ?? null });
    });
  }
}
