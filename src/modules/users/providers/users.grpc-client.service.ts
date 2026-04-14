import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Interfaces } from 'lideris-commoms-microservice';

/**
 * Example gRPC client to call another microservice's UserService.
 * Register with: ClientsModule.register([registerGRPCConfig('user', 'USER_PACKAGE')])
 */
@Injectable()
export class UsersGrpcClientService implements OnModuleInit {
  private userService!: Interfaces.IUserGrpcService;

  constructor(@Inject('USER_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<Interfaces.IUserGrpcService>('UserService');
  }

  findById(id: string) {
    return this.userService.findById({ id });
  }

  findByEmail(email: string) {
    return this.userService.findByEmail({ email });
  }

  findAll(page: number, limit: number) {
    return this.userService.findAll({ page, limit });
  }
}
