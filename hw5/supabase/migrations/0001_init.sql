-- HealthyBox: схема данных (PostgreSQL / Supabase)

create table public.dishes (
  id           text primary key,
  name         text not null,
  emoji        text not null default '🍽️',
  grams        int  not null check (grams > 0),
  kcal         int  not null check (kcal >= 0),
  protein      int  not null check (protein >= 0),
  fat          int  not null check (fat >= 0),
  carbs        int  not null check (carbs >= 0),
  ingredients  text[] not null default '{}',
  allergens    text[] not null default '{}'
);

create table public.plans (
  id           text primary key,
  name         text not null,
  emoji        text not null default '🍱',
  goal         text not null check (goal in ('loss', 'maintain', 'gain')),
  description  text not null,
  kcal_per_day int  not null check (kcal_per_day > 0),
  day_price    int  not null check (day_price > 0)          -- целые рубли
);

create table public.plan_meals (
  plan_id     text     not null references public.plans (id) on delete cascade,
  day         smallint not null check (day between 1 and 7),
  meal_title  text     not null,
  dish_id     text     not null references public.dishes (id),
  primary key (plan_id, day, meal_title)
);

create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status        text not null default 'draft' check (status in ('draft', 'placed', 'cancelled')),
  delivery_date date not null,
  created_at    timestamptz not null default now()
);

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  plan_id     text not null references public.plans (id),
  period      text not null check (period in ('day', 'week')),
  qty         int  not null check (qty between 1 and 10),
  unit_price  int  not null default 0 check (unit_price >= 0)  -- проставляется триггером
);

create index order_items_order_id_idx on public.order_items (order_id);
create index orders_user_id_idx on public.orders (user_id);

-- Минимальный срок до первой доставки: сегодня + 2 дня (проверка на сервере)
create function public.check_delivery_date() returns trigger
language plpgsql as $$
begin
  if new.delivery_date < current_date + 2 then
    raise exception 'delivery_date must be at least 2 days from today'
      using errcode = '22023';
  end if;
  return new;
end $$;

create trigger orders_check_delivery_date
  before insert on public.orders
  for each row execute function public.check_delivery_date();

-- Цена позиции всегда считается на сервере, значение от клиента игнорируется
create function public.set_unit_price() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p_day_price int;
begin
  select day_price into p_day_price from public.plans where id = new.plan_id;
  if p_day_price is null then
    raise exception 'unknown plan %', new.plan_id using errcode = '23503';
  end if;
  new.unit_price := case new.period
    when 'day' then p_day_price
    else round(p_day_price * 7 * 0.9)::int
  end;
  return new;
end $$;

create trigger order_items_set_unit_price
  before insert or update of plan_id, period on public.order_items
  for each row execute function public.set_unit_price();

-- Итог заказа; security_invoker => RLS применяется от имени вызывающего
create view public.orders_with_total with (security_invoker = true) as
select o.id, o.user_id, o.status, o.delivery_date, o.created_at,
       coalesce(sum(i.unit_price * i.qty), 0)::int as total
from public.orders o
left join public.order_items i on i.order_id = o.id
group by o.id;
