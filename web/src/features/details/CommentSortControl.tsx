import { type CommentSort } from '../../types';
import { COMMENT_SORT_OPTIONS } from './details-presentation';

export const CommentSortControl = ({
  onChange,
  value,
}: {
  onChange: (sort: CommentSort) => void;
  value: CommentSort;
}) => (
  <div className="comment-sort-control" aria-label="Comment sort" role="group">
    {COMMENT_SORT_OPTIONS.map((option) => (
      <button
        className={option.value === value ? 'is-selected' : ''}
        key={option.value}
        onClick={() => onChange(option.value)}
        type="button"
      >
        {option.label}
      </button>
    ))}
  </div>
);
