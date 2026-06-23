import { useMutation } from '@tanstack/react-query';
import { captureEvent, reportComment, reportPost } from '../../lib/api';
import { getReportSuccessMessage } from './report-presentation';
import { type ReportSubmissionInput } from './report-types';

export const useReportSubmission = ({
  onSuccess,
}: {
  onSuccess: (message: string) => void;
}) =>
  useMutation<void, Error, ReportSubmissionInput>({
    mutationFn: async ({ reason, target }) => {
      if (target.kind === 'post') {
        await reportPost(target.id, reason);
        return;
      }

      await reportComment(target.id, reason);
    },
    onSuccess: (_data, variables) => {
      void captureEvent(
        'web.report_created',
        {
          reason: variables.reason,
          targetId: variables.target.id,
          targetKind: variables.target.kind,
        },
        'details',
      );
      onSuccess(getReportSuccessMessage(variables.target.kind));
    },
  });
