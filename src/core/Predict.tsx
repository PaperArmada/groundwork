// Predict-then-reveal (P3), specs/000 S2.4 + 002 S2. Gating is structural:
// children are absent from the DOM until commit, not hidden with CSS.

import { useId, useState, type ReactNode } from 'react';
import { ledger, type PredictionRecord } from './ledger.ts';
import styles from './Predict.module.css';

export interface RangeGuess {
  lo: number;
  hi: number;
}

interface PredictProps {
  /** Stable `${moduleId}.${predictionId}` per 000 S2.4. */
  id: string;
  kind: PredictionRecord['kind'];
  prompt: string;
  /** choice: the choices; order: the items in starting order. */
  options?: string[];
  actual: unknown;
  /** Tolerance is the module spec's call; the ledger stores the verdict. */
  judge: (guess: unknown, actual: unknown) => boolean;
  /** Optional plain-speech rendering of the actual value for the reveal. */
  formatActual?: (actual: unknown) => string;
  children?: ReactNode;
}

function formatValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(' → ');
  if (v !== null && typeof v === 'object' && 'lo' in v && 'hi' in v) {
    const r = v as RangeGuess;
    return `${r.lo} to ${r.hi}`;
  }
  return String(v);
}

export function Predict({
  id,
  kind,
  prompt,
  options = [],
  actual,
  judge,
  formatActual,
  children,
}: PredictProps) {
  const inputId = useId();
  const [committed, setCommitted] = useState<PredictionRecord | null>(null);
  const [numberText, setNumberText] = useState('');
  const [loText, setLoText] = useState('');
  const [hiText, setHiText] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const [order, setOrder] = useState(options);

  const guess = ((): unknown => {
    switch (kind) {
      case 'number':
        return numberText === '' ? null : Number(numberText);
      case 'range': {
        if (loText === '' || hiText === '') return null;
        const lo = Number(loText);
        const hi = Number(hiText);
        return Number.isFinite(lo) && Number.isFinite(hi) && lo <= hi
          ? { lo, hi }
          : null;
      }
      case 'choice':
        return choice;
      case 'order':
        return order;
    }
  })();

  const valid =
    guess !== null && (kind !== 'number' || Number.isFinite(guess as number));

  function commit() {
    if (!valid) return;
    const record = ledger.record({
      id,
      moduleId: id.split('.')[0] ?? id,
      kind,
      guess,
      actual,
      withinRange: judge(guess, actual),
    });
    setCommitted(record);
  }

  function reAnswer() {
    setCommitted(null);
    setNumberText('');
    setLoText('');
    setHiText('');
    setChoice(null);
    setOrder(options);
  }

  function move(i: number, delta: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev];
      const j = i + delta;
      const a = next[i];
      const b = next[j];
      if (a === undefined || b === undefined) return prev;
      next[i] = b;
      next[j] = a;
      return next;
    });
  }

  return (
    <section className={styles.predict} aria-label="Prediction">
      <p className={styles.prompt}>{prompt}</p>

      {committed === null ? (
        <div className={styles.form}>
          {kind === 'number' && (
            <input
              type="number"
              aria-label="Your guess"
              value={numberText}
              onChange={(e) => setNumberText(e.target.value)}
            />
          )}
          {kind === 'range' && (
            <div className={styles.rangeRow}>
              <label htmlFor={`${inputId}-lo`}>from</label>
              <input
                id={`${inputId}-lo`}
                type="number"
                value={loText}
                onChange={(e) => setLoText(e.target.value)}
              />
              <label htmlFor={`${inputId}-hi`}>to</label>
              <input
                id={`${inputId}-hi`}
                type="number"
                value={hiText}
                onChange={(e) => setHiText(e.target.value)}
              />
            </div>
          )}
          {kind === 'choice' && (
            <div className={styles.choices} role="radiogroup" aria-label={prompt}>
              {options.map((opt) => (
                <label key={opt} className={styles.choice}>
                  <input
                    type="radio"
                    name={inputId}
                    checked={choice === opt}
                    onChange={() => setChoice(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
          {kind === 'order' && (
            <ol className={styles.orderList}>
              {order.map((item, i) => (
                <li key={item} className={styles.orderItem}>
                  <span>{item}</span>
                  <span className={styles.orderButtons}>
                    <button
                      type="button"
                      aria-label={`Move ${item} up`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${item} down`}
                      disabled={i === order.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      ↓
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <button
            type="button"
            className={styles.commit}
            disabled={!valid}
            onClick={commit}
          >
            Lock in my guess
          </button>
        </div>
      ) : (
        <div className={styles.reveal}>
          <p className={styles.verdict}>
            You said <strong>{formatValue(committed.guess)}</strong>. The
            answer:{' '}
            <strong>
              {formatActual ? formatActual(actual) : formatValue(actual)}
            </strong>
            .{' '}
            <span
              className={
                committed.withinRange ? styles.within : styles.outside
              }
            >
              {committed.withinRange ? 'Within range.' : 'Outside the range.'}
            </span>
          </p>
          {children}
          <button type="button" className={styles.again} onClick={reAnswer}>
            Answer again (your first answer is the one that counts)
          </button>
        </div>
      )}
    </section>
  );
}
