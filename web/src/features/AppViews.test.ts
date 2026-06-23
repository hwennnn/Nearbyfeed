import { describe, expect, it } from 'vitest';
import appViewsSource from './AppViews.tsx?raw';

describe('AppViews architecture', () => {
  it('keeps route rendering delegated out of the shell', () => {
    expect(appViewsSource).toContain('AppViewRoutes');
    expect(appViewsSource).not.toContain('FeedView');
    expect(appViewsSource).not.toContain('MapView');
    expect(appViewsSource).not.toContain('CreateView');
    expect(appViewsSource).not.toContain('ProfileView');
    expect(appViewsSource).not.toContain('DetailsView');
  });
});
