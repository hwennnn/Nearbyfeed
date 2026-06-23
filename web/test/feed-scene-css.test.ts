import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const premiumFeedCss = readFileSync(
  path.resolve(process.cwd(), 'src/styles/premium-feed.css'),
  'utf8',
);

describe('feed scene board CSS', () => {
  it('keeps live controls compact and scene moments readable', () => {
    expect(premiumFeedCss).toContain(
      'grid-template-columns: auto minmax(0, 1fr) auto;',
    );
    expect(premiumFeedCss).toContain('width: 34px;');
    expect(premiumFeedCss).toContain('min-width: 34px;');
    expect(premiumFeedCss).toContain('.scene-moment-copy strong {');
    expect(premiumFeedCss).toContain('-webkit-line-clamp: 2;');
    expect(premiumFeedCss).toContain('white-space: normal;');
  });
});
