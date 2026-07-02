Build spec $ARGUMENTS.

1. Read DESIGN.md and CLAUDE.md in full, then the spec at
   `specs/$ARGUMENTS-*.md` (match by number).
2. Confirm the spec's Status is "Ready to build." If it isn't — or if
   anything in the spec conflicts with DESIGN.md, CLAUDE.md, or the code as
   it actually exists — stop and say so before doing anything else.
3. Follow CLAUDE.md's Build protocol from step 2: propose your plan and wait
   for approval, unless this invocation explicitly says to proceed without
   plan review.
4. On completion, deliver the report per protocol steps 5–6 — including
   exact browser steps for the human's acceptance pass — then stop. Do not
   start another spec; the human runs `/clear` and `/build` for the next
   cycle.
