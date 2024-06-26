import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { PasswordSanitizerInterceptor } from 'src/common/interceptors';
import { AllExceptionsFilter } from 'src/utils';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidUnknownValues: false }),
  );
  app.useGlobalInterceptors(new PasswordSanitizerInterceptor());

  const { httpAdapter } = app.get(HttpAdapterHost);

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.enableCors();

  app.enableShutdownHooks();

  await app.listen(3000);
}

bootstrap()
  .then(() => {
    console.log('Server running');
  })
  .catch((e) => {
    console.error(e);
  });
