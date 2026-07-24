import { SetMetadata, CustomDecorator } from '@nestjs/common';

/**
 * Metadata key for specifying custom cache TTL in seconds.
 */
export const USE_CACHE_TTL_KEY = 'use_cache_ttl';

/**
 * Decorator to override default Redis cache TTL (300 seconds) for a specific controller or route.
 *
 * @param ttlSeconds - Custom Time-To-Live duration in seconds
 * @example
 * ```typescript
 * @Get('static-reports')
 * @UseCache(600) // Cache for 10 minutes
 * getStaticReports() { ... }
 * ```
 *
 * @returns CustomDecorator setting the USE_CACHE_TTL_KEY metadata
 */
export const UseCache = (ttlSeconds: number): CustomDecorator<string> =>
  SetMetadata(USE_CACHE_TTL_KEY, ttlSeconds);
