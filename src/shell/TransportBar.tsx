import { useEffect, useReducer, type KeyboardEvent } from 'react';
import type { Transport } from '../core/transport.ts';
import styles from './TransportBar.module.css';

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

interface Props {
  transport: Transport;
  /** Normalized progress for the seek slider; required when seek is true. */
  progress?: number;
  speed?: number;
}

// The bar has no clock and no state of its own: every render is driven by
// the transport's subscription (000 §7 — what you see is what the engine
// is doing).
export function TransportBar({ transport, progress, speed }: Props) {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => transport.subscribe(rerender), [transport]);

  const { state, capabilities } = transport;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT') return; // slider owns its keys
    if (e.key === ' ' && target.tagName === 'BUTTON') return; // button click
    switch (e.key) {
      case ' ':
        transport.toggle();
        break;
      case 'ArrowRight':
        transport.stepForward();
        break;
      case 'ArrowLeft':
        if (capabilities.stepBack) transport.stepBack();
        break;
      case 'Home':
        transport.reset();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div
      className={styles.bar}
      role="group"
      aria-label="Playback controls"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <button type="button" onClick={() => transport.reset()}>
        Reset
      </button>
      {capabilities.stepBack && (
        <button
          type="button"
          aria-label="Step back"
          onClick={() => transport.stepBack()}
        >
          ⏮
        </button>
      )}
      <button
        type="button"
        className={styles.playPause}
        onClick={() => transport.toggle()}
      >
        {state === 'playing' ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        aria-label="Step forward"
        onClick={() => transport.stepForward()}
      >
        ⏭
      </button>
      {capabilities.seek && (
        <input
          className={styles.seek}
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress ?? 0}
          aria-label="Seek"
          onChange={(e) => transport.seek(Number(e.target.value))}
        />
      )}
      <label className={styles.speed}>
        Speed
        <select
          value={String(speed ?? 1)}
          onChange={(e) => transport.setSpeed(Number(e.target.value))}
        >
          {SPEEDS.map((s) => (
            <option key={s} value={String(s)}>
              {s}×
            </option>
          ))}
        </select>
      </label>
      <span className={styles.state} data-state={state}>
        {state}
      </span>
    </div>
  );
}
