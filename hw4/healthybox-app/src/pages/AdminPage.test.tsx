import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrderLine, OrderSummary, ProfileSummary } from '../types';

const ORDERS: OrderSummary[] = [
  { id: 'o1', userId: 'u1', status: 'placed', deliveryDate: '2026-10-20', deliveryAddress: 'Казань', createdAt: '2026-10-10T10:00:00Z', total: 4095 },
];
const LINES: OrderLine[] = [
  { orderId: 'o1', planId: 'balance', planName: 'Баланс', period: 'week', qty: 1, unitPrice: 4095 },
];
const PROFILES: ProfileSummary[] = [{ id: 'u1', email: 'anna@mail.ru', role: 'user' }];

const mocks = vi.hoisted(() => ({
  fetchOrders: vi.fn(),
  fetchProfiles: vi.fn(),
  fetchOrderLines: vi.fn(),
}));

vi.mock('../data/accountApi', () => ({
  fetchOrders: mocks.fetchOrders,
  fetchProfiles: mocks.fetchProfiles,
  fetchOrderLines: mocks.fetchOrderLines,
  setOrderStatus: vi.fn(),
  setUserRole: vi.fn(),
  updatePlanPrice: vi.fn(),
}));

import { AdminPage } from './AdminPage';

describe('AdminPage: вкладка «Свод»', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchOrders.mockResolvedValue(ORDERS);
    mocks.fetchProfiles.mockResolvedValue(PROFILES);
    mocks.fetchOrderLines.mockResolvedValue(LINES);
  });

  it('lists the Свод tab first and opens it by default', async () => {
    render(<AdminPage />);
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(tabs).toEqual(['Свод', 'Заказы', 'Пользователи', 'Цены']);
    expect(screen.getByRole('tab', { name: 'Свод', selected: true })).toBeInTheDocument();
    expect(await screen.findByText('Сводный лист')).toBeInTheDocument();
  });

  it('lets the admin come back to the Свод tab after visiting another one', async () => {
    render(<AdminPage />);
    await screen.findByText('Сводный лист');

    await userEvent.click(screen.getByRole('tab', { name: 'Пользователи' }));
    expect(screen.queryByText('Сводный лист')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Свод' }));
    expect(await screen.findByText('Сводный лист')).toBeInTheDocument();
  });
});
