# Groundwork *(working title)*

Interactive lessons teaching non-engineers the physics of software — what
things cost, where state lives, how systems break — so they can direct AI
coding agents effectively.

**Status:** pre-build. The constitution is [DESIGN.md](DESIGN.md); the
agent's operating manual is [CLAUDE.md](CLAUDE.md); build contracts live in
[specs/](specs/).

## Running a build session

One session, one spec (CLAUDE.md → Session protocol). Open Claude Code at
the repo root and start with:

> Read DESIGN.md, CLAUDE.md, and specs/NNN-*.md. Confirm the spec's Status
> is "Ready to build," then propose your plan per the Session protocol.
> No code until I approve the plan.

**Build order:** `000 → 002 → 003 → 101` gets the first module live.
`001` (SimLoop) is not needed by 101 — build it any time before module 102.

**Pages, when ready:** the live-deploy check in spec 000's criterion 1 is
deferred until GitHub Pages is enabled (Settings → Pages → Source: GitHub
Actions) — do it before accepting the first module spec.

## Acceptance

The human accepts each build in the browser against the spec's §9 — as the
learner, not the owner: read every word in order, commit predictions
honestly, and note every hesitation. Deviations from spec or process get
logged (they're experiment data, per DESIGN.md §9).
