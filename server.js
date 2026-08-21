const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const SITE_ORIGIN = process.env.SITE_ORIGIN || '*';
const SITE_URL = process.env.SITE_URL || 'https://pasha104.github.io/My-transports_/interactive.html';

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN environment variable is not set.');
  process.exit(1);
}

app.use(cors({
  origin: SITE_ORIGIN === '*' ? true : SITE_ORIGIN.split(',').map(s => s.trim()),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '100kb' }));

const pending = new Map();
const connections = new Map();
const chatToUser = new Map();
const snapshots = new Map();

function telegramUrl(method) { return `https://api.telegram.org/bot${BOT_TOKEN}/${method}`; }
async function telegram(method, payload = {}) {
  const response = await fetch(telegramUrl(method), {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(`Telegram API: ${data?.description || `HTTP ${response.status}`}`);
  return data.result;
}
async function sendMessage(chatId, text, extra = {}) {
  return telegram('sendMessage', {chat_id:String(chatId), text:String(text).slice(0,4096), ...extra});
}
function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i=0;i<6;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return 'MY-' + s;
}
function cleanPending() {
  const now = Date.now();
  for (const [code,item] of pending) if (item.expiresAt < now) pending.delete(code);
}
function userSnapshot(chatId) {
  const userId = chatToUser.get(String(chatId));
  return userId ? snapshots.get(userId) : null;
}
function menuMarkup() {
  return { inline_keyboard: [
    [{text:'🛒 Магазин', callback_data:'shop'}, {text:'🚍 Мои ТС', callback_data:'vehicles'}],
    [{text:'📅 Карточки', callback_data:'cards'}, {text:'🚦 Диспетчерская', callback_data:'dispatch'}],
    [{text:'📊 Статистика', callback_data:'stats'}, {text:'💰 Баланс', callback_data:'balance'}],
    [{text:'📜 История', callback_data:'history'}, {text:'🔧 Ремонт', callback_data:'repair'}],
    [{text:'👤 Профиль', callback_data:'profile'}, {text:'🌐 Сайт', url:SITE_URL}]
  ]};
}
function textForSection(chatId, section) {
  const s = userSnapshot(chatId);
  if (!s) return '⚪ Данные сайта ещё не переданы серверу. Открой сайт, подключи Telegram и немного попользуйся интерактивом.';
  if (section === 'balance') return `💰 Баланс: ${Math.round(s.balance || 0).toLocaleString('ru-RU')} р.\n🚍 ТС: ${(s.owned||[]).length}`;
  if (section === 'vehicles') {
    const list = s.owned || [];
    if (!list.length) return '🚍 В гараже пока нет ТС.';
    return '🚍 Мои ТС:\n\n' + list.map((v,i)=>`${i+1}. ${v.model || 'ТС'} · ${v.plate || v.num || '—'} · состояние ${Math.round(v.condition ?? 100)}%${v.repairUntil && Number(v.repairUntil)>Date.now() ? ' · 🔧 в ремонте' : ''}`).join('\n');
  }
  if (section === 'cards') {
    const list = s.serviceCards || [];
    if (!list.length) return '📅 Карточек выезда пока нет.';
    return '📅 Карточки:\n\n' + list.map(c=>`№${c.number || '—'} · ТС ${c.vehicleId || 'не назначено'} · ${c.departureStart || '—'} → ${c.arrivalEnd || '—'}`).join('\n');
  }
  if (section === 'dispatch') {
    const list = s.routes || [];
    if (!list.length) return '🚦 Маршрутов пока нет.';
    return '🚦 Диспетчерская:\n\n' + list.map(r=>`№${r.number || '—'} ${r.start || ''} → ${r.end || ''} · ТС: ${(r.vehicleIds||[]).length}`).join('\n');
  }
  if (section === 'stats') {
    const list = s.owned || [];
    const repair = list.filter(v=>v.repairUntil && Number(v.repairUntil)>Date.now()).length;
    const avg = list.length ? Math.round(list.reduce((a,v)=>a+Number(v.condition ?? 100),0)/list.length) : 0;
    return `📊 Статистика\n\nТС: ${list.length}\nНа ремонте: ${repair}\nСреднее состояние: ${avg}%\nКарточек: ${(s.serviceCards||[]).length}`;
  }
  if (section === 'repair') {
    const list = (s.owned||[]).filter(v=>v.repairUntil && Number(v.repairUntil)>Date.now());
    if (!list.length) return '🔧 Сейчас ремонтируемых ТС нет.';
    return '🔧 Ремонт:\n\n' + list.map(v=>`${v.model || 'ТС'} · окончание ${new Date(v.repairUntil).toLocaleString('ru-RU')}`).join('\n');
  }
  if (section === 'history') {
    const list = s.log || [];
    return '📜 Последние операции:\n\n' + (list.length ? list.slice(0,8).map(x=>`${x.date || ''} · ${x.total != null ? x.total + ' р.' : ''} ${(x.details||[]).join('; ')}`).join('\n') : 'История пока пуста.');
  }
  if (section === 'profile') return `👤 Профиль My-transports\n\nTelegram подключён.\nUser ID: ${s.userId || '—'}\nПоследняя синхронизация: ${s.updatedAt ? new Date(s.updatedAt).toLocaleString('ru-RU') : '—'}`;
  if (section === 'shop') return `🛒 Магазин\n\nПокупки оставлены на сайте, чтобы не менять твою существующую механику.\nОткрой сайт и используй обычный магазин.`;
  return 'Выбери раздел ниже.';
}
async function showMenu(chatId) {
  return sendMessage(chatId, '🤖 My-transports\n\nВыбери нужный раздел:', {reply_markup:menuMarkup()});
}

async function handleCallback(query) {
  const chatId = String(query.message?.chat?.id || '');
  const data = String(query.data || '');
  if (!chatId) return;
  await telegram('answerCallbackQuery', {callback_query_id:query.id});
  if (data === 'menu') return showMenu(chatId);
  return sendMessage(chatId, textForSection(chatId, data), {reply_markup:menuMarkup()});
}

async function handleUpdate(update) {
  if (update.callback_query) return handleCallback(update.callback_query);
  const message = update.message;
  if (!message?.chat) return;
  const chatId = String(message.chat.id);
  const text = (message.text || '').trim();
  if (!text) return;

  if (/^MY-[A-Z0-9]{6}$/i.test(text)) {
    cleanPending();
    const code = text.toUpperCase();
    const item = pending.get(code);
    if (!item) return sendMessage(chatId, '❌ Код недействителен или уже истёк. Создай новый код на сайте.');
    connections.set(item.userId, chatId);
    chatToUser.set(chatId, item.userId);
    pending.delete(code);
    await sendMessage(chatId, '✅ Telegram успешно подключён к твоему My-transports профилю!');
    return showMenu(chatId);
  }
  if (text === '/start' || text === '/menu') return showMenu(chatId);
  if (text === '/id') return sendMessage(chatId, `🆔 Ваш chat_id:\n${chatId}`);
  if (text === '/status') return sendMessage(chatId, '🟢 Telegram-сервер работает.');
  if (text === '/help') return sendMessage(chatId, 'ℹ️ /menu — меню\n/id — chat_id\n/status — сервер\n/help — помощь');
  if (['/balance','/vehicles','/cards','/stats','/history','/repair'].includes(text)) {
    const section = text.slice(1);
    return sendMessage(chatId, textForSection(chatId, section), {reply_markup:menuMarkup()});
  }
}

let telegramOffset = 0, polling = false, lastUpdateAt = null;
async function startPolling() {
  if (polling) return;
  polling = true;
  try {
    await telegram('deleteWebhook', {drop_pending_updates:false});
    const latest = await telegram('getUpdates', {offset:-1, limit:1, timeout:0, allowed_updates:['message','callback_query']});
    if (Array.isArray(latest) && latest.length) telegramOffset = latest[latest.length-1].update_id + 1;
  } catch (e) { console.error('Initial Telegram setup error:', e.message); }
  while (true) {
    try {
      const updates = await telegram('getUpdates', {offset:telegramOffset, limit:100, timeout:25, allowed_updates:['message','callback_query']});
      lastUpdateAt = new Date().toISOString();
      for (const update of updates) {
        telegramOffset = update.update_id + 1;
        try { await handleUpdate(update); } catch (e) { console.error('Update error:', e.message); }
      }
    } catch (e) {
      console.error('Telegram polling error:', e.message);
      await new Promise(r=>setTimeout(r,5000));
    }
  }
}

app.get('/', (_req,res)=>res.json({ok:true,service:'my-transports-telegram-server',mode:'menu'}));
app.get('/health', (_req,res)=>res.json({ok:true,telegram:Boolean(BOT_TOKEN),polling,lastUpdateAt,connectedUsers:connections.size,snapshots:snapshots.size}));

app.post('/api/telegram/link/start', (req,res)=>{
  cleanPending();
  const userId = String(req.body?.userId || '').trim();
  if (!userId) return res.status(400).json({ok:false,error:'userId is required'});
  for (const [code,item] of pending) if (item.userId === userId) pending.delete(code);
  const code = makeCode();
  const expiresAt = Date.now() + 10*60*1000;
  pending.set(code,{userId,expiresAt});
  res.json({ok:true,code,expiresAt:new Date(expiresAt).toISOString()});
});
app.get('/api/telegram/link/status', (req,res)=>{
  const userId = String(req.query.userId || '').trim();
  const chatId = connections.get(userId) || null;
  res.json({ok:true,connected:Boolean(chatId),chatId});
});
app.post('/api/state', (req,res)=>{
  const userId = String(req.body?.userId || '').trim();
  const state = req.body?.state;
  if (!userId || !state || typeof state !== 'object') return res.status(400).json({ok:false,error:'userId and state are required'});
  snapshots.set(userId, {...state,userId,updatedAt:Date.now()});
  res.json({ok:true});
});
app.get('/api/state', (req,res)=>{
  const userId = String(req.query.userId || '').trim();
  res.json({ok:true,state:snapshots.get(userId) || null});
});

app.listen(PORT,'0.0.0.0',()=>{
  console.log(`Telegram bridge listening on 0.0.0.0:${PORT}`);
  startPolling();
});
