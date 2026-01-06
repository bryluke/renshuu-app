'use client';

import { useState, useEffect } from 'react';
import { Drawer } from './Drawer';
import { useDrawer } from '@/contexts/DrawerContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import styles from './CustomFoodFormDrawer.module.css';

export const CustomFoodFormDrawer = () => {
  const { drawerType, drawerData, closeDrawer, openDrawer } = useDrawer();
  const { user } = useAuth();

  const [foodName, setFoodName] = useState('');
  const [portionName, setPortionName] = useState('1 serving');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [saving, setSaving] = useState(false);

  const isOpen = drawerType === 'custom-food-form';

  useEffect(() => {
    if (!isOpen) return;

    setFoodName(drawerData?.suggestedName || '');
    setPortionName('1 serving');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
  }, [isOpen, drawerData]);

  const handleNumberChange = (
    setter: (value: string) => void
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,1}$/.test(value)) {
      setter(value);
    }
  };

  const handleSave = async () => {
    if (!foodName.trim() || !calories || !user) return;

    const caloriesNum = parseInt(calories);
    const proteinNum = parseFloat(protein) || 0;
    const carbsNum = parseFloat(carbs) || 0;
    const fatsNum = parseFloat(fats) || 0;

    if (caloriesNum < 0 || caloriesNum > 5000) {
      alert('Please enter valid calories (0-5000)');
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();

      const { data: food, error: foodError } = await supabase
        .from('foods')
        .insert({
          display_name: foodName.trim(),
          category: 'custom',
          is_approved: false,
          requested_by: user.id,
        })
        .select()
        .single();

      if (foodError) throw foodError;

      const { error: portionError } = await supabase
        .from('food_portions')
        .insert({
          food_id: food.id,
          display_name: portionName.trim() || '1 serving',
          calories: caloriesNum,
          protein_g: proteinNum,
          carbs_g: carbsNum,
          fats_g: fatsNum,
        });

      if (portionError) throw portionError;

      openDrawer('food-form', {
        ...drawerData,
        foodId: food.id,
        foodName: food.display_name,
      });
    } catch (err) {
      console.error('Error creating custom food:', err);
      alert('Failed to create food. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isValid = foodName.trim() && calories && parseInt(calories) >= 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title="Create Custom Food"
      footer={
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className={styles.saveButton}
        >
          {saving ? 'Creating...' : 'Create & Continue'}
        </button>
      }
    >
      <div className={styles.container}>
        <div className={styles.field}>
          <label htmlFor="foodName" className={styles.label}>
            Food Name
          </label>
          <input
            id="foodName"
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="e.g. Nasi Padang"
            className={styles.input}
            autoFocus
          />
        </div>

        <div className={styles.divider} />

        <p className={styles.sectionTitle}>Nutrition per serving</p>

        <div className={styles.field}>
          <label htmlFor="portionName" className={styles.label}>
            Portion Name
          </label>
          <input
            id="portionName"
            type="text"
            value={portionName}
            onChange={(e) => setPortionName(e.target.value)}
            placeholder="e.g. 1 plate, 100g"
            className={styles.input}
          />
        </div>

        <div className={styles.macroGrid}>
          <div className={styles.field}>
            <label htmlFor="calories" className={styles.label}>
              Calories *
            </label>
            <input
              id="calories"
              type="text"
              inputMode="numeric"
              value={calories}
              onChange={handleNumberChange(setCalories)}
              placeholder="0"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="protein" className={styles.label}>
              Protein (g)
            </label>
            <input
              id="protein"
              type="text"
              inputMode="decimal"
              value={protein}
              onChange={handleNumberChange(setProtein)}
              placeholder="0"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="carbs" className={styles.label}>
              Carbs (g)
            </label>
            <input
              id="carbs"
              type="text"
              inputMode="decimal"
              value={carbs}
              onChange={handleNumberChange(setCarbs)}
              placeholder="0"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="fats" className={styles.label}>
              Fats (g)
            </label>
            <input
              id="fats"
              type="text"
              inputMode="decimal"
              value={fats}
              onChange={handleNumberChange(setFats)}
              placeholder="0"
              className={styles.input}
            />
          </div>
        </div>

        <p className={styles.hint}>
          Only you can see this food until an admin approves it.
        </p>
      </div>
    </Drawer>
  );
};
