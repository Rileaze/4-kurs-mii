import { useState } from 'react';
import type { Dish, Period, Plan } from '../types';
import { calcSetPrice, formatRub } from '../lib/pricing';
import { DatePickerModal } from '../components/DatePickerModal';

interface Props {
  plan: Plan;
  period: Period;
  today: Date;
  onAdd: (plan: Plan, period: Period, date: Date) => void;
  onBack: () => void;
}

export function SetPage({ plan, period, today, onAdd, onBack }: Props) {
  const [dayIndex, setDayIndex] = useState(0);
  const [dish, setDish] = useState<Dish | null>(null);
  const [pickingDate, setPickingDate] = useState(false);
  const day = plan.days[dayIndex];

  if (dish) {
    return (
      <section>
        <button type="button" className="link" onClick={() => setDish(null)}>
          ← Назад
        </button>
        <h1>
          {dish.emoji} {dish.name}
        </h1>
        <p className="muted">{dish.grams} г · {dish.kcal} ккал</p>
        <p>Белки {dish.protein} г · Жиры {dish.fat} г · Углеводы {dish.carbs} г</p>
        <h2>Состав</h2>
        <p>{dish.ingredients.join(', ')}</p>
        <h2>Аллергены</h2>
        <p>{dish.allergens.length > 0 ? dish.allergens.join(', ') : 'Не указаны'}</p>
      </section>
    );
  }

  return (
    <section>
      <button type="button" className="link" onClick={onBack}>
        ← К каталогу
      </button>
      <h1>
        {plan.emoji} {plan.name}
      </h1>
      <p>{plan.description}</p>
      <p className="muted">{plan.kcalPerDay} ккал в день</p>
      <p className="price">
        {formatRub(calcSetPrice(period, plan.dayPrice))} за {period === 'day' ? 'день' : 'неделю'}
      </p>

      <div className="tabs" role="tablist" aria-label="Дни набора">
        {plan.days.map((d, i) => (
          <button
            key={d.day}
            type="button"
            role="tab"
            aria-selected={i === dayIndex}
            className={i === dayIndex ? 'tab tab--active' : 'tab'}
            onClick={() => setDayIndex(i)}
          >
            День {d.day}
          </button>
        ))}
      </div>

      <ul className="meals">
        {day.meals.map((m) => (
          <li key={m.title}>
            <button type="button" className="meal" onClick={() => setDish(m.dish)}>
              <span className="meal__emoji" aria-hidden="true">{m.dish.emoji}</span>
              <span>
                <strong>{m.title}</strong>
                <br />
                {m.dish.name} · {m.dish.grams} г
              </span>
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="btn btn--block" onClick={() => setPickingDate(true)}>
        Добавить в корзину
      </button>

      {pickingDate && (
        <DatePickerModal
          today={today}
          onClose={() => setPickingDate(false)}
          onConfirm={(date) => {
            setPickingDate(false);
            onAdd(plan, period, date);
          }}
        />
      )}
    </section>
  );
}
