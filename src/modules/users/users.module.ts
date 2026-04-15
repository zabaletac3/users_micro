import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Schemas } from 'lideris-commoms-microservice';

import { UsersController } from './controllers/users.controller';
import { UsersGrpcController } from './controllers/users.grpc.controller';
import { UsersEventController } from './controllers/users.event.controller';
import { UsersService } from './providers/users.rest.service';
import { UsersKafkaService } from './providers/users.kafka.service';
import { UsersGateway } from './gateways/users.gateway';

@Module({
  imports: [MongooseModule.forFeature([{ name: Schemas.User.name, schema: Schemas.UserSchema }])],
  controllers: [UsersController, UsersGrpcController, UsersEventController],
  providers: [UsersService, UsersKafkaService, UsersGateway],
  exports: [UsersService],
})
export class UsersModule {}
