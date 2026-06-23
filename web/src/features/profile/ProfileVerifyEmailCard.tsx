import { ArrowLeft, MailCheck, RefreshCw } from 'lucide-react';
import { type PendingRegistration } from '../../lib/api';
import { ProfileAuthStage } from './ProfileAuthStage';
import { getProfileAuthExperience } from './profile-auth-presentation';

export const ProfileVerifyEmailCard = ({
  isError,
  isResending,
  isVerifying,
  notice,
  onBack,
  onOtpChange,
  onResend,
  onSubmit,
  otpCode,
  pendingRegistration,
}: {
  isError: boolean;
  isResending: boolean;
  isVerifying: boolean;
  notice: string | null;
  onBack: () => void;
  onOtpChange: (value: string) => void;
  onResend: () => void;
  onSubmit: () => void;
  otpCode: string;
  pendingRegistration: PendingRegistration;
}) => {
  const experience = getProfileAuthExperience('register');

  return (
    <ProfileAuthStage experience={experience}>
    <form
      className="verify-card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="verify-beacon">
        <MailCheck />
        <span>Handle reserved</span>
      </div>
      <h1>Drop the code</h1>
      <p>
        We sent a six-digit pass to{' '}
        <strong>{pendingRegistration.pendingUser.email}</strong>. Verify it to
        enter the live feed.
      </p>
      {notice !== null && <div className="success-note">{notice}</div>}
      {isError && (
        <div className="form-error">That code did not land. Check it and try again.</div>
      )}
      <input
        aria-label="Verification code"
        autoComplete="one-time-code"
        className="otp-input"
        inputMode="numeric"
        maxLength={6}
        onChange={(event) =>
          onOtpChange(event.target.value.replace(/\D/g, '').slice(0, 6))
        }
        placeholder="000000"
        value={otpCode}
      />
      <button
        className="primary-button"
        disabled={isVerifying || otpCode.length !== 6}
        type="submit"
      >
        {isVerifying ? 'Checking...' : 'Verify and enter'}
      </button>
      <div className="verify-actions">
        <button className="text-command" onClick={onBack} type="button">
          <ArrowLeft />
          Edit email
        </button>
        <button
          className="text-command"
          disabled={isResending}
          onClick={onResend}
          type="button"
        >
          <RefreshCw />
          {isResending ? 'Sending...' : 'Resend'}
        </button>
      </div>
    </form>
    </ProfileAuthStage>
  );
};
