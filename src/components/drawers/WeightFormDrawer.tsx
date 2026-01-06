'use client';

import { useState, useEffect } from 'react';
import { Drawer } from './Drawer';
import { useDrawer } from '@/contexts/DrawerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRefresh } from '@/contexts/RefreshContext';
import { createClient } from '@/lib/supabase/client';
import styles from './WeightFormDrawer.module.css';

export const WeightFormDrawer = () => {
  const { drawerType, drawerData, closeDrawer } = useDrawer();
  const { user } = useAuth();
  const { emit } = useRefresh();

  const [weight, setWeight] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingLogId, setExistingLogId] = useState<string | null>(null);

  const isOpen = drawerType === 'weight-form';
  const isEditMode = !!drawerData?.weightLogId;

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode) {
      setWeight(drawerData.weight?.toString() || '');
      setDate(drawerData.date || new Date().toISOString().split('T')[0]);
      setNotes(drawerData.notes || '');
      setExistingLogId(drawerData.weightLogId);
    } else {
      setWeight('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setExistingLogId(null);
    }
  }, [isOpen, isEditMode, drawerData]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setWeight(value);
    }
  };

  const handleSave = async () => {
    if (!weight || !user) return;

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      alert('Please enter a valid weight between 0 and 500 kg');
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();

      if (isEditMode && existingLogId) {
        const { error } = await supabase
          .from('weight_logs')
          .update({
            weight_kg: weightNum,
            log_date: date,
            notes: notes.trim() || null,
          })
          .eq('id', existingLogId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('weight_logs')
          .upsert({
            user_id: user.id,
            weight_kg: weightNum,
            log_date: date,
            notes: notes.trim() || null,
          }, {
            onConflict: 'user_id,log_date',
          });

        if (error) throw error;
      }

      await emit('weight');

      closeDrawer();
    } catch (err) {
      console.error('Error saving weight:', err);
      alert('Failed to save weight. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isValid = weight && parseFloat(weight) > 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title={isEditMode ? 'Edit Weight' : 'Log Weight'}
      footer={
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className={styles.saveButton}
        >
          {saving ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
        </button>
      }
    >
      <div className={styles.container}>
        <div className={styles.field}>
          <label htmlFor="weight" className={styles.label}>
            Weight (kg)
          </label>
          <input
            id="weight"
            type="text"
            inputMode="decimal"
            value={weight}
            onChange={handleWeightChange}
            placeholder="e.g. 70.5"
            className={styles.input}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="date" className={styles.label}>
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="notes" className={styles.label}>
            Notes (optional)
          </label>
          <input
            id="notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Morning weight, after workout"
            className={styles.input}
          />
        </div>
      </div>
    </Drawer>
  );
};
