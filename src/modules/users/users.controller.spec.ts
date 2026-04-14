import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './controllers/users.controller';
import { UsersService } from './providers/users.rest.service';
import { UsersKafkaService } from './providers/users.kafka.service';

const mockUsersService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockKafkaService = {
  emitUserCreated: jest.fn().mockResolvedValue(undefined),
  emitUserUpdated: jest.fn().mockResolvedValue(undefined),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: UsersKafkaService, useValue: mockKafkaService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const expected = { users: [], total: 0, page: 1, limit: 10 };

      mockUsersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll('1', '10');

      expect(result).toEqual(expected);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should handle invalid pagination with defaults', async () => {
      const expected = { users: [], total: 0, page: 1, limit: 10 };

      mockUsersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll('abc', undefined);

      expect(result).toEqual(expected);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findById', () => {
    it('should return a user', async () => {
      const expected = { fullName: 'Test', email: 'test@test.com' };

      mockUsersService.findById.mockResolvedValue(expected);

      const result = await controller.findById('507f1f77bcf86cd799439011');

      expect(result).toEqual(expected);
      expect(mockUsersService.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('create', () => {
    it('should create a user and emit kafka event', async () => {
      const body = {
        fullName: 'Test',
        userName: 'test',
        email: 'test@test.com',
        password: 'password123',
      };
      const expected = {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Test',
        userName: 'test',
        email: 'test@test.com',
        isActive: true,
      };

      mockUsersService.create.mockResolvedValue(expected);

      const result = await controller.create(body);

      expect(result).toEqual(expected);
      expect(mockKafkaService.emitUserCreated).toHaveBeenCalledWith(expected);
    });
  });

  describe('update', () => {
    it('should update a user and emit kafka event', async () => {
      const body = { fullName: 'Updated' };
      const expected = {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Updated',
        email: 'test@test.com',
        isActive: true,
      };

      mockUsersService.update.mockResolvedValue(expected);

      const result = await controller.update('507f1f77bcf86cd799439011', body);

      expect(result).toEqual(expected);
      expect(mockKafkaService.emitUserUpdated).toHaveBeenCalledWith(expected);
    });
  });
});
