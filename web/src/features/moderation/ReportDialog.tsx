import { ShieldAlert, X } from 'lucide-react';
import { type ReportReason } from '@nearbyfeed/shared';
import {
  REPORT_REASONS,
  getReportDialogCopy,
} from './report-presentation';
import { type ReportDialogTarget } from './report-types';

export const ReportDialog = ({
  errorMessage,
  isSubmitting,
  onClose,
  onSignIn,
  onSubmit,
  signedIn,
  target,
}: {
  errorMessage: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSubmit: (reason: ReportReason) => void;
  signedIn: boolean;
  target: ReportDialogTarget | null;
}) => {
  if (target === null) return null;

  const copy = getReportDialogCopy(target.kind);
  const preview = target.preview?.trim();

  return (
    <div className="report-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-describedby="report-dialog-body"
        aria-labelledby="report-dialog-title"
        aria-modal="true"
        className="report-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="report-modal-head">
          <span className="report-modal-icon">
            <ShieldAlert />
          </span>
          <div>
            <span>{copy.eyebrow}</span>
            <h2 id="report-dialog-title">{copy.title}</h2>
          </div>
          <button
            aria-label="Close report dialog"
            className="icon-button report-close-button"
            onClick={onClose}
            type="button"
          >
            <X />
          </button>
        </div>

        <p id="report-dialog-body" className="report-modal-copy">
          {copy.body}
        </p>

        {preview !== undefined && preview.length > 0 && (
          <blockquote className="report-preview">{preview}</blockquote>
        )}

        {signedIn ? (
          <>
            <div className="report-reason-grid">
              {REPORT_REASONS.map((reason) => (
                <button
                  className="report-reason-button"
                  disabled={isSubmitting}
                  key={reason.value}
                  onClick={() => onSubmit(reason.value)}
                  type="button"
                >
                  <strong>{reason.label}</strong>
                  <span>{reason.detail}</span>
                </button>
              ))}
            </div>
            {isSubmitting && (
              <div className="report-modal-status" role="status">
                Sending report...
              </div>
            )}
            {errorMessage !== null && (
              <div className="form-error report-modal-status" role="alert">
                {errorMessage}
              </div>
            )}
          </>
        ) : (
          <div className="report-signin-gate">
            <strong>Sign in to send trusted reports.</strong>
            <span>
              Reports are attached to verified accounts so moderation can act
              fast without turning the feed into noise.
            </span>
            <button className="primary-button" onClick={onSignIn} type="button">
              Sign in to report
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
