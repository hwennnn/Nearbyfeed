import { IsEnum, IsString } from 'class-validator';
import { ReportReason } from '@nearbyfeed/shared';
import { IsReportId } from './report-id.decorator';

export class CreatePostReportDto {
  @IsString()
  @IsReportId()
  postId: string;

  @IsEnum(ReportReason, {
    message: 'Reason must be a valid ReportReason enum value',
  })
  reason: ReportReason;
}
