const express = require("express");
const cors = require("cors");

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const API_SECRET = process.env.API_SECRET || "";
const SITE_ORIGIN = process.env.SITE_ORIGIN || "*";
const DEFAULT_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

if (!BOT_TOKEN) {
  console.error("ERROR: BOT_TOKEN environment variable is not set.");
  process.exit(1);
}

app.use(cors({
  origin: SITE_ORIGIN === "*" ? true : SITE_ORIGIN.split(",").map(s => s.trim()),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-API-Key"]
}));
app.use(express.json({ limit: "100kb" }));

let telegramOffset = 0;
let polling = false;
let lastUpdateAt = null;
let knownChatIds = new Set(DEFAULT_CHAT_ID ? [String(DEFAULT_CHAT_ID)] : []);

function telegramUrl(method) {
  return `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
}

async function telegram(method, payload = {}) {
  const response = await fetch(telegramUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    const description = data && data.description ? data.description : `HTTP ${response.status}`;
    throw new Error(`Telegram API: ${description}`);
  }

  return data.result;
}

async function sendMessage(chatId, text) {
  if (!chatId) throw new Error("chat_id is required");
  return telegram("sendMessage", {
    chat_id: String(chatId),
    text: String(text).slice(0, 4096)
  });
}

async function handleUpdate(update) {
  lastUpdateAt = new Date().toISOString();

  const message = update.message;
  if (!message || !message.chat) return;

  const chatId = String(message.chat.id);
  knownChatIds.add(chatId);

  const text = (message.text || "").trim();
  if (!text) return;

  if (text === "/start") {
    await sendMessage(
      chatId,
      "🤖 Бот My-transports подключён!\n\n" +
      `Ваш chat_id: ${chatId}\n\n` +
      "Команды:\n" +
      "/start — подключение\n" +
      "/id — показать chat_id\n" +
      "/status — проверить сервер\n" +
      "/help — помощь"
    );
    return;
  }

  if (text === "/id") {
    await sendMessage(chatId, `🆔 Ваш chat_id:\n${chatId}`);
    return;
  }

  if (text === "/status") {
    await sendMessage(
      chatId,
      "🟢 Telegram-сервер работает.\n" +
      `Последняя проверка обновлений: ${lastUpdateAt || "ещё не было"}`
    );
    return;
  }

  if (text === "/help") {
    await sendMessage(
      chatId,
      "ℹ️ My-transports Telegram Bridge\n\n" +
      "/start — подключить чат\n" +
      "/id — показать chat_id\n" +
      "/status — состояние сервера\n" +
      "/help — список команд"
    );
  }
}

async function startPolling() {
  if (polling) return;
  polling = true;

  try {
    // getUpdates cannot be used while a webhook is active.
    await telegram("deleteWebhook", { drop_pending_updates: false });

    // Avoid replaying a large backlog after a Render restart.
    const latest = await telegram("getUpdates", {
      offset: -1,
      limit: 1,
      timeout: 0
    });

    if (Array.isArray(latest) && latest.length) {
      telegramOffset = latest[latest.length - 1].update_id + 1;
    }
  } catch (error) {
    console.error("Initial Telegram setup error:", error.message);
  }

  while (true) {
    try {
      const updates = await telegram("getUpdates", {
        offset: telegramOffset,
        limit: 100,
        timeout: 25,
        allowed_updates: ["message"]
      });

      for (const update of updates) {
        telegramOffset = update.update_id + 1;

        try {
          await handleUpdate(update);
        } catch (error) {
          console.error("Update handling error:", error.message);
        }
      }
    } catch (error) {
      console.error("Telegram polling error:", error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

function requireApiKey(req, res, next) {
  if (!API_SECRET) {
    return res.status(503).json({
      ok: false,
      error: "API_SECRET is not configured on the server"
    });
  }

  const supplied = req.get("X-API-Key") || "";
  if (supplied !== API_SECRET) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized"
    });
  }

  next();
}

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "my-transports-telegram-server"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    telegram: Boolean(BOT_TOKEN),
    polling,
    knownChats: knownChatIds.size,
    lastUpdateAt
  });
});

app.get("/api/telegram/status", requireApiKey, (_req, res) => {
  res.json({
    ok: true,
    polling,
    knownChats: [...knownChatIds],
    lastUpdateAt
  });
});

app.post("/api/telegram/send", requireApiKey, async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({
        ok: false,
        error: "text is required"
      });
    }

    const chatId = String(req.body?.chatId || DEFAULT_CHAT_ID || "");
    if (!chatId) {
      return res.status(400).json({
        ok: false,
        error: "chatId is required. Set TELEGRAM_CHAT_ID in Render or send chatId in the request."
      });
    }

    const result = await sendMessage(chatId, text);

    res.json({
      ok: true,
      messageId: result.message_id,
      chatId
    });
  } catch (error) {
    console.error("Send error:", error.message);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Telegram bridge listening on 0.0.0.0:${PORT}`);
  startPolling();
});
