/** One meal of the weekly menu: the main course is mandatory, starter and dessert are optional. */
export interface MealSlot {
  plat_id?: string;
  entree_id?: string;
  dessert_id?: string;
}

export type MealType = 'lunch' | 'dinner';

export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayPlan {
  day_id: DayId;
  day_name_fr: string;
  day_name_derja: string;
  day_name_ar: string;
  lunch: MealSlot;
  dinner: MealSlot;
}
