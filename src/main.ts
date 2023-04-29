import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidUnknownValues: false }),
  );
  app.enableCors();

  await app.listen(3000);
}

bootstrap()
  .then(() => {
    console.log('Server running');
  })
  .catch((e) => {
    console.error(e);
  });
