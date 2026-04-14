import { Logger, UseFilters } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Filters, Interfaces, Utils } from 'lideris-commoms-microservice';

import constants from '../../../constants';

function buildCorsOrigin(): string | string[] | boolean {
  if (constants.NODE_ENV !== 'production') return true;
  const origins = constants.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : false;
}

/**
 * WebSocket Gateway for real-time user events via Socket.IO.
 * Runs on the same HTTP port (upgrade), namespace /users.
 *
 * Connection requires a valid JWT token:
 *   const socket = io('http://host:PORT/users', {
 *     auth: { token: 'Bearer <jwt>' }
 *   });
 */
@UseFilters(new Filters.AllExceptionsFilter())
@WebSocketGateway({
  namespace: '/users',
  cors: { origin: buildCorsOrigin(), credentials: true },
})
export class UsersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(UsersGateway.name);

  afterInit() {
    this.logger.log('Socket.IO gateway initialized (namespace: /users)');
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
    this.logger.debug(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('ping')
  handlePing(): { event: string; data: string } {
    return { event: 'pong', data: new Date().toISOString() };
  }

  /**
   * Joins a room named `user:<userId>` to receive targeted events.
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string },
  ): { event: string; data: { subscribed: string } | { error: string } } {
    if (!data?.userId) {
      return { event: 'error', data: { error: 'userId is required' } };
    }

    const room = `user:${data.userId}`;

    void client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);

    return { event: 'subscribed', data: { subscribed: data.userId } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string },
  ): { event: string; data: { unsubscribed: string } | { error: string } } {
    if (!data?.userId) {
      return { event: 'error', data: { error: 'userId is required' } };
    }

    const room = `user:${data.userId}`;

    void client.leave(room);
    this.logger.debug(`Client ${client.id} left room ${room}`);

    return { event: 'unsubscribed', data: { unsubscribed: data.userId } };
  }

  /**
   * Broadcasts a user event. Emits to:
   * 1. The specific room `user:<id>` (targeted listeners)
   * 2. The entire namespace (global listeners)
   */
  broadcastUserEvent(event: string, payload: Interfaces.UserResponse) {
    this.server.to(`user:${payload.id}`).emit(event, payload);
    this.server.emit(event, payload);
    this.logger.debug(`Broadcast ${event} for user ${payload.id}`);
  }
}
