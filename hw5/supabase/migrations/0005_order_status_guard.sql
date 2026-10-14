-- Защита статуса заказа от произвольных изменений владельцем.
-- Политика "orders update own" разрешает владельцу менять любые поля своего заказа,
-- поэтому, например, оформленный заказ можно было вернуть в черновик и удалить.
-- Администратор по-прежнему может менять всё.

create function public.guard_order_update() returns trigger
language plpgsql as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'order owner cannot be changed' using errcode = '42501';
  end if;

  -- Дату доставки можно менять только в черновике
  if new.delivery_date is distinct from old.delivery_date and old.status <> 'draft' then
    raise exception 'delivery_date can only be changed in a draft' using errcode = '42501';
  end if;

  -- Разрешены переходы: черновик -> оформлен / отменён, оформлен -> отменён
  if new.status is distinct from old.status
     and not (old.status = 'draft' and new.status in ('placed', 'cancelled'))
     and not (old.status = 'placed' and new.status = 'cancelled') then
    raise exception 'status change % -> % is not allowed', old.status, new.status
      using errcode = '42501';
  end if;

  return new;
end $$;

create trigger orders_guard_update
  before update on public.orders
  for each row execute function public.guard_order_update();
