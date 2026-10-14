-- Личные данные пользователя: имя, телефон, адрес доставки.
-- Пользователь редактирует только свою строку и только эти поля; роль меняет только администратор.

alter table public.profiles
  add column full_name text check (char_length(full_name) <= 100),
  add column phone     text check (char_length(phone) <= 30),
  add column address   text check (char_length(address) <= 300);

grant update (full_name, phone, address) on public.profiles to authenticated;

create policy "profiles update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Колонка role доступна на UPDATE ради администратора, поэтому владельцу
-- смену собственной роли запрещаем триггером.
create function public.guard_profile_update() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role can only be changed by an administrator' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();
