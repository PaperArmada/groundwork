import { describe, expect, it } from 'vitest';
import { percentile } from '../../core/histogramLayout.ts';
import {
  createSkewedGenerator,
  KNOWN_SET,
  KNOWN_SET_P50,
} from './core.ts';

describe('createSkewedGenerator', () => {
  it('is deterministic per seed', () => {
    const a = createSkewedGenerator(42);
    const b = createSkewedGenerator(42);
    const c = createSkewedGenerator(7);
    const seqA = Array.from({ length: 50 }, a);
    const seqB = Array.from({ length: 50 }, b);
    const seqC = Array.from({ length: 50 }, c);
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
  });

  it('produces positive, right-skewed samples', () => {
    const gen = createSkewedGenerator(1);
    const samples = Array.from({ length: 1000 }, gen).sort((x, y) => x - y);
    expect(samples[0]).toBeGreaterThan(0);
    const p50 = percentile(samples, 50);
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeGreaterThan(p50); // skewed right: mean above median
  });
});

describe('KNOWN_SET', () => {
  it('has 100 values and the documented p50', () => {
    expect(KNOWN_SET).toHaveLength(100);
    expect(percentile([...KNOWN_SET].sort((a, b) => a - b), 50)).toBe(
      KNOWN_SET_P50,
    );
  });
});
