# Spec 101 — Why is it slow?

| Field | Value |
|---|---|
| **Type** | Module |
| **Status** | Ready to build |
| **Depends on** | 000 (shell, transport, deep links), 002 (Predict + ledger), 003 (Histogram, agent-questions card) |
| **Charter rules in play** | P1–P7, §4 all corollaries |

## 1. Purpose

Install the cost hierarchy — the single fastest plausibility check in
software. A learner who has this model can look at an agent's plan and ask
"how many trips?" within seconds, which catches the most common performance
defect agents generate (a network/database call inside a loop) before it
ships. Decision trained: *count trips before counting lines.*

## 2. The felt problem (P1)

> You asked your agent for a page showing your 50 contacts, each with their
> latest message. It built it. It works. It also takes six seconds to load,
> and you can feel every one of them.
>
> The code looks tiny — a loop, a few lines. Your laptop plays 4K video
> without breaking a sweat. How is a list of fifty names *slow*?

## 3. Target misconception

"Each line of code takes about the same tiny amount of time, so slowness
means the computer is doing *a lot*. Short program → fast program."

Correction installed: cost is dominated by *what kind* of operation — chiefly
how far the data travels — not how many lines run. One trip across a network
outweighs millions of in-memory operations.

## 4. The experience

Two scenes in one scrolling lesson (MDX prose between): **the ladder**, then
**the race**.

**Scene 1 — the ladder.** The humanized timescale: *if one CPU operation took
one second*, how long does everything else take? Five rungs, revealed after
Prediction 1: CPU operation → **1 second**; read from memory → **~2
minutes**; read from SSD → **~1 day**; call to a server in the same building
→ **~1–2 weeks**; round trip across the internet → **~3 years**. The rungs
are rendered from the same cost-model constants the race executes on (§7) —
the ladder *is* the simulator's price list, and says so.

**Scene 2 — the race.** The contacts page from §2, as two plans an agent
might propose, executed side by side on a shared timeline:

- **Plan A:** one network call fetches everything, then a per-item in-memory
  loop (defaults: 1,000,000 total in-memory operations — the counter shows
  the millions ticking).
- **Plan B:** one call for the contact list, then *one network call per
  contact inside the loop* — written on screen the way agents actually write
  it (`for each contact → await fetch(...)`), executed sequentially.

**Manipulables.**

| Variable | Range | Default |
|---|---|---|
| Contacts (n) | 1–5,000, log slider | 50 |
| Network latency preset | fast wifi 20 ms · typical 100 ms · weak mobile 400 ms | typical 100 ms |
| Plan A in-memory work | 10k–10M total operations, log slider | 1M |
| Time labels | real ms ↔ humanized | real |

**The engineered aha.** At defaults, run the race: Plan B finishes around
five-plus seconds (51 sequential ~100 ms calls, jitter included) while Plan
A — doing a *million* in-memory operations — finishes in roughly a tenth of a
second. Then two twists from the same screen: drag Plan A's work to 10M ops
and watch its bar barely move; flip to humanized labels and read the same
race as *"a million operations ≈ 12 days; one internet round trip ≈ 3
years."* Two fixed bands on the timeline mark **~3 s — "people notice"** and
**~10 s — "people give up"**: at defaults Plan B lands past the first band;
dragging n to 1,000 sends it past the second while Plan A stays under a
second.

**Prediction moments (P3).**

1. Before the ladder reveal: *"If one CPU operation took 1 second, how long
   would one round trip across the internet take?"* — choice buckets: about
   a minute / hours / days / months / **years**. Within range = "years."
2. Before the race: *"Plan A does a million operations in memory. Plan B
   makes 51 small network calls. Which loads first?"* — A by a lot (10×+) /
   roughly even / B by a lot. Within range = "A by a lot."

**Failure mode (§4).** The n slider is the failure lever: the learner grows
their own app from 50 contacts to 1,000 and watches Plan B cross the
give-up band — the "it worked in the demo" collapse, self-inflicted.

**Restraint note (§4).** Closing prose states plainly: at 50 items even Plan
B is *survivable* — sluggish, not broken — and a small app with one user does
not need caching layers or clever infrastructure; it needs the right number
of trips. Also acknowledges, without simulating it, that calls can be made in
parallel ("helps, has its own limits, later module").

## 5. Terminology gate (P2)

