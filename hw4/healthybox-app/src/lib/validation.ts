/** Parses a price typed by an admin: a positive whole number of rubles, otherwise null. */
export function parsePrice(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value > 0 && value <= 100_000 ? value : null;
}
