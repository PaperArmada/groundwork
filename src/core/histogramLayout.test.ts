import { describe, expect, it } from 'vitest';
import {
  autoBinCount,
  layoutBins,
  percentile,
} from './histogramLayout.ts';

describe('autoBinCount', () => {
  it('is round(sqrt(n)) clamped to [8, 40]', () => {
    expect(autoBinCount(4)).toBe(8); // sqrt=2 → clamp up
    expect(autoBinCount(100)).toBe(10);
    expect(autoBinCount(400)).toBe(20);
    expect(autoBinCount(10_000)).toBe(40); // sqrt=100 → clamp down
  });
});

describe('percentile', () => {
  const oneToHundred = Array.from({ length: 100 }, (_, i) => i + 1);

  it('interpolates linearly on the documented known set', () => {
    expect(percentile(oneToHundred, 50)).toBe(50.5);
    expect(percentile(oneToHundred, 95)).toBeCloseTo(95.05, 10);
    expect(percentile(oneToHundred, 99)).toBeCloseTo(99.01, 10);
  });

  it('handles edges', () => {
    expect(percentile([7], 50)).toBe(7);
    expect(percentile([1, 2], 0)).toBe(1);
    expect(percentile([1, 2], 100)).toBe(2);
    expect(Number.isNaN(percentile([], 50))).toBe(true);
  });
});

describe('layoutBins', () => {
  const samples = Array.from({ length: 100 }, (_, i) => i + 1);

  it('bins every sample exactly once (linear)', () => {
    const { bins } = layoutBins(samples, { scale: 'linear' });
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(100);
    expect(bins).toHaveLength(autoBinCount(100));
  });

  it('bins every sample exactly once (log)', () => {
    const { bins } = layoutBins(samples, { scale: 'log' });
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(100);
  });

  it('log scale drops non-positive samples from geometry', () => {
    const { bins } = layoutBins([-5, 0, 1, 10, 100], { scale: 'log' });
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(3);
  });

  it('respects an explicit bin count and covers [min, max]', () => {
    const { bins } = layoutBins(samples, { bins: 10 });
    expect(bins).toHaveLength(10);
    expect(bins[0]?.x0).toBe(1);
    expect(bins[9]?.x1).toBe(100);
  });

  it('log bin edges are geometric', () => {
    const { bins } = layoutBins([1, 1000], { bins: 3, scale: 'log' });
    expect(bins[0]?.x1).toBeCloseTo(10, 6);
    expect(bins[1]?.x1).toBeCloseTo(100, 6);
  });

  it('emits requested percentile marks from the samples', () => {
    const { marks } = layoutBins(samples, { percentiles: [50, 95] });
    expect(marks).toEqual([
      { p: 50, value: 50.5 },
      { p: 95, value: expect.closeTo(95.05, 10) as number },
    ]);
  });

  it('handles the degenerate single-value set', () => {
    const { bins } = layoutBins([5, 5, 5]);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(3);
    expect(bins[0]?.x0).toBeLessThan(5);
  });

  it('empty input yields empty output', () => {
    expect(layoutBins([])).toEqual({ bins: [], marks: [] });
  });
});
