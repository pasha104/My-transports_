# Подключение Telegram

1. В `server/.env` добавь токен, который выдал BotFather.
2. Размести `server/` на Node.js-хостинге.
3. Получи публичный HTTPS-адрес API, например `https://busphoto-api.example.com`.
4. В `busphoto-cloud-config.js` замени `YOUR-BUSPHOTO-BACKEND.example.com` на этот адрес.
5. Загрузи обновлённые файлы сайта на GitHub Pages.
6. Открой `interactive.html`. Внизу появится код привязки.
7. В Telegram открой `@Busfotointeractivbot` и отправь `/link КОД`.
8. После этого сайт и бот будут видеть общую серверную базу.

Токен бота не помещай в GitHub Pages.
