import { describe, expect, it, vi } from 'vitest';
import { type LiveMapSignal } from './map-presentation';
import {
  createLiveSignalMarkerElement,
  createPostMarkerElement,
} from './map-marker-elements';
import { type Post } from '../../types';

const post: Post = {
  id: 42,
  title: 'Food truck just opened',
  latitude: 37.323,
  longitude: -122.032,
  points: 12,
  commentsCount: 3,
  createdAt: new Date('2026-06-23T08:00:00Z').toISOString(),
};

const signal: LiveMapSignal = {
  id: 'live-1',
  title: 'Open mic queue is moving fast',
  summary: 'People are talking about it nearby.',
  url: 'https://x.com/search?q=open%20mic',
  sourceLabel: 'X live',
  label: 'music',
  tone: 'scene',
  coordinates: {
    latitude: 37.324,
    longitude: -122.031,
  },
};

describe('map marker elements', () => {
  it('creates accessible selectable post markers without raw HTML injection', () => {
    const onSelectPost = vi.fn();
    const element = createPostMarkerElement({
      onSelectPost,
      post,
      selectedPostId: 42,
    });

    expect(element.tagName).toBe('BUTTON');
    expect(element.className).toContain('is-selected');
    expect(element.textContent).toBe('3');
    expect(element.getAttribute('aria-label')).toContain('people talking');

    element.click();

    expect(onSelectPost).toHaveBeenCalledWith(42);
  });

  it('creates approximate live signal links with source and tone metadata', () => {
    const element = createLiveSignalMarkerElement(signal);

    expect(element.tagName).toBe('A');
    expect(element.className).toContain('is-scene');
    expect(element.href).toBe('https://x.com/search?q=open%20mic');
    expect(element.rel).toBe('noreferrer');
    expect(element.target).toBe('_blank');
    expect(element.getAttribute('aria-label')).toContain(
      'Approximate X live signal',
    );
    expect(element.textContent).toContain('XmusicOpen mic queue is moving fast');
  });
});
