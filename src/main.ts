import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import { bootstrapConfigMicroservice, KafkaTopics, Utils } from 'lideris-commoms-microservice';

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

  const adapter = new FastifyAdapter({ logger: pinoConfig, bodyLimit: 10 * 1024 * 1024 });

  adapter.getInstance().addHook('onRequest', (req, _reply, done) => {
    const rawAuthCtx = req.headers['x-auth-context'];
    const ctx = Utils.extractAuthorizerContext(req.headers);

    req.log.debug({
      msg: '[authz-hook] x-auth-context header received',
      url: req.url,
      hasHeader: !!rawAuthCtx,
      headerLength: typeof rawAuthCtx === 'string' ? rawAuthCtx.length : 0,
      parsed: !!ctx,
      userId: ctx?.principal?.userId ?? null,
      companyId: ctx?.principal?.companyIdSelected ?? null,
    });

    if (ctx) {
      (req as unknown as Record<string, unknown>).authzContext = ctx;
    }
    done();
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter);

  const kafkaBrokers = constants.KAFKA_BROKERS.split(',')
    .map((b) => b.trim())
    .filter(Boolean);
  const hasKafka = kafkaBrokers.length > 0;

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
        topics: [KafkaTopics.PATIENT_STATUS_CHANGED],
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

  logger.log(`HTTP + Socket.IO on port -> ${constants.PORT}`);
  logger.log(`gRPC server on port ${constants.PORT_GRPC}`);
  logger.log(`Swagger docs at http://localhost:${constants.PORT}/user/docs`);
}
bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');

  logger.error('Failed to start application', err);
  process.exit(1);
});
