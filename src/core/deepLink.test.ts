import { describe, expect, it, vi } from 'vitest';
import { buildHash, debounce, parseHash } from './deepLink.ts';

describe('parseHash', () => {
  it('parses the catalog route', () => {
    expect(parseHash('#/').moduleId).toBe('');
    expect(parseHash('').moduleId).toBe('');
    expect(parseHash('#').moduleId).toBe('');
  });

  it('parses module id and params', () => {
    const p = parseHash('#/m/fixture-shell?shape=square&count=7');
    expect(p.moduleId).toBe('fixture-shell');
    expect(p.params.get('shape')).toBe('square');
    expect(p.params.get('count')).toBe('7');
  });

  it('treats unknown paths as catalog', () => {
    expect(parseHash('#/nope/deeper').moduleId).toBe('');
    expect(parseHash('#/m/').moduleId).toBe('');
  });
});

describe('buildHash', () => {
  it('round-trips with parseHash', () => {
    const params = new URLSearchParams({ users: '5000', seed: '42' });
    const hash = buildHash('why-is-it-slow', params);
    const back = parseHash(hash);
    expect(back.moduleId).toBe('why-is-it-slow');
    expect(back.params.get('users')).toBe('5000');
    expect(back.params.get('seed')).toBe('42');
  });

  it('omits ? when there are no params', () => {
    expect(buildHash('x', new URLSearchParams())).toBe('#/m/x');
    expect(buildHash('', new URLSearchParams())).toBe('#/');
  });
});

describe('debounce', () => {
  it('fires once with the last args after the wait', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const d = debounce(spy, 150);
    d(1);
    d(2);
    d(3);
    vi.advanceTimersByTime(149);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledExactlyOnceWith(3);
    vi.useRealTimers();
  });
});
