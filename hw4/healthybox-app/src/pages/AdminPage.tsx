import { useCallback, useState } from 'react';
import type { OrderStatus, Plan, Role } from '../types';
import {
  fetchOrders,
  fetchProfiles,
  setOrderStatus,
  setUserRole,
  updatePlanPrice,
} from '../data/accountApi';
import { fetchPlans } from '../data/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../hooks/useAuth';
import { formatRub } from '../lib/pricing';
import { parsePrice } from '../lib/validation';
import { EmptyView, ErrorView, LoadingView } from '../components/StateViews';
import { ORDER_STATUS_LABELS } from '../components/orderStatus';

type Tab = 'orders' | 'users' | 'prices';

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'orders', label: 'Заказы' },
  { id: 'users', label: 'Пользователи' },
  { id: 'prices', label: 'Цены' },
];

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : 'Что-то пошло не так';
}

function FormError({ message }: { message: string | null }) {
  return message ? (
    <p className="form__error" role="alert">
      {message}
    </p>
  ) : null;
}

function OrdersTab() {
  const load = useCallback(() => Promise.all([fetchOrders(), fetchProfiles()]), []);
  const { state, reload } = useAsync(load);
  const [error, setError] = useState<string | null>(null);

  if (state.status === 'loading') return <LoadingView />;
  if (state.status === 'error') return <ErrorView message={state.message} onRetry={reload} />;
  const [orders, profiles] = state.data;
  if (orders.length === 0) return <EmptyView text="Заказов пока нет" />;
  const emails = new Map(profiles.map((p) => [p.id, p.email]));

  const change = async (id: string, status: OrderStatus) => {
    try {
      setError(null);
      await setOrderStatus(id, status);
      reload();
    } catch (e: unknown) {
      setError(errorText(e));
    }
  };

  return (
    <>
      <FormError message={error} />
      <ul className="cart">
        {orders.map((o) => (
          <li key={o.id} className="order">
            <div>
              <strong>{emails.get(o.userId) ?? 'Неизвестный пользователь'}</strong>
              <span className="muted">Доставка с {o.deliveryDate}</span>
              <strong>{formatRub(o.total)}</strong>
            </div>
            <select
              aria-label={`Статус заказа ${o.id}`}
              value={o.status}
              onChange={(e) => void change(o.id, e.target.value as OrderStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </>
  );
}

function UsersTab({ selfId }: { selfId: string }) {
  const { state, reload } = useAsync(fetchProfiles);
  const [error, setError] = useState<string | null>(null);

  if (state.status === 'loading') return <LoadingView />;
  if (state.status === 'error') return <ErrorView message={state.message} onRetry={reload} />;

  const change = async (id: string, role: Role) => {
    try {
      setError(null);
      await setUserRole(id, role);
      reload();
    } catch (e: unknown) {
      setError(errorText(e));
    }
  };

  return (
    <>
      <FormError message={error} />
      <ul className="cart">
        {state.data.map((p) => (
          <li key={p.id} className="order">
            <strong>{p.email}</strong>
            <select
              aria-label={`Роль ${p.email}`}
              value={p.role}
              disabled={p.id === selfId}
              onChange={(e) => void change(p.id, e.target.value === 'admin' ? 'admin' : 'user')}
            >
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </li>
        ))}
      </ul>
    </>
  );
}

function PriceRow({ plan, onSaved }: { plan: Plan; onSaved: () => void }) {
  const [value, setValue] = useState(String(plan.dayPrice));
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const price = parsePrice(value);
    if (price === null) {
      setError('Введите целое число рублей больше нуля');
      return;
    }
    try {
      setError(null);
      await updatePlanPrice(plan.id, price);
      onSaved();
    } catch (e: unknown) {
      setError(errorText(e));
    }
  };

  return (
    <li className="order">
      <div>
        <strong>{plan.name}</strong>
        <span className="muted">Цена за день, ₽</span>
        <FormError message={error} />
      </div>
      <div className="inline">
        <input
          aria-label={`Цена за день, ${plan.name}`}
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="button" className="btn" onClick={() => void save()}>
          Сохранить
        </button>
      </div>
    </li>
  );
}

function PricesTab() {
  const load = useCallback(() => fetchPlans(), []);
  const { state, reload } = useAsync(load);

  if (state.status === 'loading') return <LoadingView />;
  if (state.status === 'error') return <ErrorView message={state.message} onRetry={reload} />;
  return (
    <ul className="cart">
      {state.data.map((p) => (
        <PriceRow key={`${p.id}-${p.dayPrice}`} plan={p} onSaved={reload} />
      ))}
    </ul>
  );
}

export function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('orders');

  return (
    <section>
      <h1>Администрирование</h1>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab${tab === t.id ? ' tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'orders' && <OrdersTab />}
      {tab === 'users' && <UsersTab selfId={user?.id ?? ''} />}
      {tab === 'prices' && <PricesTab />}
    </section>
  );
}
