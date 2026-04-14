import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Pipes } from 'lideris-commoms-microservice';

import { UsersService } from '../providers/users.rest.service';
import { UsersKafkaService } from '../providers/users.kafka.service';
import { createUserSchema, updateUserSchema } from '../joi-validations';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersKafkaService: UsersKafkaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users listed successfully' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit ?? '10', 10) || 10));

    return this.usersService.findAll(pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new Pipes.JoiValidationPipe(createUserSchema))
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(
    @Body()
    body: {
      fullName: string;
      userName: string;
      email: string;
      password: string;
      phone?: string;
      gender?: string;
    },
  ) {
    const user = await this.usersService.create(body);

    await this.usersKafkaService.emitUserCreated(user);

    return user;
  }

  @Put(':id')
  @UsePipes(new Pipes.JoiValidationPipe(updateUserSchema))
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ fullName: string; phone: string; gender: string }>,
  ) {
    const user = await this.usersService.update(id, body);

    await this.usersKafkaService.emitUserUpdated(user);

    return user;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
