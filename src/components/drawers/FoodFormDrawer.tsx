'use client';

import { useState, useEffect } from 'react';
import { useDrawer } from '@/contexts/DrawerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRefresh } from '@/contexts/RefreshContext';
import { createClient } from '@/lib/supabase/client';
import { PortionWithNutrition, AddonWithNutrition, TotalNutrition } from '@/types/foods';
import { Drawer } from './Drawer';
import styles from './FoodFormDrawer.module.css';

export function FoodFormDrawer() {
  const { drawerType, drawerData, closeDrawer } = useDrawer();
  const { user } = useAuth();
  const { emit } = useRefresh();
  const [portions, setPortions] = useState<PortionWithNutrition[]>([]);
  const [addons, setAddons] = useState<AddonWithNutrition[]>([]);
  const [selectedPortion, setSelectedPortion] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOpen = drawerType === 'food-form';
  const isEditMode = drawerData?.isEdit;

  useEffect(() => {
    if (isOpen && drawerData?.foodId) {
      fetchPortionsAndAddons();
    }
  }, [isOpen, drawerData?.foodId]);

  useEffect(() => {
    if (!isOpen || portions.length === 0) return;

    if (isEditMode) {
      setSelectedPortion(drawerData.portionId || null);
      setSelectedAddons(drawerData.selectedAddons || []);
    } else {
      setSelectedPortion(portions[0].id);
      setSelectedAddons([]);
    }
  }, [isOpen, isEditMode, portions, drawerData?.portionId, drawerData?.selectedAddons]);

  const fetchPortionsAndAddons = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const [portionsResult, addonsResult] = await Promise.all([
        supabase
          .from('food_portions')
          .select('*')
          .eq('food_id', drawerData.foodId)
          .order('calories'),
        supabase
          .from('food_addons')
          .select('*')
          .eq('food_id', drawerData.foodId)
          .order('display_name'),
      ]);

      if (portionsResult.error) throw portionsResult.error;
      if (addonsResult.error) throw addonsResult.error;

      setPortions(portionsResult.data || []);
      setAddons(addonsResult.data || []);
    } catch (err) {
      console.error('Error fetching portions/addons:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const calculateTotalNutrition = (): TotalNutrition => {
    const selectedPortionData = portions.find(p => p.id === selectedPortion);
    if (!selectedPortionData) {
      return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    }

    const totals: TotalNutrition = {
      calories: selectedPortionData.calories,
      protein: selectedPortionData.protein_g,
      carbs: selectedPortionData.carbs_g,
      fats: selectedPortionData.fats_g,
    };

    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) {
        totals.calories += addon.calories;
        totals.protein += addon.protein_g;
        totals.carbs += addon.carbs_g;
        totals.fats += addon.fats_g;
      }
    });

    return totals;
  };

  const totalNutrition = calculateTotalNutrition();

  const handleSave = async () => {
    if (!selectedPortion || !user) return;

    try {
      setSaving(true);
      const supabase = createClient();

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('meal_foods')
          .update({
            portion_id: selectedPortion,
            selected_addons: selectedAddons.length > 0 ? selectedAddons : null,
            portion_display: portions.find(p => p.id === selectedPortion)?.display_name || '',
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fats_g: 0,
          })
          .eq('id', drawerData.mealFoodId);

        if (updateError) throw updateError;
      } else {
        const targetDate = drawerData.targetDate || new Date().toISOString().split('T')[0];
        let mealId = drawerData.mealId;

        if (!mealId) {
          const { data: meal, error: mealError } = await supabase
            .from('meals')
            .insert({
              user_id: user.id,
              meal_type: drawerData.mealType,
              meal_date: targetDate,
            })
            .select()
            .single();

          if (mealError) throw mealError;
          mealId = meal.id;
        }

        const { error: mealFoodError } = await supabase
          .from('meal_foods')
          .insert({
            meal_id: mealId,
            food_id: drawerData.foodId,
            portion_id: selectedPortion,
            selected_addons: selectedAddons.length > 0 ? selectedAddons : null,
            food_name: drawerData.foodName,
            portion_display: portions.find(p => p.id === selectedPortion)?.display_name || '',
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fats_g: 0,
          });

        if (mealFoodError) throw mealFoodError;
      }

      await emit('today');
      await emit('meals');

      closeDrawer();
    } catch (err) {
      console.error('Error saving meal:', err);
      alert('Failed to save meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title={drawerData?.foodName || 'Select Portion'}
      footer={
        <button
          onClick={handleSave}
          disabled={!selectedPortion || saving}
          className={styles.saveButton}
        >
          {saving ? 'Saving...' : isEditMode ? 'Update' : 'Add to Meal'}
        </button>
      }
    >
      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <div className={styles.container}>
          <div className={styles.nutritionSummary}>
            <div className={styles.summaryTitle}>Total Nutrition</div>
            <div className={styles.summaryStats}>
              <div className={styles.summaryMain}>
                <span className={styles.summaryCalories}>{totalNutrition.calories}</span>
                <span className={styles.summaryLabel}>kcal</span>
              </div>
              <div className={styles.summaryMacros}>
                <div className={styles.macro}>
                  <span className={styles.macroValue}>{totalNutrition.protein.toFixed(1)}g</span>
                  <span className={styles.macroLabel}>Protein</span>
                </div>
                <div className={styles.macro}>
                  <span className={styles.macroValue}>{totalNutrition.carbs.toFixed(1)}g</span>
                  <span className={styles.macroLabel}>Carbs</span>
                </div>
                <div className={styles.macro}>
                  <span className={styles.macroValue}>{totalNutrition.fats.toFixed(1)}g</span>
                  <span className={styles.macroLabel}>Fats</span>
                </div>
              </div>
            </div>
          </div>

          <section>
            <h3 className={styles.sectionTitle}>Select Portion</h3>
            <div className={styles.portionList}>
              {portions.map((portion) => (
                <button
                  key={portion.id}
                  onClick={() => setSelectedPortion(portion.id)}
                  className={`${styles.portionItem} ${selectedPortion === portion.id ? styles.selected : ''}`}
                >
                  <div className={styles.portionHeader}>
                    <div className={styles.portionName}>{portion.display_name}</div>
                    {selectedPortion === portion.id && <span className={styles.checkmark}>✓</span>}
                  </div>
                  <div className={styles.portionNutrition}>
                    {portion.calories} kcal · P: {portion.protein_g}g · C: {portion.carbs_g}g · F: {portion.fats_g}g
                  </div>
                </button>
              ))}
            </div>
          </section>

          {addons.length > 0 && (
            <section>
              <h3 className={styles.sectionTitle}>Add-ons (optional)</h3>
              <div className={styles.addonList}>
                {addons.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`${styles.addonItem} ${selectedAddons.includes(addon.id) ? styles.selected : ''}`}
                  >
                    <div className={styles.addonHeader}>
                      <div className={styles.addonName}>{addon.display_name}</div>
                      {selectedAddons.includes(addon.id) && <span className={styles.checkmark}>✓</span>}
                    </div>
                    <div className={styles.addonNutrition}>
                      +{addon.calories} kcal · P: {addon.protein_g}g · C: {addon.carbs_g}g · F: {addon.fats_g}g
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Drawer>
  );
}
