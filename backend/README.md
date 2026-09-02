# BUSPHOTO Python Engine

Отдельный Python/FastAPI-сервис для тяжёлой игровой логики. Основной сайт остаётся на GitHub Pages.

## Что уже есть

- `GET /health` — проверка сервиса.
- `GET /api/time` — серверное UTC-время.
- `POST /api/route/calculate` — расстояние и реалистичное время движения по точкам маршрута с учётом остановок.
- `POST /api/trip/calculate` — расчёт пассажиров и выплаты за рейс.
- `POST /api/salary/calculate` — расчёт зарплаты и бонусов.

## Запуск локально

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

API после запуска: `http://127.0.0.1:8000`.

## Переменная окружения

`ALLOWED_ORIGINS` — список разрешённых адресов сайта через запятую. Пока можно оставить `*` для тестирования. После публикации лучше указать только адрес GitHub Pages.

## Следующий этап

Подключить этот API к `interactive.html`/`busphoto-interactive.js`, а затем вынести сохранение критичных игровых данных в Supabase. До подключения API текущая версия игры продолжает работать по-старому.
