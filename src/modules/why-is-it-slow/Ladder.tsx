// Scene 1: the humanized timescale. The rungs are rendered from the same
// cost-model constants the race executes on (101 §7) — this is the
// simulator's price list, drawn to a log scale.

import { humanizeNs, ladderRungs } from './core.ts';
import styles from './scenes.module.css';

const W = 420;
const ROW_H = 34;

export function Ladder() {
  const rungs = ladderRungs();
  const maxLog = Math.log10(rungs[rungs.length - 1]?.ns ?? 1);
  const H = rungs.length * ROW_H + 8;

  return (
    <figure className={styles.ladderFigure}>
      <svg
        className={styles.ladder}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="The cost ladder, from one processor operation to an internet round trip"
      >
        {rungs.map((r, i) => {
          const y = i * ROW_H + 8;
          const w = 24 + (Math.log10(r.ns) / maxLog) * (W - 200);
          return (
            <g key={r.label}>
              <rect
                className={styles.rungBar}
                x={0}
                y={y + 14}
                width={w}
                height={10}
                rx={2}
              />
              <text className={styles.rungLabel} x={0} y={y + 9}>
                {r.label}
              </text>
              <text className={styles.rungValue} x={w + 8} y={y + 23}>
                {humanizeNs(r.ns)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className={styles.ladderCaption}>
        Bar lengths are to a compressed scale — each step down the ladder is
        roughly a hundred-fold jump. In real time the whole ladder spans
        about a billionth of a second to about a tenth of a second. These
        numbers are the price list the race below actually runs on.
      </figcaption>
    </figure>
  );
}
