import { describe, expect, it } from 'vitest';
import {
  advance,
  createFramePlayer,
  frameIndexAt,
  type Scheduler,
} from './framePlayer.ts';

describe('advance', () => {
  it('moves by elapsed × speed', () => {
    expect(advance(0, 100, 1, 1000)).toBe(100);
    expect(advance(100, 100, 2, 1000)).toBe(300);
    expect(advance(0, 100, 0.25, 1000)).toBe(25);
  });

  it('clamps to [0, total]', () => {
    expect(advance(950, 100, 1, 1000)).toBe(1000);
    expect(advance(0, -50, 1, 1000)).toBe(0); // negative elapsed ignored
  });
});

describe('frameIndexAt', () => {
  it('maps position to frame index, clamped', () => {
    expect(frameIndexAt(0, 100, 10)).toBe(0);
    expect(frameIndexAt(99, 100, 10)).toBe(0);
    expect(frameIndexAt(100, 100, 10)).toBe(1);
    expect(frameIndexAt(1000, 100, 10)).toBe(9); // end of run → last frame
  });
});

/** Manual scheduler: ticks fire only when the test calls step(dt). */
function fakeScheduler(): Scheduler & { step(dtMs: number): void } {
  let now = 0;
  let pending: ((t: number) => void) | null = null;
  return {
    request(cb) {
      pending = cb;
      return 1;
    },
    cancel() {
      pending = null;
    },
    now: () => now,
    step(dtMs: number) {
      now += dtMs;
      const cb = pending;
      pending = null;
      if (cb) cb(now);
    },
  };
}

const frames = Array.from({ length: 10 }, (_, i) => i);

describe('createFramePlayer', () => {
  it('starts idle at frame 0 with full capabilities', () => {
    const p = createFramePlayer(frames, { scheduler: fakeScheduler() });
    expect(p.state).toBe('idle');
    expect(p.getIndex()).toBe(0);
    expect(p.capabilities).toEqual({ stepBack: true, seek: true });
  });

  it('plays through frames in real time and ends done', () => {
    const s = fakeScheduler();
    const p = createFramePlayer(frames, { frameMs: 100, scheduler: s });
    p.play();
    expect(p.state).toBe('playing');
    s.step(250);
    expect(p.getIndex()).toBe(2);
    for (let i = 0; i < 20; i++) s.step(100);
    expect(p.state).toBe('done');
    expect(p.getIndex()).toBe(9);
  });

  it('speed scales consumption of wall-clock time', () => {
    const s = fakeScheduler();
    const p = createFramePlayer(frames, { frameMs: 100, scheduler: s });
    p.setSpeed(4);
    p.play();
    s.step(100); // 100ms × 4 = 400ms of playhead
    expect(p.getIndex()).toBe(4);
  });

  it('clamps speed to [0.25, 4]', () => {
    const p = createFramePlayer(frames, { scheduler: fakeScheduler() });
    p.setSpeed(100);
    expect(p.getSpeed()).toBe(4);
    p.setSpeed(0);
    expect(p.getSpeed()).toBe(0.25);
  });

  it('pause freezes position; play resumes without a jump', () => {
    const s = fakeScheduler();
    const p = createFramePlayer(frames, { frameMs: 100, scheduler: s });
    p.play();
    s.step(150);
    p.pause();
    const i = p.getIndex();
    s.step(5000); // wall clock passes while paused
    expect(p.getIndex()).toBe(i);
    p.play();
    s.step(0); // first tick after resume consumes no elapsed time
    expect(p.getIndex()).toBe(i);
  });

  it('steps forward and back one frame while paused', () => {
    const p = createFramePlayer(frames, { scheduler: fakeScheduler() });
    p.stepForward();
    p.stepForward();
    expect(p.getIndex()).toBe(2);
    expect(p.state).toBe('paused');
    p.stepBack();
    expect(p.getIndex()).toBe(1);
    p.stepBack();
    p.stepBack(); // clamped at 0
    expect(p.getIndex()).toBe(0);
  });

  it('seek takes normalized [0,1] and clamps', () => {
    const p = createFramePlayer(frames, { scheduler: fakeScheduler() });
    p.seek(0.5);
    expect(p.getIndex()).toBe(4);
    p.seek(1);
    expect(p.getIndex()).toBe(9);
    p.seek(-3);
    expect(p.getIndex()).toBe(0);
    expect(p.state).toBe('paused');
  });

  it('play from done restarts from frame 0', () => {
    const s = fakeScheduler();
    const p = createFramePlayer(frames, { frameMs: 100, scheduler: s });
    p.play();
    for (let i = 0; i < 20; i++) s.step(100);
    expect(p.state).toBe('done');
    p.play();
    expect(p.state).toBe('playing');
    s.step(0);
    expect(p.getIndex()).toBe(0);
  });

  it('reset returns to idle frame 0 and stops the loop', () => {
    const s = fakeScheduler();
    const p = createFramePlayer(frames, { frameMs: 100, scheduler: s });
    p.play();
    s.step(300);
    p.reset();
    expect(p.state).toBe('idle');
    expect(p.getIndex()).toBe(0);
    s.step(1000); // no pending tick should move anything
    expect(p.getIndex()).toBe(0);
  });

  it('notifies subscribers on every change; unsubscribe works', () => {
    const s = fakeScheduler();
    const p = createFramePlayer(frames, { scheduler: s });
    let calls = 0;
    const off = p.subscribe(() => calls++);
    p.play();
    p.pause();
    expect(calls).toBe(2);
    off();
    p.play();
    expect(calls).toBe(2);
  });
});
