export type LiveUpdateSource = 'x';

export type LiveUpdate = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: LiveUpdateSource;
  occurredAt: string | null;
  tags: string[];
};
