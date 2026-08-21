const express=require('express');
const cors=require('cors');
const app=express();
const PORT=Number(process.env.PORT)||10000;
const BOT_TOKEN=process.env.BOT_TOKEN||process.env.TELEGRAM_BOT_TOKEN;
const SITE_ORIGIN=process.env.SITE_ORIGIN||'*';
const SITE_URL=process.env.SITE_URL||'https://pasha104.github.io/My-transports_/interactive.html';
if(!BOT_TOKEN){console.error('BOT_TOKEN is not set');process.exit(1);}
app.use(cors({origin:SITE_ORIGIN==='*'?true:SITE_ORIGIN.split(',').map(s=>s.trim()),methods:['GET','POST','OPTIONS'],allowedHeaders:['Content-Type']}));
app.use(express.json({limit:'300kb'}));
const pending=new Map(); // code -> {userId,expiresAt}
const users=new Map(); // userId -> {chatId,state,actions,lastSeen}
const chatToUser=new Map();
const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function code(){let s='';for(let i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)];return 'MY-'+s;}
function clean(){const now=Date.now();for(const [k,v] of pending)if(v.expiresAt<now)pending.delete(k);}
function userByChat(chatId){const id=chatToUser.get(String(chatId));return id?users.get(id):null;}
function telegramUrl(m){return `https://api.telegram.org/bot${BOT_TOKEN}/${m}`;}
async function tg(method,payload={}){const r=await fetch(telegramUrl(method),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.description||`Telegram HTTP ${r.status}`);return j.result;}
async function send(chatId,text,extra={}){return tg('sendMessage',Object.assign({chat_id:String(chatId),text:String(text).slice(0,4096),disable_web_page_preview:true},extra));}
function menu(){return {inline_keyboard:[[{text:'💰 Баланс',callback_data:'balance'},{text:'🚍 Мои ТС',callback_data:'vehicles'}],[{text:'📅 Карточки',callback_data:'cards'},{text:'🔧 Ремонт',callback_data:'repair'}],[{text:'📊 Статистика',callback_data:'stats'},{text:'👤 Профиль',callback_data:'profile'}],[{text:'🌐 Открыть сайт',url:SITE_URL}]]};}
function money(n){return Number(n||0).toLocaleString('ru-RU')+' р.';}
function stateText(st){return st||{balance:0,owned:[],cards:[],log:[]};}
function vehicleLabel(v){return `${v.category==='trolleybus'?'🚎':v.category==='electrobus'?'⚡':'🚍'} ${v.model}${v.submodel?' '+v.submodel:''} · ${v.plate||v.num||'без номера'}`;}
function renderVehicles(st){if(!st.owned?.length)return '🚍 В гараже пока нет ТС.';return '🚍 Мои ТС:\n\n'+st.owned.map((v,i)=>`${i+1}. ${vehicleLabel(v)}\n   Состояние: ${Math.round(v.health??100)}%${v.maintenanceDue?' ⚠️ требуется ремонт':''}${v.repairUntil?'\n   🔧 Ремонт до: '+new Date(v.repairUntil).toLocaleString('ru-RU'):''}`).join('\n\n');}
function renderCards(st){if(!st.cards?.length)return '📅 Созданных карточек пока нет.';return '📅 Карточки:\n\n'+st.cards.map((c,i)=>`${i+1}. ТС: ${c.vehicleId||'—'} · ${c.active===false?'⏸ выключена':'▶️ активна'}\n   Выезд: ${c.parkDeparture||'—'} · до ${c.workUntil||c.endTime||'—'}`).join('\n\n');}
function renderStats(st){const owned=st.owned||[];const earned=owned.reduce((a,v)=>a+Number(v.stats?.earned||0),0);return `📊 Статистика\n\nТС: ${owned.length}\nЗаработано ТС: ${money(earned)}\nОпераций в истории: ${(st.log||[]).length}`;}
function renderRepair(st){const owned=st.owned||[];if(!owned.length)return '🔧 ТС для ремонта нет.';return '🔧 Состояние ТС:\n\n'+owned.map(v=>{const h=Math.round(v.health??100);const cost=Number(v.repairCost||0);const until=v.repairUntil?new Date(v.repairUntil).toLocaleString('ru-RU'):'не ремонтируется';return `${vehicleLabel(v)}\nСостояние: ${h}%\nСтоимость: ${cost?money(cost):'рассчитается при ремонте'}\n${v.repairUntil?'⏳ до '+until:'Готово к работе'}`}).join('\n\n');}
async function handleMessage(m){const chatId=String(m.chat.id);const text=(m.text||'').trim();if(!text)return;
 if(/^MY-[A-Z0-9]{6}$/i.test(text)){clean();const c=text.toUpperCase(),item=pending.get(c);if(!item){await send(chatId,'❌ Код недействителен или истёк. Создай новый код на сайте.');return;}let u=users.get(item.userId)||{actions:[]};u.chatId=chatId;u.lastSeen=Date.now();users.set(item.userId,u);chatToUser.set(chatId,item.userId);pending.delete(c);await send(chatId,'✅ Telegram успешно подключён к твоему My-transports профилю!\n\nНажми /menu.',{reply_markup:menu()});return;}
 if(text==='/start'||text==='/menu'){await send(chatId,'🤖 My-transports\n\nПодключи Telegram через Профиль на сайте, затем используй меню ниже.',{reply_markup:menu()});return;}
 if(text==='/id'){await send(chatId,'🆔 Ваш chat_id: '+chatId);return;}
 if(text==='/status'){await send(chatId,`🟢 Сервер работает. Подключённых профилей: ${users.size}`);return;}
 if(text==='/help'){await send(chatId,'Команды:\n/start или /menu — меню\n/id — chat_id\n/status — сервер\n/help — помощь');return;}
}
async function handleCallback(q){const chatId=String(q.message.chat.id);const u=userByChat(chatId);await tg('answerCallbackQuery',{callback_query_id:q.id});if(!u){await send(chatId,'❌ Профиль не найден. Сначала подключи Telegram через сайт.');return;}const st=stateText(u.state);const d=q.data;
 if(d==='balance')return send(chatId,`💰 Баланс: ${money(st.balance)}\n🚍 ТС: ${(st.owned||[]).length}`,{reply_markup:menu()});
 if(d==='vehicles')return send(chatId,renderVehicles(st),{reply_markup:menu()});
 if(d==='cards')return send(chatId,renderCards(st),{reply_markup:menu()});
 if(d==='stats')return send(chatId,renderStats(st),{reply_markup:menu()});
 if(d==='repair'){const damaged=(st.owned||[]).filter(v=>Number(v.health??100)<100&&!v.repairUntil);const kb=damaged.slice(0,10).map(v=>[{text:'🔧 Ремонт '+v.model+' · '+Math.round(v.health??100)+'%',callback_data:'repair:'+String(v.id)}]);return send(chatId,renderRepair(st)+'\n\nВыбери ТС — команда попадёт на сайт при следующем открытии/обновлении.',{reply_markup:{inline_keyboard:[...kb,...menu().inline_keyboard]}});}
 if(d==='profile')return send(chatId,`👤 Профиль My-transports\n\nTelegram chat_id: ${chatId}\nСайт подключён.`,{reply_markup:menu()});
 if(d.startsWith('repair:')){const id=d.slice(7);u.actions.push({type:'repair',vehicleId:id,createdAt:Date.now()});return send(chatId,'🔧 Команда на ремонт отправлена на сайт. Открой My-transports — ремонт начнётся автоматически, если хватает денег.',{reply_markup:menu()});}
}
let offset=0;async function polling(){try{await tg('deleteWebhook',{drop_pending_updates:false});const x=await tg('getUpdates',{offset:-1,limit:1,timeout:0});if(x.length)offset=x[x.length-1].update_id+1;}catch(e){console.error('Telegram init:',e.message);}while(true){try{const arr=await tg('getUpdates',{offset,limit:50,timeout:25,allowed_updates:['message','callback_query']});for(const u of arr){offset=u.update_id+1;try{if(u.message)await handleMessage(u.message);else if(u.callback_query)await handleCallback(u.callback_query);}catch(e){console.error('update:',e.message);}}}catch(e){console.error('polling:',e.message);await sleep(5000);}}}
app.get('/',(req,res)=>res.json({ok:true,service:'my-transports-telegram-server',mode:'simple-menu'}));
app.get('/health',(req,res)=>res.json({ok:true,polling:true,connectedUsers:users.size}));
app.post('/api/telegram/link/start',(req,res)=>{clean();const userId=String(req.body?.userId||'').trim();if(!userId)return res.status(400).json({ok:false,error:'userId is required'});for(const [k,v] of pending)if(v.userId===userId)pending.delete(k);const c=code(),expiresAt=Date.now()+10*60*1000;pending.set(c,{userId,expiresAt});res.json({ok:true,code:c,expiresAt:new Date(expiresAt).toISOString()});});
app.get('/api/telegram/link/status',(req,res)=>{const userId=String(req.query.userId||'').trim(),u=users.get(userId);res.json({ok:true,connected:Boolean(u?.chatId),chatId:u?.chatId||null});});
app.post('/api/telegram/state',(req,res)=>{const userId=String(req.body?.userId||'').trim();if(!userId)return res.status(400).json({ok:false,error:'userId is required'});const u=users.get(userId)||{actions:[]};u.state=req.body.state||{};u.lastSeen=Date.now();users.set(userId,u);if(u.chatId)chatToUser.set(String(u.chatId),userId);res.json({ok:true});});
app.get('/api/telegram/actions',(req,res)=>{const userId=String(req.query.userId||'').trim(),u=users.get(userId)||{actions:[]};const actions=u.actions||[];u.actions=[];users.set(userId,u);res.json({ok:true,actions});});
app.post('/api/telegram/send',async(req,res)=>{try{const userId=String(req.body?.userId||'').trim(),u=users.get(userId),text=String(req.body?.text||'').trim();if(!u?.chatId)return res.status(400).json({ok:false,error:'Telegram не подключён'});if(!text)return res.status(400).json({ok:false,error:'text is required'});const r=await send(u.chatId,text);res.json({ok:true,messageId:r.message_id});}catch(e){res.status(500).json({ok:false,error:e.message});}});
app.listen(PORT,'0.0.0.0',()=>{console.log(`My-transports Telegram server listening on ${PORT}`);polling();});
