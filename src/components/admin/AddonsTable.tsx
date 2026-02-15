'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FoodAddon } from '@/types/foods';
import styles from './AddonsTable.module.css';

interface AddonsTableProps {
  foodId: string;
}

interface AddonForm {
  display_name: string;
  category: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fats_g: string;
  fiber_g: string;
}

const ADDON_CATEGORIES = ['sauce', 'topping', 'side'] as const;

const emptyForm: AddonForm = {
  display_name: '',
  category: 'sauce',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fats_g: '',
  fiber_g: '',
};

const toForm = (a: FoodAddon): AddonForm => ({
  display_name: a.display_name,
  category: a.category || 'sauce',
  calories: String(a.calories),
  protein_g: String(a.protein_g),
  carbs_g: String(a.carbs_g),
  fats_g: String(a.fats_g),
  fiber_g: a.fiber_g != null ? String(a.fiber_g) : '',
});

export const AddonsTable = ({ foodId }: AddonsTableProps) => {
  const [addons, setAddons] = useState<FoodAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddonForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAddons = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('food_addons')
      .select('*')
      .eq('food_id', foodId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching addons:', error);
    } else {
      setAddons(data || []);
    }
    setLoading(false);
  }, [foodId]);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  const handleChange = (field: keyof AddonForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    setAdding(true);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (addon: FoodAddon) => {
    setEditingId(addon.id);
    setAdding(false);
    setForm(toForm(addon));
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
      category: form.category,
      calories: Number(form.calories),
      protein_g: Number(form.protein_g) || 0,
      carbs_g: Number(form.carbs_g) || 0,
      fats_g: Number(form.fats_g) || 0,
      fiber_g: form.fiber_g ? Number(form.fiber_g) : null,
    };

    let error;

    if (editingId) {
      ({ error } = await supabase
        .from('food_addons')
        .update(payload)
        .eq('id', editingId));
    } else {
      ({ error } = await supabase.from('food_addons').insert(payload));
    }

    if (error) {
      console.error('Error saving addon:', error);
      alert('Failed to save addon');
    } else {
      handleCancel();
      await fetchAddons();
    }

    setSaving(false);
  };

  const handleDelete = async (addonId: string) => {
    if (!confirm('Delete this addon?')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('food_addons')
      .delete()
      .eq('id', addonId);

    if (error) {
      console.error('Error deleting addon:', error);
      alert('Failed to delete addon');
      return;
    }

    await fetchAddons();
  };

  const renderInputRow = () => (
    <tr className={styles.inputRow}>
      <td>
        <input
          type="text"
          value={form.display_name}
          onChange={(e) => handleChange('display_name', e.target.value)}
          placeholder="e.g. Chili sauce"
          className={styles.input}
          autoFocus
        />
      </td>
      <td>
        <select
          value={form.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className={styles.selectInline}
        >
          {ADDON_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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

  if (loading) return <p className={styles.loadingText}>Loading addons...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Addons</h3>
        {!adding && !editingId && (
          <button className={styles.addButton} onClick={handleAdd}>
            + Add Addon
          </button>
        )}
      </div>

      {addons.length === 0 && !adding ? (
        <p className={styles.emptyText}>No addons yet</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Display Name</th>
                <th>Category</th>
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
              {addons.map((a) =>
                editingId === a.id ? (
                  <React.Fragment key={a.id}>{renderInputRow()}</React.Fragment>
                ) : (
                  <tr key={a.id}>
                    <td>{a.display_name}</td>
                    <td>
                      <span className={styles.categoryBadge}>
                        {a.category || '-'}
                      </span>
                    </td>
                    <td>{a.calories}</td>
                    <td>{a.protein_g}g</td>
                    <td>{a.carbs_g}g</td>
                    <td>{a.fats_g}g</td>
                    <td>{a.fiber_g != null ? `${a.fiber_g}g` : '-'}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleEdit(a)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(a.id)}
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
