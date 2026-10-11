import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App: catalog → set → cart flow', () => {
  it('adds a set to the cart and changes its quantity', async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: /Баланс/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Добавить в корзину' }));

    const dayButtons = screen.getAllByRole('button', { pressed: false });
    await userEvent.click(dayButtons.find((b) => !(b as HTMLButtonElement).disabled && /\d/.test(b.textContent ?? ''))!);
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    await userEvent.click(screen.getByRole('button', { name: 'Корзина' }));
    expect(screen.getByTestId('cart-total').textContent?.replace(/\s/g, ' ')).toBe('4 095 ₽');

    await userEvent.click(screen.getByRole('button', { name: /Увеличить количество/ }));
    expect(screen.getByTestId('cart-total').textContent?.replace(/\s/g, ' ')).toBe('8 190 ₽');

    await userEvent.click(screen.getByRole('button', { name: /Уменьшить количество/ }));
    await userEvent.click(screen.getByRole('button', { name: /Уменьшить количество/ }));
    expect(screen.getByText('В корзине пусто')).toBeInTheDocument();
  });
});
