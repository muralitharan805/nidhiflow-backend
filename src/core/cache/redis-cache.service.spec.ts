import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from './redis-cache.service';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn((event, callback) => {
        if (event === 'connect') {
          callback();
        }
      }),
      get: jest.fn().mockResolvedValue(JSON.stringify({ id: 1, name: 'Test' })),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      scanStream: jest.fn().mockReturnValue({
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(['nidhiflow:cache:test:1']);
          }
        }),
      }),
      pipeline: jest.fn().mockReturnValue({
        del: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      disconnect: jest.fn(),
    };
  });
});

describe('RedisCacheService', () => {
  let service: RedisCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: unknown) => {
              if (key === 'REDIS_HOST') return 'localhost';
              if (key === 'REDIS_PORT') return 6379;
              if (key === 'REDIS_PASSWORD') return '';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve parsed JSON payload from Redis on get()', async () => {
    const result = await service.get<{ id: number; name: string }>('test:key');
    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  it('should set key-value in Redis on set()', async () => {
    await expect(service.set('test:key', { id: 1 }, 300)).resolves.not.toThrow();
  });

  it('should delete key in Redis on del()', async () => {
    await expect(service.del('test:key')).resolves.not.toThrow();
  });

  it('should clear pattern in Redis on delByPattern()', async () => {
    await expect(service.delByPattern('nidhiflow:cache:test:*')).resolves.not.toThrow();
  });
});
