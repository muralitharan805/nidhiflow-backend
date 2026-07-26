import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { RedisCacheService } from './redis-cache.service';

/**
 * Interceptor automating pattern-based Redis cache invalidation whenever
 * data mutation HTTP endpoints (POST, PATCH, PUT, DELETE) execute successfully.
 */
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInvalidationInterceptor.name);

  /**
   * Initializes CacheInvalidationInterceptor with injected Redis cache service.
   *
   * @param redisCacheService - Service for Redis cache operations
   */
  constructor(private readonly redisCacheService: RedisCacheService) {}

  /**
   * Intercepts HTTP requests and triggers cache pattern deletion on data mutations.
   *
   * @param context - ExecutionContext of the current request
   * @param next - CallHandler to invoke the next handler in pipeline
   * @returns Observable emitting response payload
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, path } = request;

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const domain = this.extractDomainFromPath(path);
        const pattern = `nidhiflow:cache:*${domain}*`;

        this.logger.log(
          `🧹 [CACHE INVALIDATION] ${method} ${path} -> Purging pattern '${pattern}'`,
        );
        void this.redisCacheService.delByPattern(pattern);
      }),
    );
  }

  /**
   * Extracts domain resource name from request URL path filtering out API prefixes.
   *
   * @param path - URL path string (e.g. /api/v1/ledger/entries)
   * @returns Domain identifier (e.g. 'ledger')
   */
  private extractDomainFromPath(path: string): string {
    const pathSegments = path.split('/').filter(Boolean);
    const domainSegments = pathSegments.filter(
      (s) => s !== 'api' && !/^v\d+$/i.test(s),
    );
    return domainSegments[0] || 'default';
  }
}
