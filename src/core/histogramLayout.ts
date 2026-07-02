// Pure histogram geometry (000 S2.6, 003 S2): samples in, bins and
// percentile marks out. No DOM, no React — unit-tested headless. The
// rendering component draws strictly from this function's output (P4).

export interface Bin {
  x0: number;
  x1: number;
  count: number;
}

export interface PercentileMark {
  p: number;
  value: number;
}

export interface LayoutOptions {
  scale?: 'linear' | 'log';
  bins?: number;
  percentiles?: number[];
}

/** Auto-binning rule per 003 §11: round(sqrt(n)) clamped to [8, 40]. */
export function autoBinCount(n: number): number {
  return Math.min(40, Math.max(8, Math.round(Math.sqrt(n))));
}

/**
 * Percentile by linear interpolation between closest ranks over a sorted
 * ascending array. For samples 1..100, p50 = 50.5.
 */
export function percentile(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const rank = ((n - 1) * p) / 100;
  const lo = Math.floor(rank);
  const frac = rank - lo;
  const a = sorted[lo];
  const b = sorted[Math.min(lo + 1, n - 1)];
  if (a === undefined || b === undefined) return NaN;
  return a + frac * (b - a);
}

export function layoutBins(
  samples: number[],
  opts: LayoutOptions = {},
): { bins: Bin[]; marks: PercentileMark[] } {
  const scale = opts.scale ?? 'linear';
  // Log scale can only place positive values; non-positive samples are
  // dropped from geometry (latency-style data is always > 0).
  const usable =
    scale === 'log' ? samples.filter((s) => s > 0) : [...samples];
  if (usable.length === 0) return { bins: [], marks: [] };

  const sorted = [...usable].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first === undefined || last === undefined) return { bins: [], marks: [] };
  let min = first;
  let max = last;
  if (min === max) {
    // Degenerate single-value set: widen so the bar has width.
    if (scale === 'log') {
      min = min / 1.1;
      max = max * 1.1;
    } else {
      min = min - 0.5;
      max = max + 0.5;
    }
  }

  const count = opts.bins ?? autoBinCount(usable.length);
  const edges: number[] = [];
  for (let i = 0; i <= count; i++) {
    if (scale === 'log') {
      const logMin = Math.log(min);
      const logMax = Math.log(max);
      edges.push(Math.exp(logMin + ((logMax - logMin) * i) / count));
    } else {
      edges.push(min + ((max - min) * i) / count);
    }
  }

  const bins: Bin[] = [];
  for (let i = 0; i < count; i++) {
    bins.push({ x0: edges[i] ?? min, x1: edges[i + 1] ?? max, count: 0 });
  }
  for (const s of sorted) {
    let i =
      scale === 'log'
        ? Math.floor(
            ((Math.log(s) - Math.log(min)) / (Math.log(max) - Math.log(min))) *
              count,
          )
        : Math.floor(((s - min) / (max - min)) * count);
    i = Math.min(count - 1, Math.max(0, i));
    const bin = bins[i];
    if (bin) bin.count++;
  }

  const marks: PercentileMark[] = (opts.percentiles ?? []).map((p) => ({
    p,
    value: percentile(sorted, p),
  }));

  return { bins, marks };
}
