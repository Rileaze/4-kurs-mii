import type { Dish, MenuDay, Plan } from '../types';

export interface DishRow {
  id: string;
  name: string;
  emoji: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: string[];
  allergens: string[];
}

export interface PlanRow {
  id: string;
  name: string;
  emoji: string;
  goal: Plan['goal'];
  description: string;
  kcal_per_day: number;
  day_price: number;
  plan_meals: { day: number; meal_title: string; dishes: DishRow }[];
}

const MEAL_ORDER = ['Завтрак', 'Обед', 'Перекус', 'Ужин'];

const toDish = (r: DishRow): Dish => ({ ...r });

/** Converts the nested PostgREST response (plans → plan_meals → dishes) into Plan[]. */
export function mapPlanRows(rows: readonly PlanRow[]): Plan[] {
  return rows.map((row) => {
    const byDay = new Map<number, MenuDay>();
    for (const m of row.plan_meals) {
      const day = byDay.get(m.day) ?? { day: m.day, meals: [] };
      day.meals.push({ title: m.meal_title, dish: toDish(m.dishes) });
      byDay.set(m.day, day);
    }
    const days = [...byDay.values()]
      .sort((a, b) => a.day - b.day)
      .map((d) => ({
        ...d,
        meals: [...d.meals].sort(
          (a, b) => MEAL_ORDER.indexOf(a.title) - MEAL_ORDER.indexOf(b.title),
        ),
      }));
    return {
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      goal: row.goal,
      description: row.description,
      kcalPerDay: row.kcal_per_day,
      dayPrice: row.day_price,
      days,
    };
  });
}
