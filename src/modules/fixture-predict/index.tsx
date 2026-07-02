import { useSyncExternalStore } from 'react';
import { ledger } from '../../core/ledger.ts';
import { Predict, type RangeGuess } from '../../core/Predict.tsx';
import type { ModuleProps } from '../../core/moduleDef.ts';
import styles from './fixture.module.css';

function useLedgerRecords() {
  return useSyncExternalStore(
    (onChange) => ledger.subscribe(onChange),
    () => JSON.stringify(ledger.listAll()),
  );
}

export default function FixturePredict(_props: ModuleProps) {
  const records = JSON.parse(useLedgerRecords()) as ReturnType<
    typeof ledger.listAll
  >;

  return (
    <div className={styles.fixture}>
      <p>
        One prediction of each kind, with dummy answers. Commit a guess, watch
        it land in the table and the header chip. Answer again and note that
        the attempt count rises while the summary holds still.
      </p>

      <Predict
        id="fixture-predict.number"
        kind="number"
        prompt="Pick a number close to 7 (within 1 counts)."
        actual={7}
        judge={(g, a) => Math.abs((g as number) - (a as number)) <= 1}
      >
        <p className={styles.revealNote}>
          Revealed content for the number prediction.
        </p>
      </Predict>

      <Predict
        id="fixture-predict.range"
        kind="range"
        prompt="Give a range that contains 100."
        actual={100}
        judge={(g, a) => {
          const r = g as RangeGuess;
          return r.lo <= (a as number) && (a as number) <= r.hi;
        }}
      >
        <p className={styles.revealNote}>
          Revealed content for the range prediction.
        </p>
      </Predict>

      <Predict
        id="fixture-predict.order"
        kind="order"
        prompt="Put these in alphabetical order."
        options={['bee', 'ant', 'cat']}
        actual={['ant', 'bee', 'cat']}
        judge={(g, a) =>
          JSON.stringify(g) === JSON.stringify(a)
        }
      >
        <p className={styles.revealNote}>
          Revealed content for the order prediction.
        </p>
      </Predict>

      <Predict
        id="fixture-predict.choice"
        kind="choice"
        prompt="Which of these is a color?"
        options={['seven', 'green', 'loud']}
        actual="green"
        judge={(g, a) => g === a}
      >
        <p className={styles.revealNote}>
          Revealed content for the choice prediction.
        </p>
      </Predict>

      <h2 className={styles.tableHeading}>Stored records</h2>
      {records.length === 0 ? (
        <p className={styles.empty}>Nothing committed yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>id</th>
              <th>kind</th>
              <th>attempt</th>
              <th>guess</th>
              <th>actual</th>
              <th>within</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i}>
                <td>{r.id}</td>
                <td>{r.kind}</td>
                <td>{r.attempt}</td>
                <td>{JSON.stringify(r.guess)}</td>
                <td>{JSON.stringify(r.actual)}</td>
                <td>{r.withinRange ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button
        type="button"
        className={styles.clear}
        onClick={() => ledger.clear()}
      >
        Clear ledger (fixture-only control)
      </button>
    </div>
  );
}
