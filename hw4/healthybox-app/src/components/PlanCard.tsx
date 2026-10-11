import type { Period, Plan } from '../types';
import { calcSetPrice, formatRub } from '../lib/pricing';

interface Props {
  plan: Plan;
  period: Period;
  onOpen: (plan: Plan) => void;
}

export function PlanCard({ plan, period, onOpen }: Props) {
  const price = calcSetPrice(period, plan.dayPrice);
  return (
    <button type="button" className="card" onClick={() => onOpen(plan)}>
      <span className="card__photo" aria-hidden="true">
        {plan.emoji}
      </span>
      <span className="card__body">
        <span className="card__title">{plan.name}</span>
        <span className="card__meta">{plan.kcalPerDay} ккал в день</span>
        <span className="card__price">
          от {formatRub(price)} / {period === 'day' ? 'день' : 'неделя'}
        </span>
      </span>
    </button>
  );
}
