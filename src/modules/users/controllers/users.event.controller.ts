import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Interfaces } from 'lideris-commoms-microservice';

@Controller()
export class UsersEventController {
  private readonly logger = new Logger(UsersEventController.name);

  @EventPattern('user.created')
  async handleUserCreated(@Payload() data: Interfaces.UserResponse) {
    this.logger.log(`User created event received: ${data.id} - ${data.email}`);
  }

  @EventPattern('user.updated')
  async handleUserUpdated(@Payload() data: Interfaces.UserResponse) {
    this.logger.log(`User updated event received: ${data.id} - ${data.email}`);
  }
}
