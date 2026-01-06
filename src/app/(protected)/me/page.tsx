'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { useRefreshSubscription } from '@/contexts/RefreshContext';
import { createClient } from '@/lib/supabase/client';
import { Tables } from '@/types/database.types';
import styles from './page.module.css';

type WeightLog = Tables<'weight_logs'>;
type UserGoal = Tables<'user_goals'>;

export default function ProfilePage() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { openDrawer } = useDrawer();

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [currentGoal, setCurrentGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      const [weightResult, goalResult] = await Promise.all([
        supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', profile.id)
          .order('log_date', { ascending: false })
          .limit(10),
        supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .lte('start_date', today)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order('start_date', { ascending: false })
          .limit(1)
          .single(),
      ]);

      if (weightResult.data) setWeightLogs(weightResult.data);
      if (goalResult.data) setCurrentGoal(goalResult.data);
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRefreshSubscription('weight', fetchData);
  useRefreshSubscription('goals', fetchData);
  useRefreshSubscription('profile', async () => {
    await refreshProfile();
    await fetchData();
  });

  const handleEditWeight = (log: WeightLog) => {
    openDrawer('weight-form', {
      weightLogId: log.id,
      weight: log.weight_kg,
      date: log.log_date,
      notes: log.notes,
    });
  };

  const handleDeleteWeight = async (logId: string) => {
    if (!confirm('Delete this weight entry?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('weight_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Error deleting weight log:', err);
      alert('Failed to delete weight entry');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-SG', { weekday: 'short' });
    return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
  };

  const latestWeight = weightLogs[0]?.weight_kg;
  const previousWeight = weightLogs[1]?.weight_kg;
  const weightChange = latestWeight && previousWeight
    ? (latestWeight - previousWeight).toFixed(1)
    : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <button onClick={signOut} className={styles.signOutButton}>
          Sign Out
        </button>
      </header>

      <div className={styles.content}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Body Stats</h2>
            <button
              className={styles.editButton}
              onClick={() => openDrawer('profile-form')}
            >
              Edit
            </button>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {profile?.weight_kg ? `${profile.weight_kg} kg` : '—'}
              </span>
              <span className={styles.statLabel}>Weight</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {profile?.height_cm ? `${profile.height_cm} cm` : '—'}
              </span>
              <span className={styles.statLabel}>Height</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {profile?.age || '—'}
              </span>
              <span className={styles.statLabel}>Age</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {profile?.activity_level?.replace('_', ' ') || '—'}
              </span>
              <span className={styles.statLabel}>Activity</span>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Daily Goals</h2>
            <button
              className={styles.editButton}
              onClick={() => openDrawer('goals-form', { currentGoal })}
            >
              {currentGoal ? 'Edit' : 'Set Goals'}
            </button>
          </div>
          {currentGoal ? (
            <div className={styles.goalsGrid}>
              <div className={styles.goalItem}>
                <span className={styles.goalValue}>{currentGoal.daily_calorie}</span>
                <span className={styles.goalLabel}>kcal</span>
              </div>
              <div className={styles.goalItem}>
                <span className={styles.goalValue}>{currentGoal.daily_protein_g}g</span>
                <span className={styles.goalLabel}>protein</span>
              </div>
              <div className={styles.goalItem}>
                <span className={styles.goalValue}>{currentGoal.daily_carbs_g}g</span>
                <span className={styles.goalLabel}>carbs</span>
              </div>
              <div className={styles.goalItem}>
                <span className={styles.goalValue}>{currentGoal.daily_fats_g}g</span>
                <span className={styles.goalLabel}>fats</span>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No goals set yet</p>
              <p className={styles.emptyHint}>Set your daily nutrition targets to track progress</p>
            </div>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Weight History</h2>
            <button
              className={styles.editButton}
              onClick={() => openDrawer('weight-form')}
            >
              + Log
            </button>
          </div>
          {loading ? (
            <p className={styles.loading}>Loading...</p>
          ) : weightLogs.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No weight logs yet</p>
              <p className={styles.emptyHint}>Start tracking your weight to see progress</p>
            </div>
          ) : (
            <>
              {weightChange && (
                <div className={styles.weightSummary}>
                  <span className={`${styles.weightChange} ${parseFloat(weightChange) > 0 ? styles.up : styles.down}`}>
                    {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
                  </span>
                  <span className={styles.weightChangeLabel}>since last entry</span>
                </div>
              )}
              <div className={styles.weightList}>
                {weightLogs.map((log) => (
                  <div key={log.id} className={styles.weightItem}>
                    <div className={styles.weightInfo}>
                      <span className={styles.weightValue}>{log.weight_kg} kg</span>
                      <span className={styles.weightDate}>{formatDate(log.log_date)}</span>
                      {log.notes && <span className={styles.weightNotes}>{log.notes}</span>}
                    </div>
                    <div className={styles.weightActions}>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleEditWeight(log)}
                        aria-label="Edit"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleDeleteWeight(log.id)}
                        aria-label="Delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
