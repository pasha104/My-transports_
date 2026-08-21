# Telegram — максимально простая настройка

1. В Render создай Web Service из папки `telegram-server`.
2. Language: Node.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Instance: Free.
6. Environment Variables:
   - `BOT_TOKEN` — токен Telegram-бота.
   - `SITE_ORIGIN` — `https://pasha104.github.io`
   - `SITE_URL` — `https://pasha104.github.io/My-transports_/interactive.html`

Больше ничего не нужно.

После деплоя проверь `https://ТВОЙ-АДРЕС.onrender.com/health` — должен вернуться JSON с `ok:true`.
