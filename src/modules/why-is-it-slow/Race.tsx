// Scene 2: two plans race on a shared timeline. Every number on screen —
// bars, counters, totals, histogram, labels — is a projection of the two
// executor event streams at the playhead instant (101 §7). Pausing the
// transport freezes all of it because nothing else moves it.

import { useEffect, useMemo, useReducer } from 'react';
import { createFramePlayer } from '../../core/framePlayer.ts';
import { Histogram } from '../../core/Histogram.tsx';
import { TransportBar } from '../../shell/TransportBar.tsx';
import {
  callSamplesMs,
  execute,
  formatRealNs,
  humanizeNs,
  planA,
  planB,
  progressAt,
  raceFrames,
  summarize,
  totalNs,
  type RunEvent,
} from './core.ts';
import {
  readRaceParams,
  useModuleUrl,
  writeRaceParams,
  type RaceParams,
} from './urlContext.ts';
import styles from './scenes.module.css';

const W = 440;
const LANE_H = 18;
const NOTICE_NS = 3e9; // ~3 s — "people notice"
const GIVE_UP_NS = 10e9; // ~10 s — "people give up"

const LAT_CHOICES: { value: RaceParams['lat']; label: string }[] = [
  { value: 20, label: 'fast wifi (20 ms)' },
  { value: 100, label: 'typical (100 ms)' },
  { value: 400, label: 'weak mobile (400 ms)' },
];

// log-position slider helpers
const toSlider = (v: number, min: number, max: number) =>
  (Math.log(v / min) / Math.log(max / min)) * 100;
const fromSlider = (pos: number, min: number, max: number) =>
  Math.round(min * Math.pow(max / min, pos / 100));

function Lane({
  events,
  tNs,
  domainNs,
  y,
}: {
  events: RunEvent[];
  tNs: number;
  domainNs: number;
  y: number;
}) {
  const toX = (ns: number) => (ns / domainNs) * W;
  // Per-event segments show the trips individually; past ~600 events the
  // segments would be subpixel, so draw the same data as one bar.
  const segmented = events.length <= 600;
  const visible = events.filter((e) => tNs > e.start);
  return (
    <g>
      {segmented ? (
        visible.map((e, i) => (
          <rect
            key={i}
            className={e.kind === 'network' ? styles.segNetwork : styles.segMemory}
            x={toX(e.start)}
            y={y}
            width={Math.max(
              0.5,
              toX(Math.min(tNs, e.start + e.duration)) - toX(e.start) - 0.4,
            )}
            height={LANE_H}
          />
        ))
      ) : (
        <rect
          className={styles.segNetwork}
          x={0}
          y={y}
          width={toX(Math.min(tNs, totalNs(events)))}
          height={LANE_H}
        />
      )}
    </g>
  );
}

