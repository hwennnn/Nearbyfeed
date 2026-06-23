import { Vote } from 'lucide-react';
import { type CreatePlaceTag } from './create-payload';
import { PhotoDrop } from './PhotoDrop';
import { PlaceTagEditor } from './PlaceTagEditor';
import { PollDurationControl } from './PollDurationControl';
import { PollEditor } from './PollEditor';

export const CreateComposerFields = ({
  content,
  files,
  locationName,
  onContentChange,
  onFilesChange,
  onPlaceTagChange,
  onPollEnabledChange,
  onPollOptionsChange,
  onPollVotingLengthDaysChange,
  onTitleChange,
  options,
  placeTag,
  pollEnabled,
  pollVotingLengthDays,
  title,
}: {
  content: string;
  files: File[];
  locationName: string;
  onContentChange: (content: string) => void;
  onFilesChange: (files: File[]) => void;
  onPlaceTagChange: (placeTag: CreatePlaceTag) => void;
  onPollEnabledChange: (enabled: boolean) => void;
  onPollOptionsChange: (options: string[]) => void;
  onPollVotingLengthDaysChange: (days: number) => void;
  onTitleChange: (title: string) => void;
  options: string[];
  placeTag: CreatePlaceTag;
  pollEnabled: boolean;
  pollVotingLengthDays: number;
  title: string;
}) => (
  <div className="composer-field-stack">
    <input
      className="title-input"
      maxLength={70}
      onChange={(event) => onTitleChange(event.target.value)}
      placeholder="Nearby headline"
      value={title}
    />
    <textarea
      onChange={(event) => onContentChange(event.target.value)}
      placeholder="Drop the context, the vibe, or the heads-up."
      value={content}
    />
    <div className="composer-tool-grid">
      <PhotoDrop files={files} onFilesChange={onFilesChange} />
      <PlaceTagEditor
        locationName={locationName}
        onPlaceTagChange={onPlaceTagChange}
        placeTag={placeTag}
      />
    </div>
    <label className="toggle-row">
      <input
        checked={pollEnabled}
        onChange={(event) => onPollEnabledChange(event.target.checked)}
        type="checkbox"
      />
      <Vote />
      <span>Start a poll</span>
    </label>
    {pollEnabled && (
      <>
        <PollDurationControl
          onValueChange={onPollVotingLengthDaysChange}
          value={pollVotingLengthDays}
        />
        <PollEditor options={options} onOptionsChange={onPollOptionsChange} />
      </>
    )}
  </div>
);
