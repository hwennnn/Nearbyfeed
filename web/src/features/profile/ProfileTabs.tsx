import { Flame, MessageCircle, ShieldMinus, UserRound } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { type ProfileTab } from './profile-types';

const tabs: Array<{ Icon: LucideIcon; label: string; value: ProfileTab }> = [
  { Icon: Flame, label: 'Posts', value: 'posts' },
  { Icon: MessageCircle, label: 'Replies', value: 'comments' },
  { Icon: UserRound, label: 'Account', value: 'account' },
  { Icon: ShieldMinus, label: 'Muted', value: 'blocked' },
];

export const ProfileTabs = ({
  activeTab,
  onChange,
}: {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}) => (
  <div className="profile-tabs">
    {tabs.map(({ Icon, ...tab }) => (
      <button
        aria-label={tab.label}
        className={activeTab === tab.value ? 'is-selected' : ''}
        key={tab.value}
        onClick={() => onChange(tab.value)}
        type="button"
      >
        <Icon />
        <span>{tab.label}</span>
      </button>
    ))}
  </div>
);
