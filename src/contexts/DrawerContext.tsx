'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type DrawerType =
  | 'action-menu'
  | 'meal-type'
  | 'food-search'
  | 'food-form'
  | 'custom-food-form'
  | 'weight-form'
  | 'profile-form'
  | 'goals-form'
  | null;

interface DrawerContextType {
  drawerType: DrawerType;
  drawerData: any;
  openDrawer: (type: DrawerType, data?: any) => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [drawerType, setDrawerType] = useState<DrawerType>(null);
  const [drawerData, setDrawerData] = useState<any>(null);

  const openDrawer = (type: DrawerType, data?: any) => {
    setDrawerType(type);
    setDrawerData(data || null);
  };

  const closeDrawer = () => {
    setDrawerType(null);
    setDrawerData(null);
  };

  return (
    <DrawerContext.Provider value={{ drawerType, drawerData, openDrawer, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
}
