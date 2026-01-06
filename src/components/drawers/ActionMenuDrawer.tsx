'use client';

import { usePathname } from 'next/navigation';
import { Drawer } from './Drawer';
import { useDrawer } from '@/contexts/DrawerContext';
import styles from './ActionMenuDrawer.module.css';

const ACTIONS = [
  { type: 'meal-type', label: 'Log Meal', icon: '🍽️', description: 'Track what you ate' },
  { type: 'weight-form', label: 'Log Weight', icon: '⚖️', description: 'Record your weight' },
] as const;

export function ActionMenuDrawer() {
  const pathname = usePathname();
  const { drawerType, closeDrawer, openDrawer } = useDrawer();

  const handleSelectAction = (actionType: string) => {
    if (actionType === 'meal-type' && pathname === '/meals') {
      const selectedDate = typeof window !== 'undefined'
        ? (window as any).__selectedMealsDate
        : new Date().toISOString().split('T')[0];
      openDrawer(actionType as any, { targetDate: selectedDate });
    } else {
      openDrawer(actionType as any);
    }
  };

  return (
    <Drawer
      isOpen={drawerType === 'action-menu'}
      onClose={closeDrawer}
      title="Quick Actions"
    >
      <div className={styles.actionList}>
        {ACTIONS.map((action) => (
          <button
            key={action.type}
            className={styles.actionButton}
            onClick={() => handleSelectAction(action.type)}
          >
            <span className={styles.icon}>{action.icon}</span>
            <div className={styles.content}>
              <span className={styles.label}>{action.label}</span>
              <span className={styles.description}>{action.description}</span>
            </div>
            <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </Drawer>
  );
}
