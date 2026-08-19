
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) { console.error('BOT_TOKEN is missing'); process.exit(1); }

const db = new Database(process.env.DB_PATH || path.join(__dirname, 'busphoto.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL UNIQUE,
  state_json TEXT NOT NULL,
  link_code TEXT NOT NULL UNIQUE,
  telegram_chat_id TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  meta_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions(player_id, created_at DESC);
`);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '3mb' }));

function now(){ return Date.now(); }
function code(){ return String(Math.floor(100000 + Math.random()*900000)); }
function key(){ return crypto.randomBytes(24).toString('hex'); }
function defaultState(){
  return { balance:50000, month:1, lastPayoutDate:null, owned:[], routes:[], serviceCards:[], log:[] };
}
function normalizeState(state){
  const s = (state && typeof state === 'object') ? state : defaultState();
  s.balance = Number.isFinite(Number(s.balance)) ? Number(s.balance) : 50000;
  s.owned = Array.isArray(s.owned) ? s.owned : [];
  s.routes = Array.isArray(s.routes) ? s.routes : [];
  s.serviceCards = Array.isArray(s.serviceCards) ? s.serviceCards : [];
  s.log = Array.isArray(s.log) ? s.log : [];
  for(const c of s.serviceCards){
    if(!Number.isFinite(Number(c.terminalPayoutLastProcessedAt))) c.terminalPayoutLastProcessedAt = null;
    if(!Number.isFinite(Number(c.terminalPayouts))) c.terminalPayouts = 0;
  }
  return s;
}
function playerByKey(apiKey){
  return db.prepare('SELECT * FROM players WHERE api_key=?').get(apiKey);
}
function savePlayer(id,state){
  const t=now();
  db.prepare('UPDATE players SET state_json=?,updated_at=? WHERE id=?')
    .run(JSON.stringify(normalizeState(state)),t,id);
}
function parseHHMM(v){
  if(!/^\d\d:\d\d$/.test(String(v||''))) return null;
  const [h,m]=String(v).split(':').map(Number);
  if(h>23||m>59) return null;
  return h*60+m;
}
function cardWindow(c){
  let a=parseHHMM(c.departurePark), start=parseHHMM(c.departureStart), end=parseHHMM(c.arrivalEnd), park=parseHHMM(c.returnPark);
  if([a,start,end,park].some(x=>x==null)) return null;
  if(start<a) start+=1440;
  if(end<=start) end+=1440;
  if(park<=end) park+=1440;
  return {start,end};
}
function countArrivals(card,route,pair,fromMs,toMs){
  if(!card||!route||toMs<=fromMs) return 0;
  const w=cardWindow(card); if(!w) return 0;
  const dwell1=Math.max(0,Number(route.turnaroundMinutes||2));
  const dwell2=Math.max(0,Number(pair?.turnaroundMinutes||route.turnaroundMinutes||2));
  const first=Math.max(60,Number(route.calculatedDuration||1200))/60+dwell1;
  const second=Math.max(60,Number(pair?.calculatedDuration||route.calculatedDuration||1200))/60+dwell2;
  const cycle=first+second;
  let total=0;
  let day=new Date(fromMs); day.setHours(0,0,0,0);
  const last=new Date(toMs); last.setHours(0,0,0,0);
  for(;day<=last;day.setDate(day.getDate()+1)){
    const ds=day.getTime();
    let start=ds+w.start*60000, end=ds+w.end*60000;
    if(w.end<w.start) end+=86400000;
    const a=Math.max(fromMs,start), b=Math.min(toMs,end);
    if(b<=a) continue;
    const ea=Math.max(0,(a-start)/60000), eb=Math.max(0,(b-start)/60000);
    if(pair){
      const f=x=>Math.floor(x/cycle)*2 + ((x%cycle)>=first?1:0);
      total += Math.max(0,f(eb)-f(ea));
    } else {
      total += Math.max(0,Math.floor(eb/first)-Math.floor(ea/first));
    }
  }
  return total;
}
function processTerminalEarnings(player){
  const s=normalizeState(JSON.parse(player.state_json));
  const routes=new Map(s.routes.map(r=>[String(r.id),r]));
  let total=0, details=[];
  const nowMs=now();
  const tx=db.transaction(()=>{
    for(const card of s.serviceCards){
      const route=routes.get(String(card.routeId)); if(!route) continue;
      const pair=route.pairedRouteId ? routes.get(String(route.pairedRouteId)) : null;
      const from=Number(card.terminalPayoutLastProcessedAt||0);
      const fromMs=from>0?from:nowMs;
      if(from<=0){ card.terminalPayoutLastProcessedAt=nowMs; continue; }
      const arrivals=countArrivals(card,route,pair,fromMs,nowMs);
      if(arrivals>0){
        const amount=arrivals*100;
        total+=amount;
        card.terminalPayouts=Number(card.terminalPayouts||0)+arrivals;
        details.push({route:route.number,arrivals,amount});
      }
      card.terminalPayoutLastProcessedAt=nowMs;
    }
    if(total){
      s.balance+=total;
      s.log.unshift({date:new Date(nowMs).toISOString(),month:s.month,total,details:details.map(x=>`Конечная №${x.route}: ${x.arrivals} × 100 р. = ${x.amount} р.`),terminal:true});
      s.log=s.log.slice(0,60);
      db.prepare('INSERT INTO transactions(player_id,amount,type,meta_json,created_at) VALUES(?,?,?,?,?)')
        .run(player.id,total,'terminal',JSON.stringify(details),nowMs);
    }
    savePlayer(player.id,s);
  });
  tx();
  return {state:s,total,details};
}
function auth(req,res,next){
  const p=playerByKey(req.header('x-api-key'));
  if(!p) return res.status(401).json({error:'invalid_api_key'});
  req.player=p; next();
}

app.get('/health',(req,res)=>res.json({ok:true,service:'busphoto-api'}));

app.post('/api/players/register',(req,res)=>{
  const playerId=String(req.body.playerId||'').trim();
  const state=normalizeState(req.body.state);
  if(!playerId) return res.status(400).json({error:'playerId_required'});
  let p=db.prepare('SELECT * FROM players WHERE id=?').get(playerId);
  if(!p){
    let link=code(); while(db.prepare('SELECT 1 FROM players WHERE link_code=?').get(link)) link=code();
    p={id:playerId,api_key:key(),state_json:JSON.stringify(state),link_code:link,telegram_chat_id:null,created_at:now(),updated_at:now()};
    db.prepare('INSERT INTO players VALUES(?,?,?,?,?,?,?)').run(p.id,p.api_key,p.state_json,p.link_code,null,p.created_at,p.updated_at);
  }
  const result=processTerminalEarnings(p);
  p=db.prepare('SELECT * FROM players WHERE id=?').get(playerId);
  res.json({apiKey:p.api_key,linkCode:p.link_code,state:result.state,telegramLinked:!!p.telegram_chat_id});
});

app.get('/api/state',auth,(req,res)=>{
  const result=processTerminalEarnings(req.player);
  const p=db.prepare('SELECT * FROM players WHERE id=?').get(req.player.id);
  res.json({state:result.state,balance:result.state.balance,terminalEarned:result.total,telegramLinked:!!p.telegram_chat_id});
});

app.post('/api/state/restore',auth,(req,res)=>{
  // Explicit one-time restore: the player can restore the local browser state
  // after the first cloud sync accidentally replaced it with the default state.
  const incoming=normalizeState(req.body.state);
  const current=normalizeState(JSON.parse(req.player.state_json));
  // Never allow an empty/default restore to destroy a non-empty server account.
  const looksMeaningful = Number(incoming.balance)!==50000 || incoming.owned.length>0 || incoming.routes.length>0 || incoming.serviceCards.length>0 || incoming.log.length>0;
  if(!looksMeaningful) return res.status(400).json({error:'restore_state_is_empty_or_default'});
  savePlayer(req.player.id,incoming);
  const p=db.prepare('SELECT * FROM players WHERE id=?').get(req.player.id);
  res.json({state:normalizeState(JSON.parse(p.state_json)),balance:normalizeState(JSON.parse(p.state_json)).balance,telegramLinked:!!p.telegram_chat_id});
});

app.post('/api/state',auth,(req,res)=>{
  const incoming=normalizeState(req.body.state);
  const current=normalizeState(JSON.parse(req.player.state_json));
  // Do not accept a client rollback of server balance.
  if(Number(incoming.balance)<Number(current.balance)) incoming.balance=current.balance;
  const result=processTerminalEarnings(req.player);
  const merged=normalizeState(result.state);
  Object.assign(merged,incoming,{balance:Math.max(merged.balance,Number(incoming.balance),Number(result.state.balance))});
  savePlayer(req.player.id,merged);
  res.json({state:merged,balance:merged.balance});
});

app.post('/api/buy',auth,(req,res)=>{
  const {category,model}=req.body||{};
  const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'catalog.json'),'utf8'));
  const item=catalog?.[category]?.[model];
  if(!item) return res.status(400).json({error:'unknown_vehicle'});
  const result=processTerminalEarnings(req.player);
  const s=result.state;
  if(s.balance<item.price) return res.status(400).json({error:'not_enough_money',balance:s.balance,price:item.price});
  s.balance-=item.price;
  const id='server-'+Date.now()+'-'+crypto.randomBytes(3).toString('hex');
  s.owned.push({id,category,model,plate:'',num:'',currentSalary:null});
  s.log.unshift({date:new Date().toISOString(),month:s.month,total:-item.price,details:[`Покупка: ${model} за ${item.price} р.`],purchase:true});
  s.log=s.log.slice(0,60);
  savePlayer(req.player.id,s);
  db.prepare('INSERT INTO transactions(player_id,amount,type,meta_json,created_at) VALUES(?,?,?,?,?)')
    .run(req.player.id,-item.price,'purchase',JSON.stringify({category,model}),now());
  res.json({state:s});
});

app.post('/api/telegram/link',(req,res)=>{
  const {code:linkCode,chatId}=req.body||{};
  const p=db.prepare('SELECT * FROM players WHERE link_code=?').get(String(linkCode||''));
  if(!p) return res.status(404).json({error:'invalid_code'});
  db.prepare('UPDATE players SET telegram_chat_id=?,updated_at=? WHERE id=?').run(String(chatId),now(),p.id);
  res.json({ok:true,playerId:p.id});
});

const bot=new TelegramBot(BOT_TOKEN,{polling:true});
bot.setMyCommands([
  {command:'start',description:'Открыть меню'},
  {command:'balance',description:'Баланс'},
  {command:'vehicles',description:'Мои ТС'},
  {command:'stats',description:'Статистика'},
  {command:'link',description:'Привязать сайт'}
]);
function linked(chatId){
  return db.prepare('SELECT * FROM players WHERE telegram_chat_id=?').get(String(chatId));
}
async function menu(chatId){
  const p=linked(chatId);
  if(!p) return bot.sendMessage(chatId,'🔗 Сначала привяжи сайт командой /link КОД\\nКод можно получить в интерактиве сайта.');
  const r=processTerminalEarnings(p); const s=r.state;
  return bot.sendMessage(chatId,`🚌 BUSPHOTO\\n\\n💰 Баланс: ${Math.round(s.balance).toLocaleString('ru-RU')} ₽\\n🚌 ТС: ${s.owned.length}\\n🛣 Маршрутов: ${s.routes.length}\\n\\n+${r.total} ₽ начислено за конечные при проверке.`,{
    reply_markup:{inline_keyboard:[
      [{text:'💰 Баланс',callback_data:'balance'},{text:'🚌 Мои ТС',callback_data:'vehicles'}],
      [{text:'📊 Статистика',callback_data:'stats'},{text:'🔄 Обновить',callback_data:'refresh'}]
    ]}
  });
}
bot.onText(/\/start/,msg=>menu(msg.chat.id));
bot.onText(/\/balance/,msg=>menu(msg.chat.id));
bot.onText(/\/vehicles/,async msg=>{
  const p=linked(msg.chat.id); if(!p) return menu(msg.chat.id);
  const r=processTerminalEarnings(p), s=r.state;
  const text=s.owned.length?s.owned.map((v,i)=>`${i+1}. ${v.model||'ТС'} · ${v.plate||v.num||'без номера'}`).join('\\n'):'Пока нет купленных ТС.';
  bot.sendMessage(msg.chat.id,`🚌 Мои ТС\\n\\n${text}`);
});
bot.onText(/\/stats/,async msg=>{
  const p=linked(msg.chat.id); if(!p) return menu(msg.chat.id);
  const rows=db.prepare('SELECT amount,type,created_at FROM transactions WHERE player_id=? ORDER BY created_at DESC LIMIT 10').all(p.id);
  bot.sendMessage(msg.chat.id,'📊 Последние операции\\n\\n'+(rows.length?rows.map(x=>`${x.amount>=0?'+':''}${x.amount} ₽ · ${x.type}`).join('\\n'):'Нет операций'));
});
bot.onText(/\/link\s+(\d{6})/,async (msg,match)=>{
  const linkCode=match[1];
  const p=db.prepare('SELECT * FROM players WHERE link_code=?').get(linkCode);
  if(!p) return bot.sendMessage(msg.chat.id,'❌ Код не найден. Получи новый код на сайте.');
  db.prepare('UPDATE players SET telegram_chat_id=?,updated_at=? WHERE id=?').run(String(msg.chat.id),now(),p.id);
  bot.sendMessage(msg.chat.id,'✅ Telegram успешно привязан к твоей игре!');
  menu(msg.chat.id);
});
bot.on('callback_query',async q=>{
  const p=linked(q.message.chat.id); if(!p){await bot.answerCallbackQuery(q.id);return menu(q.message.chat.id);}
  const r=processTerminalEarnings(p),s=r.state;
  if(q.data==='vehicles') {
    const text=s.owned.length?s.owned.map((v,i)=>`${i+1}. ${v.model||'ТС'} · ${v.plate||v.num||'без номера'}`).join('\\n'):'Пока нет купленных ТС.';
    await bot.sendMessage(q.message.chat.id,`🚌 Мои ТС\\n\\n${text}`);
  } else if(q.data==='stats') {
    await bot.sendMessage(q.message.chat.id,`📊 Баланс: ${s.balance.toLocaleString('ru-RU')} ₽\\nТС: ${s.owned.length}\\nМаршрутов: ${s.routes.length}`);
  } else {
    await bot.sendMessage(q.message.chat.id,`💰 Баланс: ${s.balance.toLocaleString('ru-RU')} ₽`);
  }
  bot.answerCallbackQuery(q.id);
});
app.listen(PORT,()=>console.log(`BUSPHOTO API on :${PORT}`));
