import { useEffect, useState } from 'react';
import type { CartItem, Period, Plan } from './types';
import { addToCart, cartCount, changeQty } from './lib/cart';
import { canAccess } from './lib/roles';
import type { Screen } from './lib/roles';
import { fetchPlans } from './data/api';
import { track } from './lib/analytics';
import { useAuth } from './hooks/useAuth';
import { CatalogPage } from './pages/CatalogPage';
import { SetPage } from './pages/SetPage';
import { CartPage } from './pages/CartPage';
import { AuthPage } from './pages/AuthPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

const SIMULATE_FAIL = new URLSearchParams(window.location.search).has('fail');
const loadPlans = () => fetchPlans(SIMULATE_FAIL);

export default function App() {
  const { enabled, loading, user, signOut } = useAuth();
  const [requested, setScreen] = useState<Screen>('catalog');
  const [period, setPeriod] = useState<Period>('week');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState('');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const today = new Date();

  // A screen the role cannot open falls back to the catalog (e.g. after signing out).
  const role = user?.role ?? null;
  const screen = canAccess(role, requested) ? requested : 'catalog';

  // Prefill the delivery address from the profile once per signed-in user.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      setAddress('');
      return;
    }
    let cancelled = false;
    void import('./data/accountApi')
      .then((api) => api.fetchMyProfile(userId))
      .then((p) => !cancelled && setAddress(p.address))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const checkout = async () => {
    if (!user) {
      setScreen('auth');
      return;
    }
    if (!address.trim()) {
      setCheckoutError('Укажите адрес доставки');
      return;
    }
    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      const api = await import('./data/supabaseApi');
      const orderId = await api.createOrder(cart, address);
      await api.placeOrder(orderId);
      setCart([]);
      setScreen('orders');
    } catch (e: unknown) {
      setCheckoutError(e instanceof Error ? e.message : 'Не удалось оформить заказ');
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <button type="button" className="logo" onClick={() => setScreen('catalog')}>
          HealthyBox
        </button>
        <nav className="header__nav" aria-label="Основное меню">
          {enabled && !loading && user && (
            <>
              <button type="button" className="link" onClick={() => setScreen('orders')}>
                Мои заказы
              </button>
              <button type="button" className="link" onClick={() => setScreen('profile')}>
                Профиль
              </button>
              {user.role === 'admin' && (
                <button type="button" className="link" onClick={() => setScreen('admin')}>
                  Админ
                </button>
              )}
              <span className="badge" title={user.email}>
                {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
              </span>
              <button type="button" className="link" onClick={() => void signOut()}>
                Выйти
              </button>
            </>
          )}
          {enabled && !loading && !user && (
            <button type="button" className="link" onClick={() => setScreen('auth')}>
              Войти
            </button>
          )}
          <button
            type="button"
            className="cart-btn"
            aria-label="Корзина"
            onClick={() => setScreen('cart')}
          >
            🛒 <span data-testid="cart-count">{cartCount(cart)}</span>
          </button>
        </nav>
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
            checkout={
              enabled
                ? {
                    label: user ? 'Оформить заказ' : 'Войти и оформить',
                    busy: checkoutBusy,
                    error: checkoutError,
                    address,
                    onAddressChange: setAddress,
                    onCheckout: () => void checkout(),
                  }
                : undefined
            }
          />
        )}
        {screen === 'auth' && (
          <AuthPage onDone={() => setScreen(cart.length > 0 ? 'cart' : 'catalog')} />
        )}
        {screen === 'orders' && <MyOrdersPage />}
        {screen === 'profile' && user && <ProfilePage userId={user.id} email={user.email} />}
        {screen === 'admin' && <AdminPage />}
      </main>
    </div>
  );
}
