# CLAUDE.md

Interactive lessons teaching non-engineers the physics of software so they can
direct AI coding agents well. **DESIGN.md is the constitution; specs are
contracts; this file is your operating manual.** If these three ever disagree:
DESIGN.md > the spec > this file — and disagreement itself is a stop condition
(see Build protocol).

## Stack & commands

Vite + React + TypeScript (strict) + MDX. Hash routing. Hand-rolled SVG for
all visualization. No UI kits, no state libraries, no chart libraries.

```bash
npm install        # once
npm run dev        # local dev server
npm test           # Vitest unit tests + Playwright smoke harness
npm run build      # static output for GitHub Pages
```

## Layout

```
DESIGN.md                  # constitution — read before your first plan
specs/                     # numbered contracts; TEMPLATE.md is the format
src/
  shell/                   # app shell: routing, catalog, header, TransportBar
  core/                    # substrate: transport, simloop, ledger, predict,
                           #   histogram, agent-card, deep-link mechanics
  modules/
    manifest.ts            # THE registry — one typed entry per module
    <module-id>/
      index.tsx            # component (receives ModuleProps)
      core.ts              # pure computational core — no DOM, no React
      core.test.ts         # correctness tests for core.ts
      content.mdx          # lesson prose (when the module has any)
  styles/tokens.css        # design tokens (CSS custom properties, light/dark)
test/smoke.spec.ts         # Playwright: mounts every manifest entry
```

Interfaces (`Transport`, `ModuleDef`, `ModuleProps`, `PredictionRecord`, …)
are normative in **specs/000** — implement them exactly; changing them is a
substrate amendment, not a refactor.

## Hard rules

1. **Build only from a spec marked Ready.** No spec, no build. The spec's §9
   acceptance criteria define done — self-audit against them before reporting.
2. **Ambiguity is a stop condition.** If the spec is unclear, self-conflicting,
   or seems wrong once you're in the code — stop, say so, and reopen the
   spec's §11. Never resolve it silently, even in the obvious-seeming
   direction. Surfaced ambiguity is valued output, not failure.
3. **Modules never modify `src/core/` or `src/shell/`.** If a module needs a
   substrate change, that's a new substrate spec — stop and say so.
4. **No new runtime dependencies.** react, react-dom, MDX runtime — that's the
   list. `npm ls --prod` is checked in CI. Wanting a library is a substrate
   amendment, not an install.
5. **Nothing is faked (P4).** Every displayed outcome is computed by the
   module's `core.ts` actually running. No hand-authored results, no
   animations of foregone conclusions, no sampling a tuned distribution and
   calling it a simulation. The spec's §7 names the specific forbidden
   shortcut — take it seriously; it was written about you.
6. **Content is verbatim.** Felt-problem prose (§2), terminology (§5), and
   agent-questions text (§6) come word-for-word from the spec. Fix typos by
   flagging them, not editing.
7. **Tests or it doesn't merge.** `core.ts` is pure and unit-tested; every
   manifest entry (fixtures included) passes the smoke harness; CI green.
8. **Every interesting state is deep-linkable** per the module spec's §8; a
   fresh tab given the URL lands in the identical configuration.
9. **Accessibility floor:** full keyboard operation, `prefers-reduced-motion`
   respected, usable at 375 px. Not optional polish.
10. **Audience floor (P7):** all learner-facing copy in plain speech — second
    person, no term before the spec's §5 says it's been earned. When a
    tooltip needs jargon to be "precise," the tooltip is wrong.

## Build protocol

One **context**, one spec, one deliverable. A long-lived terminal is fine —
run `/clear` at each spec boundary so every build starts from the repo's
ground truth rather than the previous build's residue. "Session" in this
repo means one context epoch, not one terminal window. Each cycle starts
with `/build NNN` (project command in `.claude/commands/`).

1. Read DESIGN.md (skim on repeat visits), then the named spec in full.
   Confirm Status: Ready to build.
2. **Write a plan and wait for approval** (unless the invocation explicitly
   pre-approves proceeding). Files touched, components created, how the core
   stays pure, how each §9 criterion will be met, anything that smells
   ambiguous. Plans are cheap; surprises are not.
3. Build. Small commits, imperative messages, spec number in each
   (`101: add cost-model core`).
4. Run the full test suite yourself before reporting.
5. Report: what was built, §9 criteria self-audit (met / how to verify /
   any misses), and exact browser steps for the human's acceptance pass.
6. Log deviations: anything done differently from the spec or this file goes
   in the report explicitly — deviations are experiment data (DESIGN.md §9),
   and unlogged ones poison the experiment.

Refinement belongs *inside* the cycle: acceptance feedback, fixes, and
re-review iterate freely in the same context until the spec is Accepted.
The boundary is the deliverable, not the conversation's length. Changes to
an already-Accepted artifact are spec amendments — a new cycle.

## Conventions

- TypeScript strict; no `any`, no `@ts-ignore` (a suppression is an ambiguity
  — rule 2 applies).
- Styling per **specs/000 S2.8** (normative): design tokens in
  `styles/tokens.css`, component styles via CSS Modules, components never
  hard-code colors.
- SVG for structure, CSS classes for state (`.is-active`, `.is-settled`), so
  reduced-motion and theming stay centralized.
- Pure layout math (histogram binning, timeline packing) lives beside the
  component in a plain `.ts` file with tests — testable without a browser.
- Fixtures are manifest entries with `hidden: true`, routed at
  `#/m/fixture-*`, and held to the same smoke-harness bar as modules.
