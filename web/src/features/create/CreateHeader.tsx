import { X } from 'lucide-react';

export const CreateHeader = ({
  canPost,
  isPosting,
  onClose,
  onPost,
}: {
  canPost: boolean;
  isPosting: boolean;
  onClose: () => void;
  onPost: () => void;
}) => (
  <div className="compose-head">
    <button className="icon-button" onClick={onClose} title="Close">
      <X />
    </button>
    <span>New pulse</span>
    <button
      className="primary-button"
      disabled={!canPost || isPosting}
      onClick={onPost}
    >
      {isPosting ? 'Posting...' : 'Post live'}
    </button>
  </div>
);
