import { Logger, UseFilters } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Filters, Utils, Interfaces } from 'lideris-commoms-microservice';

import constants from '../../../constants';

function buildCorsOrigin(): string | string[] | boolean {
  if (constants.NODE_ENV !== 'production') return true;
  const origins = constants.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : false;
}

/**
 * Subscription map: patientId → Set<userId>
 * When a status changes, we fan out to all userIds subscribed to that patient.
 */

export interface PatientStatusPushPayload {
  patientId: string;
  documentNumber: string;
  status: string;
  timestamp: number;
}

@UseFilters(new Filters.AllExceptionsFilter())
@WebSocketGateway({
  namespace: '/patients',
  cors: { origin: buildCorsOrigin(), credentials: true },
})
export class PatientStreamGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly patientSubscribers = new Map<string, Set<string>>();
  private readonly userViews = new Map<string, Set<string>>();

  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(PatientStreamGateway.name);

  afterInit() {
    this.logger.log('PatientStreamGateway initialized (namespace: /patients)');
  }

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;

      if (!token) {
        client.emit('error', { message: 'Authentication required' });
        client.disconnect(true);

        return;
      }

      const userData = Utils.decodeJWTToken(token);

      (client.data as Record<string, unknown>).user = userData;
      this.logger.debug(`Client ${client.id} authenticated as ${userData.email ?? 'unknown'}`);
    } catch {
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = ((client.data as Record<string, unknown>).user as Interfaces.IUserDataJWT)
      ?.userId;

    if (userId) {
      this.cleanupUser(userId);
    }
    this.logger.debug(`Client ${client.id} disconnected`);
  }

  /**
   * Register which patients a user is currently viewing.
   * Called after REST enrichment so real-time updates reach this user.
   */
  registerUserView(userId: string, newPatientIds: string[]): void {
    // Remove old subscriptions for this user
    const oldIds = this.userViews.get(userId);

    if (oldIds) {
      oldIds.forEach((pid: string) => {
        this.patientSubscribers.get(pid)?.delete(userId);
        if (this.patientSubscribers.get(pid)?.size === 0) this.patientSubscribers.delete(pid);
      });
    }

    // Set new subscriptions
    this.userViews.set(userId, new Set(newPatientIds));
    newPatientIds.forEach((pid) => {
      if (!this.patientSubscribers.has(pid)) this.patientSubscribers.set(pid, new Set());
      this.patientSubscribers.get(pid)!.add(userId);
    });

    this.logger.debug(`Registered view for userId ${userId}: ${newPatientIds.length} patients`);
  }

  /**
   * Push a status update to ALL sockets of all subscribed users.
   * Multi-tab: iterates ALL sockets for a userId, not just the first.
   */
  async pushToSubscribers(payload: PatientStatusPushPayload): Promise<void> {
    const userIds = this.patientSubscribers.get(payload.patientId);

    if (!userIds || userIds.size === 0) return;

    const sockets = await this.server.fetchSockets();

    for (const socket of sockets) {
      const uid = ((socket.data as Record<string, unknown>).user as Interfaces.IUserDataJWT)
        ?.userId;

      if (uid && userIds.has(uid)) {
        socket.emit('patient.status.changed', payload);
      }
    }
  }

  private cleanupUser(userId: string): void {
    const ids = this.userViews.get(userId);

    if (ids) {
      ids.forEach((pid) => {
        this.patientSubscribers.get(pid)?.delete(userId);
        if (this.patientSubscribers.get(pid)?.size === 0) this.patientSubscribers.delete(pid);
      });
    }
    this.userViews.delete(userId);
  }
}
