# My-transports Telegram + accounts

## Render
- Root Directory: `telegram-server`
- Build Command: `npm install`
- Start Command: `npm start`
- Instance: Free

## Required Render Environment Variables
- `BOT_TOKEN` — token from BotFather. Never put it in GitHub.
- `SUPABASE_URL` — URL of the Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key. Never put it in GitHub.
- `SITE_ORIGIN` — e.g. `https://pasha104.github.io`

Optional:
- `API_SECRET` — private secret for future server-to-server notifications.

## Supabase
1. Create a Supabase project.
2. Open SQL Editor and run `supabase_schema.sql`.
3. In Supabase project settings copy:
   - Project URL
   - Publishable/anon key
4. Put the Project URL and anon key into `busphoto-cloud-config.js`.
5. Put the Project URL and service-role key into Render Environment Variables.

## User accounts
The website uses Supabase Auth (email/password). Interactive data is stored per user in `user_state`:
- balance
- owned vehicles
- routes
- service cards
- history and other interactive state

The public database of reference vehicles remains separate.

## Telegram
1. Log in on the website.
2. Open the floating `👤` account button.
3. Choose `🤖 Telegram`.
4. The website gives a one-time code.
5. Open the My-transports bot and send that code.
6. The bot links its chat_id to the current user account.

Each user gets a different Telegram connection. The bot token is shared by the bot, but chat IDs and game data are separated by user ID.

## Important
Do not publish `SUPABASE_SERVICE_ROLE_KEY` or `BOT_TOKEN` in the GitHub repository.
