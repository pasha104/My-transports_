const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const SITE_ORIGIN = process.env.SITE_ORIGIN || "*";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const API_SECRET = process.env.API_SECRET || "";

if (!BOT_TOKEN) {
  console.error("ERROR: BOT_TOKEN environment variable is not set.");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("WARNING: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Accounts and Telegram linking will not work.");
}

app.use(cors({
  origin: SITE_ORIGIN === "*" ? true : SITE_ORIGIN.split(",").map(s => s.trim()),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"]
}));
app.use(express.json({ limit: "100kb" }));

const sbHeaders = () => ({
  "apikey": SUPABASE_SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json"
});
async function sb(path, options={}) {
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase is not configured on Render");
  const r=await fetch(`${SUPABASE_URL.replace(/\/$/,"")}${path}`,{
    ...options, headers:{...sbHeaders(),...(options.headers||{})}
  });
  const text=await r.text();
  let data=null; try{data=text?JSON.parse(text):null}catch{}
  if(!r.ok) throw new Error(data?.message||data?.error_description||text||`Supabase HTTP ${r.status}`);
  return data;
}
async function getUserFromBearer(req){
  const h=req.get("Authorization")||"";
  if(!h.startsWith("Bearer ")) throw new Error("Authorization Bearer token is required");
  const token=h.slice(7).trim();
  if(!token) throw new Error("Empty bearer token");
  if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase is not configured");
  const r=await fetch(`${SUPABASE_URL.replace(/\/$/,"")}/auth/v1/user`,{
    headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${token}`}
  });
  const data=await r.json().catch(()=>null);
  if(!r.ok||!data?.id) throw new Error("Invalid or expired session");
  return data;
}
async function ensureProfile(user){
  await sb("/rest/v1/profiles?on_conflict=id",{
    method:"POST",
    headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},
    body:JSON.stringify({id:user.id,email:user.email||null})
  });
}
async function getProfile(userId){
  const rows=await sb(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,email,telegram_chat_id`);
  return rows?.[0]||null;
}

function telegramUrl(method){return `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;}
async function telegram(method,payload={}){
  const response=await fetch(telegramUrl(method),{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
  });
  const data=await response.json();
  if(!response.ok||!data.ok) throw new Error(`Telegram API: ${data?.description||`HTTP ${response.status}`}`);
  return data.result;
}
async function sendMessage(chatId,text){
  return telegram("sendMessage",{chat_id:String(chatId),text:String(text).slice(0,4096)});
}

function makeCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s="";
  for(let i=0;i<6;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return "MY-"+s;
}

async function handleUpdate(update){
  const message=update.message;
  if(!message?.chat) return;
  const chatId=String(message.chat.id);
  const text=(message.text||"").trim();
  if(!text)return;

  // One-time website account linking code.
  if(/^MY-[A-Z0-9]{6}$/i.test(text)){
    const code=text.toUpperCase();
    const rows=await sb(`/rest/v1/telegram_link_codes?code=eq.${encodeURIComponent(code)}&select=code,user_id,expires_at,used_at`);
    const link=rows?.[0];
    if(!link||link.used_at||new Date(link.expires_at).getTime()<Date.now()){
      await sendMessage(chatId,"❌ Код недействителен или уже истёк. Создайте новый код на сайте.");
      return;
    }
    await ensureProfile({id:link.user_id});
    await sb(`/rest/v1/profiles?id=eq.${encodeURIComponent(link.user_id)}`,{
      method:"PATCH",body:JSON.stringify({telegram_chat_id:chatId})
    });
    await sb(`/rest/v1/telegram_link_codes?code=eq.${encodeURIComponent(code)}`,{
      method:"PATCH",body:JSON.stringify({used_at:new Date().toISOString()})
    });
    await sendMessage(chatId,"✅ Telegram успешно подключён к вашему My-transports аккаунту!");
    return;
  }

  if(text==="/start"){
    await sendMessage(chatId,
      "🤖 Бот My-transports работает!\n\n"+
      "Для подключения к сайту откройте в аккаунте: 👤 → 🤖 Telegram и отправьте полученный код сюда.\n\n"+
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

async function auth(req,res,next){
  try{req.user=await getUserFromBearer(req);next();}
  catch(e){res.status(401).json({ok:false,error:e.message});}
}

app.get("/",(_req,res)=>res.json({ok:true,service:"my-transports-telegram-server"}));
app.get("/health",(_req,res)=>res.json({ok:true,telegram:Boolean(BOT_TOKEN),polling,lastUpdateAt,supabase:Boolean(SUPABASE_URL&&SUPABASE_SERVICE_ROLE_KEY)}));

app.post("/api/telegram/link/start",auth,async(req,res)=>{
  try{
    await ensureProfile(req.user);
    const code=makeCode();
    const expires=new Date(Date.now()+10*60*1000).toISOString();
    await sb("/rest/v1/telegram_link_codes",{
      method:"POST",headers:{"Prefer":"return=minimal"},
      body:JSON.stringify({code,user_id:req.user.id,expires_at:expires})
    });
    res.json({ok:true,code,expiresAt:expires});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
});

app.get("/api/telegram/link/status",auth,async(req,res)=>{
  try{
    const p=await getProfile(req.user.id);
    res.json({ok:true,connected:Boolean(p?.telegram_chat_id),chatId:p?.telegram_chat_id||null});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
});

app.post("/api/telegram/send",auth,async(req,res)=>{
  try{
    const p=await getProfile(req.user.id);
    if(!p?.telegram_chat_id)return res.status(400).json({ok:false,error:"Telegram не подключён"});
    const text=String(req.body?.text||"").trim();
    if(!text)return res.status(400).json({ok:false,error:"text is required"});
    const r=await sendMessage(p.telegram_chat_id,text);
    res.json({ok:true,messageId:r.message_id});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
});

// Optional server-to-server route for future scheduled notifications.
app.post("/api/internal/telegram/send",async(req,res)=>{
  if(!API_SECRET||req.get("X-API-Key")!==API_SECRET)return res.status(401).json({ok:false,error:"Unauthorized"});
  try{
    const p=await getProfile(String(req.body?.userId||""));
    if(!p?.telegram_chat_id)return res.status(400).json({ok:false,error:"Telegram не подключён"});
    const r=await sendMessage(p.telegram_chat_id,String(req.body?.text||""));
    res.json({ok:true,messageId:r.message_id});
  }catch(e){res.status(500).json({ok:false,error:e.message});}
});

app.listen(PORT,"0.0.0.0",()=>{console.log(`Telegram bridge listening on 0.0.0.0:${PORT}`);startPolling();});
