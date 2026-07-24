import { Global, Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { HttpCacheInterceptor } from './http-cache.interceptor';
import { CacheInvalidationInterceptor } from './cache-invalidation.interceptor';

/**
 * Global cache module making Redis cache services and HTTP interceptors
 * accessible application-wide.
 */
@Global()
@Module({
  providers: [RedisCacheService, HttpCacheInterceptor, CacheInvalidationInterceptor],
  exports: [RedisCacheService, HttpCacheInterceptor, CacheInvalidationInterceptor],
})
export class CacheModule {}
