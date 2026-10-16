import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { OrderLine, OrderSummary, ProfileSummary } from '../types';
import { SummaryView } from './SummaryPage';

const ORDERS: OrderSummary[] = [
  { id: 'o1', userId: 'u1', status: 'placed', deliveryDate: '2026-10-20', deliveryAddress: 'Казань', createdAt: '2026-10-10T10:00:00Z', total: 8190 },
  { id: 'o2', userId: 'u2', status: 'draft', deliveryDate: '2026-10-21', deliveryAddress: '', createdAt: '2026-10-12T10:00:00Z', total: 590 },
];
const LINES: OrderLine[] = [
  { orderId: 'o1', planId: 'balance', planName: 'Баланс', period: 'week', qty: 2, unitPrice: 4095 },
  { orderId: 'o2', planId: 'light', planName: 'Лёгкий', period: 'day', qty: 1, unitPrice: 590 },
];
const PROFILES: ProfileSummary[] = [
  { id: 'u1', email: 'anna@mail.ru', role: 'user' },
  { id: 'u2', email: 'boris@mail.ru', role: 'user' },
];

const sheetRows = () => {
  const table = screen.getByRole('table', { name: 'Сводный лист' });
  return within(table).getAllByRole('row').slice(1, -1);
};

describe('SummaryView', () => {
  it('shows key figures and totals of the sheet', () => {
    render(<SummaryView orders={ORDERS} profiles={PROFILES} lines={LINES} />);
    expect(screen.getByTestId('summary-count')).toHaveTextContent('2');
    expect(screen.getByTestId('sheet-qty')).toHaveTextContent('3');
    expect(screen.getByTestId('sheet-amount').textContent?.replace(/\s/g, ' ')).toBe('8 780 ₽');
  });

  it('sorts the sheet when a column header is clicked', async () => {
    render(<SummaryView orders={ORDERS} profiles={PROFILES} lines={LINES} />);
    // default: newest first
    expect(sheetRows()[0]).toHaveTextContent('boris@mail.ru');
    await userEvent.click(screen.getByRole('button', { name: /Сумма/ }));
    expect(sheetRows()[0]).toHaveTextContent('boris@mail.ru'); // ascending: 590 first
    await userEvent.click(screen.getByRole('button', { name: /Сумма/ }));
    expect(sheetRows()[0]).toHaveTextContent('anna@mail.ru'); // descending: 8190 first
  });

  it('filters the sheet by status and search and says so when nothing matches', async () => {
    render(<SummaryView orders={ORDERS} profiles={PROFILES} lines={LINES} />);
    await userEvent.selectOptions(screen.getByLabelText('Фильтр листа по статусу'), 'placed');
    expect(sheetRows()).toHaveLength(1);
    await userEvent.type(screen.getByLabelText('Поиск по листу'), 'nobody');
    expect(screen.getByText('По этим условиям строк нет')).toBeInTheDocument();
  });

  it('shows a friendly message when there are no orders at all', () => {
    render(<SummaryView orders={[]} profiles={[]} lines={[]} />);
    expect(screen.getByText('Данных для сводки пока нет')).toBeInTheDocument();
  });
});
