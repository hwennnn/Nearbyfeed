import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetViewScrollPosition } from './view-scroll';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('resetViewScrollPosition', () => {
  it('resets both the page and app scroll container', () => {
    const windowScrollTo = vi.fn();
    const appScrollTo = vi.fn();

    document.body.innerHTML = '<main class="app-main"></main>';
    const appMain = document.querySelector('.app-main');
    if (appMain === null) throw new Error('missing app main');
    Object.assign(appMain, { scrollTo: appScrollTo });

    resetViewScrollPosition({
      root: document,
      win: { scrollTo: windowScrollTo },
    });

    expect(windowScrollTo).toHaveBeenCalledWith({ left: 0, top: 0 });
    expect(appScrollTo).toHaveBeenCalledWith({ left: 0, top: 0 });
  });
});
