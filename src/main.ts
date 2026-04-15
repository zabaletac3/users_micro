import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import { bootstrapConfigMicroservice } from 'lideris-commoms-microservice';

import { AppModule } from './app.module';
import constants from './constants';

async function bootstrap(): Promise<void> {
  const pinoConfig =
    constants.NODE_ENV === 'production'
      ? { level: 'info' }
      : {
          level: 'debug',
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
          },
        };

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: pinoConfig, bodyLimit: 10 * 1024 * 1024 }),
  );

  const kafkaBrokers = constants.KAFKA_BROKERS.split(',')
    .map((b) => b.trim())
    .filter(Boolean);
  const hasKafka = kafkaBrokers.length > 0 && kafkaBrokers[0] !== 'localhost:9092';

  await bootstrapConfigMicroservice(app, {
    apiPrefix: 'user',
    microserviceName: constants.APP_NAME,
    swaggerPath: 'user/docs',
    enableSwagger: true,
    grpcPackageName: 'user',
    corsOptions: {
      origin:
        constants.NODE_ENV === 'production'
          ? constants.CORS_ORIGINS.split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : true,
      credentials: true,
    },
    ...(hasKafka && {
      kafkaConfig: {
        clientId: constants.KAFKA_CLIENT_ID,
        brokers: kafkaBrokers,
        groupId: constants.KAFKA_GROUP_ID,
      },
    }),
  });

  if (constants.REDIS_SERVER_URI) {
    const { RedisIoAdapter } = await import('./adapters/redis-io.adapter');
    const redisAdapter = new RedisIoAdapter(app, constants.REDIS_SERVER_URI);

    await redisAdapter.connectToRedis();
    app.useWebSocketAdapter(redisAdapter);
  }

  await app.listen(constants.PORT, '0.0.0.0');
  const logger = new Logger('Bootstrap');

  logger.log(`HTTP + Socket.IO on port ${constants.PORT}`);
  logger.log(`gRPC server on port ${constants.PORT_GRPC}`);
  logger.log(`Swagger docs at http://localhost:${constants.PORT}/user/docs`);
}
bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');

  logger.error('Failed to start application', err);
  process.exit(1);
});
