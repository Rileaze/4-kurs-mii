import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PlanBarChart, RevenueLineChart } from './Charts';

const DAYS = [
  { date: '2026-10-10', revenue: 1000, orders: 1 },
  { date: '2026-10-11', revenue: 0, orders: 0 },
  { date: '2026-10-12', revenue: 3000, orders: 2 },
];

const SALES = [
  { planId: 'mass', planName: 'Масса', qty: 3, revenue: 9000 },
  { planId: 'light', planName: 'Лёгкий', qty: 1, revenue: 3000 },
];

describe('RevenueLineChart', () => {
  it('describes the chart for screen readers, including the peak', () => {
    render(<RevenueLineChart days={DAYS} />);
    expect(screen.getByRole('img', { name: /за 3 дн\./ })).toBeInTheDocument();
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/3\s000/);
  });

  it('shows a tooltip with the day, revenue and order count on hover', async () => {
    const { container } = render(<RevenueLineChart days={DAYS} />);
    expect(screen.queryByTestId('chart-tip')).not.toBeInTheDocument();

    const hit = container.querySelectorAll('rect')[2];
    await userEvent.hover(hit);
    const tip = screen.getByTestId('chart-tip');
    expect(tip).toHaveTextContent('12 октября 2026');
    expect(tip).toHaveTextContent('Заказов: 2');
  });

  it('draws a single day without crashing and says so when there is no data', () => {
    const { container, rerender } = render(<RevenueLineChart days={[DAYS[0]]} />);
    expect(container.querySelector('path.chart__line')).toBeNull();
    expect(container.querySelector('circle')).not.toBeNull();

    rerender(<RevenueLineChart days={[]} />);
    expect(screen.getByText('Оформленных заказов для графика пока нет')).toBeInTheDocument();
  });
});

describe('PlanBarChart', () => {
  it('labels every bar with the plan name and its revenue', () => {
    render(<PlanBarChart sales={SALES} />);
    expect(screen.getByText('Масса')).toBeInTheDocument();
    expect(screen.getByText('Лёгкий')).toBeInTheDocument();
    expect(screen.getByText(/9\s000/)).toBeInTheDocument();
  });

  it('shows the share of revenue in the tooltip on hover', async () => {
    const { container } = render(<PlanBarChart sales={SALES} />);
    await userEvent.hover(container.querySelectorAll('rect')[0]);
    const tip = screen.getByTestId('chart-tip');
    expect(tip).toHaveTextContent('Доля: 75%');
    expect(tip).toHaveTextContent('Штук: 3');
  });

  it('says so when nothing is sold yet', () => {
    render(<PlanBarChart sales={[]} />);
    expect(screen.getByText('Оформленных заказов пока нет')).toBeInTheDocument();
  });
});
