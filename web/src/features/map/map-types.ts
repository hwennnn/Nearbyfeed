import { type Coordinates } from '../../types';

export type MapPostTone = 'fresh' | 'chat' | 'poll' | 'hot';
export type MapPulseLevel = 'quiet' | 'warming' | 'rising' | 'surging';
export type LiveMapSignalTone = 'social' | 'scene' | 'alert';

export type LiveMapSignal = {
  coordinates: Coordinates;
  id: string;
  label: string;
  sourceLabel: string;
  summary: string;
  title: string;
  tone: LiveMapSignalTone;
  url: string;
};

export type MapLiveStory = {
  detail: string;
  headline: string;
  kicker: string;
  metrics: Array<{
    label: 'drops' | 'X live' | 'replies';
    value: string;
  }>;
  tone: MapPulseLevel;
};

export type MapVibeSnapshot = {
  action: string;
  body: string;
  eyebrow: string;
  title: string;
  tone: MapPulseLevel;
};

export type MapLiveSheetSummary = {
  action: string;
  detail: string;
  headline: string;
  kicker: string;
  statChips: Array<{
    label: 'drops' | 'X live' | 'replies';
    value: string;
  }>;
  tone: MapPulseLevel;
};
