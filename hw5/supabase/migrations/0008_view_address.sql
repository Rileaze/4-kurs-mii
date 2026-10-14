-- Адрес доставки в представлении заказов (новая колонка добавляется в конец)
create or replace view public.orders_with_total with (security_invoker = true) as
select o.id, o.user_id, o.status, o.delivery_date, o.created_at,
       coalesce(sum(i.unit_price * i.qty), 0)::int as total,
       o.delivery_address
from public.orders o
left join public.order_items i on i.order_id = o.id
group by o.id;
