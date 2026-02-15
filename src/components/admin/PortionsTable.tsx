'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FoodPortion } from '@/types/foods';
import styles from './PortionsTable.module.css';

interface PortionsTableProps {
  foodId: string;
}

interface PortionForm {
  display_name: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fats_g: string;
  fiber_g: string;
}

const emptyForm: PortionForm = {
  display_name: '',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fats_g: '',
  fiber_g: '',
};

const toForm = (p: FoodPortion): PortionForm => ({
  display_name: p.display_name,
  calories: String(p.calories),
  protein_g: String(p.protein_g),
  carbs_g: String(p.carbs_g),
  fats_g: String(p.fats_g),
  fiber_g: p.fiber_g != null ? String(p.fiber_g) : '',
});

export const PortionsTable = ({ foodId }: PortionsTableProps) => {
  const [portions, setPortions] = useState<FoodPortion[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PortionForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPortions = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('food_portions')
      .select('*')
      .eq('food_id', foodId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching portions:', error);
    } else {
      setPortions(data || []);
    }
    setLoading(false);
  }, [foodId]);

  useEffect(() => {
    fetchPortions();
  }, [fetchPortions]);

  const handleChange = (field: keyof PortionForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    setAdding(true);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (portion: FoodPortion) => {
    setEditingId(portion.id);
    setAdding(false);
    setForm(toForm(portion));
  };

  const handleCancel = () => {
    setAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.display_name.trim() || !form.calories) return;

    setSaving(true);
    const supabase = createClient();

    const payload = {
      food_id: foodId,
      display_name: form.display_name.trim(),
      calories: Number(form.calories),
      protein_g: Number(form.protein_g) || 0,
      carbs_g: Number(form.carbs_g) || 0,
      fats_g: Number(form.fats_g) || 0,
      fiber_g: form.fiber_g ? Number(form.fiber_g) : null,
    };

    let error;

    if (editingId) {
      ({ error } = await supabase
        .from('food_portions')
        .update(payload)
        .eq('id', editingId));
    } else {
      ({ error } = await supabase.from('food_portions').insert(payload));
    }

    if (error) {
      console.error('Error saving portion:', error);
      alert('Failed to save portion');
    } else {
      handleCancel();
      await fetchPortions();
    }

    setSaving(false);
  };

  const handleDelete = async (portionId: string) => {
    if (!confirm('Delete this portion?')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('food_portions')
      .delete()
      .eq('id', portionId);

    if (error) {
      console.error('Error deleting portion:', error);
      alert('Failed to delete portion');
      return;
    }

    await fetchPortions();
  };

  const renderInputRow = () => (
    <tr className={styles.inputRow}>
      <td>
        <input
          type="text"
          value={form.display_name}
          onChange={(e) => handleChange('display_name', e.target.value)}
          placeholder="e.g. Regular"
          className={styles.input}
          autoFocus
        />
      </td>
      <td>
        <input
          type="number"
          value={form.calories}
          onChange={(e) => handleChange('calories', e.target.value)}
          placeholder="0"
          className={styles.inputNum}
        />
      </td>
      <td>
        <input
          type="number"
          value={form.protein_g}
          onChange={(e) => handleChange('protein_g', e.target.value)}
          placeholder="0"
          className={styles.inputNum}
        />
      </td>
      <td>
        <input
          type="number"
          value={form.carbs_g}
          onChange={(e) => handleChange('carbs_g', e.target.value)}
          placeholder="0"
          className={styles.inputNum}
        />
      </td>
      <td>
        <input
          type="number"
          value={form.fats_g}
          onChange={(e) => handleChange('fats_g', e.target.value)}
          placeholder="0"
          className={styles.inputNum}
        />
      </td>
      <td>
        <input
          type="number"
          value={form.fiber_g}
          onChange={(e) => handleChange('fiber_g', e.target.value)}
          placeholder="0"
          className={styles.inputNum}
        />
      </td>
      <td>
        <div className={styles.inputActions}>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '...' : 'Save'}
          </button>
          <button className={styles.cancelBtn} onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) return <p className={styles.loadingText}>Loading portions...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Portions</h3>
        {!adding && !editingId && (
          <button className={styles.addButton} onClick={handleAdd}>
            + Add Portion
          </button>
        )}
      </div>

      {portions.length === 0 && !adding ? (
        <p className={styles.emptyText}>No portions yet</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Display Name</th>
                <th>Cal</th>
                <th>Protein</th>
                <th>Carbs</th>
                <th>Fats</th>
                <th>Fiber</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adding && renderInputRow()}
              {portions.map((p) =>
                editingId === p.id ? (
                  <React.Fragment key={p.id}>{renderInputRow()}</React.Fragment>
                ) : (
                  <tr key={p.id}>
                    <td>{p.display_name}</td>
                    <td>{p.calories}</td>
                    <td>{p.protein_g}g</td>
                    <td>{p.carbs_g}g</td>
                    <td>{p.fats_g}g</td>
                    <td>{p.fiber_g != null ? `${p.fiber_g}g` : '-'}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(p.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
