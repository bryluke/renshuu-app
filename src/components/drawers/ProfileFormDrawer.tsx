'use client';

import { useState, useEffect } from 'react';
import { Drawer } from './Drawer';
import { useDrawer } from '@/contexts/DrawerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRefresh } from '@/contexts/RefreshContext';
import { createClient } from '@/lib/supabase/client';
import styles from './ProfileFormDrawer.module.css';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { value: 'light', label: 'Light', description: '1-3 days/week' },
  { value: 'moderate', label: 'Moderate', description: '3-5 days/week' },
  { value: 'active', label: 'Active', description: '6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Intense daily exercise' },
];

export const ProfileFormDrawer = () => {
  const { drawerType, closeDrawer } = useDrawer();
  const { profile, user } = useAuth();
  const { emit } = useRefresh();

  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [saving, setSaving] = useState(false);

  const isOpen = drawerType === 'profile-form';

  useEffect(() => {
    if (isOpen && profile) {
      setHeight(profile.height_cm?.toString() || '');
      setAge(profile.age?.toString() || '');
      setActivityLevel(profile.activity_level || '');
    }
  }, [isOpen, profile]);

  const handleNumberInput = (
    value: string,
    setter: (val: string) => void,
    maxLength: number = 3
  ) => {
    if (value === '' || /^\d+$/.test(value)) {
      setter(value.slice(0, maxLength));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const supabase = createClient();

      const updates: Record<string, number | string | null> = {};

      if (height) updates.height_cm = parseInt(height);
      if (age) updates.age = parseInt(age);
      if (activityLevel) updates.activity_level = activityLevel;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      await emit('profile');

      closeDrawer();
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title="Edit Body Stats"
      footer={
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      }
    >
      <div className={styles.container}>
        <div className={styles.field}>
          <label htmlFor="height" className={styles.label}>
            Height (cm)
          </label>
          <input
            id="height"
            type="text"
            inputMode="numeric"
            value={height}
            onChange={(e) => handleNumberInput(e.target.value, setHeight)}
            placeholder="e.g. 170"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="age" className={styles.label}>
            Age
          </label>
          <input
            id="age"
            type="text"
            inputMode="numeric"
            value={age}
            onChange={(e) => handleNumberInput(e.target.value, setAge)}
            placeholder="e.g. 30"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Activity Level</label>
          <div className={styles.activityList}>
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setActivityLevel(level.value)}
                className={`${styles.activityItem} ${activityLevel === level.value ? styles.selected : ''}`}
              >
                <div className={styles.activityHeader}>
                  <span className={styles.activityLabel}>{level.label}</span>
                  {activityLevel === level.value && <span className={styles.checkmark}>✓</span>}
                </div>
                <span className={styles.activityDescription}>{level.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
