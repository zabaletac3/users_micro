import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Schemas } from 'lideris-commoms-microservice';

import { UsersService } from './providers/users.rest.service';

interface MockChain {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  skip: jest.Mock;
  limit: jest.Mock;
  select: jest.Mock;
  lean: jest.Mock;
  exec: jest.Mock;
  countDocuments: jest.Mock;
}

const createMockChain = (): MockChain => {
  const chain: MockChain = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    countDocuments: jest.fn().mockReturnValue({
      exec: jest.fn(),
    }),
  };

  return chain;
};

describe('UsersService', () => {
  let service: UsersService;
  let mockModel: MockChain;

  beforeEach(async () => {
    mockModel = createMockChain();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(Schemas.User.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated active users', async () => {
      const mockUsers = [{ fullName: 'Test User', email: 'test@test.com', isActive: true }];

      mockModel.exec.mockResolvedValueOnce(mockUsers);
      mockModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(1),
      });

      const result = await service.findAll(1, 10);

      expect(result).toEqual({ users: mockUsers, total: 1, page: 1, limit: 10 });
      expect(mockModel.find).toHaveBeenCalledWith({ isActive: true, deletedAt: null });
      expect(mockModel.skip).toHaveBeenCalledWith(0);
      expect(mockModel.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('findById', () => {
    it('should return an active user by id', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Test',
        email: 'test@test.com',
      };

      mockModel.exec.mockResolvedValueOnce(mockUser);

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockUser);
      expect(mockModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        isActive: true,
        deletedAt: null,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockModel.exec.mockResolvedValueOnce(null);

      await expect(service.findById('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for invalid ObjectId', async () => {
      await expect(service.findById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return an active user by email', async () => {
      const mockUser = { _id: '507f1f77bcf86cd799439011', email: 'test@test.com' };

      mockModel.exec.mockResolvedValueOnce(mockUser);

      const result = await service.findByEmail('test@test.com');

      expect(result).toEqual(mockUser);
      expect(mockModel.findOne).toHaveBeenCalledWith({
        email: 'test@test.com',
        isActive: true,
        deletedAt: null,
      });
    });
  });

  describe('update', () => {
    it('should throw NotFoundException for invalid ObjectId', async () => {
      await expect(service.update('bad-id', { fullName: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException for invalid ObjectId', async () => {
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
