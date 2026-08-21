# My-transports Telegram — простой режим

Этот сервер работает БЕЗ Supabase и БЕЗ SQL.

## Render

- Language: Node
- Root Directory: `telegram-server`
- Build Command: `npm install`
- Start Command: `npm start`
- Instance: Free

Нужна только одна переменная:

- `BOT_TOKEN` — токен Telegram-бота

`SITE_ORIGIN` можно не задавать: для простого режима сервер разрешает запросы с сайта.

## Подключение

На сайте: 👤 Профиль → 🤖 Подключить Telegram → отправить код боту.

ВАЖНО: привязки хранятся в памяти Render. При перезапуске/сне бесплатного сервиса привязку Telegram может потребоваться сделать заново. Данные интерактива при этом остаются в localStorage браузера.
