# Spec 001 — SimLoop

| Field | Value |
|---|---|
| **Type** | Substrate |
| **Status** | Draft |
| **Depends on** | 000 (S2.3 transport contract) |
| **Charter rules in play** | §8, P4 |

## 1. Purpose

The continuous-time engine behind living systems: a second implementation of
the `Transport` contract (000 S2.3) that drives a pure simulation reducer
instead of precomputed frames. Not needed by module 101 (which precomputes
its run and rides `FramePlayer`); required before 102, 104, 105.

## S1. Capability & consumers

Consumers: specs 102, 104, 105; fixture-simloop. Deliverable: `SimLoop` +
fixture + tests, one session.

## S2. Contract

Wraps a pure, seeded reducer with a fixed-timestep accumulator:

```ts
interface SimDef<S> {
  init(seed: number): S;
  step(state: S, dtMs: number): S;   // pure; dtMs is SIMULATED time
  tickMs?: number;                    // fixed sim timestep, default 50
}
function createSimLoop<S>(def: SimDef<S>, seed: number):
  Transport & { getState(): S; subscribeState(fn: (s: S) => void): () => void };
```

Semantics: real elapsed time × speed is consumed in whole `tickMs` chunks;
rendering reads the latest state. `stepForward` while paused advances exactly
one tick. `capabilities = { stepBack: false, seek: false }` — the shared
`<TransportBar>` hides those controls (000 S2.3). Determinism: the state
sequence is a pure function of `(seed, tick count)`; all randomness flows
from the seed.

## S3. Fixture

**fixture-simloop — the drip bucket:** seeded random arrivals fill a bucket
that drains at a constant rate; displays current level, peak level, and tick
count, under the standard transport bar. Deep-link param: `seed`.

## 7. Simulation truth (P4)

Every visual renders from reducer state. **Forbidden shortcut:** any
rAF/CSS-driven motion that advances independently of ticks — pausing must
freeze the world *because nothing else moves it*.

## 8. Deep-link state

Fixture: `seed`. (Module-level params belong to module specs.)

## 9. Acceptance criteria

1. Fixture plays continuously; pausing freezes level, peak, and tick count
   simultaneously.
2. `stepForward` while paused advances the tick count by exactly 1.
3. At speed 4×, the fixture reaches a given tick count in roughly a quarter
   of the wall-clock time of 1× (observable via tick count vs. a stopwatch).
4. Reset + replay with the same seed reproduces the identical run — the
   *peak level* readout matches across replays.
5. StepBack and seek controls are absent from the transport bar
   (capability gating works).
6. Unit tests: determinism of `(seed, ticks) → state`; accumulator consumes
   speed-scaled time in whole ticks. Smoke harness green.

## 10. Out of scope

Variable/adaptive timesteps. Rewind (recording state history for stepBack —
possible later; not now). Any module content.

## 11. Open questions

1. **Default `tickMs = 50`** (sim-time) with per-module override — proposed
   as-is; fine granularity is a per-module concern. *Awaiting sign-off.*
