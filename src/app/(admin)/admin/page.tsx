'use client';

import { useState } from 'react';
import { FoodTable } from '@/components/admin/FoodTable';
import { FoodEditor } from '@/components/admin/FoodEditor';
import styles from './page.module.css';

const TABS = ['Foods'] as const;
type Tab = (typeof TABS)[number];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Foods');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);

  const handleSelectFood = (foodId: string | null) => {
    setSelectedFoodId(foodId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => {
              setActiveTab(tab);
              setSelectedFoodId(null);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'Foods' && (
          selectedFoodId !== null ? (
            <FoodEditor
              foodId={selectedFoodId === 'new' ? null : selectedFoodId}
              onBack={() => setSelectedFoodId(null)}
            />
          ) : (
            <FoodTable onSelectFood={handleSelectFood} />
          )
        )}
      </div>
    </div>
  );
};

export default AdminPage;
