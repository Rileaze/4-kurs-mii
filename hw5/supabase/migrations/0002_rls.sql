-- Row Level Security

alter table public.dishes      enable row level security;
alter table public.plans       enable row level security;
alter table public.plan_meals  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Каталог: чтение для всех (включая анонимов), запись только через service_role
create policy "catalog read dishes"     on public.dishes     for select to anon, authenticated using (true);
create policy "catalog read plans"      on public.plans      for select to anon, authenticated using (true);
create policy "catalog read plan_meals" on public.plan_meals for select to anon, authenticated using (true);

-- Заказы: только владелец
create policy "orders select own" on public.orders
  for select to authenticated using (user_id = (select auth.uid()));

create policy "orders insert own" on public.orders
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "orders update own" on public.orders
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Удалять можно только черновики
create policy "orders delete own draft" on public.orders
  for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'draft');

-- Позиции: доступ через принадлежность заказа пользователю
create policy "items select own" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_id and o.user_id = (select auth.uid())));

create policy "items insert own draft" on public.order_items
  for insert to authenticated
  with check (exists (select 1 from public.orders o
                      where o.id = order_id and o.user_id = (select auth.uid())
                        and o.status = 'draft'));

create policy "items update own draft" on public.order_items
  for update to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_id and o.user_id = (select auth.uid())
                   and o.status = 'draft'))
  with check (exists (select 1 from public.orders o
                      where o.id = order_id and o.user_id = (select auth.uid())
                        and o.status = 'draft'));

create policy "items delete own draft" on public.order_items
  for delete to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_id and o.user_id = (select auth.uid())
                   and o.status = 'draft'));
