'use client';

import { useState, useEffect } from 'react';
import { Drawer } from './Drawer';
import { useDrawer } from '@/contexts/DrawerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRefresh } from '@/contexts/RefreshContext';
import { createClient } from '@/lib/supabase/client';
import styles from './GoalsFormDrawer.module.css';

export const GoalsFormDrawer = () => {
  const { drawerType, drawerData, closeDrawer } = useDrawer();
  const { user } = useAuth();
  const { emit } = useRefresh();

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [fiber, setFiber] = useState('');
  const [saving, setSaving] = useState(false);

  const isOpen = drawerType === 'goals-form';
  const currentGoal = drawerData?.currentGoal;

  useEffect(() => {
    if (isOpen && currentGoal) {
      setCalories(currentGoal.daily_calorie?.toString() || '');
      setProtein(currentGoal.daily_protein_g?.toString() || '');
      setCarbs(currentGoal.daily_carbs_g?.toString() || '');
      setFats(currentGoal.daily_fats_g?.toString() || '');
      setFiber(currentGoal.daily_fiber_g?.toString() || '');
    } else if (isOpen) {
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      setFiber('');
    }
  }, [isOpen, currentGoal]);

  const handleNumberInput = (
    value: string,
    setter: (val: string) => void,
    allowDecimal: boolean = false
  ) => {
    if (value === '') {
      setter('');
      return;
    }

    const pattern = allowDecimal ? /^\d*\.?\d{0,1}$/ : /^\d+$/;
    if (pattern.test(value)) {
      setter(value);
    }
  };

  const handleSave = async () => {
    if (!user || !calories || !protein || !carbs || !fats) {
      alert('Please fill in all required fields (calories, protein, carbs, fats)');
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      if (currentGoal) {
        const { error } = await supabase
          .from('user_goals')
          .update({
            daily_calorie: parseInt(calories),
            daily_protein_g: parseFloat(protein),
            daily_carbs_g: parseFloat(carbs),
            daily_fats_g: parseFloat(fats),
            daily_fiber_g: parseFloat(fiber) || 0,
          })
          .eq('id', currentGoal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_goals')
          .insert({
            user_id: user.id,
            daily_calorie: parseInt(calories),
            daily_protein_g: parseFloat(protein),
            daily_carbs_g: parseFloat(carbs),
            daily_fats_g: parseFloat(fats),
            daily_fiber_g: parseFloat(fiber) || 0,
            set_by: 'self',
            set_by_user_id: user.id,
            start_date: today,
            is_active: true,
          });

        if (error) throw error;
      }

      await emit('goals');

      closeDrawer();
    } catch (err) {
      console.error('Error saving goals:', err);
      alert('Failed to save goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isValid = calories && protein && carbs && fats;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title={currentGoal ? 'Edit Goals' : 'Set Daily Goals'}
      footer={
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className={styles.saveButton}
        >
          {saving ? 'Saving...' : currentGoal ? 'Update' : 'Save'}
        </button>
      }
    >
      <div className={styles.container}>
        <p className={styles.hint}>
          Set your daily nutrition targets to track your progress
        </p>

        <div className={styles.field}>
          <label htmlFor="calories" className={styles.label}>
            Daily Calories *
          </label>
          <input
            id="calories"
            type="text"
            inputMode="numeric"
            value={calories}
            onChange={(e) => handleNumberInput(e.target.value, setCalories)}
            placeholder="e.g. 2000"
            className={styles.input}
          />
        </div>

        <div className={styles.macroGrid}>
          <div className={styles.field}>
            <label htmlFor="protein" className={styles.label}>
              Protein (g) *
            </label>
            <input
              id="protein"
              type="text"
              inputMode="decimal"
              value={protein}
              onChange={(e) => handleNumberInput(e.target.value, setProtein, true)}
              placeholder="e.g. 150"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="carbs" className={styles.label}>
              Carbs (g) *
            </label>
            <input
              id="carbs"
              type="text"
              inputMode="decimal"
              value={carbs}
              onChange={(e) => handleNumberInput(e.target.value, setCarbs, true)}
              placeholder="e.g. 200"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="fats" className={styles.label}>
              Fats (g) *
            </label>
            <input
              id="fats"
              type="text"
              inputMode="decimal"
              value={fats}
              onChange={(e) => handleNumberInput(e.target.value, setFats, true)}
              placeholder="e.g. 65"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="fiber" className={styles.label}>
              Fiber (g)
            </label>
            <input
              id="fiber"
              type="text"
              inputMode="decimal"
              value={fiber}
              onChange={(e) => handleNumberInput(e.target.value, setFiber, true)}
              placeholder="e.g. 25"
              className={styles.input}
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
};
