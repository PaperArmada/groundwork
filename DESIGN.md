# Groundwork — Project Charter

*(Working title. See Open Decisions. The final name must not contain "DSA,"
"algorithms," or anything else that smells like an interview-prep site.)*

**Status:** Draft for review · **Owner:** PaperArmada

This document is the project's constitution. Every spec cites it. Every scope
argument ends here. If a proposed feature, module, or "improvement" conflicts
with this document, the document wins — or the document gets amended first, on
purpose, in its own commit.

---

## 1. What this is

A small collection of interactive, browser-native lessons that give people with
no engineering background an accurate physical intuition for how software
actually behaves — what things cost, where state lives, and how systems break —
so they can direct AI coding agents effectively instead of being at their mercy.

A static site: no backend, no accounts, hostable on GitHub Pages. Everything a
lesson needs runs in the learner's browser.

## 2. Who it's for

The **capable non-engineer directing an agent**: the vibe coder, the recent grad
from an adjacent field, the founder building their own tool, the analyst who
just discovered they can ship software now. They can get an app working. What
they can't yet do is tell whether it's *sound* — or ask the questions that would
reveal it isn't.

This person will never choose between an AVL tree and a red-black tree. The
agent makes that call invisibly and usually fine. Their real decision points
sound like:

- "The agent put everything in a JSON file — is that okay?"
- "It worked great until twelve people used it at once."
- "The agent says it's fixed and the tests pass — do I believe it?"
- "A customer got charged twice. How is that even possible?"

We build for those moments. Engineers are welcome, but when a design choice
trades engineer-appeal against beginner-clarity, the beginner wins.

## 3. Thesis

Three claims, in order:

1. **In agentic development, human value concentrates in judgment.** The agent
   gathers information and writes code; the human's contribution is
   discernment — noticing what's fragile, asking what's missing, deciding what
   matters. Judgment runs on mental models.

2. **The mental models this audience lacks are physics, not mechanisms.** Not
   "how quicksort partitions" but: operations have wildly unequal costs; work
   grows in characteristic shapes; state has a location and a lifetime;
   concurrent actions interleave; failures happen *between* steps; passing
   tests prove less than they seem. A small set of invariants with enormous
   coverage.

3. **For this audience, the cash value of a mental model is vocabulary.**
   Their entire interface to the system is natural language. A concept they
   can *name* becomes a question they can *ask*, and a question asked at the
   right moment is the whole job. Every lesson therefore terminates in words
   the learner can say to their agent.

## 4. The filter: the decision-relevance test

A module earns its place only if it changes how the learner evaluates an
agent's output or proposal — ideally within seconds of encountering it.

Corollaries:

- **Decision-oriented, not mechanism-oriented.** Existing visualizers answer
  "how does X work?" We answer "when does X betray you, and what do you ask
  when it does?"
- **Failure-forward.** Degradation is where judgment lives. Every module has a
  mode where something breaks, saturates, races, or lies.
- **Teach restraint too.** Half of good judgment is knowing when complexity is
  unnecessary. Modules must be honest about when the scary thing *doesn't*
  apply ("most apps never reach the scale where this matters") so learners can
  also veto agent over-engineering.

## 5. Pedagogy commitments (binding)

These are rules, not aspirations. Specs cite them by ID; acceptance reviews
check them.

- **P1 — Felt-problem hook.** Every module opens with a scenario the learner
  has plausibly lived, named in their language ("Why is it slow?"), never with
  a definition or a term.
- **P2 — Experience before terminology.** No technical term appears before the
  interaction that motivates it. The learner should *meet* the lost update
  before hearing "race condition."
- **P3 — Predict, then reveal.** Every module contains at least one moment
  where the learner commits to a quantitative guess before the simulation
  answers. Confident wrong predictions, corrected, are the stickiest learning
  we can buy — and prediction is itself the skill being trained, because
  evaluating an agent's plan *is* predicting runtime behavior.
- **P4 — Nothing is faked.** Every displayed outcome is computed by actually
  running the thing — a real data structure, a real simulation, real generated
  frames. No hand-authored results, no animations of a foregone conclusion. A
  live system can surprise us; surprises are how mental models get corrected,
  including ours.
- **P5 — The agent-questions card.** Every module ends with two or three
  copyable questions the concept unlocks — e.g. "Where does this state live,
  and what happens when the server restarts?" This is the Orient→Act bridge
  made literal, and the module's cashable payoff.
- **P6 — Calibration is a feature.** Predictions from P3 feed a persistent
  local ledger ("31 predictions, 58% within range"). The meta-lesson —
  *knowing how good your guesses are* — is taught by the interface itself.
- **P7 — Plain speech.** Second person, short sentences, humor allowed,
  jargon only after P2 has earned it. Reading level: a smart person who has
  never read an engineering blog.

## 6. The season: six modules

Named by the felt problem, ordered so each module's vocabulary is available to
the next. Three physics, two breakage, one epistemics.

