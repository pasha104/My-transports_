# Подключение BUSPHOTO к Telegram

1. Backend должен быть опубликован на Render.
2. В Render → Environment добавьте `BOT_TOKEN` с токеном от @BotFather.
3. В `busphoto-cloud-config.js` должен стоять адрес backend, например:
   `https://busphoto-api.onrender.com`
4. Загрузите все файлы этой версии в корень GitHub-репозитория сайта.
5. Откройте `interactive.html`. В правом нижнем углу появится блок **«Telegram и облако»**.
6. Дождитесь появления шестизначного кода.
7. В Telegram отправьте боту команду `/link КОД`.
8. После успешной привязки в блоке появится `Telegram подключён`.

Токен Telegram не должен находиться в файлах сайта или GitHub. Он хранится только в переменных окружения Render.
