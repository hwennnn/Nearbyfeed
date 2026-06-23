import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type CommentWithPost, type Post } from '../../types';
import { ProfileActivityPanel } from './ProfileActivityPanel';

const post: Post = {
  id: 7,
  title: 'Tiny ramen line outside the car wash',
  content: 'Twenty people deep but moving fast.',
  latitude: 37.318,
  longitude: -122.03,
  locationName: 'Cupertino Car Wash',
  points: 12,
  commentsCount: 0,
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
};

describe('ProfileActivityPanel', () => {
  it('opens a profile post in the shared details flow', () => {
    const onOpenPost = vi.fn();

    render(
      <ProfileActivityPanel
        blockedUsers={[]}
        comments={[]}
        onOpenPost={onOpenPost}
        posts={[post]}
        profileTab="posts"
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /Tiny ramen line outside the car wash/,
      }),
    );

    expect(onOpenPost).toHaveBeenCalledWith(post);
  });

  it('opens the parent post from a reply row', () => {
    const onOpenPost = vi.fn();
    const comment: CommentWithPost = {
      id: 13,
      content: 'Still here, line is moving fast.',
      createdAt: new Date('2026-06-23T08:04:00Z').toISOString(),
      postId: post.id,
      points: 0,
      post,
    };

    render(
      <ProfileActivityPanel
        blockedUsers={[]}
        comments={[comment]}
        onOpenPost={onOpenPost}
        posts={[]}
        profileTab="comments"
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /Still here, line is moving fast./,
      }),
    );

    expect(onOpenPost).toHaveBeenCalledWith(post);
  });

  it('lets users unmute a blocked account from the blocked tab', () => {
    const onUnblockUser = vi.fn();

    render(
      <ProfileActivityPanel
        blockedUsers={[
          {
            id: 21,
            image: null,
            username: 'noisynextdoor',
          },
        ]}
        comments={[]}
        onOpenPost={vi.fn()}
        onUnblockUser={onUnblockUser}
        posts={[]}
        profileTab="blocked"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /unmute noisynextdoor/i }));

    expect(onUnblockUser).toHaveBeenCalledWith(21, 'noisynextdoor');
  });
});
