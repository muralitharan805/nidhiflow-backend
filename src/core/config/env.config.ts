import { z } from 'zod';

/**
 * Environment configuration schema enforcing runtime type validation.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z
    .string()
    .default(
      'postgresql://postgres:postgres@localhost:5432/nidhiflow?schema=public',
    ),
  JWT_SECRET: z
    .string()
    .min(16)
    .default('super_secret_jwt_key_minimum_16_chars'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_CACHE_GLOBAL_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val === 'true' || val === '1'),
  CACHE_DISABLED_ROUTES: z.string().default(''),
});

/**
 * Inferred environment configuration type.
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates raw environment variable object against envSchema.
 *
 * @param config - Raw key-value environment pairs
 * @returns Parsed and typed environment configuration
 * @throws Error if environment validation fails
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Config validation error: ${JSON.stringify(result.error.format())}`,
    );
  }
  return result.data;
}
