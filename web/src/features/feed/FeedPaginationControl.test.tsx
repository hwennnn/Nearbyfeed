import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedPaginationControl } from './FeedPaginationControl';

describe('FeedPaginationControl', () => {
  afterEach(() => {
    cleanup();
  });

  it('loads more nearby posts when more pages are available', () => {
    const onLoadMore = vi.fn();

    render(
      <FeedPaginationControl
        hasMorePosts
        isFetchingMorePosts={false}
        onLoadMore={onLoadMore}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Load more nearby' }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('stays hidden when the feed is fully caught up', () => {
    render(
      <FeedPaginationControl
        hasMorePosts={false}
        isFetchingMorePosts={false}
        onLoadMore={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
