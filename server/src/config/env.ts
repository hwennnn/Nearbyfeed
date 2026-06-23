import { resolve } from 'path';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

type EnvLike = {
  APP_ENV?: string;
  NODE_ENV?: string;
};

type PortEnvLike = {
  PORT?: string;
};

type CorsEnvLike = EnvLike & {
  CORS_ORIGINS?: string;
  WEB_ORIGIN?: string;
};

const LOCAL_VITE_PORTS = [5173, 5174, 5175, 5176] as const;

const LOCAL_WEB_ORIGINS = [
  ...LOCAL_VITE_PORTS.map((port) => `http://localhost:${port}`),
  ...LOCAL_VITE_PORTS.map((port) => `http://127.0.0.1:${port}`),
];

export const getEnvFilePaths = (
  env: EnvLike = process.env as EnvLike,
): string[] => {
  const appEnv = env.APP_ENV ?? env.NODE_ENV ?? 'development';

  return [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), `.env.${appEnv}`),
  ];
};

export const getPort = (env: PortEnvLike = process.env as PortEnvLike) => {
  const port = Number(env.PORT);
  return Number.isInteger(port) && port > 0 ? port : 3000;
};

const normalizeOrigin = (origin: string): string | undefined => {
  try {
    return new URL(origin.trim()).origin;
  } catch {
    return undefined;
  }
};

const parseCorsOriginList = (value?: string): string[] =>
  (value ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin));

const unique = (values: string[]): string[] => Array.from(new Set(values));

const isProduction = (env: EnvLike): boolean =>
  (env.APP_ENV ?? env.NODE_ENV ?? '').toLowerCase() === 'production';

export const getCorsOrigins = (
  env: CorsEnvLike = process.env as CorsEnvLike,
): string[] => {
  const configuredOrigins = unique([
    ...parseCorsOriginList(env.CORS_ORIGINS),
    ...parseCorsOriginList(env.WEB_ORIGIN),
  ]);

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return isProduction(env) ? [] : [...LOCAL_WEB_ORIGINS];
};

export const getCorsOptions = (
  env: CorsEnvLike = process.env as CorsEnvLike,
): CorsOptions => {
  const origins = getCorsOrigins(env);

  return {
    origin: origins.length > 0 ? origins : false,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  };
};
