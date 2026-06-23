import { Camera, CheckCircle2, MapPin, Vote } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { type Session } from '../../types';
import { DraftReadiness } from './DraftReadiness';
import { getCreateDraftMetrics } from './create-presentation';

export const CreatePreviewPanel = ({
  content,
  filesCount,
  locationName,
  pollEnabled,
  pollOptions,
  session,
  title,
  validationError,
}: {
  content: string;
  filesCount: number;
  locationName: string;
  pollEnabled: boolean;
  pollOptions: string[];
  session: Session;
  title: string;
  validationError: string | null;
}) => {
  const metrics = getCreateDraftMetrics({
    content,
    filesCount,
    locationName,
    pollEnabled,
    pollOptions,
    title,
  });

  return (
    <aside className="composer-sidecar">
      <DraftReadiness metrics={metrics} validationError={validationError} />
      <div className={`composer-preview is-${metrics.readinessTone}`}>
        <div className="preview-author-row">
          <Avatar image={session.user.image} name={session.user.username} />
          <span>
            <strong>{session.user.username}</strong>
            <em>posting near {locationName}</em>
          </span>
        </div>
        <span className="preview-mode-chip">{metrics.modeLabel}</span>
        <h2>{metrics.previewTitle}</h2>
        <p>{metrics.previewBody}</p>
        <div className="preview-meta-row">
          <span>
            <Camera />
            {metrics.photoLabel}
          </span>
          <span>
            <Vote />
            {pollEnabled ? `${metrics.filledPollOptions} options` : 'No poll'}
          </span>
        </div>
      </div>
      <div className="composer-checklist">
        <span>
          <MapPin />
          {locationName}
        </span>
        <span>
          <CheckCircle2 />
          {metrics.titleRemaining} title chars left
        </span>
      </div>
    </aside>
  );
};
