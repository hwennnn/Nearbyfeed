import { type ReportReason } from '@nearbyfeed/shared';
import { BlockUserDialog } from '../moderation/BlockUserDialog';
import { type BlockUserTarget } from '../moderation/block-types';
import { ReportDialog } from '../moderation/ReportDialog';
import { type ReportDialogTarget } from '../moderation/report-types';

export const DetailsModerationDialogs = ({
  blockErrorMessage,
  blockTarget,
  isBlocking,
  isReporting,
  onBlockSignIn,
  onCloseBlock,
  onCloseReport,
  onConfirmBlock,
  onReportSignIn,
  onSubmitReport,
  reportErrorMessage,
  reportTarget,
  signedIn,
}: {
  blockErrorMessage: string | null;
  blockTarget: BlockUserTarget | null;
  isBlocking: boolean;
  isReporting: boolean;
  onBlockSignIn: () => void;
  onCloseBlock: () => void;
  onCloseReport: () => void;
  onConfirmBlock: () => void;
  onReportSignIn: () => void;
  onSubmitReport: (reason: ReportReason) => void;
  reportErrorMessage: string | null;
  reportTarget: ReportDialogTarget | null;
  signedIn: boolean;
}) => (
  <>
    <ReportDialog
      errorMessage={reportErrorMessage}
      isSubmitting={isReporting}
      onClose={onCloseReport}
      onSignIn={onReportSignIn}
      onSubmit={onSubmitReport}
      signedIn={signedIn}
      target={reportTarget}
    />
    <BlockUserDialog
      errorMessage={blockErrorMessage}
      isSubmitting={isBlocking}
      onClose={onCloseBlock}
      onConfirm={onConfirmBlock}
      onSignIn={onBlockSignIn}
      signedIn={signedIn}
      target={blockTarget}
    />
  </>
);
