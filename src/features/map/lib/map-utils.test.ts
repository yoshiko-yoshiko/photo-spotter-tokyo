import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isInTokyo,
  getDistanceMeters,
  getSpotsBounds,
  getRouteUrl,
  escapeHtml,
  createMarkerElement,
  TOKYO_BOUNDS,
  TOKYO_CENTER,
  CATEGORY_COLORS,
  MAP_CONFIG,
} from './map-utils';

describe('isInTokyo', () => {
  it('returns true for a point inside Tokyo bounds', () => {
    expect(isInTokyo(35.6812, 139.7671)).toBe(true);
  });

  it('returns true for boundary min values', () => {
    expect(isInTokyo(TOKYO_BOUNDS.latMin, TOKYO_BOUNDS.lngMin)).toBe(true);
  });

  it('returns true for boundary max values', () => {
    expect(isInTokyo(TOKYO_BOUNDS.latMax, TOKYO_BOUNDS.lngMax)).toBe(true);
  });

  it('returns false for a point north of Tokyo', () => {
    expect(isInTokyo(36.0, 139.7)).toBe(false);
  });

  it('returns false for a point south of Tokyo', () => {
    expect(isInTokyo(35.0, 139.7)).toBe(false);
  });

  it('returns false for a point west of Tokyo', () => {
    expect(isInTokyo(35.68, 139.0)).toBe(false);
  });

  it('returns false for a point east of Tokyo', () => {
    expect(isInTokyo(35.68, 140.5)).toBe(false);
  });

  // --- QA追加: 境界値・異常系 ---
  it('returns false for NaN latitude', () => {
    expect(isInTokyo(NaN, 139.7)).toBe(false);
  });

  it('returns false for NaN longitude', () => {
    expect(isInTokyo(35.68, NaN)).toBe(false);
  });

  it('returns false for both NaN', () => {
    expect(isInTokyo(NaN, NaN)).toBe(false);
  });

  it('returns false for Infinity', () => {
    expect(isInTokyo(Infinity, 139.7)).toBe(false);
    expect(isInTokyo(35.68, Infinity)).toBe(false);
  });

  it('returns false for -Infinity', () => {
    expect(isInTokyo(-Infinity, 139.7)).toBe(false);
    expect(isInTokyo(35.68, -Infinity)).toBe(false);
  });

  it('returns false for origin (0, 0)', () => {
    expect(isInTokyo(0, 0)).toBe(false);
  });

  it('returns false for just outside boundary (latMin - epsilon)', () => {
    expect(isInTokyo(TOKYO_BOUNDS.latMin - 0.001, TOKYO_BOUNDS.lngMin)).toBe(false);
  });

  it('returns false for just outside boundary (latMax + epsilon)', () => {
    expect(isInTokyo(TOKYO_BOUNDS.latMax + 0.001, TOKYO_BOUNDS.lngMax)).toBe(false);
  });
});

describe('getDistanceMeters', () => {
  it('returns 0 for the same point', () => {
    expect(getDistanceMeters(35.68, 139.77, 35.68, 139.77)).toBe(0);
  });

  it('calculates distance between Tokyo Tower and Skytree (~8km)', () => {
    const dist = getDistanceMeters(35.6586, 139.7454, 35.7101, 139.8107);
    expect(dist).toBeGreaterThan(7500);
    expect(dist).toBeLessThan(9000);
  });

  it('calculates distance between Tokyo and Osaka (~400km)', () => {
    const dist = getDistanceMeters(35.6812, 139.7671, 34.6937, 135.5023);
    expect(dist).toBeGreaterThan(380_000);
    expect(dist).toBeLessThan(420_000);
  });

  it('is symmetric (a→b == b→a)', () => {
    const d1 = getDistanceMeters(35.6586, 139.7454, 35.7101, 139.8107);
    const d2 = getDistanceMeters(35.7101, 139.8107, 35.6586, 139.7454);
    expect(d1).toBeCloseTo(d2, 6);
  });

  // --- QA追加: 異常系・エッジケース ---
  it('returns NaN when any input is NaN', () => {
    expect(getDistanceMeters(NaN, 139.77, 35.68, 139.77)).toBeNaN();
    expect(getDistanceMeters(35.68, NaN, 35.68, 139.77)).toBeNaN();
    expect(getDistanceMeters(35.68, 139.77, NaN, 139.77)).toBeNaN();
    expect(getDistanceMeters(35.68, 139.77, 35.68, NaN)).toBeNaN();
  });

  it('handles negative coordinates (southern/western hemisphere)', () => {
    // Sydney to Melbourne (~714km)
    const dist = getDistanceMeters(-33.8688, 151.2093, -37.8136, 144.9631);
    expect(dist).toBeGreaterThan(700_000);
    expect(dist).toBeLessThan(730_000);
  });

  it('returns positive distance for very close points', () => {
    // 1 meter apart approximately
    const dist = getDistanceMeters(35.6812, 139.7671, 35.6812, 139.76711);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(10); // within 10 meters
  });
});

