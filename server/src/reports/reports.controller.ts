import { Body, Controller, Post } from '@nestjs/common';
import { CreateCommentReportDto } from 'src/reports/dto/create-comment-report.dto';
import { ReportsService } from 'src/reports/reports.service';
import { CreatePostReportDto } from './dto/create-post-report.dto';

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
