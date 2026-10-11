import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PLANS } from '../data/mock';
import { ApiError } from '../data/api';
import { CatalogPage } from './CatalogPage';

function setup(load: () => Promise<typeof PLANS>) {
  const onOpen = vi.fn();
  render(<CatalogPage period="week" onPeriodChange={vi.fn()} onOpen={onOpen} load={load} />);
  return { onOpen };
}

describe('CatalogPage', () => {
  it('shows the loading state, then the plan cards', async () => {
    setup(() => Promise.resolve(PLANS));
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByText('Баланс')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /ккал в день/ })).toHaveLength(3);
  });

  it('opens a plan on card click', async () => {
    const { onOpen } = setup(() => Promise.resolve(PLANS));
    await userEvent.click(await screen.findByRole('button', { name: /Лёгкий/ }));
    expect(onOpen).toHaveBeenCalledWith(PLANS[0]);
  });

  it('shows an error and retries successfully', async () => {
    const load = vi
      .fn<() => Promise<typeof PLANS>>()
      .mockRejectedValueOnce(new ApiError('Не удалось загрузить данные', 500))
      .mockResolvedValueOnce(PLANS);
    setup(load);
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить данные');
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByText('Баланс')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('shows the empty state when there are no plans', async () => {
    setup(() => Promise.resolve([]));
    expect(await screen.findByText('Скоро будем в вашем городе')).toBeInTheDocument();
  });
});
