BUSPHOTO v52 — modular interactive

Интерактив теперь разделён на отдельные HTML-файлы. Главный interactive.html только собирает страницу, а разделы загружаются отдельно через interactive-loader.js.

Файлы:
- interactive.html — оболочка интерактива
- interactive-menu.html — меню
- interactive-shop.html — магазин
- interactive-garage.html — гараж
- interactive-finance.html — финансы
- interactive-history.html — история
- interactive-routes.html — маршруты
- interactive-map.html — карта и построение маршрута
- interactive-dispatch.html — диспетчерская
- interactive-stats.html — статистика ТС
- interactive-maintenance.html — обслуживание/ремонт
- interactive-rules.html — правила
- interactive-loader.js — загрузчик разделов
- busphoto-interactive.js — общая игровая логика

Важно: логика игры и localStorage сохранены. Разделение сделано для того, чтобы дальше исправлять конкретный экран, не переписывая весь interactive.html.

Маршруты и построение по дорогам оставлены из предыдущей версии v51.