| # | Module | Concept smuggled in | The engineered aha |
|---|--------|--------------------|--------------------|
| 1 | **Why is it slow?** | The cost hierarchy: CPU ≪ RAM ≪ disk ≪ network, on a humanized timescale (1 CPU cycle = 1 second → a network call = months) | A loop making one network call per item (the N+1 pattern agents constantly generate) visibly dwarfing a *million* in-memory operations |
| 2 | **It worked until people showed up** | Growth shapes: constant, linear, pairwise work vs. a users slider | The learner's predicted "when does it cross one second?" is off by orders of magnitude — and the twin lesson that most apps never get there |
| 3 | **I refreshed and it's gone** | Where state lives: variable, localStorage, file, database — lifetime and visibility | The survival matrix: throw refresh / restart / second device / crash-mid-write at each home and watch what lives, dies, or half-dies |
| 4 | **Two people clicked at once** | Interleaving and the lost update | Two simulated users, read-modify-write on one counter, an overlap slider — the update vanishes in slow motion |
| 5 | **The customer got charged twice** | Partial failure, retries, idempotency | Kill the *response* on its way back; the operation succeeded, only the answer died; the innocent retry duplicates it |
| 6 | **The agent says it works** | Verification literacy: what tests do and don't prove; the edge-case genre (empty, one, many, duplicate, huge, malformed) | A suite the learner assembled passes — over a function still harboring a seeded bug. Tests prove the absence of *caught* bugs |

Module ordering is firm-ish; module 6 is the hardest to design as a
manipulable and the most important to this audience's daily loop, so its spec
gets drafted early even if it ships last.

## 7. Non-goals (binding)

- **No interview canon.** No sorting mechanics, tree rotations, or Big-O
  drills. That territory is well served elsewhere; it fails the
  decision-relevance test for this audience.
- **No backend, no accounts, no analytics.** The deployed artifact is fully
  static. All state (theme, calibration ledger) is local to the browser. The
  project about "where state lives" keeps its own state in the most honest
  place available.
- **No scale-worship.** We never imply every app needs distributed-systems
  armor. See §4, "teach restraint."
- **Not a coding course.** We teach judgment about systems, not syntax. The
  learner's agent writes the code; we make the learner worth listening to.

## 8. Technical commitments

- **Deployment constraint (binding).** The site builds to static assets and
  deploys to GitHub Pages via Actions. Any static host must work. A build
  step and frameworks are permitted if they serve the end aims; they are a
  means, never a feature. Stack selection is an open decision resolved by the
  substrate spec (see §11).
- **Substrate first.** Before module 1, the project stands up its shared
  foundation, each piece with a fixture page and tests:
  1. **App shell** — module registry, lesson sequencing, routing, search,
     theming, responsive layout.
  2. **Playback transport** — a single play/pause/step/seek/speed contract
     used by everything that animates, implemented once.
  3. **Simulation loop** — a continuous-time engine for living systems
     (modules 2, 4, 5), sharing the transport contract so playback UX stays
     uniform.
  4. **Predict** component — commit-a-guess UI plus the local calibration
     ledger (P3/P6).
  5. **Histogram** primitive with percentile markers — module 1 needs it;
     future tail-latency material will too.
  6. **Agent-questions card** component (P5) with copy-to-clipboard.
- **Modules may not modify the substrate.** Substrate changes require their
  own spec. This is the entropy guard: no module "improves" shared code ad
  hoc until nothing is shared.
- **Shell capabilities (binding):** deep-linkable state (every interesting
  configuration has a shareable URL), light/dark themes, keyboard-accessible
  controls, `prefers-reduced-motion` respected, usable on mobile.
  *Desirable, not binding:* offline/PWA support, embed mode for teachers.
- **Testing bar (binding):** a headless-browser harness loads every registered
  module and verifies it mounts without errors, renders, steps, and survives
  interaction with all its controls; the computational core of each module is
  pure and unit-tested for correctness (P4 depends on this); CI runs the full
  suite on every push. A module without tests does not merge.

## 9. Process (binding)

- **The spec is the contract.** Every module and every substrate change has a
  one-page spec, committed to `specs/` *before* build. Specs follow the
  template (separate document) and cite this charter's rule IDs.
- **Acceptance criteria are browser-verifiable.** Every criterion is checkable
  by using the running artifact for a few minutes. "The N+1 demo visibly
  dwarfs a million in-memory ops at default settings" is a criterion. "Code is
  clean" is a mood.
- **One session, one deliverable.** Each build session produces exactly one
  spec'd artifact, starting from a plan the human reviews before code is
  written. Fresh context each session; the repo's documents, not chat history,
  carry continuity.
- **Ambiguity is a stop condition.** If a spec is ambiguous or seems wrong,
  the agent stops and says so rather than resolving it silently. Every
  ambiguity surfaced is a defect in our spec-writing we want to know about.
- **This process is itself the experiment.** The project exists partly to test
  whether tight specs plus browser-level acceptance produce conforming builds
  with the human touching no code. Deviations from process are data; log them.

## 10. What success looks like

Primary, qualitative: a learner who finishes the season looks at an agent's
proposal and asks questions they could not have articulated before — at least
one per module's territory. The agent-questions cards are the visible proxy.

Secondary, observable in-product: the calibration ledger trends toward honest
("within range" rate rising across modules); lesson completion beats catalog
browsing; deep links get shared.

Vanity metrics (stars, traffic) are noted and ignored for design decisions.

## 11. Open decisions

- **Name.** "Groundwork" is a placeholder. Constraint: inviting to the
  audience in §2, zero interview-prep odor. Decide before the repo is public.
- **Stack.** Framework vs. vanilla, build step vs. none — resolved in the
  substrate spec against these criteria: static output (§8), fast first load,
  low maintenance burden over years, and buildability by agents (a stack
  agents know deeply is itself a feature of this project's process). The
  charter is deliberately silent beyond the constraints.
- **Calibration ledger scope for v1.** Full cross-module ledger vs. per-module
  tallies first. Leaning full (it's cheap: local storage + one component), but
  the substrate spec makes the call.
- **Module 3 fidelity.** How database-like must the "database" home be for the
  survival matrix to be honest (P4) without building a toy DB? Spec 003
  resolves this.

---

*Amendment history: none yet. Amend deliberately, in dedicated commits.*
