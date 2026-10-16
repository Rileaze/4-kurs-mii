import { useCallback, useMemo, useState } from 'react';
import type { OrderLine, OrderSummary, ProfileSummary } from '../types';
import { fetchOrderLines, fetchOrders, fetchProfiles } from '../data/accountApi';
import { useAsync } from '../hooks/useAsync';
import { buildSheetCsv } from '../lib/orderExport';
import { ORDER_STATUS_LABELS, filterOrders, planPopularity, summarize } from '../lib/orders';
import type { StatusFilter } from '../lib/orders';
import { revenueByDay } from '../lib/charts';
import { formatRub } from '../lib/pricing';
import {
  buildSheetRows,
  customerSummary,
  sheetTotals,
  sortRows,
  statusBreakdown,
} from '../lib/summary';
import type { SheetColumn, SortDirection } from '../lib/summary';
import { PlanBarChart, RevenueLineChart } from '../components/Charts';
import { dateStamp, downloadText } from '../components/download';
import { EmptyView, ErrorView, LoadingView } from '../components/StateViews';

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as Array<keyof typeof ORDER_STATUS_LABELS>;

const PERIOD_LABELS = { day: 'День', week: 'Неделя' } as const;

interface Column {
  key: SheetColumn;
  label: string;
  numeric?: boolean;
}

const COLUMNS: readonly Column[] = [
  { key: 'createdAt', label: 'Создан' },
  { key: 'customer', label: 'Клиент' },
  { key: 'status', label: 'Статус' },
  { key: 'deliveryDate', label: 'Доставка с' },
  { key: 'address', label: 'Адрес' },
  { key: 'planName', label: 'Рацион' },
  { key: 'period', label: 'Период' },
  { key: 'qty', label: 'Кол-во', numeric: true },
  { key: 'unitPrice', label: 'Цена', numeric: true },
  { key: 'lineTotal', label: 'Сумма', numeric: true },
];

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

function shortDate(iso: string): string {
  const parsed = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(parsed.getTime()) ? iso : dateFmt.format(parsed);
}

interface ViewProps {
  orders: OrderSummary[];
  profiles: ProfileSummary[];
  lines: OrderLine[];
}

