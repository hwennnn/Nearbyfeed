import {
  Injectable,
  Logger,
  type INestApplication,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, type Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error'>
  implements OnModuleInit
{
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'stdout',
          level: 'info',
        },
        {
          emit: 'stdout',
          level: 'warn',
        },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    if (this.configService.get('APP_ENV') === 'development') {
      this.$on('query', (e) => {
        this.logger.log('Query: ' + e.query);
        this.logger.log('Params: ' + e.params);
        this.logger.log(`Duration: ${e.duration} + ms`);
      });
    }

    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
