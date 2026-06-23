import { type Session } from '../types';

const SESSION_KEY = 'nearbyfeed.session';
const CLIENT_ID_KEY = 'nearbyfeed.client-id';

export const readSession = (): Session | null => {
  const value = localStorage.getItem(SESSION_KEY);
  return value === null ? null : (JSON.parse(value) as Session);
};

export const saveSession = (session: Session): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

export const getClientId = (): string => {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing !== null) return existing;

  const value = crypto.randomUUID();
  localStorage.setItem(CLIENT_ID_KEY, value);
  return value;
};
