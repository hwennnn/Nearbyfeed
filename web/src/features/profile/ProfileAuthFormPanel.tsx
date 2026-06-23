import { AtSign, LockKeyhole, UserRound } from 'lucide-react';
import {
  type ProfileAuthExperience,
  type ProfileAuthMode,
} from './profile-auth-presentation';

export const ProfileAuthFormPanel = ({
  email,
  experience,
  isError,
  isPending,
  mode,
  notice,
  onEmailChange,
  onModeChange,
  onPasswordChange,
  onSubmit,
  onUsernameChange,
  password,
  username,
}: {
  email: string;
  experience: ProfileAuthExperience;
  isError: boolean;
  isPending: boolean;
  mode: ProfileAuthMode;
  notice: string | null;
  onEmailChange: (value: string) => void;
  onModeChange: (mode: ProfileAuthMode) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onUsernameChange: (value: string) => void;
  password: string;
  username: string;
}) => (
  <form
    className="auth-card"
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <div className="auth-card-head">
      <span className="auth-mark">NF</span>
      <span>{mode === 'login' ? 'Welcome back' : 'New handle'}</span>
    </div>
    <h1>{mode === 'login' ? 'Sign in' : 'Register'}</h1>
    {notice !== null && <div className="success-note">{notice}</div>}
    {isError && <div className="form-error">The auth request failed.</div>}
    {mode === 'register' && (
      <label className="auth-input-shell">
        <UserRound />
        <input
          autoComplete="username"
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder="Username"
          value={username}
        />
      </label>
    )}
    <label className="auth-input-shell">
      <AtSign />
      <input
        autoComplete="email"
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="Email"
        type="email"
        value={email}
      />
    </label>
    <label className="auth-input-shell">
      <LockKeyhole />
      <input
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        onChange={(event) => onPasswordChange(event.target.value)}
        placeholder="Password"
        type="password"
        value={password}
      />
    </label>
    <button
      className="primary-button auth-submit"
      disabled={isPending}
      type="submit"
    >
      {isPending ? 'Working...' : experience.ctaLabel}
    </button>
    <button
      className="text-command"
      disabled={isPending}
      onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
      type="button"
    >
      {experience.switchLabel}
    </button>
  </form>
);
