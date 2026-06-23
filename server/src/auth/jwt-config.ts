import { ConfigService } from '@nestjs/config';

export const getJwtSecret = (
  configService: ConfigService,
  key: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET',
): string => {
  const configuredValue = configService.get<string>(key);
  if (configuredValue !== undefined && configuredValue.trim().length > 0) {
    return configuredValue;
  }

  const appEnv =
    configService.get<string>('APP_ENV') ??
    configService.get<string>('NODE_ENV') ??
    process.env.NODE_ENV;

  if (appEnv === 'development' || appEnv === 'test') {
    return `nearbyfeed-${key.toLowerCase().replace(/_/g, '-')}-dev-secret`;
  }

  throw new Error(`${key} is required`);
};
