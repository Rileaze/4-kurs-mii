import { fetchOrders } from '../data/accountApi';
import { useAsync } from '../hooks/useAsync';
import { formatRub } from '../lib/pricing';
import { EmptyView, ErrorView, LoadingView } from '../components/StateViews';
import { ORDER_STATUS_LABELS } from '../components/orderStatus';

export function MyOrdersPage() {
  const { state, reload } = useAsync(fetchOrders);

  return (
    <section>
      <h1>Мои заказы</h1>
      {state.status === 'loading' && <LoadingView />}
      {state.status === 'error' && <ErrorView message={state.message} onRetry={reload} />}
      {state.status === 'success' && state.data.length === 0 && (
        <EmptyView text="Заказов пока нет" />
      )}
      {state.status === 'success' && state.data.length > 0 && (
        <ul className="cart">
          {state.data.map((o) => (
            <li key={o.id} className="order">
              <div>
                <strong>Доставка с {o.deliveryDate}</strong>
                <span className="muted">{ORDER_STATUS_LABELS[o.status]}</span>
              </div>
              <strong>{formatRub(o.total)}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
