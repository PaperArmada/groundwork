import type { ModuleProps } from '../../core/moduleDef.ts';
import {
  COUNT_MAX,
  COUNT_MIN,
  readParams,
  SHAPES,
  writeParams,
  type Shape,
} from './core.ts';
import styles from './fixture.module.css';

export default function FixtureShell({ urlState, onStateChange }: ModuleProps) {
  const state = readParams(urlState);

  const update = (next: Partial<typeof state>) =>
    onStateChange(writeParams({ ...state, ...next }));

  return (
    <div className={styles.fixture}>
      <p>
        Shell checks: the controls below round-trip through the URL (copy the
        link, open a fresh tab, land here), the header toggles the theme, and
        the pulsing dot goes still when your device asks for reduced motion.
      </p>

      <div className={styles.controls}>
        <label>
          Shape
          <select
            value={state.shape}
            onChange={(e) => update({ shape: e.target.value as Shape })}
          >
            {SHAPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Count: {state.count}
          <input
            type="range"
            min={COUNT_MIN}
            max={COUNT_MAX}
            value={state.count}
            onChange={(e) => update({ count: Number(e.target.value) })}
          />
        </label>
      </div>

      <svg
        className={styles.stage}
        viewBox={`0 0 ${state.count * 24} 24`}
        role="img"
        aria-label={`${state.count} ${state.shape}s`}
      >
        {Array.from({ length: state.count }, (_, i) => {
          const cx = i * 24 + 12;
          if (state.shape === 'circle') {
            return (
              <circle key={i} cx={cx} cy="12" r="8" className={styles.shape} />
            );
          }
          if (state.shape === 'square') {
            return (
              <rect
                key={i}
                x={cx - 8}
                y="4"
                width="16"
                height="16"
                className={styles.shape}
              />
            );
          }
          return (
            <polygon
              key={i}
              points={`${cx},4 ${cx + 8},20 ${cx - 8},20`}
              className={styles.shape}
            />
          );
        })}
      </svg>

      <p className={styles.motionRow}>
        <span className={styles.pulse} aria-hidden="true" />
        This dot pulses — unless reduced motion is on.
      </p>
    </div>
  );
}
