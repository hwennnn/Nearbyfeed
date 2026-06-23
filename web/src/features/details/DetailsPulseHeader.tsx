import { ArrowLeft, Flag, MessageCircle, Radio } from 'lucide-react';
import { type Comment, type Post } from '../../types';
import { getThreadMetrics } from './details-presentation';

export const DetailsPulseHeader = ({
  backLabel,
  comments,
  onBack,
  onReportPost,
  post,
}: {
  backLabel: string;
  comments: Comment[];
  onBack: () => void;
  onReportPost: () => void;
  post: Post;
}) => {
  const metrics = getThreadMetrics(post, comments);

  return (
    <header className={`details-pulse-header is-${metrics.energy}`}>
      <button className="details-back-button" onClick={onBack} type="button">
        <ArrowLeft />
        {backLabel}
      </button>
      <div className="details-pulse-copy">
        <span>
          <Radio />
          {metrics.energyLabel}
        </span>
        <h1>{post.title}</h1>
        <p>{metrics.commentLabel} from {metrics.voiceLabel}.</p>
      </div>
      <div className="details-header-actions">
        <div>
          <MessageCircle />
          <strong>{metrics.commentLabel}</strong>
          <em>{metrics.latestLabel}</em>
        </div>
        <button
          className="icon-button"
          onClick={onReportPost}
          title="Report feed"
          type="button"
        >
          <Flag />
        </button>
      </div>
    </header>
  );
};
