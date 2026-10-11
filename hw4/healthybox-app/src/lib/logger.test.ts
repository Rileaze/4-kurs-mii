import { describe, expect, it } from 'vitest';
import { buildRecord } from './logger';

describe('buildRecord', () => {
  it('produces a structured record with level, message and timestamp', () => {
    const r = buildRecord('error', 'fetch failed', { status: 500 }, new Date('2026-10-11T12:00:00Z'));
    expect(r).toEqual({ ts: '2026-10-11T12:00:00.000Z', level: 'error', msg: 'fetch failed', status: 500 });
  });

  it('redacts sensitive keys', () => {
    const r = buildRecord('info', 'login', { email: 'a@b.c', Password: 'x', planId: 'light' });
    expect(r.email).toBe('[REDACTED]');
    expect(r.Password).toBe('[REDACTED]');
    expect(r.planId).toBe('light');
  });

  it('does not let context override level or message', () => {
    const r = buildRecord('info', 'real', { level: 'error', msg: 'fake' });
    expect(r.level).toBe('info');
    expect(r.msg).toBe('real');
  });
});
