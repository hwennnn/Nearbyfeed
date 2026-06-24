import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorators';
import { JwtAuthGuard } from 'src/auth/guards';
import { CreateCommentReportDto, CreatePostReportDto } from 'src/reports/dto';

import { ReportsService } from 'src/reports/reports.service';
import { UserActiveGuard } from 'src/users/guards';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard, UserActiveGuard)
  async reportPost(
    @Body() dto: CreatePostReportDto,
    @GetUser('userId') userId: string,
  ): Promise<void> {
    await this.reportsService.reportPost(dto, userId);
  }

  @Post('comments')
  @UseGuards(JwtAuthGuard, UserActiveGuard)
  async reportComment(
    @Body() dto: CreateCommentReportDto,
    @GetUser('userId') userId: string,
  ): Promise<void> {
    await this.reportsService.reportComment(dto, userId);
  }
}
