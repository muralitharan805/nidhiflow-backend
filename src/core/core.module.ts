import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalHttpExceptionFilter } from './filters/http-exception.filter';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { CacheModule } from './cache/cache.module';
import { HttpCacheInterceptor } from './cache/http-cache.interceptor';
import { CacheInvalidationInterceptor } from './cache/cache-invalidation.interceptor';

/**
 * Core singleton module registering global exception filters, response transformation interceptors,
 * HTTP Redis caching, cache invalidation, and logging interceptors.
 */
@Global()
@Module({
  imports: [CacheModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInvalidationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [CacheModule],
})
export class CoreModule {}
