import { type BlockTargetKind } from './block-types';

export const getBlockDialogCopy = (target: BlockTargetKind) => {
  if (target === 'post') {
    return {
      eyebrow: 'Personal signal control',
      title: 'Mute this creator?',
      body: 'Their drops will stop showing up in your nearby feed. You can unmute them from Profile whenever you want.',
    };
  }

  return {
    eyebrow: 'Reply boundary',
    title: 'Mute this reply?',
    body: 'This reply stays visible for context, but future drops and replies from this account stay out of your nearby feed.',
  };
};

export const getBlockSuccessMessage = (username: string): string =>
  `Muted ${username}. Their drops will stay out of your nearby feed.`;

export const getUnblockSuccessMessage = (username: string): string =>
  `Unmuted ${username}. Their drops can show up again.`;

export const getBlockedUserLabel = (_username: string): string =>
  'Muted from your feed';
