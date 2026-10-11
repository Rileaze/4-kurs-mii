import { useState } from 'react';
import type { CartItem, Period, Plan } from './types';
import { addToCart, cartCount, changeQty } from './lib/cart';
import { fetchPlans } from './data/api';
import { track } from './lib/analytics';
import { CatalogPage } from './pages/CatalogPage';
import { SetPage } from './pages/SetPage';
import { CartPage } from './pages/CartPage';

type Screen = 'catalog' | 'set' | 'cart';

const SIMULATE_FAIL = new URLSearchParams(window.location.search).has('fail');
const loadPlans = () => fetchPlans(SIMULATE_FAIL);

export default function App() {
  const [screen, setScreen] = useState<Screen>('catalog');
  const [period, setPeriod] = useState<Period>('week');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const today = new Date();

  return (
    <div className="app">
      <header className="header">
        <button type="button" className="logo" onClick={() => setScreen('catalog')}>
          HealthyBox
        </button>
        <button type="button" className="cart-btn" aria-label="Корзина" onClick={() => setScreen('cart')}>
          🛒 <span data-testid="cart-count">{cartCount(cart)}</span>
        </button>
      </header>
      <main className="main">
        {screen === 'catalog' && (
          <CatalogPage
            period={period}
            onPeriodChange={setPeriod}
            load={loadPlans}
            onOpen={(p) => {
              setPlan(p);
              setScreen('set');
            }}
          />
        )}
        {screen === 'set' && plan && (
          <SetPage
            plan={plan}
            period={period}
            today={today}
            onBack={() => setScreen('catalog')}
            onAdd={(p, per, date) => {
              setCart((c) => addToCart(c, p, per, date, today));
              track('add_to_cart', { planId: p.id, period: per });
            }}
          />
        )}
        {screen === 'cart' && (
          <CartPage
            cart={cart}
            onChangeQty={(key, delta) => {
              setCart((c) => changeQty(c, key, delta));
              track('change_cart_qty', { delta });
            }}
            onBack={() => setScreen('catalog')}
          />
        )}
      </main>
    </div>
  );
}
