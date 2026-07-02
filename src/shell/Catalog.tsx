import { useState } from 'react';
import { modules } from '../modules/manifest.ts';
import styles from './Catalog.module.css';

export function Catalog() {
  const [query, setQuery] = useState('');
  const visible = modules.filter((m) => !m.hidden);
  const q = query.trim().toLowerCase();
  const shown =
    q === ''
      ? visible
      : visible.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.blurb.toLowerCase().includes(q),
        );

  return (
    <div>
      <h1 className={styles.heading}>Lessons</h1>
      <input
        className={styles.search}
        type="search"
        placeholder="Search lessons"
        aria-label="Search lessons"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {shown.length === 0 ? (
        <p className={styles.empty}>
          {visible.length === 0
            ? 'No lessons yet — the season is being built. Check back soon.'
            : 'Nothing matches that search.'}
        </p>
      ) : (
        <ul className={styles.grid}>
          {shown.map((m) => (
            <li key={m.id}>
              <a className={styles.card} href={`#/m/${m.id}`}>
                <span className={styles.cardTitle}>{m.title}</span>
                <span className={styles.cardBlurb}>{m.blurb}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
