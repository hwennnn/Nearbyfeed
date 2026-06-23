import { UserX, X } from 'lucide-react';
import { getBlockDialogCopy } from './block-presentation';
import { type BlockUserTarget } from './block-types';

export const BlockUserDialog = ({
  errorMessage,
  isSubmitting,
  onClose,
  onConfirm,
  onSignIn,
  signedIn,
  target,
}: {
  errorMessage: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSignIn: () => void;
  signedIn: boolean;
  target: BlockUserTarget | null;
}) => {
  if (target === null) return null;

  const copy = getBlockDialogCopy(target.kind);
  const preview = target.preview?.trim();

  return (
    <div className="report-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-describedby="block-dialog-body"
        aria-labelledby="block-dialog-title"
        aria-modal="true"
        className="report-modal block-user-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="report-modal-head">
          <span className="report-modal-icon block-user-modal-icon">
            <UserX />
          </span>
          <div>
            <span>{copy.eyebrow}</span>
            <h2 id="block-dialog-title">{copy.title}</h2>
          </div>
          <button
            aria-label="Close mute dialog"
            className="icon-button report-close-button"
            onClick={onClose}
            type="button"
          >
            <X />
          </button>
        </div>

        <p id="block-dialog-body" className="report-modal-copy">
          {copy.body}
        </p>

        <div className="block-user-target-card">
          <strong>@{target.username}</strong>
          {preview !== undefined && preview.length > 0 && <span>{preview}</span>}
        </div>

        {signedIn ? (
          <div className="block-user-confirm-row">
            <button
              className="danger-button"
              disabled={isSubmitting}
              onClick={onConfirm}
              type="button"
            >
              <UserX />
              {isSubmitting ? 'Muting...' : `Mute ${target.username}`}
            </button>
            <button
              className="text-command"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="report-signin-gate">
            <strong>Sign in to tune your radius.</strong>
            <span>
              Mutes are saved to your account so your nearby feed stays clean
              across devices.
            </span>
            <button className="primary-button" onClick={onSignIn} type="button">
              Sign in to mute
            </button>
          </div>
        )}

        {errorMessage !== null && (
          <div className="form-error report-modal-status" role="alert">
            {errorMessage}
          </div>
        )}
      </section>
    </div>
  );
};
