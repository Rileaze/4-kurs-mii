-- Права ролей на таблицы. RLS (0002) ограничивает строки, но без GRANT
-- роли anon/authenticated не могут обратиться к таблице вообще (ошибка 42501).

grant usage on schema public to anon, authenticated;

-- Публичный каталог: только чтение
grant select on public.dishes, public.plans, public.plan_meals to anon, authenticated;

-- Заказы: только для вошедших пользователей, строки ограничивает RLS
grant select, insert, update, delete on public.orders, public.order_items to authenticated;
grant select on public.orders_with_total to authenticated;