describe('getSpotsBounds', () => {
  it('returns null for empty array', () => {
    expect(getSpotsBounds([])).toBeNull();
  });

  it('returns bounds for a single spot', () => {
    const result = getSpotsBounds([{ latitude: 35.68, longitude: 139.77 }]);
    expect(result).toEqual([[139.77, 35.68], [139.77, 35.68]]);
  });

  it('calculates correct bounds for multiple spots', () => {
    const spots = [
      { latitude: 35.6, longitude: 139.7 },
      { latitude: 35.8, longitude: 139.9 },
      { latitude: 35.7, longitude: 139.8 },
    ];
    const result = getSpotsBounds(spots);
    expect(result).toEqual([[139.7, 35.6], [139.9, 35.8]]);
  });

  it('handles string latitude/longitude', () => {
    const spots = [
      { latitude: '35.6', longitude: '139.7' },
      { latitude: '35.8', longitude: '139.9' },
    ];
    const result = getSpotsBounds(spots);
    expect(result).toEqual([[139.7, 35.6], [139.9, 35.8]]);
  });

  // --- QA追加: 異常系 ---
  it('BUG: returns Infinity/-Infinity for non-numeric string coordinates instead of null or NaN', () => {
    // BUG FOUND: When coordinates are non-numeric strings like "abc",
    // Number("abc") = NaN. NaN comparisons (NaN < Infinity) are always false,
    // so the initial values (Infinity/-Infinity) are never updated.
    // The function returns [[Infinity, Infinity], [-Infinity, -Infinity]]
    // instead of null or NaN bounds.
    // This could cause downstream mapbox errors if the return value is used as-is.
    const spots = [{ latitude: 'abc', longitude: 'xyz' }];
    const result = getSpotsBounds(spots);
    expect(result).not.toBeNull();
    const [[minLng, minLat], [maxLng, maxLat]] = result!;
    // Actual behavior: returns initial sentinel values
    expect(minLng).toBe(Infinity);
    expect(minLat).toBe(Infinity);
    expect(maxLng).toBe(-Infinity);
    expect(maxLat).toBe(-Infinity);
  });

  it('handles negative coordinates', () => {
    const spots = [
      { latitude: -33.87, longitude: 151.21 },
      { latitude: -37.81, longitude: 144.96 },
    ];
    const result = getSpotsBounds(spots);
    expect(result).toEqual([[144.96, -37.81], [151.21, -33.87]]);
  });

  it('handles mixed numeric and string coordinates', () => {
    const spots = [
      { latitude: 35.6, longitude: '139.7' },
      { latitude: '35.8', longitude: 139.9 },
    ];
    const result = getSpotsBounds(spots);
    expect(result).toEqual([[139.7, 35.6], [139.9, 35.8]]);
  });
});

