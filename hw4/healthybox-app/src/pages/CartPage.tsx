import type { CartItem } from '../types';
import { cartTotal, lineTotal } from '../lib/cart';
import { formatRub } from '../lib/pricing';
import { EmptyView } from '../components/StateViews';

interface Props {
  cart: readonly CartItem[];
  onChangeQty: (key: string, delta: number) => void;
  onBack: () => void;
}

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

export function CartPage({ cart, onChangeQty, onBack }: Props) {
  return (
    <section>
      <h1>Корзина</h1>
      {cart.length === 0 ? (
        <>
          <EmptyView text="В корзине пусто" />
          <button type="button" className="btn btn--block" onClick={onBack}>
            К каталогу
          </button>
        </>
      ) : (
        <>
          <ul className="cart">
            {cart.map((item) => (
              <li key={item.key} className="cart__item">
                <span className="cart__emoji" aria-hidden="true">{item.emoji}</span>
                <div className="cart__info">
                  <strong>{item.name}</strong>
                  <span className="muted">
                    {item.period === 'day' ? 'День' : 'Неделя'} · с {dateFmt.format(item.deliveryDate)}
                  </span>
                  <span className="muted">{formatRub(item.unitPrice)} за шт.</span>
                </div>
                <div className="qty">
                  <button
                    type="button"
                    aria-label={`Уменьшить количество ${item.name}`}
                    onClick={() => onChangeQty(item.key, -1)}
                  >
                    −
                  </button>
                  <span aria-label="Количество">{item.qty}</span>
                  <button
                    type="button"
                    aria-label={`Увеличить количество ${item.name}`}
                    onClick={() => onChangeQty(item.key, 1)}
                  >
                    +
                  </button>
                </div>
                <strong className="cart__sum">{formatRub(lineTotal(item))}</strong>
              </li>
            ))}
          </ul>
          <p className="total">
            Итого: <strong data-testid="cart-total">{formatRub(cartTotal(cart))}</strong>
          </p>
        </>
      )}
    </section>
  );
}
