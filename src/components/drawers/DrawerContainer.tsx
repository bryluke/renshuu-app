'use client';

import { ActionMenuDrawer } from './ActionMenuDrawer';
import { MealTypeDrawer } from './MealTypeDrawer';
import { FoodSearchDrawer } from './FoodSearchDrawer';
import { FoodFormDrawer } from './FoodFormDrawer';
import { CustomFoodFormDrawer } from './CustomFoodFormDrawer';
import { WeightFormDrawer } from './WeightFormDrawer';
import { ProfileFormDrawer } from './ProfileFormDrawer';
import { GoalsFormDrawer } from './GoalsFormDrawer';

export const DrawerContainer = () => {
  return (
    <>
      <ActionMenuDrawer />
      <MealTypeDrawer />
      <FoodSearchDrawer />
      <FoodFormDrawer />
      <CustomFoodFormDrawer />
      <WeightFormDrawer />
      <ProfileFormDrawer />
      <GoalsFormDrawer />
    </>
  );
};
