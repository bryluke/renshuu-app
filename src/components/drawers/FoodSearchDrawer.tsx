'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDrawer } from '@/contexts/DrawerContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { FoodSearchResult } from '@/types/foods';
import { Drawer } from './Drawer';
import styles from './FoodSearchDrawer.module.css';

interface RecentFood {
  food_id: string;
  food_name: string;
}

export function FoodSearchDrawer() {
  const { drawerType, drawerData, closeDrawer, openDrawer } = useDrawer();
  const { user } = useAuth();
  const [foods, setFoods] = useState<FoodSearchResult[]>([]);
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const isOpen = drawerType === 'food-search';

  const fetchRecentFoods = useCallback(async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('meal_foods')
        .select(`
          food_id,
          food_name,
          created_at,
          meals!inner(user_id)
        `)
        .eq('meals.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const uniqueFoods = (data || [])
        .filter((item): item is typeof item & { food_id: string } =>
          item.food_id !== null
        )
        .reduce((acc: RecentFood[], item) => {
          if (!acc.some(f => f.food_id === item.food_id)) {
            acc.push({ food_id: item.food_id, food_name: item.food_name });
          }
          return acc;
        }, [])
        .slice(0, 8);

      setRecentFoods(uniqueFoods);
    } catch (err) {
      console.error('Error fetching recent foods:', err);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchRecentFoods();
    } else {
      setSearchQuery('');
      setFoods([]);
    }
  }, [isOpen, fetchRecentFoods]);

  useEffect(() => {
    if (isOpen && debouncedSearchQuery.length >= 2) {
      searchFoods(debouncedSearchQuery);
    } else if (isOpen && debouncedSearchQuery.length === 0) {
      setFoods([]);
    }
  }, [isOpen, debouncedSearchQuery]);

  const searchFoods = async (query: string) => {
    try {
      setLoading(true);
      const supabase = createClient();

      // RLS handles visibility: approved foods + user's own custom foods
      const { data, error } = await supabase
        .from('foods')
        .select('id, display_name, category, subcategory, description')
        .ilike('display_name', `%${query}%`)
        .order('display_name')
        .limit(50);

      if (error) throw error;
      setFoods(data || []);
    } catch (err) {
      console.error('Error searching foods:', err);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food: FoodSearchResult) => {
    openDrawer('food-form', {
      ...drawerData,
      foodId: food.id,
      foodName: food.display_name,
    });
  };

  const handleCreateCustom = () => {
    openDrawer('custom-food-form', {
      ...drawerData,
      suggestedName: searchQuery,
    });
  };

  const handleSelectRecent = (food: RecentFood) => {
    openDrawer('food-form', {
      ...drawerData,
      foodId: food.food_id,
      foodName: food.food_name,
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFoods([]);
  };

  const showRecentFoods = searchQuery.length < 2 && recentFoods.length > 0;
  const showEmptyState = searchQuery.length < 2 && recentFoods.length === 0;
  const showNoResults = searchQuery.length >= 2 && foods.length === 0;
  const showResults = searchQuery.length >= 2 && foods.length > 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title="Select Food"
    >
      <div className={styles.container}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className={styles.clearButton}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {loading ? (
          <p className={styles.loading}>Searching...</p>
        ) : (
          <div className={styles.foodList}>
            {showEmptyState && (
              <p className={styles.empty}>Start typing to search foods</p>
            )}

            {showRecentFoods && (
              <>
                <p className={styles.sectionLabel}>Recent</p>
                {recentFoods.map((food) => (
                  <button
                    key={food.food_id}
                    onClick={() => handleSelectRecent(food)}
                    className={styles.foodItem}
                  >
                    <div className={styles.foodName}>{food.food_name}</div>
                  </button>
                ))}
              </>
            )}

            {showNoResults && (
              <div className={styles.noResults}>
                <p className={styles.empty}>No foods found</p>
                <button
                  onClick={handleCreateCustom}
                  className={styles.createCustomButton}
                >
                  + Create &quot;{searchQuery}&quot;
                </button>
              </div>
            )}

            {showResults && (
              <>
                {foods.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className={styles.foodItem}
                  >
                    <div className={styles.foodName}>{food.display_name}</div>
                    <div className={styles.foodCategory}>{food.category}</div>
                  </button>
                ))}
                <button
                  onClick={handleCreateCustom}
                  className={styles.createCustomLink}
                >
                  Can&apos;t find it? Create custom food
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
