import { describe, expect, it } from 'vitest';
import mapViewSource from '../features/map/MapView.tsx?raw';
import mainSource from '../main.tsx?raw';

describe('Mapbox lazy boundary', () => {
  it('keeps Mapbox CSS inside the lazy map module', () => {
    expect(mainSource).not.toContain('mapbox-gl/dist/mapbox-gl.css');
    expect(mapViewSource).toContain('mapbox-gl/dist/mapbox-gl.css');
  });
});
