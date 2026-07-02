import { describe, expect, it } from 'vitest';
import { FRAME_COUNT, generateFrames } from './core.ts';

describe('generateFrames', () => {
  it('produces the requested number of frames, indexed in order', () => {
    const frames = generateFrames();
    expect(frames).toHaveLength(FRAME_COUNT);
    frames.forEach((f, i) => expect(f.i).toBe(i));
  });

  it('is deterministic', () => {
    expect(generateFrames()).toEqual(generateFrames());
  });

  it('keeps the ball inside the viewbox', () => {
    for (const f of generateFrames(500)) {
      expect(f.x).toBeGreaterThanOrEqual(0);
      expect(f.x).toBeLessThanOrEqual(100);
      expect(f.y).toBeGreaterThanOrEqual(0);
      expect(f.y).toBeLessThanOrEqual(100);
    }
  });

  it('actually moves — frames are not constant', () => {
    const frames = generateFrames();
    const first = frames[0];
    expect(frames.some((f) => f.x !== first?.x || f.y !== first?.y)).toBe(
      true,
    );
  });
});
