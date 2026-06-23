import { type ReportReason } from '@nearbyfeed/shared';

export type ReportTargetKind = 'post' | 'comment';

export type ReportDialogTarget = {
  id: number;
  kind: ReportTargetKind;
  preview?: string;
};

export type ReportSubmissionInput = {
  reason: ReportReason;
  target: ReportDialogTarget;
};
