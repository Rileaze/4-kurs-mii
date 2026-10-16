import { describe, expect, it } from 'vitest';
import { PLANS } from './mock';

describe('mock catalog', () => {
  it('has unique plan ids and prices in whole rubles', () => {
    const ids = PLANS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PLANS) expect(Number.isInteger(p.dayPrice) && p.dayPrice > 0).toBe(true);
  });

  it('gives every plan a full 7-day menu with four meals a day', () => {
    for (const p of PLANS) {
      expect(p.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
      for (const d of p.days) {
        expect(d.meals.map((m) => m.title)).toEqual(['Завтрак', 'Обед', 'Перекус', 'Ужин']);
      }
    }
  });

  it('keeps dish ids unique per dish across all plans', () => {
    const byId = new Map<string, string>();
    for (const p of PLANS) {
      for (const d of p.days) {
        for (const m of d.meals) {
          const known = byId.get(m.dish.id);
          expect(known === undefined || known === m.dish.name).toBe(true);
          byId.set(m.dish.id, m.dish.name);
        }
      }
    }
    expect(byId.size).toBe(32);
  });

  it('keeps the vegetarian plan free of meat and fish', () => {
    const veg = PLANS.find((p) => p.id === 'veg');
    const banned = /кур|говяд|индей|лосос|судак|кревет|рыб/i;
    for (const d of veg?.days ?? []) {
      for (const m of d.meals) expect(m.dish.ingredients.join(' ')).not.toMatch(banned);
    }
  });
});
