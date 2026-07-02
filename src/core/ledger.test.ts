import { describe, expect, it } from 'vitest';
import { createLedger, LEDGER_STORAGE_KEY, type StorageLike } from './ledger.ts';

function fakeStorage(): StorageLike & { dump(): string | null } {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    dump: () => map.get(LEDGER_STORAGE_KEY) ?? null,
  };
}

const entry = (id: string, withinRange: boolean) => ({
  id,
  moduleId: id.split('.')[0] ?? '',
  kind: 'number' as const,
  guess: 5,
  actual: 7,
  withinRange,
});

describe('ledger', () => {
  it('round-trips records through storage', () => {
    const storage = fakeStorage();
    const l = createLedger(storage);
    l.record(entry('m.p1', true));
    expect(JSON.parse(storage.dump() ?? '')).toHaveLength(1);
    // a fresh ledger over the same storage sees the same records
    const l2 = createLedger(storage);
    expect(l2.listAll()).toHaveLength(1);
    expect(l2.listByModule('m')).toHaveLength(1);
    expect(l2.listByModule('other')).toHaveLength(0);
  });

  it('increments attempt per prediction id', () => {
    const l = createLedger(fakeStorage());
    expect(l.record(entry('m.p1', true)).attempt).toBe(1);
    expect(l.record(entry('m.p1', false)).attempt).toBe(2);
    expect(l.record(entry('m.p2', false)).attempt).toBe(1);
    expect(l.attemptsFor('m.p1')).toBe(2);
  });

  it('summary counts first commitments only (P6)', () => {
    const l = createLedger(fakeStorage());
    l.record(entry('m.p1', false)); // first: miss
    l.record(entry('m.p1', true)); // re-take: hit — must not count
    l.record(entry('m.p2', true)); // first: hit
    expect(l.summary()).toEqual({ total: 2, withinRange: 1, pct: 50 });
  });

  it('summary of an empty ledger is all zeros', () => {
    const l = createLedger(fakeStorage());
    expect(l.summary()).toEqual({ total: 0, withinRange: 0, pct: 0 });
  });

  it('clear empties storage and notifies subscribers', () => {
    const l = createLedger(fakeStorage());
    let calls = 0;
    l.subscribe(() => calls++);
    l.record(entry('m.p1', true));
    l.clear();
    expect(l.listAll()).toEqual([]);
    expect(calls).toBe(2);
  });

  it('survives corrupted storage', () => {
    const storage = fakeStorage();
    storage.setItem(LEDGER_STORAGE_KEY, '{not json');
    const l = createLedger(storage);
    expect(l.listAll()).toEqual([]);
    expect(l.record(entry('m.p1', true)).attempt).toBe(1);
  });
});
