import { type View } from '../../app-types';
import { type Coordinates, type Session } from '../../types';
import { CreateAuthPrompt } from './CreateAuthPrompt';
import { CreateComposerFields } from './CreateComposerFields';
import { CreateComposerIntro } from './CreateComposerIntro';
import { CreateHeader } from './CreateHeader';
import { CreatePreviewPanel } from './CreatePreviewPanel';
import { CreateStatusNote } from './CreateStatusNote';
import { useCreatePostComposer } from './useCreatePostComposer';

export const CreateView = ({
  coordinates,
  locationName,
  onCreated,
  session,
  setView,
}: {
  coordinates: Coordinates;
  locationName: string;
  onCreated: () => void;
  session: Session | null;
  setView: (view: View) => void;
}) => {
  const composer = useCreatePostComposer({
    coordinates,
    locationName,
    onCreated,
  });

  if (session === null) {
    return <CreateAuthPrompt setView={setView} />;
  }

  return (
    <section className="compose-screen">
      <div className="compose-panel">
        <CreateHeader
          canPost={composer.validationError === null}
          isPosting={composer.mutation.isPending}
          onClose={() => setView('feed')}
          onPost={() => composer.mutation.mutate()}
        />
        <CreateComposerIntro locationName={locationName} />
        <CreateStatusNote
          apiError={composer.mutation.isError}
          validationError={composer.validationError}
        />
        <CreateComposerFields
          content={composer.content}
          files={composer.files}
          locationName={locationName}
          onContentChange={composer.setContent}
          onFilesChange={composer.setFiles}
          onPlaceTagChange={composer.setPlaceTag}
          onPollEnabledChange={composer.setPollEnabled}
          onPollOptionsChange={composer.setOptions}
          onPollVotingLengthDaysChange={composer.setPollVotingLengthDays}
          onTitleChange={composer.setTitle}
          options={composer.options}
          placeTag={composer.placeTag}
          pollEnabled={composer.pollEnabled}
          pollVotingLengthDays={composer.pollVotingLengthDays}
          title={composer.title}
        />
      </div>
      <CreatePreviewPanel
        content={composer.content}
        filesCount={composer.files.length}
        locationName={composer.displayLocationName}
        pollEnabled={composer.pollEnabled}
        pollOptions={composer.options}
        session={session}
        title={composer.title}
        validationError={composer.validationError}
      />
    </section>
  );
};
