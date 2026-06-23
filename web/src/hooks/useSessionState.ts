import { useState } from 'react';
import { clearSession, readSession, saveSession } from '../lib/session';
import { type Session } from '../types';

export const useSessionState = () => {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const handleSession = (nextSession: Session) => {
    saveSession(nextSession);
    setSession(nextSession);
  };

  const signOut = () => {
    clearSession();
    setSession(null);
  };

  return {
    handleSession,
    session,
    signOut,
  };
};
