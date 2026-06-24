import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const mapCoreCss = readFileSync(
  path.resolve(process.cwd(), 'src/styles/map-core.css'),
  'utf8',
);
const liveSocialCss = readFileSync(
  path.resolve(process.cwd(), 'src/styles/live-social.css'),
  'utf8',
);

describe('map canvas CSS boundary', () => {
  it('keeps the Mapbox container full-bleed after lazy Mapbox CSS loads', () => {
    expect(mapCoreCss).toContain('.map-screen .map-canvas');
    expect(mapCoreCss).toContain('position: absolute;');
    expect(mapCoreCss).toContain('height: 100%;');
  });

  it('keeps the live panel bounded while its body scrolls independently', () => {
    expect(mapCoreCss).toContain('flex-direction: column;');
    expect(mapCoreCss).toContain('overflow: hidden;');
    expect(mapCoreCss).toContain('.map-panel-body {');
    expect(mapCoreCss).toContain('flex: 1 1 auto;');
    expect(mapCoreCss).toContain('min-height: 0;');
    expect(mapCoreCss).toContain('grid-auto-rows: max-content;');
    expect(mapCoreCss).toContain('overflow: auto;');
    expect(mapCoreCss).toContain('flex: 0 0 auto;');
    expect(mapCoreCss).toContain('width: 34px;');
    expect(mapCoreCss).toContain('min-width: 34px;');
  });

  it('keeps the mobile frame action compact inside stacked map controls', () => {
    expect(liveSocialCss).toContain('.map-frame-button {');
    expect(liveSocialCss).toContain('justify-self: start;');
    expect(liveSocialCss).toContain('min-height: 34px;');
  });
});
