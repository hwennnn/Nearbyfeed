import { describe, expect, it } from 'vitest';
import createViewSource from './CreateView.tsx?raw';

describe('CreateView architecture', () => {
  it('delegates signed-in composer fields out of the route-level view', () => {
    expect(createViewSource).toContain('CreateComposerFields');
    expect(createViewSource).not.toContain('placeholder="Nearby headline"');
    expect(createViewSource).not.toContain('Start a poll');
  });
});
