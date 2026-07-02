import { useCallback, useEffect, useState } from 'react';
import styles from './Header.module.css';

const THEME_KEY = 'gw.theme.v1';
type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

export function Header() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const [copied, setCopied] = useState(false);

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
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  return (
    <header className={styles.header}>
      <a className={styles.home} href="#/">
        Groundwork
      </a>
      <div className={styles.actions}>
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
