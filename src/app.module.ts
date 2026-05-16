import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Interceptors, Middlewares, HealthcheckController } from 'lideris-commoms-microservice';
import * as Joi from 'joi';

import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(5500),
        PORT_GRPC: Joi.number().default(50052),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        APP_NAME: Joi.string().default('micro-users'),
        // Cors
        CORS_ORIGINS: Joi.string().allow('').default(''),
        MONGO_STRING_CONNECTION: Joi.string().required(),
        MONGO_DB_NAME: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        REDIS_SERVER_URI: Joi.string().default('redis://localhost:6379'),
        REDIS_DB: Joi.number().default(1),
        KAFKA_BROKERS: Joi.string().default('localhost:9092'),
        KAFKA_CLIENT_ID: Joi.string().default('micro-users'),
        KAFKA_GROUP_ID: Joi.string().default('micro-users-group'),
        GRPC_URL_USER: Joi.string().default('localhost:50052'),
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_STRING_CONNECTION'),
        dbName: config.getOrThrow<string>('MONGO_DB_NAME'),
      }),
    }),
    UsersModule,
    PatientsModule,
  ],
  controllers: [HealthcheckController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: Interceptors.StandardResponseInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('LLEGO A DEVELOPMENRT');
      consumer
        .apply(Middlewares.DevAuthContextMiddleware, Middlewares.LoggerMiddleware)
        .forRoutes('*');
    }

    consumer
      .apply(Middlewares.AuthorizerContextMiddleware, Middlewares.LoggerMiddleware)
      .forRoutes('*');
  }
}
