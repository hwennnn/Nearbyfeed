import { KeyRound, Link2 } from 'lucide-react';
import { type User } from '../../types';

export const ProfileAccountPanel = ({ profile }: { profile: User }) => {
  const providers = profile.providers ?? [];

  return (
    <div className="activity-panel">
      <div className="account-card">
        <KeyRound />
        <strong>Password</strong>
        <span>{profile.hasPassword === false ? 'Not created' : 'Enabled'}</span>
      </div>
      {providers.map((provider) => (
        <div className="account-card" key={provider.providerName}>
          <Link2 />
          <strong>{provider.providerName}</strong>
          <span>{provider.isActive ? 'Connected' : 'Disconnected'}</span>
        </div>
      ))}
      {providers.length === 0 && (
        <div className="account-card">
          <Link2 />
          <strong>Email</strong>
          <span>Connected</span>
        </div>
      )}
    </div>
  );
};
