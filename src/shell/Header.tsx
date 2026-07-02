import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { ledger } from '../core/ledger.ts';
import styles from './Header.module.css';

const THEME_KEY = 'gw.theme.v1';
type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

// The chip re-reads the stored records on every ledger change — the summary
// is computed, never a cached tally (002 §7).
function useLedgerSummary() {
  return useSyncExternalStore(
    (onChange) => ledger.subscribe(onChange),
    () => JSON.stringify(ledger.summary()),
  );
}

export function Header() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const [copied, setCopied] = useState(false);
  const summary = JSON.parse(useLedgerSummary()) as ReturnType<
    typeof ledger.summary
  >;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // storage unavailable (private mode) — theme still applies this visit
      }
      return next;
    });
  }, []);

  const copyLink = useCallback(() => {
    void navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // clipboard denied — the button simply doesn't flip to "Copied!"
      });
  }, []);

  return (
    <header className={styles.header}>
      <a className={styles.home} href="#/">
        Groundwork
      </a>
      <div className={styles.actions}>
        {summary.total > 0 && (
          <span
            className={styles.chip}
            aria-label={`Calibration: ${summary.total} predictions, ${summary.pct}% within range`}
          >
            {summary.total} prediction{summary.total === 1 ? '' : 's'} ·{' '}
            {summary.pct}% within range
          </span>
        )}
        <button type="button" onClick={copyLink}>
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
          }
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </header>
  );
}
