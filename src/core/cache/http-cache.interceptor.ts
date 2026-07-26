import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { RedisCacheService } from './redis-cache.service';
import { NO_CACHE_KEY } from '../decorators/no-cache.decorator';
import { USE_CACHE_TTL_KEY } from '../decorators/use-cache.decorator';

/**
 * Interceptor handling automatic HTTP GET response caching, custom TTL overrides,
 * route exclusions, visual logging, and cache headers injection.
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpCache');

  /**
   * Initializes HttpCacheInterceptor with injected Redis service, ConfigService, and Reflector.
   *
   * @param redisCacheService - Service for Redis key-value storage
   * @param configService - Environment configuration provider
   * @param reflector - NestJS metadata reflector for decorator inspection
   */
  constructor(
    private readonly redisCacheService: RedisCacheService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Intercepts HTTP requests and serves cached responses for GET requests when eligible.
   *
   * @param context - ExecutionContext of the current request
   * @param next - CallHandler to invoke the next handler in pipeline
   * @returns Observable emitting response payload
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (
      request.method !== 'GET' ||
      this.shouldBypassCache(context, request.path || request.url)
    ) {
      return next.handle();
    }

    const startTime = Date.now();
    const reqWithUser = request as Request & { user?: { id?: string } };
    const cacheKey = this.generateCacheKey(
      request.path || '',
      request.originalUrl || request.url,
      reqWithUser.user?.id,
    );
    const cachedData = await this.redisCacheService.get<unknown>(cacheKey);

    if (cachedData) {
      const duration = Date.now() - startTime;
      this.logger.log(
        `⚡ [CACHE HIT] ${request.method} ${request.originalUrl || request.url} (cached - ${duration}ms)`,
      );
      response.setHeader('X-Cache', 'HIT');
      response.setHeader('X-Response-Time', `${duration}ms`);
      return of(cachedData);
    }

    const ttl = this.getCacheTtl(context);
    response.setHeader('X-Cache', 'MISS');

    return next.handle().pipe(
      tap((data: unknown) => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `🔍 [CACHE MISS] ${request.method} ${request.originalUrl || request.url} (database query - ${duration}ms)`,
        );
        response.setHeader('X-Response-Time', `${duration}ms`);
        void this.redisCacheService.set(cacheKey, data, ttl);
      }),
    );
  }

  /**
   * Determines if caching should be bypassed based on global config, route blacklist, or @NoCache().
   *
   * @param context - ExecutionContext for checking decorator metadata
   * @param path - Current request URL path
   * @returns True if cache should be bypassed, false otherwise
   */
  private shouldBypassCache(context: ExecutionContext, path: string): boolean {
    const isGlobalEnabled = this.configService.get<boolean>(
      'REDIS_CACHE_GLOBAL_ENABLED',
      true,
    );
    if (!isGlobalEnabled) {
      return true;
    }

    const disabledRoutes = this.configService
      .get<string>('CACHE_DISABLED_ROUTES', '')
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    if (disabledRoutes.some((route) => path.startsWith(route))) {
      return true;
    }

    const noCache = this.reflector.getAllAndOverride<boolean>(NO_CACHE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return Boolean(noCache);
  }

  /**
   * Retrieves custom cache TTL from @UseCache(ttlSeconds) decorator or defaults to 300s.
   *
   * @param context - ExecutionContext for checking decorator metadata
   * @returns TTL duration in seconds
   */
  private getCacheTtl(context: ExecutionContext): number {
    const customTtl = this.reflector.getAllAndOverride<number>(
      USE_CACHE_TTL_KEY,
      [context.getHandler(), context.getClass()],
    );

    return customTtl || 300;
  }

  /**
   * Generates a deterministic cache key prefix, user scope, and URL hash.
   *
   * @param path - Request path string
   * @param url - Request full URL string
   * @param userId - Optional authenticated user ID for multi-tenant cache isolation
   * @returns Formatted cache key string
   */
  private generateCacheKey(
    path: string,
    url: string,
    userId?: string,
  ): string {
    const userScope = userId ? `user:${userId}` : 'anon';
    const urlHash = crypto
      .createHash('md5')
      .update(url)
      .digest('hex')
      .substring(0, 8);
    const pathKey = path ? path.replace(/\//g, ':') : 'root';
    return `nidhiflow:cache:${userScope}:${pathKey}:${urlHash}`;
  }
}
