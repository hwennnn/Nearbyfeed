import { Logger, Module, type DynamicModule } from '@nestjs/common';
import { ApiService } from './api.service';

@Module({
  providers: [ApiService, Logger],
  exports: [ApiService],
})
export class ApiModule {
  static forRoot(apiUrl: string): DynamicModule {
    return {
      module: ApiModule,
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
