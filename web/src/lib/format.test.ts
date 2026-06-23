import { describe, expect, it, vi } from 'vitest';
import { formatDistance, initials, timeAgo } from './format';

describe('format helpers', () => {
  it('matches the mobile compact time format for nearby feeds', () => {
    vi.spyOn(Date, 'now').mockReturnValue(
      new Date('2026-06-23T12:00:00Z').getTime(),
    );

    expect(timeAgo('2026-06-23T11:58:00Z')).toBe('Just now');
    expect(timeAgo('2026-06-23T11:54:00Z')).toBe('6m');
    expect(timeAgo('2026-06-23T09:00:00Z')).toBe('3h');
    expect(timeAgo('2026-06-21T12:00:00Z')).toBe('2d');
    expect(timeAgo('2026-04-23T12:00:00Z')).toBe('2mo');
  });

  it('keeps shared social labels compact', () => {
    expect(formatDistance(200)).toBe('200m');
    expect(formatDistance(1000)).toBe('1km');
    expect(initials('Ari Local')).toBe('AL');
    expect(initials('pulseqa')).toBe('P');
    expect(initials()).toBe('NF');
  });
});
