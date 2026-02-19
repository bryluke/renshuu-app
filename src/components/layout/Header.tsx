'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import styles from './Header.module.css';

const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/meals': 'Meals',
  '/me': 'Profile',
};

export const Header = () => {
  const pathname = usePathname();
  const pageName = PAGE_NAMES[pathname] || '';

  return (
    <header className={styles.header}>
      <span className={styles.pageName}>{pageName}</span>
      <span className={styles.title}>Renshuu</span>
      <ThemeToggle />
    </header>
  );
};
