## Файлы
- `src/lib/calcBoxPrice.ts` (новый)
- `src/lib/calcBoxPrice.test.ts` (новый)

Инструменты не использовались: файлы не читались и не создавались, как вы просили. Код ниже.

## `src/lib/calcBoxPrice.ts`

```ts
export type Period = 'day' | 'week';

export interface BoxPriceInput {
  period: Period;
  /** Цена одного дня питания, целые рубли. */
  dayPrice: number;
  /** Количество наборов. */
  quantity: number;
}

export interface BoxPrice {
  /** Итоговая цена, целые рубли. */
  total: number;
  /** Готовая строка для UI, например «Неделя, 2 шт. — 6 300 ₽». */
  label: string;
}

const DAYS_IN_WEEK = 7;
const WEEK_DISCOUNT_PERCENT = 10;
const NBSP = ' ';

const PERIOD_TITLES: Record<Period, string> = {
  day: 'День',
  week: 'Неделя',
};

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer, got ${value}`);
  }
}

function formatRubles(amount: number): string {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}${NBSP}₽`;
}

/**
 * Считает итоговую цену набора и строку для показа в UI.
 * Неделя = 7 дней со скидкой 10%. Цена одного набора округляется
 * до целых рублей (half up), затем умножается на количество.
 *
 * @param input.period - период: 'day' или 'week'
 * @param input.dayPrice - цена одного дня в целых рублях (> 0)
 * @param input.quantity - количество наборов (целое, > 0)
 * @throws {RangeError} если dayPrice или quantity не положительные целые,
 * либо period не 'day' и не 'week'
 */
export function calcBoxPrice({ period, dayPrice, quantity }: BoxPriceInput): BoxPrice {
  assertPositiveInteger(dayPrice, 'dayPrice');
  assertPositiveInteger(quantity, 'quantity');

  let unitPrice: number;
  if (period === 'day') {
    unitPrice = dayPrice;
  } else if (period === 'week') {
    const fullPercent = 100 - WEEK_DISCOUNT_PERCENT;
    // целочисленная арифметика, округление half up без float-ошибок
    unitPrice = Math.floor((dayPrice * DAYS_IN_WEEK * fullPercent + 50) / 100);
  } else {
    throw new RangeError(`Unknown period: ${String(period)}`);
  }

  const total = unitPrice * quantity;
  const label = `${PERIOD_TITLES[period]}, ${quantity}${NBSP}шт. — ${formatRubles(total)}`;

  return { total, label };
}
```

## `src/lib/calcBoxPrice.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { calcBoxPrice } from './calcBoxPrice';

describe('calcBoxPrice', () => {
  it('считает день без скидки с учётом количества', () => {
    const result = calcBoxPrice({ period: 'day', dayPrice: 500, quantity: 2 });
    expect(result.total).toBe(1000);
    expect(result.label).toBe('День, 2 шт. — 1 000 ₽');
  });

  it('считает неделю со скидкой 10%', () => {
    const result = calcBoxPrice({ period: 'week', dayPrice: 500, quantity: 2 });
    expect(result.total).toBe(6300); // 500 * 7 * 0.9 = 3150 за набор
    expect(result.label).toBe('Неделя, 2 шт. — 6 300 ₽');
  });

  it('округляет цену недели до целого рубля (half up)', () => {
    // 335 * 7 * 0.9 = 2110.5 -> 2111
    expect(calcBoxPrice({ period: 'week', dayPrice: 335, quantity: 1 }).total).toBe(2111);
  });

  it('работает на минимальных значениях', () => {
    expect(calcBoxPrice({ period: 'day', dayPrice: 1, quantity: 1 }).total).toBe(1);
    // 1 * 7 * 0.9 = 6.3 -> 6
    expect(calcBoxPrice({ period: 'week', dayPrice: 1, quantity: 1 }).total).toBe(6);
  });

  it('не мутирует входной объект', () => {
    const input = Object.freeze({ period: 'week' as const, dayPrice: 500, quantity: 1 });
    expect(() => calcBoxPrice(input)).not.toThrow();
  });

  it('бросает ошибку при некорректной цене', () => {
    expect(() => calcBoxPrice({ period: 'day', dayPrice: 0, quantity: 1 })).toThrow(RangeError);
    expect(() => calcBoxPrice({ period: 'day', dayPrice: -10, quantity: 1 })).toThrow(RangeError);
    expect(() => calcBoxPrice({ period: 'day', dayPrice: 99.5, quantity: 1 })).toThrow(RangeError);
  });

  it('бросает ошибку при некорректном количестве', () => {
    expect(() => calcBoxPrice({ period: 'day', dayPrice: 500, quantity: 0 })).toThrow(RangeError);
    expect(() => calcBoxPrice({ period: 'day', dayPrice: 500, quantity: 1.5 })).toThrow(RangeError);
    expect(() => calcBoxPrice({ period: 'day', dayPrice: 500, quantity: NaN })).toThrow(RangeError);
  });

  it('бросает ошибку при неизвестном периоде', () => {
    // @ts-expect-error проверяем защиту в рантайме
    expect(() => calcBoxPrice({ period: 'month', dayPrice: 500, quantity: 1 })).toThrow(
      'Unknown period',
    );
  });
});
```

## Допущения
- Скидка 10% применяется к одному набору на неделю: `dayPrice × 7 × 0.9`. Затем цена округляется до целого рубля и умножается на количество. Так цена набора в UI и итог не расходятся.
- Округление идёт по правилу half up и целочисленной арифметикой, без float. Например, 2110,5 превращается в 2111.
- Скидка за количество наборов не предусмотрена, потому что в задаче её нет.
- Невалидный ввод (цена или количество не положительные целые, неизвестный период) бросает `RangeError`. Ноль не допускается ни для цены, ни для количества.
- Формат строки: `Неделя, 2 шт. — 6 300 ₽`. Разделитель тысяч и пробелы перед «₽» и «шт.» заменены неразрывным пробелом. Он нужен, чтобы строка не переносилась в мобильном UI, и не зависит от локали и версии `Intl`. Если нужна другая формулировка или склонение («набор/набора/наборов»), это меняется только в `label`.
- Константы `DAYS_IN_WEEK` и `WEEK_DISCOUNT_PERCENT` лежат в файле функции. Если они понадобятся в других местах, их можно вынести в `src/data`.
- Тест на неизвестный период использует `@ts-expect-error`, потому что правила запрещают только `@ts-ignore`. Если нужно запретить и его, тест можно переписать так, чтобы значение приходило из внешнего источника типа `unknown` с проверкой.
