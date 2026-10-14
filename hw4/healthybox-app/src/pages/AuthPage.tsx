import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

interface Props {
  onDone: () => void;
}

type Mode = 'login' | 'register';

export function AuthPage({ onDone }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setError(null);
    setBusy(true);
    try {
      if (mode === 'register') {
        const needsConfirmation = await signUp(email.trim(), password);
        if (needsConfirmation) {
          setNotice('Мы отправили письмо. Подтвердите email и войдите.');
          setMode('login');
          return;
        }
      } else {
        await signIn(email.trim(), password);
      }
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setBusy(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <section>
      <h1>{isLogin ? 'Вход' : 'Регистрация'}</h1>
      <form className="form" onSubmit={(e) => void submit(e)} noValidate>
        <label className="field">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          Пароль
          <input
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        <button type="submit" className="btn btn--block" disabled={busy}>
          {isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>
      <button
        type="button"
        className="link"
        onClick={() => {
          setMode(isLogin ? 'register' : 'login');
          setError(null);
        }}
      >
        {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>
    </section>
  );
}
