BUSPHOTO fixed build

Changes:
- Removed route creation form from Routes; routes are created only from the Map.
- Moved service-card creation/list into a dedicated Cards section.
- Removed the in-game guide section and navigation button.
- Route section no longer renders service cards.
- Full route list is rendered only when the Routes section is opened, reducing mobile lag.
- Main database now shows game-owned vehicles from localStorage in a separate “Мои ТС из интерактива” panel.
- Added safe HTML escaping helper for the database page.
- Telegram/Render client integration is excluded.
- Existing game localStorage is preserved; no reset on normal update.
