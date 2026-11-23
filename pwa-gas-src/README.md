# ЛФП v9.68 — устанавливаемая PWA-оболочка Google Apps Script

Дата: 23.11.2026. Отдельный URL `/pwa-gas/`; исходный бюджет `/`, `/pwa-preview/`, `/pwa-local/` не меняются.

## Что делает
- Устанавливается как PWA: свой manifest, логотип ₽, Service Worker и отдельное окно `standalone`.
- При первом открытии спрашивает адрес **нового работающего Apps Script Web App `/exec`**; только этот адрес сохраняется в локальном браузере (`localStorage`), не загружается на GitHub.
- Показывает *тот же* защищённый Apps Script v9.68 в `iframe`; **никакого GIS OAuth/Firebase/Auth кода в PWA-оболочке нет**.
- `google.script.run` **остается внутри iframe HtmlService**, где нужны серверные функции `getAll`, `setCells`, ZenMoney; никогда не переносится в GitHub JS.
- Браузерный вход Google в пределах самого Apps Script **может потребоваться** (особенно при блокировке сторонних cookies). iframe и отсутствие OAuth-кнопки не создают анонимный доступ к таблице. Нет гарантий успешного встраивания без смены X-Frame-Options.
- Кэшируется **только оболочка /pwa-gas/**: `index.html`, `app.js`, `manifest`, `icon`. Никакой Google-ответ, таблица, токен, финансы или ZenMoney не попадают в Service Worker.
- Есть кнопки «Открыть напрямую», «Обновить», «Изменить адрес», подсказка при пустом iframe.

## Что нужно в Apps Script
1. **Не менять** `Zen.gs`, финансовую Google Таблицу, действующий API Executable и существующий `Index.html`.
2. В редакторе *нашего нового Web App* скопировать именно URL `.../exec` из «Управление развёртываниями».
3. Сначала проверить PWA без изменения сервера. При стандартном X-Frame-Options Google может заблокировать iframe.
4. **Только если пользователь осознанно согласен с риском clickjacking:** в **имеющемся** `Code.gs`, внутри `doGet()`, перед `return out;`, после всех `.setTitle/.addMetaTag` добавить:

```js
out.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
```

Затем новая версия **только Web App**; API Executable не менять. При этом все серверные `familyAccess_()` и `lfpNativeRpc` проверки сохраняются.

**ПРЕДУПРЕЖДЕНИЕ:** `ALLOWALL` разрешает **любым сторонним сайтам** вставлять веб-приложение в iframe, а не только `ndinar1982.github.io`. Это увеличивает риск clickjacking, включая операции в авторизованном приложении. Google официально требует отдельной защиты от clickjacking. Apps Script HtmlService не позволяет ограничить ALLOWALL только этим одним origin через API `setXFrameOptionsMode`. Без такого разрешения iframe может не загрузиться. Для строгой безопасности предпочтительнее запускать Apps Script напрямую, а не встраивать.

## Google Таблица
Текущий доступ (проверено Google Drive API 23.11.2026): *owner + one editor*, нет `anyone with the link`. **Не менять** на `Anyone with the link`: это доступ без аккаунта. Для доступа ещё одному человеку добавляйте его Gmail в «Поделиться → Ограниченный доступ → Редактор»; в `Code.gs` отдельный `familyAccess_` allowlist уже защищает веб-приложение.

## Тест
После деплоя откройте `https://ndinar1982.github.io/pwa-gas/`; один раз вставьте свой Web App `/exec` URL; проверьте доступ/авторизацию в Google, отображение сумм и запуск PWA с рабочего стола. **Запись пока проверять только на копии таблицы**, если серверный код был изменён.

Если iframe пустой: «Открыть напрямую», сравните, не блокирует ли Google встраивание или third-party cookies. Не возвращайтесь к публичному Apps Script `execute as owner / anyone` и не делайте финансовую таблицу общедоступной.
