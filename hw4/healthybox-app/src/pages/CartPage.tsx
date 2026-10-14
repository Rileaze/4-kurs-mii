import type { CartItem } from '../types';
import { cartTotal, lineTotal } from '../lib/cart';
import { formatRub } from '../lib/pricing';
import { EmptyView } from '../components/StateViews';

export interface CheckoutProps {
  /** Button label, e.g. "Оформить заказ" or "Войти и оформить". */
  label: string;
  busy: boolean;
  error: string | null;
  /** Delivery address typed in the cart; empty when the user has none yet. */
  address: string;
  onAddressChange: (value: string) => void;
  onCheckout: () => void;
}

interface Props {
  cart: readonly CartItem[];
  onChangeQty: (key: string, delta: number) => void;
  onBack: () => void;
  /** Omitted in mock mode, where there is no backend to place an order. */
  checkout?: CheckoutProps;
}

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

export function CartPage({ cart, onChangeQty, onBack, checkout }: Props) {
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
          {checkout && (
            <>
              <label className="field">
                Адрес доставки
                <input
                  type="text"
                  autoComplete="street-address"
                  maxLength={300}
                  value={checkout.address}
                  onChange={(e) => checkout.onAddressChange(e.target.value)}
                />
              </label>
              {checkout.error && (
                <p className="form__error" role="alert">
                  {checkout.error}
                </p>
              )}
              <button
                type="button"
                className="btn btn--block"
                disabled={checkout.busy}
                onClick={checkout.onCheckout}
              >
                {checkout.label}
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
