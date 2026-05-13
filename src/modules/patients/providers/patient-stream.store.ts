import { Inject, Injectable, Logger, OnModuleInit, Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KafkaTopics, Interfaces, Schemas } from 'lideris-commoms-microservice';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '../../redis/redis.module';
import { PatientStreamGateway } from '../gateways/patient-stream.gateway';

const STREAM_KEY_PREFIX = 'patient:stream:';
const STREAM_TTL_SECONDS = 86400; // 24 hours

export interface CachedPatientStatus {
  patientId: string;
  documentNumber: string;
  status: string;
  timestamp: number;
}

@Controller()
@Injectable()
export class PatientStreamStore implements OnModuleInit {
  private readonly logger = new Logger(PatientStreamStore.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectModel(Schemas.User.name)
    private readonly userModel: Model<Schemas.UserDocument>,
    private readonly gateway: PatientStreamGateway,
  ) {}

  onModuleInit() {
    this.logger.log('PatientStreamStore initialized');
  }

  @EventPattern(KafkaTopics.PATIENT_STATUS_CHANGED)
  async handlePatientStatusChanged(
    @Payload() event: Interfaces.PatientStatusChangedEvent,
  ): Promise<void> {
    // Resolve patientId: use directly if present, otherwise lookup by documentNumber
    let patientId: string | null = event.patientId ?? null;

    if (!patientId && event.documentNumber) {
      const user = await this.userModel
        .findOne({ documentNumber: event.documentNumber }, { _id: 1 })
        .lean()
        .exec();

      patientId = user ? String(user._id) : null;
    }

    if (!patientId) {
      this.logger.warn(
        `Cannot resolve patientId for event — documentNumber=${event.documentNumber}, skipping`,
      );

      return;
    }

    // Store in Redis
    const key = `${STREAM_KEY_PREFIX}${patientId}`;
    const value: CachedPatientStatus = {
      patientId,
      documentNumber: event.documentNumber,
      status: event.currentStatus,
      timestamp: event.timestamp,
    };

    try {
      await this.redis
        .multi()
        .set(key, JSON.stringify(value))
        .expire(key, STREAM_TTL_SECONDS)
        .exec();

      this.logger.debug(`Patient ${patientId}: ${event.previousStatus} → ${event.currentStatus}`);
    } catch (error) {
      this.logger.error(`Failed to store status for patient ${patientId}`, error);

      throw error;
    }

    // Fan-out to subscribed WebSocket clients
    void this.gateway.pushToSubscribers({
      patientId,
      documentNumber: event.documentNumber,
      status: event.currentStatus,
      timestamp: event.timestamp,
    });
  }

  /**
   * Batch-read current statuses from Redis.
   * Returns a Map keyed by patientId. Null means no cached status.
   */
  async getStatuses(patientIds: string[]): Promise<Map<string, CachedPatientStatus | null>> {
    if (patientIds.length === 0) return new Map();

    const pipeline = this.redis.pipeline();

    patientIds.forEach((id) => pipeline.get(`${STREAM_KEY_PREFIX}${id}`));

    const results = await pipeline.exec();
    const statusMap = new Map<string, CachedPatientStatus | null>();

    patientIds.forEach((id, i) => {
      const [err, raw] = results?.[i] ?? [];

      if (err || !raw) {
        statusMap.set(id, null);
      } else {
        try {
          statusMap.set(id, JSON.parse(raw as string));
        } catch {
          statusMap.set(id, null);
        }
      }
    });

    return statusMap;
  }
}
