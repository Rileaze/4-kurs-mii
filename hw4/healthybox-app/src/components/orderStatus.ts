import type { OrderStatus } from '../types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Черновик',
  placed: 'Оформлен',
  cancelled: 'Отменён',
};
