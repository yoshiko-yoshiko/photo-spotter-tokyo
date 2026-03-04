import { describe, it, expect } from 'vitest';
import { isCoordsMissing } from '../geocode';

describe('isCoordsMissing', () => {
  it('returns true when both are 0', () => {
    expect(isCoordsMissing(0, 0)).toBe(true);
  });

  it('returns false when only latitude is 0 (AND logic: both must be falsy)', () => {
    // isCoordsMissing uses (!lat && !lng), so only one being 0 returns false
    expect(isCoordsMissing(0, 139.7671)).toBe(false);
  });

  it('returns false when only longitude is 0 (AND logic: both must be falsy)', () => {
    expect(isCoordsMissing(35.6812, 0)).toBe(false);
  });

  it('returns true when latitude is NaN', () => {
    expect(isCoordsMissing(NaN, 139.7671)).toBe(true);
  });

  it('returns true when longitude is NaN', () => {
    expect(isCoordsMissing(35.6812, NaN)).toBe(true);
  });

  it('returns true when both are NaN', () => {
    expect(isCoordsMissing(NaN, NaN)).toBe(true);
  });

  it('returns false for valid coordinates', () => {
    expect(isCoordsMissing(35.6812, 139.7671)).toBe(false);
  });

  it('returns false for negative valid coordinates', () => {
    expect(isCoordsMissing(-33.8688, 151.2093)).toBe(false);
  });
});
