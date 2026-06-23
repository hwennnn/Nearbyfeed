import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { type FeedSceneMoment } from './feed-presentation';

export const FeedSceneMomentAction = ({
  moment,
  onOpenPost,
}: {
  moment: FeedSceneMoment;
  onOpenPost: (postId: number) => void;
}) => {
  const content = (
    <>
      <span className={`scene-moment-dot is-${moment.tone}`} />
      <span className="scene-moment-copy">
        <em>{moment.meta}</em>
        <strong>{moment.title}</strong>
      </span>
      {moment.kind === 'live' ? <ExternalLink /> : <ArrowUpRight />}
    </>
  );

  if (moment.kind === 'live') {
    return (
      <a
        className={`scene-moment is-${moment.tone}`}
        href={moment.url}
        rel="noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={`scene-moment is-${moment.tone}`}
      onClick={() => {
        if (moment.postId !== undefined) onOpenPost(moment.postId);
      }}
      type="button"
    >
      {content}
    </button>
  );
};
