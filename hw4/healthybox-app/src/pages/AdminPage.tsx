import { useCallback, useMemo, useState } from 'react';
import type { OrderLine, OrderStatus, OrderSummary, Plan, ProfileSummary, Role } from '../types';
import {
  fetchOrderLines,
  fetchOrders,
  fetchProfiles,
  setOrderStatus,
  setUserRole,
  updatePlanPrice,
} from '../data/accountApi';
import { fetchPlans } from '../data/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../hooks/useAuth';
import { buildOrdersCsv, buildUsersCsv } from '../lib/orderExport';
import {
  ORDER_STATUS_LABELS,
  filterOrders,
  groupLines,
  planPopularity,
  summarize,
} from '../lib/orders';
import type { StatusFilter } from '../lib/orders';
import { formatRub } from '../lib/pricing';
import { parsePrice } from '../lib/validation';
import { dateStamp, downloadText } from '../components/download';
import { OrderCard } from '../components/OrderCard';
import { SummaryTab } from './SummaryPage';
import { EmptyView, ErrorView, LoadingView } from '../components/StateViews';

type Tab = 'summary' | 'orders' | 'users' | 'prices';

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

interface OrdersViewProps {
  orders: OrderSummary[];
  profiles: ProfileSummary[];
  lines: OrderLine[];
  onChanged: () => void;
}

function OrdersView({ orders, profiles, lines, onChanged }: OrdersViewProps) {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const emails = useMemo(() => new Map(profiles.map((p) => [p.id, p.email])), [profiles]);
  const grouped = useMemo(() => groupLines(lines), [lines]);
  const visible = useMemo(
    () => filterOrders(orders, { status, query }, emails),
    [orders, status, query, emails],
  );
  const stats = summarize(visible);
  const popularity = planPopularity(visible, lines);

  const change = async (id: string, next: OrderStatus) => {
    try {
      setError(null);
      await setOrderStatus(id, next);
      onChanged();
    } catch (e: unknown) {
      setError(errorText(e));
    }
  };

  return (
    <>
      <div className="stats">
        <div className="stat">
          <span className="muted">Заказов</span>
          <strong data-testid="stat-count">{stats.count}</strong>
        </div>
        <div className="stat">
          <span className="muted">Выручка (оформленные)</span>
          <strong>{formatRub(stats.revenue)}</strong>
        </div>
        <div className="stat">
          <span className="muted">Средний чек</span>
          <strong>{formatRub(stats.average)}</strong>
        </div>
      </div>

      {popularity.length > 0 && (
        <>
          <h2>Популярность рационов</h2>
          <ul className="sales">
            {popularity.map((s) => (
              <li key={s.planId}>
                <span>{s.planName}</span>
                <span className="muted">
                  {s.qty} шт. · {formatRub(s.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="toolbar">
        <select
          aria-label="Фильтр по статусу"
          value={status}
          onChange={(e) =>
            setStatus(STATUSES.find((s) => s === e.target.value) ?? 'all')
          }
        >
          <option value="all">Все статусы</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          type="search"
          aria-label="Поиск по email или номеру"
          placeholder="Поиск по email или номеру"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="btn btn--ghost"
          disabled={visible.length === 0}
          onClick={() =>
            downloadText(`orders-${dateStamp()}.csv`, buildOrdersCsv(visible, lines, emails))
          }
        >
          Скачать CSV
        </button>
      </div>

      <FormError message={error} />
      {visible.length === 0 ? (
        <EmptyView text="Заказов по этим условиям нет" />
      ) : (
        <ul className="cart">
          {visible.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              lines={grouped.get(o.id) ?? []}
              customer={emails.get(o.userId) ?? 'Неизвестный пользователь'}
              actions={
                <label className="inline">
                  Статус
                  <select
                    aria-label={`Статус заказа ${o.id}`}
                    value={o.status}
                    onChange={(e) => {
                      const next = STATUSES.find((s) => s === e.target.value);
                      if (next) void change(o.id, next);
                    }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
              }
            />
          ))}
        </ul>
      )}
    </>
  );
}

function OrdersTab() {
  const load = useCallback(
    () => Promise.all([fetchOrders(), fetchProfiles(), fetchOrderLines()]),
    [],
  );
  const { state, reload } = useAsync(load);

  if (state.status === 'loading') return <LoadingView />;
  if (state.status === 'error') return <ErrorView message={state.message} onRetry={reload} />;
  const [orders, profiles, lines] = state.data;
  return <OrdersView orders={orders} profiles={profiles} lines={lines} onChanged={reload} />;
}

function UsersTab({ selfId }: { selfId: string }) {
  const load = useCallback(() => Promise.all([fetchProfiles(), fetchOrders()]), []);
  const { state, reload } = useAsync(load);
  const [error, setError] = useState<string | null>(null);

  if (state.status === 'loading') return <LoadingView />;
  if (state.status === 'error') return <ErrorView message={state.message} onRetry={reload} />;
  const [profiles, orders] = state.data;

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
      <div className="toolbar">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => downloadText(`users-${dateStamp()}.csv`, buildUsersCsv(profiles, orders))}
        >
          Скачать CSV
        </button>
      </div>
      <FormError message={error} />
      <ul className="cart">
        {profiles.map((p) => {
          const own = orders.filter((o) => o.userId === p.id);
          return (
            <li key={p.id} className="order">
              <div>
                <strong>{p.email}</strong>
                <span className="muted">Заказов: {own.length}</span>
              </div>
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
          );
        })}
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
  const [tab, setTab] = useState<Tab>('summary');

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
      {tab === 'summary' && <SummaryTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'users' && <UsersTab selfId={user?.id ?? ''} />}
      {tab === 'prices' && <PricesTab />}
    </section>
  );
}
