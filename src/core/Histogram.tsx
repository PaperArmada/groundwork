// Streaming SVG histogram (000 S2.6, 003 S2). Every bar and marker derives
// from layoutBins over the actual sample array — nothing is passed in as a
// display-only prop (P4).

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { layoutBins } from './histogramLayout.ts';
import styles from './Histogram.module.css';

export interface HistogramHandle {
  add(sample: number): void;
  setSamples(samples: number[]): void;
}

interface HistogramProps {
  samples?: number[];
  scale?: 'linear' | 'log';
  bins?: number;
  percentiles?: (50 | 95 | 99)[];
  ariaLabel?: string;
  /** Unit suffix for min/max/marker labels, e.g. "ms". */
  unit?: string;
}

const W = 400;
const H = 130;
const PAD_BOTTOM = 18;
const PAD_TOP = 14;

function fmt(v: number, unit: string): string {
  const rounded =
    Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${rounded}${unit}`;
}

export const Histogram = forwardRef<HistogramHandle, HistogramProps>(
  function Histogram(
    { samples: samplesProp, scale = 'linear', bins, percentiles = [], ariaLabel, unit = '' },
    ref,
  ) {
    const [samples, setSamples] = useState<number[]>(samplesProp ?? []);

    // Controlled path: a new samples array from props replaces the set.
    useEffect(() => {
      if (samplesProp) setSamples(samplesProp);
    }, [samplesProp]);

    // Streaming path: add()/setSamples() feed the same state.
    useImperativeHandle(ref, () => ({
      add: (s: number) => setSamples((prev) => [...prev, s]),
      setSamples: (s: number[]) => setSamples([...s]),
    }));

    const layoutOpts: Parameters<typeof layoutBins>[1] = {
      scale,
      percentiles,
    };
    if (bins !== undefined) layoutOpts.bins = bins;
    const { bins: laid, marks } = layoutBins(samples, layoutOpts);

    if (laid.length === 0) {
      return <p className={styles.empty}>No samples yet.</p>;
    }

    const first = laid[0];
    const last = laid[laid.length - 1];
    const min = first ? first.x0 : 0;
    const max = last ? last.x1 : 1;
    const maxCount = Math.max(...laid.map((b) => b.count), 1);
    const toX = (v: number): number =>
      scale === 'log'
        ? ((Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min))) * W
        : ((v - min) / (max - min)) * W;
    const plotH = H - PAD_BOTTOM - PAD_TOP;

    return (
      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel ?? `Histogram of ${samples.length} samples`}
      >
        {laid.map((b, i) => {
          const x = toX(b.x0);
          const w = Math.max(1, toX(b.x1) - x - 1);
          const h = (b.count / maxCount) * plotH;
          return (
            <rect
              key={i}
              className={styles.bar}
              x={x}
              y={PAD_TOP + plotH - h}
              width={w}
              height={h}
            />
          );
        })}
        {marks.map((m) => (
          <g key={m.p}>
            <line
              className={styles.mark}
              x1={toX(m.value)}
              x2={toX(m.value)}
              y1={PAD_TOP - 4}
              y2={PAD_TOP + plotH}
            />
            <text
              className={styles.markLabel}
              x={Math.min(toX(m.value) + 3, W - 40)}
              y={PAD_TOP + 6}
            >
              p{m.p} {fmt(m.value, unit)}
            </text>
          </g>
        ))}
        <text className={styles.axisLabel} x={0} y={H - 4}>
          {fmt(min, unit)}
        </text>
        <text className={styles.axisLabel} x={W} y={H - 4} textAnchor="end">
          {fmt(max, unit)}
        </text>
      </svg>
    );
  },
);
