import { describe, it, expect } from 'vitest';
import { escapeHtml, isInTokyo, getDistanceMeters } from '../map-utils';

describe('escapeHtml', () => {
  it('escapes & to &amp;', () => {
    expect(escapeHtml('A&B')).toBe('A&amp;B');
  });

  it('escapes < to &lt;', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes > to &gt;', () => {
    expect(escapeHtml('a>b')).toBe('a&gt;b');
  });

  it('escapes " to &quot;', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('escapes multiple special characters in one string', () => {
    expect(escapeHtml('<a href="url">&</a>')).toBe(
      '&lt;a href=&quot;url&quot;&gt;&amp;&lt;/a&gt;'
    );
  });

  it('returns the same string when no special characters', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  it('returns empty string as-is', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('isInTokyo', () => {
  it('returns true for Tokyo Station coordinates', () => {
    expect(isInTokyo(35.6812, 139.7671)).toBe(true);
  });

  it('returns false for Osaka coordinates', () => {
    expect(isInTokyo(34.6937, 135.5023)).toBe(false);
  });

  it('returns true at the lower boundary (inclusive)', () => {
    expect(isInTokyo(35.5, 139.5)).toBe(true);
  });

  it('returns true at the upper boundary (inclusive)', () => {
    expect(isInTokyo(35.85, 140.0)).toBe(true);
  });

  it('returns false just outside the south boundary', () => {
    expect(isInTokyo(35.499, 139.75)).toBe(false);
  });

  it('returns false just outside the west boundary', () => {
    expect(isInTokyo(35.68, 139.499)).toBe(false);
  });
});

describe('getDistanceMeters', () => {
  it('returns 0 for the same point', () => {
    expect(getDistanceMeters(35.6812, 139.7671, 35.6812, 139.7671)).toBe(0);
  });

  it('calculates Tokyo Station to Tokyo Tower as ~3.2km (10% tolerance)', () => {
    // Tokyo Station: 35.6812, 139.7671
    // Tokyo Tower:   35.6586, 139.7454
    const distance = getDistanceMeters(35.6812, 139.7671, 35.6586, 139.7454);
    const expectedKm = 3.2;
    const toleranceRatio = 0.1;
    expect(distance).toBeGreaterThan(expectedKm * 1000 * (1 - toleranceRatio));
    expect(distance).toBeLessThan(expectedKm * 1000 * (1 + toleranceRatio));
  });

  it('calculates Tokyo to Osaka as ~400km (5% tolerance)', () => {
    // Tokyo Station: 35.6812, 139.7671
    // Osaka Station:  34.7024, 135.4959
    const distance = getDistanceMeters(35.6812, 139.7671, 34.7024, 135.4959);
    const expectedKm = 400;
    const toleranceRatio = 0.05;
    expect(distance).toBeGreaterThan(expectedKm * 1000 * (1 - toleranceRatio));
    expect(distance).toBeLessThan(expectedKm * 1000 * (1 + toleranceRatio));
  });
});
