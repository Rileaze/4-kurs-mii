import type { Period } from '../types';

interface Props {
  value: Period;
  onChange: (period: Period) => void;
}

const OPTIONS: { value: Period; label: string }[] = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
];

export function PeriodToggle({ value, onChange }: Props) {
  return (
    <div className="toggle" role="group" aria-label="Срок набора">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? 'toggle__btn toggle__btn--active' : 'toggle__btn'}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
