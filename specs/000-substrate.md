# Spec 000 — Substrate: Stack, Shell & Contracts

| Field | Value |
|---|---|
| **Type** | Substrate |
| **Status** | Ready to build |
| **Depends on** | — (root spec) |
| **Charter rules in play** | §7 non-goals, §8 all technical commitments, P3/P4/P5/P6 (contracts defined here serve them) |

## 1. Purpose

Resolve the stack decision (DESIGN.md §11), stand up the application shell and
playback transport, and pin the shared contracts — transport, simulation loop,
prediction ledger, histogram, agent-questions card, deep-link state — that
every downstream spec cites. This is the only spec allowed to be
architecture-shaped; everything after it is content on these bones.

## S1. Capability & consumers

**Build deliverable of this spec (one session):** a deployed, empty site —
repo scaffold, CI, app shell, transport implementation, fixture
infrastructure, smoke harness. Green checks, zero modules.

**Contracts defined here, built in follow-up sessions:**

| Spec | Deliverable | Consumed by |
|---|---|---|
| 001 | Simulation loop (`SimLoop`) | Modules 102, 104, 105 |
| 002 | Predict component + calibration ledger | All modules (P3/P6) |
| 003 | Histogram primitive + agent-questions card | 101 onward (P5) |

Module specs are numbered 101–106, matching charter §6. Nothing in 001–003
gets built without this spec's contracts; no module spec gets built before
the specs in its Depends-on row are Accepted (002–003 for 101; 001
additionally for 102, 104, 105 — matching the README's build order).

## S2. Contracts

### S2.1 Stack (decision record)

**Decision: Vite + React + TypeScript (strict), MDX for lesson prose,
hand-rolled SVG for all visualization, hash-based routing. Vitest for unit
tests, Playwright for the smoke harness. GitHub Actions builds and deploys to
Pages.**

Against the charter's four criteria (§11):

- *Static output:* `vite build` emits plain assets; hash routing (`#/...`)
  makes every deep link work on GitHub Pages with no 404 rewrite hacks.
- *Fast first load:* per-module code-splitting via dynamic import; the site is
  small; no chart or animation libraries — SVG components we own.
- *Low maintenance:* dependency surface is deliberately thin — react,
  react-dom, vite, mdx plugin, and dev-only test tooling. No UI kit, no state
  library, no chart library. Renovate-style churn stays proportional.
- *Agent-buildability:* React + TypeScript is the most deeply
  agent-fluent UI stack in existence, and strict TypeScript turns this spec's
  contracts into compiler-enforced guardrails — an agent that violates an
  interface fails the build, not the code review.

Rejected: **vanilla JS** (viable, but component reuse and typed contracts do
real work here, and the constraint it protected — longevity — is preserved by
the thin-dependency rule instead); **Astro islands** (attractive for
prose-heavy lessons, but a second paradigm and hydration directives add
novelty the process doesn't need); **Svelte** (excellent, less agent-deep).

MDX from day one: lessons are the primary surface (charter §8) and are
human-authored prose interleaved with interactives — MDX keeps that content
as reviewable, diffable markdown with embedded components rather than prose
trapped in TSX.

### S2.2 Module registration

A typed manifest, not side-effect self-registration:

```ts
interface ModuleDef {
  id: string;                 // URL segment: #/m/{id}
  title: string;              // felt-problem phrasing, e.g. "Why is it slow?"
  blurb: string;              // one line for the catalog card
  load: () => Promise<{ default: React.ComponentType<ModuleProps> }>;
  hidden?: boolean;           // fixtures set true
}
interface ModuleProps {
  urlState: URLSearchParams;                    // deep-link state in
  onStateChange: (s: URLSearchParams) => void;  // deep-link state out
}
```

`modules/manifest.ts` is the single registry; shell derives catalog, search
filter, routing, and lesson embedding from it. Adding a module = one file +
one manifest entry.

### S2.3 Transport

One transport contract, two implementations, one UI:

```ts
type TransportState = 'idle' | 'playing' | 'paused' | 'done';
interface Transport {
  play(): void;  pause(): void;  toggle(): void;
  stepForward(): void;
  stepBack(): void;            // capability-gated, see below
  seek(pos: number): void;     // capability-gated
  setSpeed(mult: number): void;   // 0.25–4, default 1
  reset(): void;
  readonly state: TransportState;
  readonly capabilities: { stepBack: boolean; seek: boolean };
  subscribe(fn: (t: Transport) => void): () => void;
}
```

- **`FramePlayer`** (built in this spec): drives an array of precomputed
  frames; supports everything, including stepBack and seek.
- **`SimLoop`** (spec 001): continuous-time engine; `stepBack: false,
  seek: false`. Stepping forward advances one tick.

The shared `<TransportBar>` renders from `capabilities` — unsupported
controls don't appear, so playback UX stays uniform without pretending
continuous systems can rewind. Keyboard: `Space` toggle, `←/→` step,
`Home` reset.

### S2.4 Prediction ledger (consumed by spec 002)

```ts
interface PredictionRecord {
  id: string;                  // `${moduleId}.${predictionId}` — stable
  moduleId: string;
  kind: 'number' | 'range' | 'order' | 'choice';
  guess: unknown;
  actual: unknown;
  withinRange: boolean;        // per-prediction tolerance, defined in module spec
  committedAt: string;         // ISO 8601
  attempt: number;             // 1, 2, …
}
```

Storage: `localStorage["gw.ledger.v1"]`, JSON array, append-only.
**Calibration policy: first commitment counts.** Re-takes are recorded with
incremented `attempt` but the ledger summary computes only over `attempt: 1` —
you can't grind your calibration score, which is itself the meta-lesson (P6).
Summary surface in the shell header: "N predictions · M% within range."

### S2.5 Deep-link state (P-shell)

Pattern: `#/m/{moduleId}?{params}`. Shell owns mechanics: it parses params
into `ModuleProps.urlState` and serializes `onStateChange` back to the URL
(replaceState, debounced). Each module spec's §8 declares its params. Rules:
params are short, human-scrutable where possible (`users=5000`), and a fresh
tab given the URL must land in the identical configuration. A "Copy link"
control lives in the shell, available to every module.

### S2.6 Histogram (consumed by spec 003)

SVG component: streaming-friendly (`add(sample)` / `setSamples([])`), linear
and log-x scales, configurable bins, percentile markers (p50/p95/p99)
toggleable, reduced-motion aware. Pure layout function
(`samples → bins/marks`) separated from rendering so it unit-tests without a
browser (P4's testing bar).

### S2.7 Agent-questions card (consumed by spec 003)

Component taking `questions: string[]` (2–3 per P5); renders at module end,
visually distinct, copy-per-question and copy-all. Content always comes
verbatim from the module's spec §6 — the component never generates or edits
text.

### S2.8 Styling

Design tokens as CSS custom properties in `styles/tokens.css` — the single
source for color, spacing, and type scale; light/dark themes are token swaps
keyed off a `data-theme` attribute. Component styles via CSS Modules
(`*.module.css`). Components never hard-code colors; SVG takes color from
tokens/`currentColor` and state from CSS classes, so theming and
reduced-motion behavior stay centralized rather than re-implemented per
visualization.

## S3. Fixtures

Fixture modules live in the manifest with `hidden: true`, routed at
`#/m/fixture-*`, excluded from catalog/search, included in the smoke harness.
This spec ships: **fixture-transport** (a trivial 60-frame sequence proving
play/pause/step/seek/speed/keyboard against `FramePlayer`) and
**fixture-shell** (theme toggle, deep-link round-trip with dummy params,
reduced-motion check). Specs 001–003 each add their own fixture.

## 7. Simulation truth (P4)

Foundation-level honesty: the ledger summary is computed from stored records,
never a displayed running tally that could drift; fixture-transport's frames
are generated by a real loop, not hand-authored. **Forbidden shortcut:** a
`TransportBar` that animates independently of actual `Transport` state — the
bar must render *from* the transport's subscription, so what you see is what
the engine is doing.

## 8. Deep-link state

This spec's own deep-linkable surface: theme is *not* in the URL (it's a
device preference, localStorage); fixture params round-trip per S2.5 as the
proof of mechanism.

## 9. Acceptance criteria

1. Fresh clone → `npm install && npm run dev` → working site; `npm test`
   green; push to `main` → CI builds, tests, deploys to Pages, and the
   deployed URL serves the site.
2. Catalog renders from the manifest; fixtures are absent from catalog and
   search but reachable by URL.
3. fixture-transport: plays, pauses, steps forward *and back*, seeks, obeys
   speed 0.25–4, full keyboard control; the transport bar visibly reflects
   engine state (pause mid-play → bar freezes on the current frame).
4. fixture-shell: theme toggles and persists across reload;
   `prefers-reduced-motion` disables animation; layout usable at 375 px width.
5. Deep-link round trip: set dummy params in fixture-shell, copy link, open
   in a fresh tab → identical configuration.
6. Smoke harness loads every manifest entry (fixtures included), asserts
   mount without console errors and survival of all rendered controls.
7. Zero runtime dependencies beyond react/react-dom (+ MDX runtime);
   `npm ls --prod` confirms.

## 10. Out of scope

PWA/offline and embed mode (charter: desirable, not binding — later spec if
ever). Search beyond simple title/blurb filtering. Lesson *content* of any
kind. The SimLoop, Predict, Histogram, and Card implementations (001–003 —
contracts only here). Analytics of any form (charter-forbidden). State
libraries, UI kits, chart libraries (S2.1 forbids; adding one is a substrate
amendment, not a convenience).

## 11. Open questions

None. Three items resolved by owner sign-off (2026-07-02): **full
cross-module ledger in v1** (S2.4 as written, closes DESIGN.md §11);
**first-commitment-counts** calibration policy (S2.4);
**MDX from day one** (S2.1).

Four build-plan resolutions (owner-approved 2026-07-02, 000 session):
**`seek(pos)` takes normalized progress [0, 1]** in the S2.3 contract —
implementation-agnostic; `FramePlayer` maps it to the nearest frame.
**`play()` from `done` restarts** (reset, then play). **Transport keyboard
shortcuts are scoped** to focus within the transport bar / module area, not
global capture (typing in search must never toggle playback). **Theme
initializes from `prefers-color-scheme`**, persisting to localStorage only
once the learner toggles it.

*Amended 2026-07-02 (owner-approved): S2.8 styling contract added —
previously an unspecified convention living only in CLAUDE.md.*

*Amended 2026-07-02: S1 build gate corrected — modules gate on their own
Depends-on specs, not a blanket "001–003 Accepted." The old wording
contradicted the README build order and spec 101's Depends-on row (101
does not consume 001).*
