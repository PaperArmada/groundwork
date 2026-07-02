// Pure sample generation for fixture-viz (003 S3): a seeded, right-skewed
// distribution (latency-shaped) and the documented known set.

import { mulberry32 } from '../../core/rng.ts';

/** Right-skewed positive samples, deterministic per seed. */
export function createSkewedGenerator(seed: number): () => number {
  const rand = mulberry32(seed);
  return () => {
    // exponential tail on a 20-unit floor, occasionally spiky
    const u = rand();
    const base = 20 + -Math.log(1 - u) * 25;
    const spike = rand() < 0.05 ? 150 + rand() * 200 : 0;
    return Math.round((base + spike) * 10) / 10;
  };
}

/**
 * The known set: 1..100. With linear-interpolation percentiles this places
 * p50 at exactly 50.5 (documented in the fixture caption; 003 §9.3).
 */
export const KNOWN_SET: number[] = Array.from(
  { length: 100 },
  (_, i) => i + 1,
);
export const KNOWN_SET_P50 = 50.5;
