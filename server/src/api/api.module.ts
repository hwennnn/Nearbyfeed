import { Logger, Module, type DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiService } from './api.service';

@Module({
  imports: [ConfigModule],
  providers: [ApiService, Logger],
  exports: [ApiService],
})
export class ApiModule {
  static forRoot(apiUrl: string): DynamicModule {
    return {
      module: ApiModule,
      imports: [ConfigModule],
      providers: [
        ApiService,
        {
          provide: 'API_URL',
          useValue: apiUrl,
        },
      ],
      exports: [ApiService],
    };
  }
}
