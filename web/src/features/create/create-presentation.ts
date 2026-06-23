export type CreateDraftInput = {
  content: string;
  filesCount: number;
  locationName: string;
  pollEnabled: boolean;
  pollOptions: string[];
  title: string;
};

export type CreateDraftMetrics = {
  filledPollOptions: number;
  modeLabel: string;
  photoLabel: string;
  previewBody: string;
  previewTitle: string;
  readinessLabel: string;
  readinessTone: 'draft' | 'ready' | 'rich';
  titleRemaining: number;
};

const TITLE_LIMIT = 70;

export const getCreateDraftMetrics = ({
  content,
  filesCount,
  locationName,
  pollEnabled,
  pollOptions,
  title,
}: CreateDraftInput): CreateDraftMetrics => {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const filledPollOptions = pollOptions.filter(
    (option) => option.trim().length > 0,
  ).length;
  const hasTitle = trimmedTitle.length >= 4;
  const hasContext = trimmedContent.length >= 15;
  const hasRichAttachment = filesCount > 0 || (pollEnabled && filledPollOptions >= 2);

  let readinessTone: CreateDraftMetrics['readinessTone'] = 'draft';
  if (hasTitle && hasRichAttachment) readinessTone = 'rich';
  else if (hasTitle) readinessTone = 'ready';

  const readinessLabel =
    readinessTone === 'rich'
      ? 'ready to pop'
      : readinessTone === 'ready'
        ? 'ready'
        : 'drafting';

  const modeLabel = pollEnabled
    ? `${filledPollOptions} poll option${filledPollOptions === 1 ? '' : 's'}`
    : filesCount > 0
      ? 'photo signal'
      : 'text signal';

  return {
    filledPollOptions,
    modeLabel,
    photoLabel:
      filesCount === 0 ? 'No photos yet' : `${filesCount} photo${filesCount === 1 ? '' : 's'}`,
    previewBody:
      trimmedContent.length > 0
        ? trimmedContent
        : `Posting from ${locationName}. Add a little context so people nearby know what to do next.`,
    previewTitle: trimmedTitle.length > 0 ? trimmedTitle : 'What is happening nearby?',
    readinessLabel,
    readinessTone,
    titleRemaining: Math.max(0, TITLE_LIMIT - title.length),
  };
};
