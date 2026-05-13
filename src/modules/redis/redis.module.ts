import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

import constants from '../../constants';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        return new Redis(constants.REDIS_SERVER_URI, {
          db: constants.REDIS_DB,
          lazyConnect: true,
          retryStrategy: (times) => Math.min(times * 100, 3000),
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
