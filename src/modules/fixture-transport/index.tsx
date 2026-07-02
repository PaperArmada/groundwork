import { useEffect, useReducer, useState } from 'react';
import { createFramePlayer } from '../../core/framePlayer.ts';
import type { ModuleProps } from '../../core/moduleDef.ts';
import { TransportBar } from '../../shell/TransportBar.tsx';
import { generateFrames } from './core.ts';
import styles from './fixture.module.css';

export default function FixtureTransport(_props: ModuleProps) {
  const [player] = useState(() => createFramePlayer(generateFrames()));
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const off = player.subscribe(rerender);
    return () => {
      off();
      player.reset();
    };
  }, [player]);

  const frame = player.getFrame();

  return (
    <div className={styles.fixture}>
      <p>
        Sixty precomputed frames of a bouncing ball, driven by FramePlayer.
        Every control below talks to the engine; the picture is whatever the
        engine says.
      </p>
      <svg
        className={styles.stage}
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Ball at frame ${frame.i + 1} of 60`}
      >
        <rect
          x="1"
          y="1"
          width="98"
          height="98"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.3"
        />
        <circle cx={frame.x} cy={frame.y} r="6" className={styles.ball} />
      </svg>
      <p className={styles.readout}>
        frame {frame.i + 1} / 60 · speed {player.getSpeed()}×
      </p>
      <TransportBar
        transport={player}
        progress={player.getProgress()}
        speed={player.getSpeed()}
      />
      <p className={styles.hint}>
        Keyboard, with the bar focused: Space plays/pauses, ←/→ step, Home
        resets.
      </p>
    </div>
  );
}
