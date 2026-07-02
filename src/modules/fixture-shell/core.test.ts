import { describe, expect, it } from 'vitest';
import { DEFAULTS, readParams, writeParams } from './core.ts';

describe('readParams', () => {
  it('returns defaults for empty params', () => {
    expect(readParams(new URLSearchParams())).toEqual(DEFAULTS);
  });

  it('reads valid values', () => {
    const p = new URLSearchParams('shape=square&count=7');
    expect(readParams(p)).toEqual({ shape: 'square', count: 7 });
  });

  it('falls back on junk and clamps out-of-range counts', () => {
    expect(readParams(new URLSearchParams('shape=blob&count=banana'))).toEqual(
      DEFAULTS,
    );
    expect(readParams(new URLSearchParams('count=999')).count).toBe(10);
    expect(readParams(new URLSearchParams('count=-2')).count).toBe(1);
  });
});

describe('writeParams', () => {
  it('round-trips through readParams', () => {
    const state = { shape: 'triangle' as const, count: 9 };
    expect(readParams(writeParams(state))).toEqual(state);
  });

  it('omits defaults so URLs stay short', () => {
    expect(writeParams(DEFAULTS).toString()).toBe('');
    expect(writeParams({ ...DEFAULTS, count: 5 }).toString()).toBe('count=5');
  });
});
