import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatePickerModal } from './DatePickerModal';

const today = new Date(2026, 9, 11);

describe('DatePickerModal', () => {
  it('disables the first two days and the confirm button initially', () => {
    render(<DatePickerModal today={today} onConfirm={vi.fn()} onClose={vi.fn()} />);
    const days = screen.getAllByRole('button', { pressed: false });
    expect(days[0]).toBeDisabled();
    expect(days[1]).toBeDisabled();
    expect(days[2]).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Подтвердить' })).toBeDisabled();
  });

  it('confirms the selected date', async () => {
    const onConfirm = vi.fn();
    render(<DatePickerModal today={today} onConfirm={onConfirm} onClose={vi.fn()} />);
    const days = screen.getAllByRole('button', { pressed: false });
    await userEvent.click(days[2]);
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));
    expect(onConfirm).toHaveBeenCalledWith(new Date(2026, 9, 13));
  });
});
