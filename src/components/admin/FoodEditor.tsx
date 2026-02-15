'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Food } from '@/types/foods';
import { PortionsTable } from './PortionsTable';
import { AddonsTable } from './AddonsTable';
import styles from './FoodEditor.module.css';

interface FoodEditorProps {
  foodId: string | null;
  onBack: () => void;
}

const CATEGORIES = ['hawker', 'drinks', 'fast_food', 'basics', 'custom'] as const;

interface FoodForm {
  display_name: string;
  description: string;
  category: string;
  subcategory: string;
  is_approved: boolean;
}

const emptyForm: FoodForm = {
  display_name: '',
  description: '',
  category: 'hawker',
  subcategory: '',
  is_approved: true,
};

export const FoodEditor = ({ foodId, onBack }: FoodEditorProps) => {
  const { user } = useAuth();
  const [food, setFood] = useState<Food | null>(null);
  const [form, setForm] = useState<FoodForm>(emptyForm);
  const [loading, setLoading] = useState(!!foodId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew = foodId === null;
  const savedFoodId = food?.id || null;

  const fetchFood = useCallback(async () => {
    if (!foodId) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('id', foodId)
      .single();

    if (error) {
      console.error('Error fetching food:', error);
      setError('Food not found');
    } else if (data) {
      setFood(data);
      setForm({
        display_name: data.display_name,
        description: data.description || '',
        category: data.category,
        subcategory: data.subcategory || '',
        is_approved: data.is_approved ?? false,
      });
    }

    setLoading(false);
  }, [foodId]);

  useEffect(() => {
    fetchFood();
  }, [fetchFood]);

  const handleChange = (field: keyof FoodForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSave = async () => {
    if (!form.display_name.trim()) {
      setError('Display name is required');
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      display_name: form.display_name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      subcategory: form.subcategory.trim() || null,
      is_approved: form.is_approved,
      ...(form.is_approved && !food?.approved_by ? { approved_by: user?.id } : {}),
    };

    if (savedFoodId) {
      const { data, error } = await supabase
        .from('foods')
        .update(payload)
        .eq('id', savedFoodId)
        .select()
        .single();

      if (error) {
        console.error('Error updating food:', error);
        setError(error.message);
      } else {
        setFood(data);
      }
    } else {
      const { data, error } = await supabase
        .from('foods')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Error creating food:', error);
        setError(error.message);
      } else {
        setFood(data);
      }
    }

    setSaving(false);
  };

  if (loading) {
    return <div className={styles.loadingState}>Loading food...</div>;
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={onBack}>
        &larr; Back to Foods
      </button>

      <h2 className={styles.title}>
        {isNew && !savedFoodId ? 'New Food' : food?.display_name || 'Edit Food'}
      </h2>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formCard}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Display Name *</label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => handleChange('display_name', e.target.value)}
              className={styles.input}
              placeholder="e.g. Chicken Rice"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Category *</label>
            <select
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={styles.select}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Subcategory</label>
            <input
              type="text"
              value={form.subcategory}
              onChange={(e) => handleChange('subcategory', e.target.value)}
              className={styles.input}
              placeholder="e.g. rice dishes"
            />
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={styles.textarea}
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div className={styles.fieldCheckbox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.is_approved}
                onChange={(e) => handleChange('is_approved', e.target.checked)}
                className={styles.checkbox}
              />
              Approved
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : savedFoodId ? 'Update Food' : 'Create Food'}
          </button>
        </div>
      </div>

      {savedFoodId && (
        <div className={styles.subSections}>
          <PortionsTable foodId={savedFoodId} />
          <AddonsTable foodId={savedFoodId} />
        </div>
      )}

      {isNew && !savedFoodId && (
        <p className={styles.hint}>
          Save the food first, then you can add portions and addons.
        </p>
      )}
    </div>
  );
};
