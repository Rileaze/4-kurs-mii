-- Роли: user (по умолчанию) и admin.
-- Роль хранится в public.profiles; клиент может её только читать.
-- Менять роль может только администратор (политика ниже) или владелец проекта через SQL Editor.

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Профиль создаётся автоматически при регистрации
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Профили для уже существующих пользователей
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Проверка роли. security definer обходит RLS и не даёт политикам зациклиться на profiles
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

alter table public.profiles enable row level security;

create policy "profiles select own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles update admin" on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.profiles to authenticated;
grant update (role) on public.profiles to authenticated;

-- Администратор видит и меняет заказы всех пользователей
create policy "orders select admin" on public.orders
  for select to authenticated using (public.is_admin());

create policy "orders update admin" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "items select admin" on public.order_items
  for select to authenticated using (public.is_admin());

-- Администратор управляет каталогом
grant insert, update, delete on public.dishes, public.plans, public.plan_meals to authenticated;

create policy "dishes write admin" on public.dishes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "plans write admin" on public.plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "plan_meals write admin" on public.plan_meals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Первый администратор назначается вручную (подставьте свою почту):
-- update public.profiles set role = 'admin' where email = 'you@example.com';