export function Race() {
  const { urlState, onStateChange } = useModuleUrl();
  const params = readRaceParams(urlState);
  const { n, lat, ops, labels, seed } = params;

  const run = useMemo(() => {
    const latNs = lat * 1e6;
    const eventsA = execute(planA(ops), latNs, seed);
    const eventsB = execute(planB(n), latNs, seed + 1);
    const frames = raceFrames(totalNs(eventsA), totalNs(eventsB));
    return { eventsA, eventsB, frames };
  }, [n, lat, ops, seed]);

  const player = useMemo(
    () =>
      createFramePlayer(run.frames, {
        // one frame of sim time takes the same wall time at speed 1
        frameMs: Math.max(
          8,
          (run.frames[1] ?? 1e6) / 1e6,
        ),
      }),
    [run],
  );
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const off = player.subscribe(rerender);
    return () => {
      off();
      player.reset();
    };
  }, [player]);

  const tNs = player.getFrame();
  const progA = progressAt(run.eventsA, tNs);
  const progB = progressAt(run.eventsB, tNs);
  const sumA = summarize(run.eventsA);
  const sumB = summarize(run.eventsB);
  const fmt = labels === 'human' ? humanizeNs : formatRealNs;
  const domainNs = Math.max(totalNs(run.eventsB), totalNs(run.eventsA), GIVE_UP_NS * 1.1);
  const toX = (ns: number) => (ns / domainNs) * W;
  const samples = callSamplesMs(run.eventsB, tNs);

  const update = (next: Partial<RaceParams>) =>
    onStateChange(writeRaceParams(urlState, { ...params, ...next }));

  return (
    <div className={styles.race} data-scene="race">
      <div className={styles.planCards}>
        <div className={styles.planCard}>
          <h3>Plan A — one trip, then work in memory</h3>
          <code className={styles.planCode}>
            all = fetch(everything)
            <br />
            for each contact → look it up in all
          </code>
        </div>
        <div className={styles.planCard}>
          <h3>Plan B — one trip per contact</h3>
          <code className={styles.planCode}>
            contacts = fetch(list)
            <br />
            for each contact → await fetch(latest message)
          </code>
        </div>
      </div>

      <div className={styles.controls}>
        <label>
          Contacts: {n.toLocaleString('en-US')}
          <input
            type="range"
            min={0}
            max={100}
            value={toSlider(n, 1, 5000)}
            aria-label="Contacts"
            onChange={(e) => update({ n: fromSlider(Number(e.target.value), 1, 5000) })}
          />
        </label>
        <label>
          Connection speed
          <select
            value={String(lat)}
            onChange={(e) => update({ lat: Number(e.target.value) as RaceParams['lat'] })}
          >
            {LAT_CHOICES.map((c) => (
              <option key={c.value} value={String(c.value)}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Plan A in-memory work: {ops.toLocaleString('en-US')} operations
          <input
            type="range"
            min={0}
            max={100}
            value={toSlider(ops, 10_000, 10_000_000)}
            aria-label="Plan A in-memory work"
            onChange={(e) =>
              update({ ops: fromSlider(Number(e.target.value), 10_000, 10_000_000) })
            }
          />
        </label>
        <label className={styles.labelToggle}>
          <input
            type="checkbox"
            checked={labels === 'human'}
            onChange={(e) => update({ labels: e.target.checked ? 'human' : 'real' })}
          />
          humanized time (1 operation = 1 second)
        </label>
      </div>

      <svg
        className={styles.timeline}
        viewBox={`0 0 ${W} 108`}
        role="img"
        aria-label="Race timeline for Plan A and Plan B"
      >
        <text className={styles.laneLabel} x={0} y={16}>
          Plan A
        </text>
        <Lane events={run.eventsA} tNs={tNs} domainNs={domainNs} y={20} />
        <text className={styles.laneLabel} x={0} y={56}>
          Plan B
        </text>
        <Lane events={run.eventsB} tNs={tNs} domainNs={domainNs} y={60} />
        {[
          { ns: NOTICE_NS, label: '~3 s — people notice' },
          { ns: GIVE_UP_NS, label: '~10 s — people give up' },
        ].map((band) => (
          <g key={band.ns}>
            <line
              className={styles.band}
              x1={toX(band.ns)}
              x2={toX(band.ns)}
              y1={10}
              y2={84}
            />
            <text
              className={styles.bandLabel}
              x={toX(band.ns) + 3}
              y={94}
            >
              {band.label}
            </text>
          </g>
        ))}
        <line className={styles.playhead} x1={toX(tNs)} x2={toX(tNs)} y1={8} y2={86} />
      </svg>

      <div className={styles.counters}>
        <p className={styles.counter}>
          <strong>Plan A:</strong>{' '}
          {progA.opsDone.toLocaleString('en-US')} of{' '}
          {sumA.memOps.toLocaleString('en-US')} in-memory operations ·{' '}
          {progA.callsDone} of {sumA.trips} trip{sumA.trips === 1 ? '' : 's'}
          {progA.done && (
            <>
              {' '}
              — <strong>finished in {fmt(sumA.totalNs)}</strong>
            </>
          )}
        </p>
        <p className={styles.counter}>
          <strong>Plan B:</strong> {progB.callsDone} of {sumB.trips} trips
          {progB.done && (
            <>
              {' '}
              — <strong>finished in {fmt(sumB.totalNs)}</strong>
            </>
          )}
        </p>
      </div>

      <TransportBar
        transport={player}
        progress={player.getProgress()}
        speed={player.getSpeed()}
      />

      <div className={styles.breakdown}>
        <p>
          Plan A: {sumA.trips} trip ({fmt(sumA.tripNs)}) +{' '}
          {sumA.memOps.toLocaleString('en-US')} in-memory operations (
          {fmt(sumA.memNs)}) → {fmt(sumA.totalNs)} total
        </p>
        <p>
          Plan B: {sumB.trips} trips ({fmt(sumB.tripNs)}) → {fmt(sumB.totalNs)}{' '}
          total
        </p>
      </div>

      {samples.length > 0 && (
        <figure className={styles.histFigure}>
          <figcaption>
            Every network call this run has made so far, by how long it took.
            No two waits are identical — the marks show the middle call (p50)
            and the slow tail (p95).
          </figcaption>
          <Histogram
            samples={samples}
            percentiles={[50, 95]}
            unit=" ms"
            ariaLabel="How long each network call took"
          />
        </figure>
      )}
    </div>
  );
}
