import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/nidhiflow?schema=public'),
  JWT_SECRET: z.string().min(16).default('super_secret_jwt_key_minimum_16_chars'),
  JWT_EXPIRES_IN: z.string().default('1d'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Config validation error: ${JSON.stringify(result.error.format())}`);
  }
  return result.data;
}
