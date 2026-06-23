import { ChevronDown, LoaderCircle } from 'lucide-react';

export const FeedPaginationControl = ({
  hasMorePosts,
  isFetchingMorePosts,
  onLoadMore,
}: {
  hasMorePosts: boolean;
  isFetchingMorePosts: boolean;
  onLoadMore: () => void;
}) => {
  if (!hasMorePosts) return null;

  return (
    <div className="feed-pagination-control">
      <button
        disabled={isFetchingMorePosts}
        onClick={onLoadMore}
        type="button"
      >
        {isFetchingMorePosts ? <LoaderCircle /> : <ChevronDown />}
        {isFetchingMorePosts ? 'Loading nearby...' : 'Load more nearby'}
      </button>
    </div>
  );
};
