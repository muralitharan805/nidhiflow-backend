import { ExecutionContext, CallHandler } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { HttpCacheInterceptor } from './http-cache.interceptor';
import { RedisCacheService } from './redis-cache.service';

describe('HttpCacheInterceptor', () => {
  let interceptor: HttpCacheInterceptor;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let configService: jest.Mocked<ConfigService>;
  let reflector: jest.Mocked<Reflector>;

  const mockResponse = {
    setHeader: jest.fn(),
  };

  const createMockContext = (
    method: string,
    url: string,
    path: string,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ method, url, originalUrl: url, path }),
        getResponse: () => mockResponse,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  const mockCallHandler: CallHandler = {
    handle: () => of({ success: true, data: 'test' }),
  };

  beforeEach(() => {
    redisCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    configService = {
      get: jest.fn((key: string, defaultValue: unknown) => {
        if (key === 'REDIS_CACHE_GLOBAL_ENABLED') return true;
        if (key === 'CACHE_DISABLED_ROUTES') return '/health,/api/v1/auth';
        return defaultValue;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Reflector>;

    interceptor = new HttpCacheInterceptor(
      redisCacheService,
      configService,
      reflector,
    );
    jest.clearAllMocks();
  });

  it('should bypass non-GET requests', async () => {
    const context = createMockContext('POST', '/api/v1/users', '/api/v1/users');
    const result$ = await interceptor.intercept(context, mockCallHandler);

    result$.subscribe((val) => {
      expect(val).toEqual({ success: true, data: 'test' });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisCacheService.get).not.toHaveBeenCalled();
    });
  });

  it('should bypass blacklisted routes like /health', async () => {
    const context = createMockContext('GET', '/health', '/health');
    const result$ = await interceptor.intercept(context, mockCallHandler);

    result$.subscribe(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisCacheService.get).not.toHaveBeenCalled();
    });
  });

  it('should set X-Cache: MISS header and cache response on cache miss', async () => {
    redisCacheService.get.mockResolvedValue(null);

    const context = createMockContext('GET', '/api/v1/users', '/api/v1/users');
    const result$ = await interceptor.intercept(context, mockCallHandler);

    result$.subscribe((val) => {
      expect(val).toEqual({ success: true, data: 'test' });
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisCacheService.set).toHaveBeenCalled();
    });
  });

  it('should return cached data and set X-Cache: HIT header on cache hit', async () => {
    const cachedPayload = { success: true, data: 'cached-test' };
    redisCacheService.get.mockResolvedValue(cachedPayload);

    const context = createMockContext('GET', '/api/v1/users', '/api/v1/users');
    const result$ = await interceptor.intercept(context, mockCallHandler);

    result$.subscribe((val) => {
      expect(val).toEqual(cachedPayload);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
    });
  });
});
