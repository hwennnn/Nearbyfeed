import { Flame, Sparkles } from 'lucide-react';
import { type LiveUpdate, type Post } from '../../types';
import { getMapVibeSnapshot } from './map-presentation';

export const MapVibeCard = ({
  liveUpdates,
  posts,
}: {
  liveUpdates: LiveUpdate[];
  posts: Post[];
}) => {
  const vibe = getMapVibeSnapshot(posts, liveUpdates);

  return (
    <section
      aria-label="Nearby vibe snapshot"
      className={`map-vibe-card is-${vibe.tone}`}
    >
      <div className="map-vibe-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="map-vibe-copy">
        <span className="map-vibe-eyebrow">
          <Sparkles />
          {vibe.eyebrow}
        </span>
        <strong>{vibe.title}</strong>
        <p>{vibe.body}</p>
      </div>
      <span className="map-vibe-action">
        <Flame />
        {vibe.action}
      </span>
    </section>
  );
};
