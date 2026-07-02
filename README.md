# Groundwork *(working title)*

Interactive lessons teaching non-engineers the physics of software — what
things cost, where state lives, how systems break — so they can direct AI
coding agents effectively.

**Status:** pre-build. The constitution is [DESIGN.md](DESIGN.md); the
agent's operating manual is [CLAUDE.md](CLAUDE.md); build contracts live in
[specs/](specs/).

## Running a build cycle

One context, one spec (CLAUDE.md → Build protocol). Keep a single terminal
open as long as you like; run `/clear` between specs so each build starts
from the repo's ground truth. Start every cycle with the project command:

```
/build 000
```

(defined in `.claude/commands/build.md` — it reads the constitution,
verifies the spec is Ready, and proposes a plan for your approval before
writing code).

**Build order:** `000 → 002 → 003 → 101` gets the first module live.
`001` (SimLoop) is not needed by 101 — build it any time before module 102.

## Acceptance

The human accepts each build in the browser against the spec's §9 — as the
learner, not the owner: read every word in order, commit predictions
honestly, and note every hesitation. Deviations from spec or process get
logged (they're experiment data, per DESIGN.md §9).
