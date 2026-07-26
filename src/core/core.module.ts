import {
  Global,
  Module,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalHttpExceptionFilter } from './filters/http-exception.filter';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { CacheModule } from './cache/cache.module';
import { HttpCacheInterceptor } from './cache/http-cache.interceptor';
import { CacheInvalidationInterceptor } from './cache/cache-invalidation.interceptor';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

/**
 * Core singleton module registering global exception filters, response transformation interceptors,
 * HTTP Redis caching, cache invalidation, correlation ID middleware, and logging interceptors.
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
      useClass: LoggingInterceptor,
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
  ],
  exports: [CacheModule],
})
export class CoreModule implements NestModule {
  /**
   * Configures global middleware including X-Correlation-ID tracing.
   *
   * @param consumer - MiddlewareConsumer instance
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
