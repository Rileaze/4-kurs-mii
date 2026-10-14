export type Period = 'day' | 'week';

export interface Dish {
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

export interface Meal {
  title: string;
  dish: Dish;
}

export interface MenuDay {
  day: number;
  meals: Meal[];
}

export interface Plan {
  id: string;
  name: string;
  emoji: string;
  goal: 'loss' | 'maintain' | 'gain';
  description: string;
  kcalPerDay: number;
  dayPrice: number;
  days: MenuDay[];
}

export interface CartItem {
  key: string;
  planId: string;
  name: string;
  emoji: string;
  period: Period;
  unitPrice: number;
  qty: number;
  deliveryDate: Date;
}

export type Role = 'user' | 'admin';

export type OrderStatus = 'draft' | 'placed' | 'cancelled';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface OrderSummary {
  id: string;
  userId: string;
  status: OrderStatus;
  deliveryDate: string;
  createdAt: string;
  total: number;
}

export interface ProfileSummary {
  id: string;
  email: string;
  role: Role;
}
