import {
  Flame,
  MessageCircle,
  Radio,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { type FeedSceneStatTone } from './feed-presentation';

const STAT_ICONS: Record<FeedSceneStatTone, LucideIcon> = {
  chat: MessageCircle,
  live: Radio,
  media: Sparkles,
  pulse: Flame,
};

export const FeedSceneStats = ({
  stats,
}: {
  stats: Array<{
    label: string;
    tone: FeedSceneStatTone;
    value: string;
  }>;
}) => (
  <div className="scene-board-stats" aria-label="Nearby scene stats">
    {stats.map((stat) => {
      const Icon = STAT_ICONS[stat.tone];

      return (
        <span className={`scene-stat is-${stat.tone}`} key={stat.label}>
          <Icon />
          <strong>{stat.value}</strong>
          <em>{stat.label}</em>
        </span>
      );
    })}
  </div>
);
