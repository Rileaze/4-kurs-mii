# HealthyBox

Мобильное веб-приложение для заказа готовых наборов здорового питания (MVP): каталог рационов, детальное меню по дням, корзина с выбором даты первой доставки.

## Стек

React 18, TypeScript (strict), Vite, Vitest + Testing Library, обычный CSS (mobile-first), Supabase (backend, опционально).

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 27 тестов
npm run typecheck
npm run build
```

Без настроенного backend приложение работает на mock-данных. Чтобы увидеть состояние ошибки сети, откройте `/?fail=1`.

## Подключение Supabase

1. Создайте проект в Supabase и выполните `hw5/supabase/migrations/0001_init.sql`, `0002_rls.sql`, затем `seed.sql`.
2. Скопируйте `.env.example` в `.env` и укажите `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` (только anon-ключ; `service_role` во фронтенд не добавляется).
3. Перезапустите `npm run dev`: каталог будет загружаться из базы.

## Структура

```
src/
  pages/        экраны: каталог, набор, корзина
  components/   переиспользуемые компоненты
  lib/          чистая бизнес-логика (цены, корзина, логгер, аналитика)
  data/         mock-данные и API-слой (mock / Supabase)
CLAUDE.md       правила для AI-агента (ДЗ 2)
.github/workflows/ci.yml   CI/CD (ДЗ 6)
```
