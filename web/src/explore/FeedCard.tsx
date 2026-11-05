import { useState } from 'react';
import type { FeedItem } from './feed-api';
import {
  formatAge,
  formatDistance,
  hasExactLocation,
  isFixture,
} from './geo-presentation';

type FeedCardProps = {
  item: FeedItem;
  selected: boolean;
  onSelect: (item: FeedItem) => void;
};

export const FeedCard = ({ item, selected, onSelect }: FeedCardProps) => {
  const [playing, setPlaying] = useState(false);
  const media = item.media[0];
  const fixture = isFixture(item);
  const canPlay = Boolean(media?.embed_id) && !fixture;

  return (
    <article
      className={selected ? 'nf-card nf-card--selected' : 'nf-card'}
      data-item-id={item.id}
    >
      {media && (
        <div className="nf-card__media">
          {playing && media.embed_id ? (
            // Playback uses the official player, unmodified, as YouTube requires.
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(media.embed_id)}?autoplay=1`}
              title={item.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              className="nf-card__thumb"
              disabled={!canPlay}
              aria-label={canPlay ? `Play ${item.title}` : undefined}
              onClick={() => setPlaying(true)}
            >
              <img src={media.url} alt="" loading="lazy" />
              {canPlay && <span className="nf-card__play" aria-hidden="true" />}
            </button>
          )}
          {item.kind === 'live' && <span className="nf-card__live">Live</span>}
        </div>
      )}

      <button
        type="button"
        className="nf-card__body"
        onClick={() => onSelect(item)}
      >
        <span className="nf-card__title">{item.title}</span>
        <span className="nf-card__meta">
          {item.author_name && <span>{item.author_name}</span>}
          <span>{formatAge(item.published_at)}</span>
        </span>
        <span
          className={
            hasExactLocation(item)
              ? 'nf-card__place'
              : 'nf-card__place nf-card__place--approximate'
          }
        >
          {formatDistance(item)}
          {!hasExactLocation(item) && ' · approximate location'}
        </span>
      </button>

      {item.source === 'youtube' && (
        <footer className="nf-card__source">
          <span>YouTube</span>
          {fixture ? (
            <span className="nf-card__fixture">Sample data</span>
          ) : (
            item.url && (
              <a href={item.url} target="_blank" rel="noreferrer">
                Watch on YouTube
              </a>
            )
          )}
        </footer>
      )}
    </article>
  );
};
