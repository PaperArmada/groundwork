# Spec Template

*Lives at `specs/TEMPLATE.md`. Copy to `specs/NNN-short-name.md`, fill, delete
the italic guidance. One spec = one build session's deliverable (DESIGN.md §9).
A spec that can't fit the one-deliverable rule is two specs.*

*Two types share this file: **Module** specs use every section; **Substrate**
specs replace §§2–6 with §S1–S3 and skip what doesn't apply. Brevity is a
feature: if a section exceeds ~10 lines, the spec is doing design work that
belongs in the build plan.*

---

# Spec NNN — Title

| Field | Value |
|---|---|
| **Type** | Module / Substrate |
| **Status** | Draft → Ready to build → Built → Accepted |
| **Depends on** | spec numbers this consumes (e.g., 000) |
| **Charter rules in play** | e.g., P1–P7, §4 failure-forward, §8 testing bar |

*Status gates: a spec is **Ready to build** only when §11 is empty or every
remaining item is explicitly marked "accepted as-is." A build session starts
only from Ready. **Accepted** means every criterion in §9 passed in the
browser, checked by a human.*

## 1. Purpose

*Two or three sentences. For a module: the decision this trains, and why it
passes the decision-relevance test (DESIGN.md §4) — what will the learner
evaluate differently within seconds? For substrate: the capability provided
and which specs consume it.*

---

*Module sections:*

## 2. The felt problem (P1)

*The opening scenario, written out — close to verbatim what the learner will
read. It must be a moment they have plausibly lived, in their language. No
terms.*

## 3. Target misconception

*The specific wrong belief this module corrects, stated the way the learner
would say it. E.g., "The computer does things in order, so my code can't
overlap with itself." One misconception per module; a second one is scope
creep.*

## 4. The experience

**Manipulables.** *A table: variable, range, default. Defaults matter — the
aha must be reachable from defaults in a few interactions.*

| Variable | Range | Default |
|---|---|---|
| | | |

**The engineered aha.** *What the learner does, what they see, and the exact
configuration that produces it. This is the module's payload; write it as a
reproducible recipe, because §9 will test it as one.*

**Prediction moments (P3).** *Each one: the question posed, the answer format
(number, range, ordering, multiple choice), and what counts as "within range"
for the calibration ledger.*

**Failure mode (§4).** *What the learner can break, saturate, race, or catch
lying — and how they trigger it.*

**Restraint note (§4).** *Where the module says "this usually doesn't
matter" — the honest boundary that lets learners veto agent over-engineering.*

## 5. Terminology gate (P2)

*Every technical term the module introduces, each paired with the interaction
that precedes it. A term with no preceding interaction is a spec defect.*

| Term | Earned by |
|---|---|
| | |

## 6. Agent-questions card (P5)

*The two or three exact copyable questions. These are content, not
implementation — the human writes them, verbatim, here.*

---

*Substrate sections (replace §§2–6):*

## S1. Capability & consumers

*What this provides, and which module specs (by number) will consume it.
Substrate with no named consumer is speculative and does not get built.*

## S2. Contract

*The interface other code programs against — names, inputs, outputs,
events — at the level of a README for the component, not an implementation.
If the transport contract, ledger schema, or URL-state format is decided
here, write it down here; downstream specs cite it.*

## S3. Fixture

*The fixture page that exercises this primitive in isolation: what it shows,
what interacting with it should demonstrate. Fixtures are how substrate stays
browser-verifiable (§9 applies to them too).*

---

*All specs:*

## 7. Simulation truth (P4)

*What actually computes the displayed outcomes. Name the pure, unit-testable
core (functions/data in, frames/results out) and state what would count as
faking it — the forbidden shortcut an implementer might be tempted by. E.g.,
"the latency histogram is populated by the simulated request timings, never by
sampling a hand-tuned distribution."*

## 8. Deep-link state

*What's encoded in the URL so any interesting configuration is shareable —
including the aha configuration from §4.*

## 9. Acceptance criteria

*Numbered. Every criterion checkable by a human using the running artifact in
the browser within a few minutes — no code reading required. Always include:*

1. *The aha recipe from §4 reproduces at default settings.*
2. *Each prediction moment appears before its reveal and records to the
   ledger.* (modules)
3. *No term precedes its earning interaction (walk the module as a learner).*
   (modules)
4. *The agent-questions card renders with the §6 text and copies correctly.*
   (modules)
5. *The deep link from §8 restores the aha configuration in a fresh tab.*
6. *Criteria specific to this spec: observable numbers, visible contrasts,
   thresholds — "X visibly dwarfs Y at defaults," not "X is performant."*

*Plus the standing bar (not restated per spec, but checked): smoke harness
passes, pure core has correctness tests, CI green (DESIGN.md §8).*

## 10. Out of scope

*What this spec deliberately does not include, especially adjacent-plausible
features an implementer might helpfully add. Name them to forbid them.*

## 11. Open questions

*Anything unresolved. This section must be empty — or every item marked
"accepted as-is" — before Status moves to Ready to build. During build,
new ambiguity reopens this section and pauses work (DESIGN.md §9).*
