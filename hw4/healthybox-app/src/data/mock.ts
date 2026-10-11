import type { Dish, MenuDay, Plan } from '../types';

const dish = (
  id: string,
  name: string,
  emoji: string,
  grams: number,
  kcal: number,
  protein: number,
  fat: number,
  carbs: number,
  ingredients: string[],
  allergens: string[] = [],
): Dish => ({ id, name, emoji, grams, kcal, protein, fat, carbs, ingredients, allergens });

const BREAKFASTS = [
  dish('d1', 'Овсянка с ягодами', '🥣', 250, 340, 12, 8, 55, ['овсяные хлопья', 'молоко', 'ягоды'], ['глютен', 'молоко']),
  dish('d2', 'Омлет с овощами', '🍳', 220, 310, 20, 21, 8, ['яйца', 'томаты', 'шпинат'], ['яйца']),
];
const LUNCHES = [
  dish('d3', 'Курица с булгуром', '🍗', 350, 520, 42, 14, 55, ['куриная грудка', 'булгур', 'брокколи'], ['глютен']),
  dish('d4', 'Лосось с рисом', '🐟', 330, 560, 38, 22, 48, ['лосось', 'рис', 'огурец'], ['рыба']),
];
const SNACKS = [
  dish('d5', 'Творог с орехами', '🥜', 180, 240, 22, 10, 12, ['творог', 'миндаль', 'мёд'], ['молоко', 'орехи']),
  dish('d6', 'Йогурт с яблоком', '🍎', 200, 190, 9, 5, 28, ['йогурт', 'яблоко'], ['молоко']),
];
const DINNERS = [
  dish('d7', 'Индейка с овощами', '🥘', 320, 410, 36, 12, 32, ['филе индейки', 'кабачок', 'морковь']),
  dish('d8', 'Чечевичный суп', '🍲', 350, 380, 20, 9, 52, ['чечевица', 'морковь', 'лук']),
];

function buildDays(seed: number): MenuDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const n = i + seed;
    return {
      day: i + 1,
      meals: [
        { title: 'Завтрак', dish: BREAKFASTS[n % 2] },
        { title: 'Обед', dish: LUNCHES[(n + 1) % 2] },
        { title: 'Перекус', dish: SNACKS[n % 2] },
        { title: 'Ужин', dish: DINNERS[(n + 1) % 2] },
      ],
    };
  });
}

export const PLANS: Plan[] = [
  {
    id: 'light',
    name: 'Лёгкий',
    emoji: '🥗',
    goal: 'loss',
    description: 'Сбалансированный рацион для снижения веса без жёстких ограничений.',
    kcalPerDay: 1400,
    dayPrice: 590,
    days: buildDays(0),
  },
  {
    id: 'balance',
    name: 'Баланс',
    emoji: '🍱',
    goal: 'maintain',
    description: 'Рацион для поддержания веса и энергии в течение рабочего дня.',
    kcalPerDay: 1800,
    dayPrice: 650,
    days: buildDays(1),
  },
  {
    id: 'mass',
    name: 'Масса',
    emoji: '💪',
    goal: 'gain',
    description: 'Повышенная калорийность и белок для набора мышечной массы.',
    kcalPerDay: 2600,
    dayPrice: 790,
    days: buildDays(2),
  },
];
