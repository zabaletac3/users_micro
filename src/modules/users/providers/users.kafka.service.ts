import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Optional,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { toUserResponse, UserLeanDoc } from '../users.mapper';
import { UsersGateway } from '../gateways/users.gateway';

@Injectable()
export class UsersKafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsersKafkaService.name);

  constructor(
    @Optional() @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka | null,
    private readonly usersGateway: UsersGateway,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.kafkaClient) {
      this.logger.warn('Kafka client is disabled: KAFKA_CLIENT provider not configured');

      return;
    }
    await this.kafkaClient.connect();
    this.logger.log('Kafka client connected');
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.kafkaClient) {
      return;
    }
    await this.kafkaClient.close();
    this.logger.log('Kafka client disconnected');
  }

  async emitUserCreated(user: UserLeanDoc): Promise<void> {
    const payload = toUserResponse(user);

    if (this.kafkaClient) {
      try {
        await firstValueFrom(
          this.kafkaClient.emit('user.created', { key: payload.id, value: payload }),
        );
      } catch (err) {
        this.logger.error(`Failed to emit user.created for ${payload.id}`, err);
      }
    }

    this.usersGateway.broadcastUserEvent('user.created', payload);
    this.logger.debug(`Emitted user.created for ${payload.id}`);
  }

  async emitUserUpdated(user: UserLeanDoc): Promise<void> {
    const payload = toUserResponse(user);

    if (this.kafkaClient) {
      try {
        await firstValueFrom(
          this.kafkaClient.emit('user.updated', { key: payload.id, value: payload }),
        );
      } catch (err) {
        this.logger.error(`Failed to emit user.updated for ${payload.id}`, err);
      }
    }

    this.usersGateway.broadcastUserEvent('user.updated', payload);
    this.logger.debug(`Emitted user.updated for ${payload.id}`);
  }
}
