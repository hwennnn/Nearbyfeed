import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { PasswordSanitizerInterceptor } from 'src/common/interceptors';
import { getCorsOptions, getPort } from 'src/config/env';
import { ObservabilityService } from 'src/observability/observability.service';
import { AllExceptionsFilter } from 'src/utils';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
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

  await app.listen(getPort());
}

bootstrap()
  .then(() => {
    console.log('Server running');
  })
  .catch((e) => {
    console.error(e);
  });
