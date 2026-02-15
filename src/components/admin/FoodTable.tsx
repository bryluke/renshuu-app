'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Food } from '@/types/foods';
import styles from './FoodTable.module.css';

interface FoodTableProps {
  onSelectFood: (foodId: string) => void;
}

const CATEGORIES = ['all', 'hawker', 'drinks', 'fast_food', 'basics', 'custom'] as const;
const STATUSES = ['all', 'approved', 'pending'] as const;

export const FoodTable = ({ onSelectFood }: FoodTableProps) => {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  const debouncedSearch = useDebounce(search, 300);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('foods')
      .select('*')
      .order('created_at', { ascending: false });

    if (debouncedSearch) {
      query = query.ilike('display_name', `%${debouncedSearch}%`);
    }

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    if (status === 'approved') {
      query = query.eq('is_approved', true);
    } else if (status === 'pending') {
      query = query.or('is_approved.eq.false,is_approved.is.null');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching foods:', error);
    } else {
      setFoods(data || []);
    }

    setLoading(false);
  }, [debouncedSearch, category, status]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const handleApprove = async (foodId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('foods')
      .update({ is_approved: true, approved_by: user?.id })
      .eq('id', foodId);

    if (error) {
      console.error('Error approving food:', error);
      alert('Failed to approve food');
      return;
    }

    await fetchFoods();
  };

  const handleDelete = async (foodId: string, foodName: string) => {
    if (!confirm(`Delete "${foodName}"? This will also delete all its portions and addons.`)) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('foods')
      .delete()
      .eq('id', foodId);

    if (error) {
      console.error('Error deleting food:', error);
      alert('Failed to delete food');
      return;
    }

    await fetchFoods();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <input
              type="text"
              placeholder="Search foods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button
                className={styles.clearButton}
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={styles.select}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={styles.select}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Status' : s}
              </option>
            ))}
          </select>
        </div>

        <button
          className={styles.newButton}
          onClick={() => onSelectFood('new')}
        >
          + New Food
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading foods...</div>
      ) : foods.length === 0 ? (
        <div className={styles.emptyState}>No foods found</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {foods.map((food) => (
                <tr key={food.id}>
                  <td className={styles.nameCell}>{food.display_name}</td>
                  <td>
                    <span className={styles.categoryBadge}>
                      {food.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={styles.subcategoryCell}>{food.subcategory || '-'}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        food.is_approved ? styles.approved : styles.pending
                      }`}
                    >
                      {food.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className={styles.dateCell}>{formatDate(food.created_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      {!food.is_approved && (
                        <button
                          className={styles.approveButton}
                          onClick={() => handleApprove(food.id)}
                        >
                          Approve
                        </button>
                      )}
                      <button
                        className={styles.editButton}
                        onClick={() => onSelectFood(food.id)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(food.id, food.display_name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.count}>
        {foods.length} food{foods.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
