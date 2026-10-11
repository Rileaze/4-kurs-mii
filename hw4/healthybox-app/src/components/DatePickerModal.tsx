import { useState } from 'react';
import { earliestDeliveryDate, isDeliveryDateAllowed } from '../lib/cart';

interface Props {
  today: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

const DAYS_SHOWN = 14;
const dateFmt = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });

export function DatePickerModal({ today, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<Date | null>(null);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Array.from(
    { length: DAYS_SHOWN },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
  const earliest = earliestDeliveryDate(today);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Дата первой доставки">
      <div className="modal__panel">
        <h2>Дата первой доставки</h2>
        <p className="muted">Не ранее {dateFmt.format(earliest)} (минимальный срок производства 2 дня)</p>
        <div className="calendar">
          {days.map((d) => {
            const allowed = isDeliveryDateAllowed(d, today);
            const isSelected = selected?.getTime() === d.getTime();
            return (
              <button
                key={d.getTime()}
                type="button"
                disabled={!allowed}
                aria-pressed={isSelected}
                className={isSelected ? 'day day--selected' : 'day'}
                onClick={() => setSelected(d)}
              >
                {dateFmt.format(d)}
              </button>
            );
          })}
        </div>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn"
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}
