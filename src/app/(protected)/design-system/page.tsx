'use client';

import { useTheme } from '@/contexts/ThemeContext';
import styles from './page.module.css';

export default function Home() {
  const { theme, accentHue, toggleTheme, setAccentHue } = useTheme();

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>Renshuu Design System</h1>
        <p className={styles.subtitle}>Testing our design tokens and theme system</p>

        <div className={styles.controls}>
          <div className={styles.control}>
            <label>Theme</label>
            <button onClick={toggleTheme} className={styles.button}>
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>

          <div className={styles.control}>
            <label htmlFor="hue">Accent Color (Hue: {accentHue}°)</label>
            <input
              id="hue"
              type="range"
              min="0"
              max="360"
              value={accentHue}
              onChange={(e) => setAccentHue(parseInt(e.target.value))}
              className={styles.slider}
            />
            <div
              className={styles.colorPreview}
              style={{ backgroundColor: `hsl(${accentHue}, 80%, 55%)` }}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2>Typography</h2>
          <h1>Heading 1 (2xl)</h1>
          <h2>Heading 2 (xl)</h2>
          <h3>Heading 3 (lg)</h3>
          <h4>Heading 4 (base)</h4>
          <p>Body text (base) - The quick brown fox jumps over the lazy dog.</p>
          <p style={{ fontSize: 'var(--font-sm)' }}>Small text - Perfect for captions and labels.</p>
        </div>

        <div className={styles.section}>
          <h2>Colors</h2>
          <div className={styles.colorGrid}>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--accent)' }}>
              <span>Accent</span>
            </div>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--success)' }}>
              <span>Success</span>
            </div>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--error)' }}>
              <span>Error</span>
            </div>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--warning)' }}>
              <span>Warning</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Buttons</h2>
          <div className={styles.buttonGroup}>
            <button className={styles.buttonPrimary}>Primary</button>
            <button className={styles.buttonSecondary}>Secondary</button>
            <button className={styles.buttonGhost}>Ghost</button>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Card</h2>
          <div className={styles.card}>
            <h3>Card Title</h3>
            <p>This is a card with border and shadow. It uses our design tokens for consistent styling.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
