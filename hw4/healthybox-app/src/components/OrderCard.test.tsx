import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { OrderLine, OrderSummary } from '../types';
import { OrderCard } from './OrderCard';

const ORDER: OrderSummary = {
  id: 'order-1',
  userId: 'u1',
  status: 'placed',
  deliveryDate: '2026-10-20',
  deliveryAddress: 'Казань, ул. Баумана, 1',
  createdAt: '2026-10-14T10:00:00Z',
  total: 8190,
};
const LINES: OrderLine[] = [
  { orderId: 'order-1', planId: 'balance', planName: 'Баланс', period: 'week', qty: 2, unitPrice: 4095 },
];

describe('OrderCard', () => {
  it('shows the breakdown only after expanding', async () => {
    render(<ul><OrderCard order={ORDER} lines={LINES} customer="anna@mail.ru" /></ul>);
    expect(screen.queryByText('Баланс')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('Баланс')).toBeInTheDocument();
    expect(screen.getByText('order-1')).toBeInTheDocument();
  });

  it('says so when the lines are not available', async () => {
    render(<ul><OrderCard order={ORDER} lines={[]} /></ul>);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Состав заказа недоступен')).toBeInTheDocument();
  });

  it('renders the actions slot inside the expanded body', async () => {
    render(<ul><OrderCard order={ORDER} lines={LINES} actions={<button>Отменить</button>} /></ul>);
    expect(screen.queryByRole('button', { name: 'Отменить' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('button', { name: 'Отменить' })).toBeInTheDocument();
  });
});
