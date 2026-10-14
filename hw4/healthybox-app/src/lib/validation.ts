const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 6;

/** Returns a user-facing error for invalid sign-in/sign-up input, or null when it is valid. */
export function validateCredentials(email: string, password: string): string | null {
  if (!EMAIL_RE.test(email.trim())) return 'Введите корректный email';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`;
  }
  return null;
}

/** Parses a price typed by an admin: a positive whole number of rubles, otherwise null. */
export function parsePrice(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value > 0 && value <= 100_000 ? value : null;
}
