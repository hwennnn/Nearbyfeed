export type BlockTargetKind = 'post' | 'comment';

export type BlockUserTarget = {
  kind: BlockTargetKind;
  preview?: string;
  userId: number;
  username: string;
};

export type BlockSubmissionInput = {
  currentUserId: number;
  target: BlockUserTarget;
};
