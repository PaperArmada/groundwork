# Spec 003 — Histogram & Agent-Questions Card

| Field | Value |
|---|---|
| **Type** | Substrate |
| **Status** | Ready to build |
| **Depends on** | 000 (S2.6, S2.7, S2.8) |
| **Charter rules in play** | P4, P5, §8 |

## 1. Purpose

The two presentation primitives module 101 blocks on: the streaming SVG
histogram with percentile markers (000 S2.6) and the agent-questions card
(000 S2.7). Small enough to share one session.

## S1. Capability & consumers

Consumers: 101 onward (both primitives; every module ends in the card per
P5); fixture-viz. Deliverable: both components + pure layout function +
fixture + tests, one session.

## S2. Contract

**Histogram:** props `{ samples, scale: 'linear' | 'log', bins?: number,
percentiles?: (50 | 95 | 99)[] }` plus a streaming path (`add(sample)`).
All geometry comes from a pure function, tested headless:

```ts
layoutBins(samples: number[], opts): { bins: Bin[]; marks: PercentileMark[] }
```

Auto-binning: `round(sqrt(n))` clamped to [8, 40] (see §11). Colors from
tokens (000 S2.8); no animation under `prefers-reduced-motion`.

**Card:** `<AgentQuestions questions={string[]} />` — 2–3 questions,
visually distinct end-of-module treatment, copy-per-question and copy-all
(newline-joined). Renders its props verbatim; never generates or edits text
(000 S2.7).

## S3. Fixture

**fixture-viz:** a seeded skewed-sample generator feeding the histogram
through the real `add()` path — buttons for +1 and +100 samples, a "known
set" button loading 100 predetermined values, scale toggle, percentile
toggles, and a visible total-count readout. Below it, the card with three
dummy questions.

## 7. Simulation truth (P4)

Bars derive strictly from `layoutBins` over the actual sample array;
percentile marks are computed from the samples, never passed in as display
props. **Forbidden shortcut:** hardcoded bar heights, pre-binned constants,
or marker positions tuned to look right.

## 8. Deep-link state

Fixture: `seed`, `scale`.

## 9. Acceptance criteria

1. +100 re-bins live; the total-count readout matches samples fed.
2. Scale toggle re-lays out the *same* samples (count readout invariant).
3. Known-set check: loading the predetermined 100 values places the p50
   marker at the documented value (written in the fixture's caption).
4. Copy-per-question yields exactly the provided text on the clipboard
   (paste to verify); copy-all joins with newlines.
5. Reduced-motion shows no bar-grow animation; both themes render from
   tokens with no hard-coded colors.
6. Unit tests: `layoutBins` correctness on linear and log scales, clamped
   auto-binning, percentile math on known data. Smoke harness green.

## 10. Out of scope

Other chart types (timeline rendering belongs to module 101's own
component). Axis niceties beyond min/max labels and percentile marks.
Export/download of charts.

## 11. Open questions

1. **Auto-bin rule** — `sqrt(n)` clamped [8, 40]: simple, predictable,
   good enough for teaching visuals; fancier rules (Freedman–Diaconis) add
   nothing a learner would notice. *Accepted as-is (owner-delegated sign-off via goal directive, 2026-07-02).*
