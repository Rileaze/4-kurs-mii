import { describe, expect, it } from 'vitest';
import { PLANS } from './mock';
import { mapPlanRows, type PlanRow } from './mapRows';
import { toApiError } from './supabaseApi';

describe('mapPlanRows', () => {
  it('builds ordered days and meals from nested rows', () => {
    const light = PLANS[0];
    const rows: PlanRow[] = [
      {
        id: light.id,
        name: light.name,
        emoji: light.emoji,
        goal: light.goal,
        description: light.description,
        kcal_per_day: light.kcalPerDay,
        day_price: light.dayPrice,
        // deliberately shuffled: the mapper must sort days and meals
        plan_meals: [...light.days]
          .reverse()
          .flatMap((d) =>
            [...d.meals].reverse().map((m) => ({ day: d.day, meal_title: m.title, dishes: m.dish })),
          ),
      },
    ];
    expect(mapPlanRows(rows)).toEqual([light]);
  });
});

describe('toApiError', () => {
  it('maps auth, RLS and validation errors to user-facing messages', () => {
    expect(toApiError({ message: 'x' }, 401).status).toBe(401);
    expect(toApiError({ message: 'x', code: '42501' }, 403).message).toBe('Нет доступа к этим данным');
    expect(toApiError({ message: 'x', code: '22023' }).status).toBe(422);
  });

  it('falls back to a generic message without leaking details', () => {
    const err = toApiError({ message: 'relation "secret_table" does not exist' }, 500);
    expect(err.message).not.toContain('secret_table');
  });
});
