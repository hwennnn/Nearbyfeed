import {
  REPORT_REASON_OPTIONS,
  type ReportReason,
} from '@nearbyfeed/shared';
import { type ReportTargetKind } from './report-types';

export const REPORT_REASONS = REPORT_REASON_OPTIONS;

export const getReportReasonOption = (reason: ReportReason) =>
  REPORT_REASONS.find((option) => option.value === reason);

export const getReportDialogCopy = (target: ReportTargetKind) => {
  if (target === 'post') {
    return {
      eyebrow: 'Community signal check',
      title: 'Why are you reporting this feed?',
      body: 'Pick the closest reason. Nearbyfeed uses reports to keep the local pulse useful, safe, and actually worth opening.',
    };
  }

  return {
    eyebrow: 'Reply trust check',
    title: 'Why are you reporting this comment?',
    body: 'Pick the closest reason. Reports help keep local replies useful, safe, and grounded in what is really happening nearby.',
  };
};

export const getReportSuccessMessage = (target: ReportTargetKind): string =>
  target === 'post'
    ? "Report sent. We'll review this feed against the community guidelines."
    : "Report sent. We'll review this comment against the community guidelines.";
