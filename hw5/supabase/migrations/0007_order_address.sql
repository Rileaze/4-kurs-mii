-- Адрес доставки хранится в заказе: смена адреса в профиле не меняет уже оформленные заказы.
alter table public.orders
  add column delivery_address text check (char_length(delivery_address) <= 300);

-- Владелец может менять адрес только в черновике (как и дату доставки)
create or replace function public.guard_order_update() returns trigger
language plpgsql as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'order owner cannot be changed' using errcode = '42501';
  end if;

  if (new.delivery_date is distinct from old.delivery_date
      or new.delivery_address is distinct from old.delivery_address)
     and old.status <> 'draft' then
    raise exception 'delivery details can only be changed in a draft' using errcode = '42501';
  end if;

  if new.status is distinct from old.status
     and not (old.status = 'draft' and new.status in ('placed', 'cancelled'))
     and not (old.status = 'placed' and new.status = 'cancelled') then
    raise exception 'status change % -> % is not allowed', old.status, new.status
      using errcode = '42501';
  end if;

  return new;
end $$;
