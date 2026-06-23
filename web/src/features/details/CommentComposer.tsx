import { getCreateCommentValidationError } from '@nearbyfeed/shared';
import { Send } from 'lucide-react';

export const CommentComposer = ({
  comment,
  isPosting,
  onCommentChange,
  onSignIn,
  onSubmit,
  signedIn,
}: {
  comment: string;
  isPosting: boolean;
  onCommentChange: (value: string) => void;
  onSignIn: () => void;
  onSubmit: () => void;
  signedIn: boolean;
}) => {
  const validationError = getCreateCommentValidationError({ content: comment });
  const canSubmit = signedIn && validationError === null && !isPosting;

  return (
    <div className="comment-composer">
      <input
        disabled={!signedIn || isPosting}
        onChange={(event) => onCommentChange(event.target.value)}
        placeholder={signedIn ? 'Write a comment.' : 'Sign in to comment.'}
        value={comment}
      />
      <button
        className="icon-button"
        disabled={!canSubmit}
        onClick={onSubmit}
        title={validationError ?? 'Send'}
      >
        <Send />
      </button>
      {!signedIn && (
        <button className="text-command" onClick={onSignIn}>
          Sign in
        </button>
      )}
    </div>
  );
};
