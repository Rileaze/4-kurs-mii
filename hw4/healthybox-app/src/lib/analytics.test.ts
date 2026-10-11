import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  delete window.ym;
});

describe('track', () => {
  it('does nothing when the counter id is not configured', async () => {
    const ym = vi.fn();
    window.ym = ym;
    const { track } = await import('./analytics');
    track('add_to_cart');
    expect(ym).not.toHaveBeenCalled();
  });

  it('sends a goal to Yandex.Metrika when configured', async () => {
    vi.stubEnv('VITE_YM_COUNTER_ID', '12345');
    const ym = vi.fn();
    window.ym = ym;
    const { track } = await import('./analytics');
    track('add_to_cart', { planId: 'light' });
    expect(ym).toHaveBeenCalledWith(12345, 'reachGoal', 'add_to_cart', { planId: 'light' });
  });

  it('swallows errors thrown by the counter', async () => {
    vi.stubEnv('VITE_YM_COUNTER_ID', '12345');
    window.ym = () => {
      throw new Error('blocked');
    };
    const { track } = await import('./analytics');
    expect(() => track('view_catalog')).not.toThrow();
  });
});
