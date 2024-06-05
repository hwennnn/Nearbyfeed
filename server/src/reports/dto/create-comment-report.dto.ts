import { IsEnum, IsString } from 'class-validator';
import { ReportReason } from 'src/reports/entities';

export class CreateCommentReportDto {
  @IsString()
  commentId: string;

  @IsEnum(ReportReason, {
    message: 'Reason must be a valid ReportReason enum value',
  })
  reason: ReportReason;
}
