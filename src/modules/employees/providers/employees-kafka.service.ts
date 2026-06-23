import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

export const EMPLOYEES_KAFKA_CLIENT = 'EMPLOYEES_KAFKA_CLIENT';

export interface EmployeeCreatedPayload {
  userId: string;
  companyId: string;
  email: string;
  fullName: string;
  positionIds: string[];
}

export interface PositionAssignedPayload {
  userId: string;
  positionId: string;
  oldPositionId?: string;
  action: 'ADD' | 'REMOVE' | 'REPLACE';
}

@Injectable()
export class EmployeesKafkaService {
  private readonly logger = new Logger(EmployeesKafkaService.name);

  constructor(
    @Optional()
    @Inject(EMPLOYEES_KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka | null,
  ) {}

  emitEmployeeCreated(payload: EmployeeCreatedPayload): void {
    this.emit('employee.created', payload);
  }

  emitPositionAssigned(payload: PositionAssignedPayload): void {
    this.emit('user.position.assigned', payload);
  }

  private emit(topic: string, payload: unknown): void {
    if (!this.kafkaClient) {
      this.logger.warn(`Kafka not available — skipping topic ${topic}`);

      return;
    }
    try {
      this.kafkaClient.emit(topic, payload);
      this.logger.debug(`Emitted to ${topic}`, { payload });
    } catch (error) {
      this.logger.error(`Failed to emit to ${topic}`, error);
    }
  }
}