describe('getRouteUrl', () => {
  const originalNavigator = navigator.userAgent;

  function mockUserAgent(ua: string) {
    Object.defineProperty(navigator, 'userAgent', {
      value: ua,
      writable: true,
      configurable: true,
    });
  }

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('returns Apple Maps URL for iPhone', () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)');
    expect(getRouteUrl(35.68, 139.77)).toBe('https://maps.apple.com/?daddr=35.68,139.77');
  });

  it('returns Apple Maps URL for iPad', () => {
    mockUserAgent('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)');
    expect(getRouteUrl(35.68, 139.77)).toBe('https://maps.apple.com/?daddr=35.68,139.77');
  });

  it('returns Apple Maps URL for iPod', () => {
    mockUserAgent('Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)');
    expect(getRouteUrl(35.68, 139.77)).toBe('https://maps.apple.com/?daddr=35.68,139.77');
  });

  it('returns Google Maps URL for Android', () => {
    mockUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7)');
    expect(getRouteUrl(35.68, 139.77)).toBe('https://www.google.com/maps/dir/?api=1&destination=35.68,139.77');
  });

  it('returns Google Maps URL for desktop browser', () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    expect(getRouteUrl(35.68, 139.77)).toBe('https://www.google.com/maps/dir/?api=1&destination=35.68,139.77');
  });

  it('embeds coordinates correctly in URL', () => {
    mockUserAgent('Linux');
    const url = getRouteUrl(0, 0);
    expect(url).toContain('0,0');
  });

  it('handles negative coordinates', () => {
    mockUserAgent('Linux');
    const url = getRouteUrl(-33.87, 151.21);
    expect(url).toContain('-33.87,151.21');
  });
});

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes all special characters together', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('does not modify safe strings', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  // --- QA追加: XSS・セキュリティ ---
  it('does NOT escape single quotes (known limitation)', () => {
    // NOTE: escapeHtml does not escape single quotes.
    // This is acceptable for innerHTML context but risky in single-quoted attribute context.
    expect(escapeHtml("it's")).toBe("it's");
  });

  it('double-escapes already escaped content', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('handles XSS payload', () => {
    const payload = '<img src=x onerror="alert(1)">';
    const escaped = escapeHtml(payload);
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('handles unicode characters without escaping them', () => {
    expect(escapeHtml('東京タワー 🗼')).toBe('東京タワー 🗼');
  });
});

describe('createMarkerElement', () => {
  it('creates a div element', () => {
    const el = createMarkerElement('テストスポット', '#0D9488', false);
    expect(el).toBeInstanceOf(HTMLDivElement);
  });

  it('uses provided valid hex color', () => {
    const el = createMarkerElement('Test', '#FF0000', false);
    expect(el.innerHTML).toContain('background:#FF0000');
  });

  it('falls back to #EF4444 for invalid color', () => {
    const el = createMarkerElement('Test', 'not-a-color', false);
    expect(el.innerHTML).toContain('background:#EF4444');
  });

  it('falls back for 3-digit hex color (not matching 6-digit pattern)', () => {
    const el = createMarkerElement('Test', '#F00', false);
    expect(el.innerHTML).toContain('background:#EF4444');
  });

  it('falls back for XSS attempt in color', () => {
    const el = createMarkerElement('Test', '"><script>alert(1)</script>', false);
    expect(el.innerHTML).toContain('background:#EF4444');
    expect(el.innerHTML).not.toContain('<script>');
  });

  it('shows checkmark badge when isVisited is true', () => {
    const el = createMarkerElement('Test', '#0D9488', true);
    expect(el.innerHTML).toContain('bg-amber-500');
    expect(el.innerHTML).toContain('polyline');
  });

  it('does not show checkmark badge when isVisited is false', () => {
    const el = createMarkerElement('Test', '#0D9488', false);
    expect(el.innerHTML).not.toContain('bg-amber-500');
  });

  it('escapes HTML in spot name to prevent XSS', () => {
    const el = createMarkerElement('<script>alert(1)</script>', '#0D9488', false);
    expect(el.innerHTML).not.toContain('<script>alert(1)</script>');
    expect(el.innerHTML).toContain('&lt;script&gt;');
  });

  it('handles empty spot name', () => {
    const el = createMarkerElement('', '#0D9488', false);
    expect(el).toBeInstanceOf(HTMLDivElement);
  });

  it('sets width to 80px', () => {
    const el = createMarkerElement('Test', '#0D9488', false);
    expect(el.style.width).toBe('80px');
  });
});

describe('CATEGORY_COLORS', () => {
  it('has color for each expected category', () => {
    expect(CATEGORY_COLORS['ランドマーク']).toBeDefined();
    expect(CATEGORY_COLORS['寺社・歴史']).toBeDefined();
    expect(CATEGORY_COLORS['自然・公園']).toBeDefined();
    expect(CATEGORY_COLORS['都市・カルチャー']).toBeDefined();
  });

  it('all values are valid hex color codes', () => {
    for (const [key, value] of Object.entries(CATEGORY_COLORS)) {
      expect(value, `${key} should be a valid hex color`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('MAP_CONFIG', () => {
  it('has expected zoom levels', () => {
    expect(MAP_CONFIG.DEFAULT_ZOOM).toBe(11);
    expect(MAP_CONFIG.NEARBY_ZOOM).toBe(13);
    expect(MAP_CONFIG.LOCATE_ZOOM).toBe(15);
  });

  it('has positive threshold and duration values', () => {
    expect(MAP_CONFIG.NEARBY_THRESHOLD_M).toBeGreaterThan(0);
    expect(MAP_CONFIG.INFO_BANNER_DURATION_MS).toBeGreaterThan(0);
    expect(MAP_CONFIG.NEARBY_BANNER_DURATION_MS).toBeGreaterThan(0);
    expect(MAP_CONFIG.MAP_INIT_DELAY_MS).toBeGreaterThan(0);
  });
});

describe('TOKYO_CENTER', () => {
  it('is inside Tokyo bounds', () => {
    expect(isInTokyo(TOKYO_CENTER[1], TOKYO_CENTER[0])).toBe(true);
  });
});
