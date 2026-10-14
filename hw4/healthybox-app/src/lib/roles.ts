import type { Role } from '../types';

export type Screen = 'catalog' | 'set' | 'cart' | 'auth' | 'orders' | 'admin';

const SIGNED_IN_SCREENS: readonly Screen[] = ['orders'];
const ADMIN_SCREENS: readonly Screen[] = ['admin'];

/** Narrows an unknown database value to a Role; anything unexpected becomes the safe 'user'. */
export function parseRole(value: unknown): Role {
  return value === 'admin' ? 'admin' : 'user';
}

/**
 * Whether a screen is available for the given role. `null` means a guest (not signed in).
 * The check only hides UI; real protection is enforced by RLS in the database.
 */
export function canAccess(role: Role | null, screen: Screen): boolean {
  if (ADMIN_SCREENS.includes(screen)) return role === 'admin';
  if (SIGNED_IN_SCREENS.includes(screen)) return role !== null;
  return true;
}