/** Summary of all data for the admin: key figures, breakdowns and one sortable sheet. */
export function SummaryView({ orders, profiles, lines }: ViewProps) {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ column: SheetColumn; direction: SortDirection }>({
    column: 'createdAt',
    direction: 'desc',
  });

  const emails = useMemo(() => new Map(profiles.map((p) => [p.id, p.email])), [profiles]);
  const stats = summarize(orders);
  const byStatus = statusBreakdown(orders);
  const plans = planPopularity(orders, lines);
  const days = useMemo(() => revenueByDay(orders), [orders]);
  const planRevenue = plans.reduce((sum, p) => sum + p.revenue, 0);
  const customers = useMemo(() => customerSummary(orders, emails), [orders, emails]);

  const rows = useMemo(() => {
    const filtered = filterOrders(orders, { status, query }, emails);
    return sortRows(buildSheetRows(filtered, lines, emails), sort.column, sort.direction);
  }, [orders, lines, emails, status, query, sort]);
  const totals = sheetTotals(rows);

  const toggleSort = (column: SheetColumn) =>
    setSort((s) => ({
      column,
      direction: s.column === column && s.direction === 'asc' ? 'desc' : 'asc',
    }));

  if (orders.length === 0) return <EmptyView text="Данных для сводки пока нет" />;

  return (
    <>
      <div className="stats">
        <div className="stat">
          <span className="muted">Заказов всего</span>
          <strong data-testid="summary-count">{stats.count}</strong>
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

      <div className="charts">
        <div>
          <h2>Выручка по дням</h2>
          <RevenueLineChart days={days} />
        </div>
        <div>
          <h2>Выручка по рационам</h2>
          <PlanBarChart sales={plans} />
        </div>
      </div>

      <h2>По статусам</h2>
      <table className="sheet sheet--small">
        <thead>
          <tr>
            <th>Статус</th>
            <th className="num">Заказов</th>
            <th className="num">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {byStatus.map((s) => (
            <tr key={s.status}>
              <td>{ORDER_STATUS_LABELS[s.status]}</td>
              <td className="num">{s.count}</td>
              <td className="num">{formatRub(s.sum)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>По рационам (оформленные заказы)</h2>
      {plans.length === 0 ? (
        <p className="muted">Оформленных заказов пока нет</p>
      ) : (
        <table className="sheet sheet--small">
          <thead>
            <tr>
              <th>Рацион</th>
              <th className="num">Штук</th>
              <th className="num">Выручка</th>
              <th className="num">Доля</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.planId}>
                <td>{p.planName}</td>
                <td className="num">{p.qty}</td>
                <td className="num">{formatRub(p.revenue)}</td>
                <td className="num">
                  {planRevenue === 0 ? '0' : Math.round((p.revenue / planRevenue) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>По клиентам</h2>
      <div className="sheet-wrap">
        <table className="sheet sheet--small">
          <thead>
            <tr>
              <th>Клиент</th>
              <th className="num">Заказов</th>
              <th className="num">Оформлено</th>
              <th className="num">На сумму</th>
              <th>Последний заказ</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.userId}>
                <td>{c.customer}</td>
                <td className="num">{c.orders}</td>
                <td className="num">{c.placedOrders}</td>
                <td className="num">{formatRub(c.spent)}</td>
                <td>{c.lastOrderAt ? shortDate(c.lastOrderAt) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Сводный лист</h2>
      <div className="toolbar">
        <select
          aria-label="Фильтр листа по статусу"
          value={status}
          onChange={(e) => setStatus(STATUSES.find((s) => s === e.target.value) ?? 'all')}
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
          aria-label="Поиск по листу"
          placeholder="Поиск по email или номеру"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="btn btn--ghost"
          disabled={rows.length === 0}
          onClick={() => downloadText(`summary-${dateStamp()}.csv`, buildSheetCsv(rows))}
        >
          Скачать CSV
        </button>
      </div>

      <div className="sheet-wrap">
        <table className="sheet" aria-label="Сводный лист">
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const active = sort.column === c.key;
                return (
                  <th
                    key={c.key}
                    className={c.numeric ? 'num' : undefined}
                    aria-sort={
                      active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'
                    }
                  >
                    <button type="button" className="sheet__sort" onClick={() => toggleSort(c.key)}>
                      {c.label}
                      {active ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="muted">
                  По этим условиям строк нет
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.orderId}-${i}`}>
                  <td>{shortDate(r.createdAt)}</td>
                  <td>{r.customer || '—'}</td>
                  <td>{ORDER_STATUS_LABELS[r.status]}</td>
                  <td>{shortDate(r.deliveryDate)}</td>
                  <td>{r.address || '—'}</td>
                  <td>{r.planName || '—'}</td>
                  <td>{r.period === '' ? '—' : PERIOD_LABELS[r.period]}</td>
                  <td className="num">{r.qty}</td>
                  <td className="num">{formatRub(r.unitPrice)}</td>
                  <td className="num">{formatRub(r.lineTotal)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={7}>
                Итого строк: {totals.rows} · из них оформлено на {formatRub(totals.placedAmount)}
              </td>
              <td className="num" data-testid="sheet-qty">
                {totals.qty}
              </td>
              <td />
              <td className="num" data-testid="sheet-amount">
                {formatRub(totals.amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

export function SummaryTab() {
  const load = useCallback(
    () => Promise.all([fetchOrders(), fetchProfiles(), fetchOrderLines()]),
    [],
  );
  const { state, reload } = useAsync(load);

  if (state.status === 'loading') return <LoadingView />;
  if (state.status === 'error') return <ErrorView message={state.message} onRetry={reload} />;
  const [orders, profiles, lines] = state.data;
  return <SummaryView orders={orders} profiles={profiles} lines={lines} />;
}
