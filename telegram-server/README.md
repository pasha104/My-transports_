# Telegram server for My-transports

## Render settings

- Language: Node
- Root Directory: `telegram-server`
- Build Command: `npm install`
- Start Command: `npm start`
- Instance: Free

## Environment Variables

Required:

- `BOT_TOKEN` — Telegram bot token from BotFather
- `API_SECRET` — a private random string used by the website when calling `/api/telegram/send`

Optional:

- `TELEGRAM_CHAT_ID` — your Telegram chat ID after you send `/start` to the bot
- `SITE_ORIGIN` — your GitHub Pages origin, for example `https://pasha104.github.io`

Do not put the bot token or API secret into GitHub source code.

## First test

1. Deploy the service on Render.
2. Open the bot in Telegram and send `/start`.
3. The bot replies with your `chat_id`.
4. Put that ID into Render as `TELEGRAM_CHAT_ID` and redeploy.
5. Open `https://YOUR-SERVICE.onrender.com/health` and check that it returns JSON.
6. The website can later call `POST /api/telegram/send` with:
   - Header: `X-API-Key: API_SECRET`
   - JSON: `{ "text": "Тестовое уведомление" }`

The server uses Telegram long polling (`getUpdates`) and sends messages with `sendMessage`.
