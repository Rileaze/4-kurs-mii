import { useState } from 'react';
import type { ReactNode } from 'react';
import type { OrderLine, OrderSummary } from '../types';
import { ORDER_STATUS_LABELS, orderLineTotal } from '../lib/orders';
import { formatRub } from '../lib/pricing';

interface Props {
  order: OrderSummary;
  lines: readonly OrderLine[];
  /** Customer e-mail, shown to administrators. */
  customer?: string;
  /** Buttons or selects shown under the details (cancel, change status). */
  actions?: ReactNode;
}

const PERIOD_LABELS = { day: 'День', week: 'Неделя' } as const;

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

function formatDate(iso: string): string {
  const parsed = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(parsed.getTime()) ? iso : dateFmt.format(parsed);
}

/** One order with an expandable breakdown of its items. */
export function OrderCard({ order, lines, customer, actions }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <li className="order-card">
      <button
        type="button"
        className="order-card__head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="order-card__main">
          <strong>{customer ?? `Заказ от ${formatDate(order.createdAt)}`}</strong>
          <span className="muted">
            Доставка с {formatDate(order.deliveryDate)} · {ORDER_STATUS_LABELS[order.status]}
          </span>
        </span>
        <strong>{formatRub(order.total)}</strong>
      </button>
      {open && (
        <div className="order-card__body">
          <dl className="order-card__meta">
            <dt>Номер</dt>
            <dd>{order.id}</dd>
            <dt>Создан</dt>
            <dd>{formatDate(order.createdAt)}</dd>
            {order.deliveryAddress && (
              <>
                <dt>Адрес</dt>
                <dd>{order.deliveryAddress}</dd>
              </>
            )}
            {customer && (
              <>
                <dt>Клиент</dt>
                <dd>{customer}</dd>
              </>
            )}
          </dl>
          {lines.length === 0 ? (
            <p className="muted">Состав заказа недоступен</p>
          ) : (
            <table className="lines">
              <thead>
                <tr>
                  <th>Рацион</th>
                  <th>Период</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={`${l.planId}-${l.period}`}>
                    <td>{l.planName}</td>
                    <td>{PERIOD_LABELS[l.period]}</td>
                    <td>{l.qty}</td>
                    <td>{formatRub(l.unitPrice)}</td>
                    <td>{formatRub(orderLineTotal(l))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {actions && <div className="order-card__actions">{actions}</div>}
        </div>
      )}
    </li>
  );
}
