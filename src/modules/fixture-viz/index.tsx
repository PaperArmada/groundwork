import { useMemo, useRef, useState } from 'react';
import { AgentQuestions } from '../../core/AgentQuestions.tsx';
import { Histogram, type HistogramHandle } from '../../core/Histogram.tsx';
import type { ModuleProps } from '../../core/moduleDef.ts';
import { createSkewedGenerator, KNOWN_SET, KNOWN_SET_P50 } from './core.ts';
import styles from './fixture.module.css';

const PERCENTILES = [50, 95, 99] as const;

export default function FixtureViz({ urlState, onStateChange }: ModuleProps) {
  const seed = Number(urlState.get('seed') ?? '1') || 1;
  const scale = urlState.get('scale') === 'log' ? 'log' : 'linear';
  const generator = useMemo(() => createSkewedGenerator(seed), [seed]);
  const histogram = useRef<HistogramHandle>(null);
  const [fed, setFed] = useState(0);
  const [shown, setShown] = useState<(50 | 95 | 99)[]>([50, 95]);

  function feed(count: number) {
    for (let i = 0; i < count; i++) histogram.current?.add(generator());
    setFed((n) => n + count);
  }

  function loadKnownSet() {
    histogram.current?.setSamples(KNOWN_SET);
    setFed(KNOWN_SET.length);
  }

  function setScale(next: 'linear' | 'log') {
    const params = new URLSearchParams(urlState);
    if (next === 'linear') params.delete('scale');
    else params.set('scale', next);
    if (seed !== 1) params.set('seed', String(seed));
    onStateChange(params);
  }

  function togglePercentile(p: 50 | 95 | 99) {
    setShown((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p].sort((a, b) => a - b),
    );
  }

  return (
    <div className={styles.fixture}>
      <p>
        A seeded, skewed sample source feeding the histogram through its real
        streaming path. The known set is the numbers 1 to 100 — its p50
        marker lands at exactly {KNOWN_SET_P50}.
      </p>

      <div className={styles.controls}>
        <button type="button" onClick={() => feed(1)}>
          +1 sample
        </button>
        <button type="button" onClick={() => feed(100)}>
          +100 samples
        </button>
        <button type="button" onClick={loadKnownSet}>
          Load known set
        </button>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={scale === 'log'}
            onChange={(e) => setScale(e.target.checked ? 'log' : 'linear')}
          />
          log scale
        </label>
        {PERCENTILES.map((p) => (
          <label key={p} className={styles.toggle}>
            <input
              type="checkbox"
              checked={shown.includes(p)}
              onChange={() => togglePercentile(p)}
            />
            p{p}
          </label>
        ))}
      </div>

      <p className={styles.readout}>samples fed: {fed}</p>

      <Histogram
        ref={histogram}
        scale={scale}
        percentiles={shown}
        ariaLabel="Fixture histogram"
      />

      <AgentQuestions
        questions={[
          'Dummy question one for the card fixture?',
          'Dummy question two, slightly longer, for the card fixture?',
          'Dummy question three for the card fixture?',
        ]}
      />
    </div>
  );
}
