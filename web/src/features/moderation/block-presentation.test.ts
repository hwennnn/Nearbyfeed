import { describe, expect, it } from 'vitest';
import {
  getBlockDialogCopy,
  getBlockSuccessMessage,
  getBlockedUserLabel,
} from './block-presentation';

describe('block presentation', () => {
  it('frames blocking as a personal mute action', () => {
    expect(getBlockDialogCopy('post').title).toContain('Mute');
    expect(getBlockDialogCopy('comment').body).toContain('reply');
  });

  it('keeps success and blocked-row labels user-facing', () => {
    expect(getBlockSuccessMessage('pulseqa')).toBe(
      'Muted pulseqa. Their drops will stay out of your nearby feed.',
    );
    expect(getBlockedUserLabel('pulseqa')).toBe('Muted from your feed');
  });
});
