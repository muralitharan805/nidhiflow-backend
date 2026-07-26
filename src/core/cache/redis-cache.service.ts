import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Service handling Redis cache connection lifecycle, key-value retrieval,
 * storage, deletion, and pattern purging with fault-tolerant DB fallbacks.
 */
@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client!: Redis;
  private isConnected = false;

  /**
   * Initializes RedisCacheService with injected ConfigService.
   *
   * @param configService - Application environment configuration provider
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * NestJS lifecycle hook connecting to Redis on module initialization.
   */
  onModuleInit(): void {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD', '');

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 2,
      lazyConnect: false,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log(`✅ Connected to Redis Server at ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.logger.warn(
        `⚠️ Redis Connection Error: ${err.message}. Falling back to DB queries.`,
      );
    });
  }

  /**
   * NestJS lifecycle hook disconnecting Redis client on application shutdown.
   */
  onModuleDestroy(): void {
    if (this.client) {
      this.client.disconnect();
    }
  }

  /**
   * Retrieves a cached value by key. Returns null on miss or Redis offline.
   *
   * @template T - Type of the deserialized cached payload
   * @param key - Redis cache key
   * @returns Deserialized cached data or null
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null;
    }
    try {
      const data = await this.client.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to read key ${key} from Redis: ${message}`);
      return null;
    }
  }

  /**
   * Stores a value in Redis cache with specified TTL in seconds.
   *
   * @param key - Redis cache key
   * @param value - Value to serialize and cache
   * @param ttlSeconds - Expiration TTL in seconds (default: 300s)
   */
  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!this.isConnected) {
      return;
    }
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to write key ${key} to Redis: ${message}`);
    }
  }

  /**
   * Deletes a specific key from Redis cache.
   *
   * @param key - Redis cache key to remove
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }
    try {
      await this.client.del(key);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to delete key ${key} from Redis: ${message}`);
    }
  }

  /**
   * Purges all keys matching a glob pattern using scanStream.
   *
   * @param pattern - Glob key pattern (e.g. 'nidhiflow:cache:users:*')
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        const stream = this.client.scanStream({ match: pattern, count: 100 });
        stream.on('data', (keys: string[]) => {
          if (keys.length > 0) {
            const pipeline = this.client.pipeline();
            keys.forEach((k) => pipeline.del(k));
            void pipeline.exec();
          }
        });
        stream.on('end', () => resolve());
        stream.on('error', (err) => reject(err));
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to clear cache pattern ${pattern}: ${message}`);
    }
  }
}
