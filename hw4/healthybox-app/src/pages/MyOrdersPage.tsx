import { useMemo, useState } from 'react';
import { fetchOrderLines, fetchOrders, setOrderStatus } from '../data/accountApi';
import { useAsync } from '../hooks/useAsync';
import { buildOrdersCsv } from '../lib/orderExport';
import { groupLines } from '../lib/orders';
import { dateStamp, downloadText } from '../components/download';
import { OrderCard } from '../components/OrderCard';
import { EmptyView, ErrorView, LoadingView } from '../components/StateViews';

const loadMine = () => Promise.all([fetchOrders(), fetchOrderLines()]);

export function MyOrdersPage() {
  const { state, reload } = useAsync(loadMine);
  const [error, setError] = useState<string | null>(null);
  const grouped = useMemo(
    () => groupLines(state.status === 'success' ? state.data[1] : []),
    [state],
  );

  const cancel = async (id: string) => {
    if (!window.confirm('Отменить этот заказ?')) return;
    try {
      setError(null);
      await setOrderStatus(id, 'cancelled');
      reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Не удалось отменить заказ');
    }
  };

  return (
    <section>
      <h1>Мои заказы</h1>
      {state.status === 'loading' && <LoadingView />}
      {state.status === 'error' && <ErrorView message={state.message} onRetry={reload} />}
      {state.status === 'success' && state.data[0].length === 0 && (
        <EmptyView text="Заказов пока нет" />
      )}
      {state.status === 'success' && state.data[0].length > 0 && (
        <>
          <div className="toolbar">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                downloadText(
                  `my-orders-${dateStamp()}.csv`,
                  buildOrdersCsv(state.data[0], state.data[1], null),
                )
              }
            >
              Скачать CSV
            </button>
          </div>
          {error && (
            <p className="form__error" role="alert">
              {error}
            </p>
          )}
          <ul className="cart">
            {state.data[0].map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                lines={grouped.get(o.id) ?? []}
                actions={
                  o.status === 'placed' ? (
                    <button type="button" className="btn btn--ghost" onClick={() => void cancel(o.id)}>
                      Отменить заказ
                    </button>
                  ) : undefined
                }
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
