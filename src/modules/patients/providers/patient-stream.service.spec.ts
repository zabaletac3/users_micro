import { Test, TestingModule } from '@nestjs/testing';

import { PatientStreamGateway } from '../gateways/patient-stream.gateway';

import { PatientStreamStore } from './patient-stream.store';
import { PatientStreamService } from './patient-stream.service';

const makeStore = () => ({
  getStatuses: jest.fn(),
});

const makeGateway = () => ({
  registerUserView: jest.fn(),
});

interface TestItem {
  _id: string;
  fullName: string;
  [key: string]: unknown;
}

describe('PatientStreamService', () => {
  let service: PatientStreamService;
  let store: ReturnType<typeof makeStore>;
  let gateway: ReturnType<typeof makeGateway>;

  beforeEach(async () => {
    store = makeStore();
    gateway = makeGateway();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientStreamService,
        { provide: PatientStreamStore, useValue: store },
        { provide: PatientStreamGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<PatientStreamService>(PatientStreamService);
  });

  describe('enrichAndRegisterView', () => {
    it('should return empty array when no items', async () => {
      const result = await service.enrichAndRegisterView({ items: [] }, 'user-1');

      expect(result).toEqual([]);
      expect(store.getStatuses).not.toHaveBeenCalled();
      expect(gateway.registerUserView).not.toHaveBeenCalled();
    });

    it('should enrich items with status from Redis', async () => {
      const items: TestItem[] = [
        { _id: 'abc', fullName: 'Juan Pérez' },
        { _id: 'def', fullName: 'María López' },
      ];

      store.getStatuses.mockResolvedValue(
        new Map([
          ['abc', { patientId: 'abc', documentNumber: '123', status: 'waiting', timestamp: 1 }],
          ['def', null],
        ]),
      );

      const result = await service.enrichAndRegisterView({ items }, 'user-1');

      expect(result).toEqual([
        { _id: 'abc', fullName: 'Juan Pérez', status: 'waiting' },
        { _id: 'def', fullName: 'María López', status: null },
      ]);
    });

    it('should register user view for real-time fan-out', async () => {
      const items: TestItem[] = [{ _id: 'abc', fullName: 'Juan Pérez' }];

      store.getStatuses.mockResolvedValue(new Map());

      await service.enrichAndRegisterView({ items }, 'user-1');

      expect(gateway.registerUserView).toHaveBeenCalledWith('user-1', ['abc']);
    });

    it('should preserve original item properties', async () => {
      const items: TestItem[] = [{ _id: 'abc', fullName: 'Juan Pérez' }];

      store.getStatuses.mockResolvedValue(new Map([['abc', null]]));

      const result = await service.enrichAndRegisterView({ items }, 'user-2');

      expect(result[0].fullName).toBe('Juan Pérez');
      expect(result[0]._id).toBe('abc');
    });
  });
});
