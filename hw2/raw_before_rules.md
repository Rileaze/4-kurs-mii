Реализация на TypeScript. Расчёт ведётся в копейках (целые числа), чтобы не накапливать ошибки float.

```ts
// pricing.ts
export type Period = 'day' | 'week';

export const DAYS_IN_WEEK = 7;
export const WEEK_DISCOUNT = 0.10;

export interface PriceResult {
  total: number;   // итог в рублях (округлён до копеек)
  label: string;   // строка для UI
}

const rubFormat = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function calculateBoxPrice(
  period: Period,
  dayPrice: number,
  quantity: number,
): PriceResult {
  if (period !== 'day' && period !== 'week') {
    throw new RangeError(`Unknown period: ${period}`);
  }
  if (!Number.isFinite(dayPrice) || dayPrice < 0) {
    throw new RangeError('dayPrice must be a non-negative number');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new RangeError('quantity must be a positive integer');
  }

  const dayKopecks = Math.round(dayPrice * 100);
  const days = period === 'week' ? DAYS_IN_WEEK : 1;

  let kopecks = dayKopecks * days * quantity;
  if (period === 'week') {
    // скидка 10% без float: умножаем на 90 и делим на 100
    kopecks = Math.round((kopecks * 90) / 100);
  }

  const total = kopecks / 100;
  const periodText = period === 'week' ? 'неделя (7 дней, скидка 10%)' : 'день';
  const label = `${rubFormat.format(total)} ₽ — ${quantity} × ${periodText}`;

  return { total, label };
}
```

Тесты (Jest/Vitest):

```ts
// pricing.test.ts
import { calculateBoxPrice } from './pricing';

describe('calculateBoxPrice', () => {
  it('день, один набор', () => {
    expect(calculateBoxPrice('day', 500, 1).total).toBe(500);
  });
  it('день, несколько наборов', () => {
    expect(calculateBoxPrice('day', 500, 3).total).toBe(1500);
  });
  it('неделя: 7 дней со скидкой 10%', () => {
    expect(calculateBoxPrice('week', 500, 1).total).toBe(3150); // 3500 * 0.9
  });
  it('неделя, несколько наборов', () => {
    expect(calculateBoxPrice('week', 500, 2).total).toBe(6300);
  });
  it('округление до копеек', () => {
    expect(calculateBoxPrice('week', 333.33, 1).total).toBe(2099.98);
  });
  it('строка для UI', () => {
    const { label } = calculateBoxPrice('week', 500, 1);
    expect(label).toContain('3');           // 3 150
    expect(label).toContain('₽');
    expect(label).toContain('скидка 10%');
  });
  it('невалидный ввод', () => {
    expect(() => calculateBoxPrice('month' as any, 500, 1)).toThrow(RangeError);
    expect(() => calculateBoxPrice('day', -1, 1)).toThrow(RangeError);
    expect(() => calculateBoxPrice('day', 500, 0)).toThrow(RangeError);
    expect(() => calculateBoxPrice('day', 500, 1.5)).toThrow(RangeError);
  });
});
```

Замечания:
- Скидка применяется к общей сумме (7 дней × количество), округление один раз в конце.
- Количество должно быть целым >= 1, иначе RangeError. Если нужна поддержка 0 (пустая корзина), поменяйте проверку.
- Пример: `calculateBoxPrice('week', 500, 1)` даёт `{ total: 3150, label: '3 150 ₽ — 1 × неделя (7 дней, скидка 10%)' }`. Разделитель тысяч в `Intl` это неразрывный пробел, поэтому в тестах на label лучше не сравнивать строку целиком.
- Файлы я не читал и не создавал, как вы просили. Если проект не на TypeScript, код легко перенести на JS, убрав типы.
