import { Logger, ValidationPipe, type INestApplication } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { PasswordSanitizerInterceptor } from 'src/common/interceptors';
import { getCorsOptions, getPort } from 'src/config/env';
import { ObservabilityService } from 'src/observability/observability.service';
import { AllExceptionsFilter } from 'src/utils';
import { AppModule } from './app.module';

type BootstrapLogger = Pick<Logger, 'error' | 'log'>;

type BootstrapOptions = {
  createApp?: () => Promise<Pick<INestApplication, 'listen'>>;
  env?: Record<string, string | undefined>;
  logger?: BootstrapLogger;
};

export async function createServerApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new PasswordSanitizerInterceptor());

  const { httpAdapter } = app.get(HttpAdapterHost);
  const observabilityService = app.get(ObservabilityService);

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter, observabilityService));
  app.enableCors(getCorsOptions());

  app.enableShutdownHooks();

  return app;
}

export async function bootstrap({
  createApp = createServerApp,
  env = process.env,
  logger = new Logger('Bootstrap'),
}: BootstrapOptions = {}): Promise<void> {
  const app = await createApp();
  const port = getPort(env);

  await app.listen(port);
  logger.log(`Server running on port ${port}`);
}

export function startServer({
  logger = new Logger('Bootstrap'),
}: Pick<BootstrapOptions, 'logger'> = {}): void {
  void bootstrap({ logger }).catch((error: unknown) => {
    logger.error(
      'Failed to start server',
      error instanceof Error ? error.stack : String(error),
    );
    process.exitCode = 1;
  });
}

if (require.main === module) {
  startServer();
}
