import { Body, Controller, Post } from '@nestjs/common';
import { CreateCommentReportDto, CreatePostReportDto } from 'src/reports/dto';

import { ReportsService } from 'src/reports/reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('posts')
  async reportPost(@Body() dto: CreatePostReportDto): Promise<void> {
    await this.reportsService.reportPost(dto);
  }

  @Post('comments')
  async reportComment(@Body() dto: CreateCommentReportDto): Promise<void> {
    await this.reportsService.reportComment(dto);
  }
}
