'use client';

import styles from './MacroDonut.module.css';

interface MacroDonutProps {
  protein: number;
  carbs: number;
  fats: number;
  size?: number;
  strokeWidth?: number;
}

export const MacroDonut = ({
  protein,
  carbs,
  fats,
  size = 120,
  strokeWidth = 10,
}: MacroDonutProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = protein + carbs + fats;

  const proteinPercent = total > 0 ? (protein / total) * 100 : 0;
  const carbsPercent = total > 0 ? (carbs / total) * 100 : 0;
  const fatsPercent = total > 0 ? (fats / total) * 100 : 0;

  const proteinOffset = 0;
  const carbsOffset = proteinPercent;
  const fatsOffset = proteinPercent + carbsPercent;

  const getStrokeDasharray = (percent: number) => {
    const length = (percent / 100) * circumference;
    return `${length} ${circumference - length}`;
  };

  const getStrokeDashoffset = (offsetPercent: number) => {
    return -(offsetPercent / 100) * circumference;
  };

  return (
    <div className={styles.container} style={{ width: size, height: size }}>
      <svg className={styles.donut} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className={styles.background}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {total > 0 && (
          <>
            <circle
              className={styles.protein}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={getStrokeDasharray(proteinPercent)}
              strokeDashoffset={getStrokeDashoffset(proteinOffset)}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <circle
              className={styles.carbs}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={getStrokeDasharray(carbsPercent)}
              strokeDashoffset={getStrokeDashoffset(carbsOffset)}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <circle
              className={styles.fats}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={getStrokeDasharray(fatsPercent)}
              strokeDashoffset={getStrokeDashoffset(fatsOffset)}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </>
        )}
      </svg>
      <div className={styles.content}>
        <span className={styles.value}>{total.toFixed(0)}g</span>
        <span className={styles.label}>macros</span>
      </div>
    </div>
  );
};
