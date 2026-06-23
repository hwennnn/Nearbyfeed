import { describe, expect, it } from 'vitest';
import { canCreatePost, getCreatePostValidationError } from '@nearbyfeed/shared';

describe('create post validation', () => {
  it('allows a title-only nearby post', () => {
    expect(canCreatePost({ title: 'Library steps are buzzing' })).toBe(true);
  });

  it('rejects short optional content so the API is not hit with avoidable 400s', () => {
    expect(
      getCreatePostValidationError({
        title: 'Library steps are buzzing',
        content: 'too short',
      }),
    ).toContain('15');
  });

  it('requires two filled poll options when poll mode is enabled', () => {
    expect(
      getCreatePostValidationError({
        title: 'Library steps are buzzing',
        pollEnabled: true,
        pollOptions: ['pull up', ''],
      }),
    ).toContain('2');
  });
});
