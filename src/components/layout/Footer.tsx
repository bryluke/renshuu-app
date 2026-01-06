'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDrawer } from '@/contexts/DrawerContext';
import styles from './Footer.module.css';

export function Footer() {
  const pathname = usePathname();
  const { openDrawer } = useDrawer();

  return (
    <footer className={styles.footer}>
      <nav className={styles.nav}>
        <div className={styles.navGroup}>
          <Link
            href="/dashboard"
            className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}
          >
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className={styles.label}>Home</span>
          </Link>

          <Link
            href="/meals"
            className={`${styles.navItem} ${pathname === '/meals' ? styles.active : ''}`}
          >
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <span className={styles.label}>Meals</span>
          </Link>
        </div>

        <button
          className={styles.actionButton}
          onClick={() => openDrawer('action-menu')}
          aria-label="Log meal or weight"
        >
          <svg className={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <div className={styles.navGroup}>
          <div className={styles.navItem} style={{ visibility: 'hidden' }}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className={styles.label}>Placeholder</span>
          </div>

          <Link
            href="/me"
            className={`${styles.navItem} ${pathname === '/me' ? styles.active : ''}`}
          >
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className={styles.label}>Profile</span>
          </Link>
        </div>
      </nav>
    </footer>
  );
}
