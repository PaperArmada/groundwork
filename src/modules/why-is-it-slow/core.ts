// Pure computational core for "Why is it slow?" (spec 101 §7).
//
// (a) the cost model: napkin-class constants shared by the ladder and the
//     race — the ladder IS this price list;
// (b) plan builders producing explicit operation sequences;
// (c) a seeded executor that walks a plan and emits one event stream.
// Every displayed number is a projection of that stream (P4).

import { mulberry32 } from '../../core/rng.ts';

// --- (a) cost model -------------------------------------------------------
// All costs in nanoseconds. Humanized scale: 1 ns of real time reads as
// 1 second (one CPU operation ≈ 1 ns ≈ "1 second").
export const COSTS = {
  cpuOpNs: 1, // one simple in-memory operation (~1 ns on modern hardware)
  memReadNs: 100, // a read from main memory (~100 ns)
  ssdReadNs: 100_000, // a random read from an SSD (~100 µs)
  lanCallNs: 1_000_000, // a call to a server in the same building (~1 ms)
  internetRtNs: 100_000_000, // a round trip across the internet (~100 ms)
} as const;

export interface LadderRung {
  label: string;
  ns: number;
}

/** The ladder's five rungs, derived from the cost model above. */
export function ladderRungs(): LadderRung[] {
  return [
    { label: 'One operation on data already in the processor', ns: COSTS.cpuOpNs },
    { label: 'Read something from memory', ns: COSTS.memReadNs },
    { label: 'Read something from the SSD', ns: COSTS.ssdReadNs },
    { label: 'Call a server in the same building', ns: COSTS.lanCallNs },
    { label: 'One round trip across the internet', ns: COSTS.internetRtNs },
  ];
}

// --- (b) plans -------------------------------------------------------------

export type OpKind = 'network' | 'memory';

export interface PlanOp {
  kind: OpKind;
  label: string;
  /** In-memory operation count (memory ops only). */
  ops?: number;
}

/** Plan A: one call fetches everything, then a per-item in-memory loop. */
export function planA(totalOps: number): PlanOp[] {
  return [
    { kind: 'network', label: 'fetch everything in one call' },
    { kind: 'memory', label: 'loop over it in memory', ops: totalOps },
  ];
}

/** Plan B: one call for the list, then one call per contact — N+1 calls. */
export function planB(n: number): PlanOp[] {
  const plan: PlanOp[] = [
    { kind: 'network', label: 'fetch the contact list' },
  ];
  for (let i = 1; i <= n; i++) {
    plan.push({ kind: 'network', label: `fetch latest message ${i}` });
  }
  return plan;
}

// --- (c) executor ----------------------------------------------------------

export interface RunEvent {
  op: string;
  kind: OpKind;
  start: number; // ns, cumulative (sequential execution)
  duration: number; // ns
  opCount: number; // 1 for network; ops for memory work
}

/**
 * Walk a plan sequentially, sampling per-call network jitter from the seed.
 * The state sequence is a pure function of (plan, latencyNs, seed).
 */
export function execute(
  plan: PlanOp[],
  latencyNs: number,
  seed: number,
): RunEvent[] {
  const rand = mulberry32(seed);
  const events: RunEvent[] = [];
  let t = 0;
  for (const op of plan) {
    const duration =
      op.kind === 'network'
        ? Math.round(latencyNs * (0.75 + rand() * 0.7)) // ±35% jitter
        : (op.ops ?? 0) * COSTS.cpuOpNs;
    events.push({
      op: op.label,
      kind: op.kind,
      start: t,
      duration,
      opCount: op.kind === 'network' ? 1 : (op.ops ?? 0),
    });
    t += duration;
  }
  return events;
}

// --- projections -----------------------------------------------------------

export function totalNs(events: RunEvent[]): number {
  const last = events[events.length - 1];
  return last ? last.start + last.duration : 0;
}

export interface Progress {
  opsDone: number; // in-memory operations completed by t
  callsDone: number; // network calls completed by t
  busy: string | null; // label of the op in flight at t
  done: boolean;
}

export function progressAt(events: RunEvent[], tNs: number): Progress {
  let opsDone = 0;
  let callsDone = 0;
  let busy: string | null = null;
  for (const e of events) {
    const end = e.start + e.duration;
    if (tNs >= end) {
      if (e.kind === 'memory') opsDone += e.opCount;
      else callsDone += 1;
    } else if (tNs > e.start) {
      const frac = (tNs - e.start) / e.duration;
      if (e.kind === 'memory') opsDone += Math.floor(e.opCount * frac);
      busy = e.op;
      break;
    } else {
      break;
    }
  }
  return { opsDone, callsDone, busy, done: tNs >= totalNs(events) };
}

/** Completed network-call durations by t, in ms — the histogram's feed. */
export function callSamplesMs(events: RunEvent[], tNs: number): number[] {
  return events
    .filter((e) => e.kind === 'network' && tNs >= e.start + e.duration)
    .map((e) => e.duration / 1e6);
}

export interface PlanSummary {
  trips: number;
  tripNs: number;
  memOps: number;
  memNs: number;
  totalNs: number;
}

export function summarize(events: RunEvent[]): PlanSummary {
  let trips = 0;
  let tripNs = 0;
  let memOps = 0;
  let memNs = 0;
  for (const e of events) {
    if (e.kind === 'network') {
      trips += 1;
      tripNs += e.duration;
    } else {
      memOps += e.opCount;
      memNs += e.duration;
    }
  }
  return { trips, tripNs, memOps, memNs, totalNs: totalNs(events) };
}

// --- labels ----------------------------------------------------------------

/**
 * The humanized timescale: 1 ns of real time reads as 1 second. The
 * conversion is the identity on the number and only changes the unit label,
 * so ratios are preserved exactly.
 */
export function humanizeNs(ns: number): string {
  const s = ns; // 1 ns → 1 s, by definition of the scale
  const round = (v: number, unit: string) => {
    const r = Math.round(v);
    return `${r.toLocaleString('en-US')} ${unit}${r === 1 ? '' : 's'}`;
  };
  if (s < 90) return round(s, 'second');
  if (s < 90 * 60) return round(s / 60, 'minute');
  if (s < 27 * 3600) return round(s / 3600, 'hour');
  if (s < 60 * 86400) return round(s / 86400, 'day');
  if (s < 540 * 86400) return round(s / (30 * 86400), 'month');
  return round(s / (365 * 86400), 'year');
}

/** Real-time formatting: milliseconds under a second, seconds above. */
export function formatRealNs(ns: number): string {
  const ms = ns / 1e6;
  if (ms < 1) return `${(Math.round(ms * 100) / 100).toLocaleString('en-US')} ms`;
  if (ms < 1000) return `${Math.round(ms).toLocaleString('en-US')} ms`;
  return `${(Math.round(ms / 100) / 10).toLocaleString('en-US')} s`;
}

// --- playback frames --------------------------------------------------------

export const FRAME_COUNT = 120;

/** Evenly spaced timeline instants from 0 to the slower plan's finish. */
export function raceFrames(aTotal: number, bTotal: number): number[] {
  const total = Math.max(aTotal, bTotal, 1);
  return Array.from(
    { length: FRAME_COUNT },
    (_, i) => (i / (FRAME_COUNT - 1)) * total,
  );
}
