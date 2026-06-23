import { Logger, Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [UsersModule],
  controllers: [ReportsController],
  providers: [ReportsService, Logger],
})
export class ReportsModule {}
