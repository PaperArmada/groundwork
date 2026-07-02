# Spec 002 — Predict & Calibration Ledger

| Field | Value |
|---|---|
| **Type** | Substrate |
| **Status** | Built |
| **Depends on** | 000 (S2.4 ledger schema & policy) |
| **Charter rules in play** | P3, P6, §8 |

## 1. Purpose

The predict-then-reveal mechanism (P3) and the persistent calibration ledger
(P6). Required before any module ships; module 101 consumes it twice.

## S1. Capability & consumers

Consumers: every module spec (101–106); the shell's summary chip;
fixture-predict. Deliverable: ledger module + `<Predict>` component + shell
chip + fixture + tests, one session.

## S2. Contract

**Ledger** (schema and first-commitment policy are normative in 000 S2.4):

```ts
record(entry: Omit<PredictionRecord, 'attempt' | 'committedAt'>): PredictionRecord;
summary(): { total: number; withinRange: number; pct: number };  // attempt === 1 only
listByModule(moduleId: string): PredictionRecord[];
attemptsFor(id: string): number;
clear(): void;   // exposed in fixture only for now — see §11
```

**Component:**

```tsx
<Predict
  id="why-is-it-slow.ladder-roundtrip"      // stable, per 000 S2.4
  kind="number" | "range" | "order" | "choice"
  prompt="…" options={…} actual={…}
  judge={(guess, actual) => boolean}         // tolerance defined by module spec
>
  {revealed content — NOT RENDERED until commit}
</Predict>
```

Gating is structural: children are absent from the DOM until commit, not
hidden. On commit: write to ledger (attempt = `attemptsFor(id) + 1`), show
guess vs. actual with within-range mark, render children. The shell header
chip renders "N predictions · M% within range" from `summary()` and updates
on ledger change.

## S3. Fixture

**fixture-predict:** one `<Predict>` of each kind with dummy actuals, a live
table of stored records beneath, and a re-answer flow demonstrating that
attempts increment while the summary holds still. Fixture-only "clear
ledger" button.

## 7. Simulation truth (P4)

The summary is computed from stored records on every render — no shadow
tally. **Forbidden shortcut:** a component- or app-local "score" state that
could drift from `localStorage`; the ledger *is* the truth.

## 8. Deep-link state

None — predictions are deliberately not URL state (a shared link must not
leak or pre-fill someone's commitment).

## 9. Acceptance criteria

1. Reveal content is unreachable before commit — not in the DOM, not
   scrollable-to, not findable via devtools-free inspection of the page.
2. A commit persists across reload and appears in the fixture table and the
   shell chip.
3. Re-answering the same prediction increments `attempt` in the table and
   changes the summary *not at all*.
4. All four kinds are fully keyboard-operable.
5. Chip numbers always equal a recount of the table's attempt-1 rows.
6. Unit tests: first-commitment policy, judge/tolerance path, storage
   round-trip. Smoke harness green.

## 10. Out of scope

A user-facing settings surface for ledger reset (fixture-only `clear()` for
now). Streaks, badges, or any gamification beyond the honest percentage.
Server sync of any kind (charter-forbidden).

## 11. Open questions

1. **Ledger reset placement** — fixture-only now; a small settings surface
   becomes its own tiny spec when the shell grows one. *Accepted as-is
   (owner-delegated sign-off via goal directive, 2026-07-02).*
