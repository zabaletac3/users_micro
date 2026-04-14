import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Interfaces } from 'lideris-commoms-microservice';

import { UsersService } from '../providers/users.rest.service';
import { toUserResponse } from '../users.mapper';

@Controller()
export class UsersGrpcController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod('UserService', 'FindAll')
  async findAll(data: Interfaces.FindAllRequest): Promise<Interfaces.UserListResponse> {
    const page = Math.max(1, data.page || 1);
    const limit = Math.min(100, Math.max(1, data.limit || 10));
    const result = await this.usersService.findAll(page, limit);

    return {
      users: result.users.map(toUserResponse),
      total: result.total,
    };
  }

  @GrpcMethod('UserService', 'FindById')
  async findById(data: Interfaces.FindByIdRequest): Promise<Interfaces.UserResponse> {
    const user = await this.usersService.findById(data.id);

    return toUserResponse(user);
  }

  @GrpcMethod('UserService', 'FindByEmail')
  async findByEmail(data: Interfaces.FindByEmailRequest): Promise<Interfaces.UserResponse> {
    const user = await this.usersService.findByEmail(data.email);

    return toUserResponse(user);
  }

  @GrpcMethod('UserService', 'Create')
  async create(data: Interfaces.CreateUserRequest): Promise<Interfaces.UserResponse> {
    const user = await this.usersService.create(data);

    return toUserResponse(user);
  }

  @GrpcMethod('UserService', 'Update')
  async update(data: Interfaces.UpdateUserRequest): Promise<Interfaces.UserResponse> {
    const { id, ...rest } = data;
    const user = await this.usersService.update(id, rest);

    return toUserResponse(user);
  }
}
