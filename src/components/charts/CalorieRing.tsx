'use client';

import styles from './CalorieRing.module.css';

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export const CalorieRing = ({
  consumed,
  target,
  size = 120,
  strokeWidth = 10,
}: CalorieRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const hasTarget = target > 0;
  const percentage = hasTarget ? Math.min((consumed / target) * 100, 100) : (consumed > 0 ? 100 : 0);
  const filledLength = (percentage / 100) * circumference;
  const isOverTarget = consumed > target && hasTarget;

  return (
    <div className={styles.container} style={{ width: size, height: size }}>
      <svg className={styles.ring} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className={styles.background}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={`${styles.progress} ${isOverTarget ? styles.over : ''}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filledLength} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={styles.content}>
        <span className={styles.value}>{consumed.toFixed(0)}</span>
        <span className={styles.label}>kcal</span>
      </div>
    </div>
  );
};
