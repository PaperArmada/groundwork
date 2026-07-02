import { describe, expect, it } from 'vitest';
import {
  callSamplesMs,
  COSTS,
  execute,
  formatRealNs,
  humanizeNs,
  ladderRungs,
  planA,
  planB,
  progressAt,
  raceFrames,
  summarize,
  totalNs,
} from './core.ts';

describe('plans', () => {
  it('plan B contains exactly n+1 network operations (the N+1 pattern)', () => {
    for (const n of [1, 50, 1000]) {
      const plan = planB(n);
      expect(plan.filter((op) => op.kind === 'network')).toHaveLength(n + 1);
      expect(plan.filter((op) => op.kind === 'memory')).toHaveLength(0);
    }
  });

  it('plan A is one network call plus the in-memory loop', () => {
    const plan = planA(1_000_000);
    expect(plan.filter((op) => op.kind === 'network')).toHaveLength(1);
    expect(plan.filter((op) => op.kind === 'memory')).toHaveLength(1);
    expect(plan[1]?.ops).toBe(1_000_000);
  });
});

describe('execute', () => {
  const LAT = COSTS.internetRtNs;

  it('is deterministic under a fixed seed', () => {
    expect(execute(planB(50), LAT, 7)).toEqual(execute(planB(50), LAT, 7));
    expect(execute(planB(50), LAT, 7)).not.toEqual(
      execute(planB(50), LAT, 8),
    );
  });

  it('runs sequentially: each op starts where the previous ended', () => {
    const events = execute(planB(10), LAT, 1);
    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      expect(events[i]?.start).toBe((prev?.start ?? 0) + (prev?.duration ?? 0));
    }
  });

  it('total equals the sum of event durations', () => {
    const events = execute(planB(50), LAT, 3);
    const sum = events.reduce((a, e) => a + e.duration, 0);
    expect(totalNs(events)).toBe(sum);
  });

  it('network jitter stays within ±35% of the latency preset', () => {
    const events = execute(planB(200), LAT, 5);
    for (const e of events) {
      expect(e.duration).toBeGreaterThanOrEqual(LAT * 0.75 - 1);
      expect(e.duration).toBeLessThanOrEqual(LAT * 1.45 + 1);
    }
  });

  it('memory work costs exactly ops × cpuOpNs', () => {
    const events = execute(planA(1_000_000), LAT, 1);
    expect(events[1]?.duration).toBe(1_000_000 * COSTS.cpuOpNs);
  });

  it('at defaults, plan B total is at least 20× plan A (criterion 1)', () => {
    const a = totalNs(execute(planA(1_000_000), LAT, 1));
    const b = totalNs(execute(planB(50), LAT, 1));
    expect(b / a).toBeGreaterThan(20);
    expect(a).toBeLessThan(0.3e9); // plan A under ~0.3 s simulated
    expect(b).toBeGreaterThan(3e9); // plan B past the "people notice" band
  });
});

describe('projections', () => {
  const events = execute(planA(1_000_000), COSTS.internetRtNs, 1);

  it('progressAt is complete at the total and empty at zero', () => {
    const total = totalNs(events);
    expect(progressAt(events, 0)).toEqual({
      opsDone: 0,
      callsDone: 0,
      busy: null,
      done: false,
    });
    const end = progressAt(events, total);
    expect(end.opsDone).toBe(1_000_000);
    expect(end.callsDone).toBe(1);
    expect(end.done).toBe(true);
  });

  it('progressAt mid-memory-loop shows partial op count', () => {
    const first = events[0];
    const second = events[1];
    const mid = (first?.duration ?? 0) + (second?.duration ?? 0) / 2;
    const p = progressAt(events, mid);
    expect(p.opsDone).toBeGreaterThan(400_000);
    expect(p.opsDone).toBeLessThan(600_000);
    expect(p.busy).toBe(second?.op ?? '');
  });

  it('callSamplesMs feeds only completed network calls', () => {
    const b = execute(planB(50), COSTS.internetRtNs, 1);
    expect(callSamplesMs(b, 0)).toHaveLength(0);
    expect(callSamplesMs(b, totalNs(b))).toHaveLength(51);
  });

  it('summarize partitions the run into trips and memory work', () => {
    const s = summarize(events);
    expect(s.trips).toBe(1);
    expect(s.memOps).toBe(1_000_000);
    expect(s.tripNs + s.memNs).toBe(s.totalNs);
  });
});

describe('labels', () => {
  it('humanizes the ladder rungs to the spec figures', () => {
    expect(humanizeNs(COSTS.cpuOpNs)).toBe('1 second');
    expect(humanizeNs(COSTS.memReadNs)).toBe('2 minutes');
    expect(humanizeNs(COSTS.ssdReadNs)).toBe('1 day');
    expect(humanizeNs(COSTS.lanCallNs)).toBe('12 days');
    expect(humanizeNs(COSTS.internetRtNs)).toBe('3 years');
  });

  it('preserves exact ratios: 1M ops ≈ 12 days, one ~100ms trip ≈ 3 years', () => {
    expect(humanizeNs(1_000_000 * COSTS.cpuOpNs)).toBe('12 days');
    expect(humanizeNs(100e6)).toBe('3 years');
  });

  it('formats real time in ms and s', () => {
    expect(formatRealNs(1_000_000)).toBe('1 ms');
    expect(formatRealNs(101_000_000)).toBe('101 ms');
    expect(formatRealNs(5_400_000_000)).toBe('5.4 s');
  });

  it('ladder rungs come from the cost model, ascending', () => {
    const rungs = ladderRungs();
    expect(rungs).toHaveLength(5);
    for (let i = 1; i < rungs.length; i++) {
      expect(rungs[i]?.ns ?? 0).toBeGreaterThan(rungs[i - 1]?.ns ?? 0);
    }
  });
});

describe('raceFrames', () => {
  it('spans 0 to the slower plan, evenly', () => {
    const frames = raceFrames(100, 1000);
    expect(frames[0]).toBe(0);
    expect(frames[frames.length - 1]).toBe(1000);
    expect(frames).toHaveLength(120);
  });
});
