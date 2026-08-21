const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const SITE_ORIGIN = process.env.SITE_ORIGIN || "*";

if (!BOT_TOKEN) {
  console.error("ERROR: BOT_TOKEN environment variable is not set.");
  process.exit(1);
}

app.use(cors({
  origin: SITE_ORIGIN === "*" ? true : SITE_ORIGIN.split(",").map(s => s.trim()),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "100kb" }));

// Простое хранилище для привязки Telegram. Для первого/простого варианта
// никакой Supabase, SQL или API-ключей сайта не требуется.
const pending = new Map();       // code -> { userId, expiresAt }
const connections = new Map();   // userId -> chatId
const chatToUser = new Map();    // chatId -> userId

function telegramUrl(method){return `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;}
async function telegram(method,payload={}){
  const response=await fetch(telegramUrl(method),{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  });
  const data=await response.json();
  if(!response.ok || !data.ok) throw new Error(`Telegram API: ${data?.description || `HTTP ${response.status}`}`);
  return data.result;
}
async function sendMessage(chatId,text){
  return telegram("sendMessage",{chat_id:String(chatId),text:String(text).slice(0,4096)});
}
function makeCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s="";
  for(let i=0;i<6;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return "MY-"+s;
}
function cleanPending(){
  const now=Date.now();
  for(const [code,item] of pending) if(item.expiresAt<now) pending.delete(code);
}

async function handleUpdate(update){
  const message=update.message;
  if(!message?.chat) return;
  const chatId=String(message.chat.id);
  const text=(message.text||"").trim();
  if(!text) return;

  if(/^MY-[A-Z0-9]{6}$/i.test(text)){
    cleanPending();
    const code=text.toUpperCase();
    const item=pending.get(code);
    if(!item){
      await sendMessage(chatId,"❌ Код недействителен или уже истёк. Создайте новый код на сайте.");
      return;
    }
    connections.set(item.userId,chatId);
    chatToUser.set(chatId,item.userId);
    pending.delete(code);
    await sendMessage(chatId,"✅ Telegram успешно подключён к вашему My-transports профилю!");
    return;
  }

  if(text==="/start"){
    await sendMessage(chatId,
      "🤖 Бот My-transports работает!\n\n"+
      "Для подключения откройте на сайте 👤 Профиль → 🤖 Подключить Telegram и отправьте полученный код сюда.\n\n"+
      "/id — показать chat_id\n/status — состояние сервера\n/help — помощь");
    return;
  }
  if(text==="/id"){await sendMessage(chatId,`🆔 Ваш chat_id:\n${chatId}`);return;}
  if(text==="/status"){await sendMessage(chatId,"🟢 Telegram-сервер работает.");return;}
  if(text==="/help"){await sendMessage(chatId,"ℹ️ Команды:\n/start — запуск\n/id — chat_id\n/status — сервер\n/help — помощь");}
}

let telegramOffset=0,polling=false,lastUpdateAt=null;
async function startPolling(){
  if(polling)return; polling=true;
  try{
    await telegram("deleteWebhook",{drop_pending_updates:false});
    const latest=await telegram("getUpdates",{offset:-1,limit:1,timeout:0});
    if(Array.isArray(latest)&&latest.length) telegramOffset=latest[latest.length-1].update_id+1;
  }catch(e){console.error("Initial Telegram setup error:",e.message);}
  while(true){
    try{
      const updates=await telegram("getUpdates",{offset:telegramOffset,limit:100,timeout:25,allowed_updates:["message"]});
      lastUpdateAt=new Date().toISOString();
      for(const update of updates){
        telegramOffset=update.update_id+1;
        try{await handleUpdate(update);}catch(e){console.error("Update error:",e.message);}
      }
    }catch(e){console.error("Telegram polling error:",e.message);await new Promise(r=>setTimeout(r,5000));}
  }
}

app.get("/",(_req,res)=>res.json({ok:true,service:"my-transports-telegram-server",mode:"simple"}));
app.get("/health",(_req,res)=>res.json({ok:true,telegram:Boolean(BOT_TOKEN),polling,lastUpdateAt,connectedUsers:connections.size}));

app.post("/api/telegram/link/start",(req,res)=>{
  try{
    cleanPending();
    const userId=String(req.body?.userId||"").trim();
    if(!userId) return res.status(400).json({ok:false,error:"userId is required"});
    for(const [code,item] of pending) if(item.userId===userId) pending.delete(code);
    const code=makeCode();
    const expiresAt=Date.now()+10*60*1000;
    pending.set(code,{userId,expiresAt});
    res.json({ok:true,code,expiresAt:new Date(expiresAt).toISOString()});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
});

app.get("/api/telegram/link/status",(req,res)=>{
  const userId=String(req.query.userId||"").trim();
  const chatId=connections.get(userId)||null;
  res.json({ok:true,connected:Boolean(chatId),chatId});
});

app.post("/api/telegram/send",async(req,res)=>{
  try{
    const userId=String(req.body?.userId||"").trim();
    const text=String(req.body?.text||"").trim();
    const chatId=connections.get(userId);
    if(!chatId) return res.status(400).json({ok:false,error:"Telegram не подключён"});
    if(!text) return res.status(400).json({ok:false,error:"text is required"});
    const r=await sendMessage(chatId,text);
    res.json({ok:true,messageId:r.message_id});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
});

app.listen(PORT,"0.0.0.0",()=>{
  console.log(`Telegram bridge listening on 0.0.0.0:${PORT}`);
  startPolling();
});
