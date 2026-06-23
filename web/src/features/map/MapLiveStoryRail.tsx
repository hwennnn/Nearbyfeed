import { MessageCircle, RadioTower, SatelliteDish } from 'lucide-react';
import { type LiveUpdate, type Post } from '../../types';
import { getMapLiveStory } from './map-presentation';
import { type MapLiveStory } from './map-types';

type MetricLabel = MapLiveStory['metrics'][number]['label'];

const metricIcons: Record<MetricLabel, typeof RadioTower> = {
  'X live': SatelliteDish,
  drops: RadioTower,
  replies: MessageCircle,
};

const metricLabels: Record<
  MetricLabel,
  {
    plural: string;
    singular: string;
  }
> = {
  'X live': {
    plural: 'X live',
    singular: 'X live',
  },
  drops: {
    plural: 'drops',
    singular: 'drop',
  },
  replies: {
    plural: 'replies',
    singular: 'reply',
  },
};

export const MapLiveStoryRail = ({
  liveUpdates,
  posts,
}: {
  liveUpdates: LiveUpdate[];
  posts: Post[];
}) => {
  const story = getMapLiveStory(posts, liveUpdates);

  return (
    <section className={`map-live-story is-${story.tone}`}>
      <span className="map-live-story-kicker">{story.kicker}</span>
      <strong>{story.headline}</strong>
      <p>{story.detail}</p>
      <div className="map-live-story-metrics" aria-label="Map live story metrics">
        {story.metrics.map((metric) => {
          const Icon = metricIcons[metric.label];
          const label =
            metric.value === '1'
              ? metricLabels[metric.label].singular
              : metricLabels[metric.label].plural;

          return (
            <span key={metric.label}>
              <Icon />
              <em>{metric.value}</em>
              {label}
            </span>
          );
        })}
      </div>
    </section>
  );
};
