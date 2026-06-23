import { type ReactNode } from 'react';
import { type View } from '../app-types';
import { type Session } from '../types';
import { MobileNav, SideNav } from './Navigation';

export const AppLayout = ({
  activeView,
  children,
  session,
  setView,
}: {
  activeView: View;
  children: ReactNode;
  session: Session | null;
  setView: (view: View) => void;
}) => (
  <div className="app-shell">
    <SideNav activeView={activeView} setView={setView} session={session} />
    {children}
    <MobileNav activeView={activeView} setView={setView} />
  </div>
);
