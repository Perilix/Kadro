import { z } from 'zod';

export const zEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI manquant'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET : 32 caractères minimum'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET : 32 caractères minimum'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  CORS_ORIGINS: z.string().optional(),
  JOIN_URL_BASE: z.string().url().default('https://kadro-app.com/rejoindre'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  MOBILE_REDIRECT_URL: z.string().default('kadro://connections'),
  WEB_APP_URL: z.string().url().default('http://localhost:4200'),
  TOKENS_ENC_KEY: z.string().min(32).optional(),
  STRAVA_CLIENT_ID: z.string().optional(),
  STRAVA_CLIENT_SECRET: z.string().optional(),
  STRAVA_VERIFY_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof zEnv>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = zEnv.safeParse(config);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join('.')} — ${i.message}`).join(' · ');
    throw new Error(`Configuration invalide : ${detail}`);
  }
  return parsed.data;
}
