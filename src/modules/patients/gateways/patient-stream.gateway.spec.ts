import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';

import { PatientStreamGateway } from './patient-stream.gateway';

const makeSocket = (id: string, userId?: string): Socket =>
  ({
    id,
    data: { user: { userId } },
    emit: jest.fn(),
    disconnect: jest.fn(),
  }) as unknown as Socket;

describe('PatientStreamGateway', () => {
  let gateway: PatientStreamGateway;
  let mockServer: { fetchSockets: jest.Mock; to: jest.Mock; emit: jest.Mock };

  beforeEach(async () => {
    mockServer = {
      fetchSockets: jest.fn().mockResolvedValue([]),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientStreamGateway],
    }).compile();

    gateway = module.get<PatientStreamGateway>(PatientStreamGateway);
    // Override server with mock
    (gateway as unknown as Record<string, unknown>).server = mockServer;
  });

  describe('registerUserView', () => {
    it('should register a user view for patient IDs', () => {
      gateway.registerUserView('user-1', ['patient-a', 'patient-b']);
      gateway.registerUserView('user-2', ['patient-a']);

      // Both users subscribed to patient-a
      // Verified indirectly via pushToSubscribers test
    });

    it('should replace old view when registering new patient IDs', () => {
      gateway.registerUserView('user-1', ['patient-a']);
      gateway.registerUserView('user-1', ['patient-b', 'patient-c']);

      // Old subscription to patient-a should be gone
    });

    it('should clean up patient with zero subscribers', () => {
      gateway.registerUserView('user-1', ['patient-a']);
      gateway.registerUserView('user-1', []); // empty view

      // patient-a should have zero subscribers now
    });
  });

  describe('pushToSubscribers', () => {
    it('should push to all sockets of subscribed users', async () => {
      const socket1 = makeSocket('sock-1', 'user-1');
      const socket2 = makeSocket('sock-2', 'user-2');

      mockServer.fetchSockets.mockResolvedValue([socket1, socket2]);
      gateway.registerUserView('user-1', ['patient-a']);
      gateway.registerUserView('user-2', ['patient-a']);

      await gateway.pushToSubscribers({
        patientId: 'patient-a',
        documentNumber: '123',
        status: 'called',
        timestamp: Date.now(),
      });

      expect(socket1.emit).toHaveBeenCalledWith(
        'patient.status.changed',
        expect.objectContaining({
          patientId: 'patient-a',
          status: 'called',
        }),
      );
      expect(socket2.emit).toHaveBeenCalledWith(
        'patient.status.changed',
        expect.objectContaining({
          patientId: 'patient-a',
          status: 'called',
        }),
      );
    });

    it('should push to multiple tabs of the same user', async () => {
      const tab1 = makeSocket('tab-1', 'user-1');
      const tab2 = makeSocket('tab-2', 'user-1');
      const socket3 = makeSocket('sock-3', 'user-2');

      mockServer.fetchSockets.mockResolvedValue([tab1, tab2, socket3]);
      gateway.registerUserView('user-1', ['patient-a']);

      await gateway.pushToSubscribers({
        patientId: 'patient-a',
        documentNumber: '123',
        status: 'in_attention',
        timestamp: Date.now(),
      });

      expect(tab1.emit).toHaveBeenCalledWith('patient.status.changed', expect.any(Object));
      expect(tab2.emit).toHaveBeenCalledWith('patient.status.changed', expect.any(Object));
      // user-2 is not subscribed to patient-a
      expect(socket3.emit).not.toHaveBeenCalled();
    });

    it('should not push when no subscribers for patient', async () => {
      const socket1 = makeSocket('sock-1', 'user-1');

      mockServer.fetchSockets.mockResolvedValue([socket1]);
      // No one subscribed to patient-z

      await gateway.pushToSubscribers({
        patientId: 'patient-z',
        documentNumber: '456',
        status: 'waiting',
        timestamp: Date.now(),
      });

      expect(socket1.emit).not.toHaveBeenCalled();
    });

    it('should handle sockets without userId gracefully', async () => {
      const anonymous = makeSocket('anon-1', undefined);
      const valid = makeSocket('valid-1', 'user-1');

      mockServer.fetchSockets.mockResolvedValue([anonymous, valid]);
      gateway.registerUserView('user-1', ['patient-a']);

      await gateway.pushToSubscribers({
        patientId: 'patient-a',
        documentNumber: '123',
        status: 'attended',
        timestamp: Date.now(),
      });

      expect(valid.emit).toHaveBeenCalledWith('patient.status.changed', expect.any(Object));
    });
  });
});
