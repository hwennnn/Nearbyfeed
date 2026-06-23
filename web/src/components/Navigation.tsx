import {
  Flame,
  Map as MapIcon,
  Plus,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { type View } from '../app-types';
import { type Session } from '../types';

const NavButton = ({
  Icon,
  isActive,
  label,
  onClick,
}: {
  Icon: LucideIcon;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    aria-label={label}
    className={`nav-button ${isActive ? 'is-active' : ''}`}
    onClick={onClick}
    title={label}
  >
    <Icon />
    <span>{label}</span>
  </button>
);

export const SideNav = ({
  activeView,
  session,
  setView,
}: {
  activeView: View;
  session: Session | null;
  setView: (view: View) => void;
}) => (
  <aside className="side-nav">
    <button className="brand-lockup" onClick={() => setView('feed')}>
      <span className="brand-mark">NF</span>
      <span>
        <strong>NearbyFeed</strong>
        <small>live around you</small>
      </span>
    </button>
    <NavButton
      Icon={Flame}
      isActive={activeView === 'feed'}
      label="Feed"
      onClick={() => setView('feed')}
    />
    <NavButton
      Icon={MapIcon}
      isActive={activeView === 'map'}
      label="Map"
      onClick={() => setView('map')}
    />
    <NavButton
      Icon={Plus}
      isActive={activeView === 'create'}
      label="Post"
      onClick={() => setView('create')}
    />
    <NavButton
      Icon={UserRound}
      isActive={activeView === 'profile'}
      label={session === null ? 'Sign in' : 'Profile'}
      onClick={() => setView('profile')}
    />
  </aside>
);

export const MobileNav = ({
  activeView,
  setView,
}: {
  activeView: View;
  setView: (view: View) => void;
}) => (
  <nav className="mobile-nav">
    <NavButton
      Icon={Flame}
      isActive={activeView === 'feed'}
      label="Feed"
      onClick={() => setView('feed')}
    />
    <NavButton
      Icon={MapIcon}
      isActive={activeView === 'map'}
      label="Map"
      onClick={() => setView('map')}
    />
    <NavButton
      Icon={Plus}
      isActive={activeView === 'create'}
      label="Post"
      onClick={() => setView('create')}
    />
    <NavButton
      Icon={UserRound}
      isActive={activeView === 'profile'}
      label="Me"
      onClick={() => setView('profile')}
    />
  </nav>
);
