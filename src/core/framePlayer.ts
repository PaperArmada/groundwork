// FramePlayer — the precomputed-frames Transport implementation (000 S2.3).
// Supports everything: stepBack and seek are both true.
//
// The timing math is the pure `advance` function below; the player is a thin
// stateful wrapper that feeds it elapsed wall-clock time. Tests drive
// `advance` and the player directly with a fake scheduler — no timers.

import {
  clampSpeed,
  SPEED_DEFAULT,
  type Transport,
  type TransportState,
} from './transport.ts';

/** Advance a playhead: elapsed real time is scaled by speed and clamped. */
export function advance(
  positionMs: number,
  elapsedMs: number,
  speed: number,
  totalMs: number,
): number {
  const next = positionMs + Math.max(0, elapsedMs) * speed;
  return Math.min(totalMs, Math.max(0, next));
}

/** Map a playhead position to a frame index. */
export function frameIndexAt(
  positionMs: number,
  frameMs: number,
  frameCount: number,
): number {
  if (frameCount === 0) return 0;
  const i = Math.floor(positionMs / frameMs);
  return Math.min(frameCount - 1, Math.max(0, i));
}

export interface Scheduler {
  request(cb: (nowMs: number) => void): number;
  cancel(id: number): void;
  now(): number;
}

const rafScheduler: Scheduler = {
  request: (cb) => requestAnimationFrame(cb),
  cancel: (id) => cancelAnimationFrame(id),
  now: () => performance.now(),
};

export interface FramePlayerOptions {
  /** Wall-clock duration of one frame at speed 1. */
  frameMs?: number;
  scheduler?: Scheduler;
}

export interface FramePlayer<F> extends Transport {
  getFrame(): F;
  getIndex(): number;
  /** Normalized progress in [0, 1]. */
  getProgress(): number;
  getSpeed(): number;
}

export function createFramePlayer<F>(
  frames: readonly F[],
  options: FramePlayerOptions = {},
): FramePlayer<F> {
  if (frames.length === 0) {
    throw new Error('FramePlayer needs at least one frame');
  }
  const frameMs = options.frameMs ?? 100;
  const scheduler = options.scheduler ?? rafScheduler;
  const totalMs = frames.length * frameMs;

  let state: TransportState = 'idle';
  let positionMs = 0;
  let speed = SPEED_DEFAULT;
  let rafId: number | null = null;
  let lastTickMs: number | null = null;
  const listeners = new Set<(t: Transport) => void>();

  function notify() {
    for (const fn of listeners) fn(player);
  }

  function stopLoop() {
    if (rafId !== null) {
      scheduler.cancel(rafId);
      rafId = null;
    }
    lastTickMs = null;
  }

  function tick(nowMs: number) {
    rafId = null;
    if (state !== 'playing') return;
    const elapsed = lastTickMs === null ? 0 : nowMs - lastTickMs;
    lastTickMs = nowMs;
    positionMs = advance(positionMs, elapsed, speed, totalMs);
    if (positionMs >= totalMs) {
      state = 'done';
      stopLoop();
    } else {
      rafId = scheduler.request(tick);
    }
    notify();
  }

  const player: FramePlayer<F> = {
    get state() {
      return state;
    },
    capabilities: { stepBack: true, seek: true },

    play() {
      if (state === 'playing') return;
      if (state === 'done') positionMs = 0; // §11 resolution: restart
      state = 'playing';
      lastTickMs = scheduler.now();
      rafId = scheduler.request(tick);
      notify();
    },
    pause() {
      if (state !== 'playing') return;
      state = 'paused';
      stopLoop();
      notify();
    },
    toggle() {
      if (state === 'playing') player.pause();
      else player.play();
    },
    stepForward() {
      if (state === 'playing') player.pause();
      const i = frameIndexAt(positionMs, frameMs, frames.length);
      positionMs = Math.min(totalMs - frameMs, (i + 1) * frameMs);
      if (state === 'idle' || state === 'done') state = 'paused';
      notify();
    },
    stepBack() {
      if (state === 'playing') player.pause();
      const i = frameIndexAt(positionMs, frameMs, frames.length);
      positionMs = Math.max(0, (i - 1) * frameMs);
      if (state === 'idle' || state === 'done') state = 'paused';
      notify();
    },
    seek(pos: number) {
      const p = Math.min(1, Math.max(0, pos));
      positionMs = p * (totalMs - frameMs);
      if (state !== 'playing') {
        state = 'paused';
      }
      notify();
    },
    setSpeed(mult: number) {
      speed = clampSpeed(mult);
      notify();
    },
    reset() {
      stopLoop();
      state = 'idle';
      positionMs = 0;
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    getFrame() {
      const frame = frames[frameIndexAt(positionMs, frameMs, frames.length)];
      if (frame === undefined) throw new Error('unreachable: empty frames');
      return frame;
    },
    getIndex() {
      return frameIndexAt(positionMs, frameMs, frames.length);
    },
    getProgress() {
      return frames.length <= 1
        ? 1
        : frameIndexAt(positionMs, frameMs, frames.length) /
            (frames.length - 1);
    },
    getSpeed() {
      return speed;
    },
  };

  return player;
}
