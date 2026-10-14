import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { fetchMyProfile, updateMyProfile } from '../data/accountApi';
import type { ProfileDetails } from '../types';
import { LoadingView } from '../components/StateViews';

interface Props {
  userId: string;
  email: string;
}

const EMPTY: ProfileDetails = { fullName: '', phone: '', address: '' };

export function ProfilePage({ userId, email }: Props) {
  const [form, setForm] = useState<ProfileDetails>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyProfile(userId)
      .then((d) => !cancelled && setForm(d))
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить профиль');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const set = (key: keyof ProfileDetails) => (e: { target: { value: string } }) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await updateMyProfile(userId, form);
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить профиль');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingView />;

  return (
    <section>
      <h1>Профиль</h1>
      <form className="form" onSubmit={(e) => void submit(e)}>
        <label className="field">
          Email
          <input type="email" value={email} readOnly disabled />
        </label>
        <label className="field">
          Имя
          <input
            type="text"
            autoComplete="name"
            maxLength={100}
            value={form.fullName}
            onChange={set('fullName')}
          />
        </label>
        <label className="field">
          Телефон
          <input
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={form.phone}
            onChange={set('phone')}
          />
        </label>
        <label className="field">
          Адрес доставки
          <input
            type="text"
            autoComplete="street-address"
            maxLength={300}
            value={form.address}
            onChange={set('address')}
          />
        </label>
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
        {saved && <p role="status">Профиль сохранён</p>}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </form>
    </section>
  );
}