| Term | Earned by |
|---|---|
| round trip | the ladder's top rung — the learner has just seen the years |
| latency | the per-call strip/histogram — calls visibly vary; this is the word for the wait |
| the N+1 pattern | after the race — "what you just watched has a name; it's one of the most common things agents build by accident" |

No other jargon appears. "Network call" and "in memory" are treated as plain
speech.

## 6. Agent-questions card (P5)

1. "How many separate network or database calls happen for one page load or
   click? Does that number grow with my data?"
2. "Which parts of this run in memory, and which cross the network or touch
   a disk?"
3. "What happens to load time when this list grows from 50 items to 5,000?"

## 7. Simulation truth (P4)

`core.ts` owns: (a) the **cost model** — named constants (approximate,
napkin-class, commented with the real-world figures they round) shared by
ladder and race; (b) **plan builders** — `planA(n, ops)` and `planB(n)`
produce explicit operation sequences (Plan B's contains exactly n+1 network
operations); (c) a seeded **executor** that walks a plan's operations,
sampling per-call network jitter, and emits one event stream
`{op, kind, start, duration}`. Timeline, totals, tick counters, the per-call
histogram (p50/p95 markers), and humanized labels are all *projections of
that one stream* — pausing the transport freezes every view at the same
instant. The RNG seed rides in the deep link, so a shared URL replays the
identical race.

Unit tests: plan structure (Plan B emits n+1 network ops), totals equal the
event-stream sum, humanized conversion preserves exact ratios, executor is
deterministic under a fixed seed.

**Forbidden shortcut:** computing plan totals with closed-form arithmetic and
drawing a timeline to match, or tuning constants until the race "looks
dramatic." The real ratios are dramatic enough; the drama must be emitted,
not painted.

## 8. Deep-link state

`#/m/why-is-it-slow?scene=ladder|race&n=50&lat=100&ops=1000000&labels=real|human&seed=<int>`
— the aha configuration is the defaults with `scene=race`; a fresh tab given
any copied link replays the identical run (seed included).

## 9. Acceptance criteria

1. Aha recipe reproduces at defaults: race → Plan B total ≥ 20× Plan A;
   Plan A under ~0.3 s simulated, Plan B ~5 s or more, visibly past the
   ~3 s "people notice" band.
2. Both predictions appear before their reveals, cannot be skipped into, and
   record to the ledger (visible in the shell summary afterward).
3. Walking the lesson as a learner: "round trip," "latency," and "N+1" each
   appear only after their §5 earning interaction; no other jargon anywhere.
4. Raising Plan A's work 1M → 10M leaves its bar visibly near-unchanged
   while its operation counter shows the tenfold work.
5. Dragging n to 1,000 at defaults pushes Plan B past the ~10 s "people give
   up" band; Plan A stays under ~1 s.
6. Humanized toggle relabels the same events at exact ratio (a ~100 ms call
   reads as ~3 years; 1M ops read as ~12 days).
7. Pausing mid-race freezes timeline, counters, totals, and histogram at a
   consistent instant; stepping advances all together.
8. Per-call histogram shows this run's network calls with p50/p95 markers
   and visible spread.
9. Agent-questions card renders §6 verbatim; copy works.
10. Copied deep link mid-configuration reproduces the identical race
    (same seed) in a fresh tab.

## 10. Out of scope

**Plan C — parallel requests.** Deliberately excluded from this module: an
in-module parallel "fix" would reframe the lesson as *parallelize* rather
than *count trips*, and honest parallel simulation requires concurrency caps
and tail behavior (a parallel page completes at the max of n latency draws) —
module-sized machinery. Scheduled, not dodged: **candidate module "The
slowest straggler"** (parallelism, connection limits, tail latency) inherits
it; the restraint note acknowledges parallelism in one sentence. Also out:
caching, CDNs, batching APIs, pagination mechanics. Databases as distinct
from network calls (a database call is "a trip to another machine" here).
Real network measurement of the learner's connection. Any backend.

## 11. Open questions

None. Three items resolved by owner sign-off (2026-07-02): **Plan B
sequential-only**, with parallelism scheduled into the named follow-up
candidate (§10); **prediction 1 strict tolerance** — exact bucket only;
**two timeline bands** — ~3 s "people notice" and ~10 s "people give up"
(§4, criteria 1 and 5 updated to match).
