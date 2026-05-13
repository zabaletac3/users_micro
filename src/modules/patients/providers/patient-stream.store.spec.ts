import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Schemas, Interfaces, Enums } from 'lideris-commoms-microservice';

import { REDIS_CLIENT } from '../../redis/redis.module';
import { PatientStreamGateway } from '../gateways/patient-stream.gateway';

import { PatientStreamStore } from './patient-stream.store';

const makeRedis = () => {
  const multiChain = {
    set: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };

  const pipeline = {
    get: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };

  return {
    multi: jest.fn().mockReturnValue(multiChain),
    pipeline: jest.fn().mockReturnValue(pipeline),
  };
};

const makeUserModel = () => ({
  findOne: jest.fn(),
});

const makeGateway = () => ({
  pushToSubscribers: jest.fn(),
});

const makeEvent = (
  overrides: Partial<Interfaces.PatientStatusChangedEvent> = {},
): Interfaces.PatientStatusChangedEvent => ({
  patientId: '67fd2a95f8f66b591dc9b20d',
  documentNumber: '12345678',
  companyId: '67fd2a95f8f66b591dc9b20a',
  previousStatus: null,
  currentStatus: Enums.PatientAttentionStatus.WAITING,
  timestamp: Date.now(),
  domain: 'admission',
  context: {},
  ...overrides,
});

describe('PatientStreamStore', () => {
  let store: PatientStreamStore;
  let redis: ReturnType<typeof makeRedis>;
  let userModel: ReturnType<typeof makeUserModel>;
  let gateway: ReturnType<typeof makeGateway>;

  beforeEach(async () => {
    redis = makeRedis();
    userModel = makeUserModel();
    gateway = makeGateway();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientStreamStore,
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: getModelToken(Schemas.User.name), useValue: userModel },
        { provide: PatientStreamGateway, useValue: gateway },
      ],
    }).compile();

    store = module.get<PatientStreamStore>(PatientStreamStore);
  });

  describe('handlePatientStatusChanged', () => {
    it('should store status in Redis when patientId is present', async () => {
      const event = makeEvent();

      await store.handlePatientStatusChanged(event);

      const multi = redis.multi.mock.results[0]?.value;

      expect(multi.set).toHaveBeenCalledWith(
        `patient:stream:${event.patientId}`,
        expect.any(String),
      );
      expect(multi.expire).toHaveBeenCalledWith(`patient:stream:${event.patientId}`, 86400);
    });

    it('should fan out to gateway after storing', async () => {
      const event = makeEvent();

      await store.handlePatientStatusChanged(event);

      expect(gateway.pushToSubscribers).toHaveBeenCalledWith({
        patientId: event.patientId,
        documentNumber: event.documentNumber,
        status: event.currentStatus,
        timestamp: event.timestamp,
      });
    });

    it('should resolve patientId via documentNumber when not in event', async () => {
      const leanExec = jest.fn().mockResolvedValue({ _id: '67fd2a95f8f66b591dc9b20d' });

      userModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({ exec: leanExec }),
      });

      const event = makeEvent({ patientId: '' });

      await store.handlePatientStatusChanged(event);

      expect(userModel.findOne).toHaveBeenCalledWith({ documentNumber: '12345678' }, { _id: 1 });
      const multi = redis.multi.mock.results[0]?.value;

      expect(multi.set).toHaveBeenCalledWith(
        'patient:stream:67fd2a95f8f66b591dc9b20d',
        expect.any(String),
      );
    });

    it('should throw when Redis write fails', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation();
      const multiChain = {
        set: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Redis down')),
      };

      redis.multi.mockReturnValue(multiChain);

      const event = makeEvent();

      await expect(store.handlePatientStatusChanged(event)).rejects.toThrow('Redis down');
      jest.restoreAllMocks();
    });

    it('should skip when neither patientId nor documentNumber resolves', async () => {
      const leanExec = jest.fn().mockResolvedValue(null);

      userModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({ exec: leanExec }),
      });

      const event = makeEvent({ patientId: '' });

      await store.handlePatientStatusChanged(event);

      expect(redis.multi).not.toHaveBeenCalled();
      expect(gateway.pushToSubscribers).not.toHaveBeenCalled();
    });
  });

  describe('getStatuses', () => {
    it('should return empty map for empty input', async () => {
      const result = await store.getStatuses([]);

      expect(result.size).toBe(0);
    });

    it('should batch-read statuses from Redis', async () => {
      const cached = JSON.stringify({
        patientId: 'abc',
        documentNumber: '123',
        status: 'waiting',
        timestamp: 1,
      });

      redis.pipeline().exec.mockResolvedValueOnce([
        [null, cached],
        [null, null],
      ] as Array<[Error | null, string | null]>);

      const result = await store.getStatuses(['abc', 'def']);

      expect(result.get('abc')).toEqual({
        patientId: 'abc',
        documentNumber: '123',
        status: 'waiting',
        timestamp: 1,
      });
      expect(result.get('def')).toBeNull();
    });

    it('should handle Redis errors per-key gracefully', async () => {
      redis
        .pipeline()
        .exec.mockResolvedValueOnce([[new Error('fail'), null]] as Array<
          [Error | null, string | null]
        >);

      const result = await store.getStatuses(['abc']);

      expect(result.get('abc')).toBeNull();
    });

    it('should handle invalid JSON gracefully', async () => {
      redis
        .pipeline()
        .exec.mockResolvedValueOnce([[null, 'not-json']] as Array<[Error | null, string | null]>);

      const result = await store.getStatuses(['abc']);

      expect(result.get('abc')).toBeNull();
    });
  });
});
