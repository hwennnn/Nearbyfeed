import { describe, expect, it } from 'vitest';
import {
  canCreateComment,
  getCreateCommentValidationError,
} from '@nearbyfeed/shared';

describe('comment validation', () => {
  it('accepts a trimmed two-character comment', () => {
    expect(canCreateComment({ content: ' ok ' })).toBe(true);
  });

  it('rejects comments that are too short after trimming', () => {
    expect(getCreateCommentValidationError({ content: '  a ' })).toContain('2');
  });
});
