// Agent-questions card (000 S2.7, 003 S2): renders its props verbatim and
// never generates or edits text — the questions are the module spec's §6,
// word for word.

import { useState } from 'react';
import styles from './AgentQuestions.module.css';

interface AgentQuestionsProps {
  questions: string[];
}

export function AgentQuestions({ questions }: AgentQuestionsProps) {
  const [copied, setCopied] = useState<number | 'all' | null>(null);

  function copy(text: string, which: number | 'all') {
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(which);
        setTimeout(() => setCopied(null), 1500);
      })
      .catch(() => {
        // clipboard denied — the button simply doesn't flip to "Copied!"
      });
  }

  return (
    <aside className={styles.card} aria-label="Questions to take to your agent">
      <h2 className={styles.heading}>Questions to take to your agent</h2>
      <ol className={styles.list}>
        {questions.map((q, i) => (
          <li key={i} className={styles.item}>
            <span className={styles.question}>{q}</span>
            <button
              type="button"
              className={styles.copy}
              onClick={() => copy(q, i)}
            >
              {copied === i ? 'Copied!' : 'Copy'}
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className={styles.copyAll}
        onClick={() => copy(questions.join('\n'), 'all')}
      >
        {copied === 'all' ? 'Copied!' : 'Copy all'}
      </button>
    </aside>
  );
}
