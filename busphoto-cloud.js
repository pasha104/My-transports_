/* My-transports — лёгкий профиль + Telegram.
   Игровая логика остаётся локальной. Сервер Telegram получает только снимок
   состояния, нужный для меню бота, и не вмешивается в базу данных сайта.
*/
(function(){
  const cfg = window.BP_TELEGRAM_CONFIG || {};
  const apiBase = String(cfg.apiBase || '').replace(/\/$/,'');
  const USER_KEY = 'mytransports_local_user_v2';
  let profile = null;
  try { profile = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch(e) {}
  if(!profile || !profile.id){
    const uid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now()+'-'+Math.random().toString(36).slice(2);
    profile = {id:'local-'+uid, createdAt:new Date().toISOString()};
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }

  async function api(path, options={}){
    if(!apiBase) throw new Error('Telegram-сервер не настроен');
    const r = await fetch(apiBase+path, options);
    const j = await r.json().catch(()=>({ok:false,error:'Неверный ответ сервера'}));
    if(!r.ok || j.ok===false) throw new Error(j.error || ('Ошибка сервера '+r.status));
    return j;
  }
  async function startTelegramLink(){
    return api('/api/telegram/link/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:profile.id})});
  }
  async function telegramStatus(){
    try{return await api('/api/telegram/link/status?userId='+encodeURIComponent(profile.id));}
    catch(e){return {ok:false,connected:false,error:e.message};}
  }
  async function sendTelegram(text){
    return api('/api/telegram/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:profile.id,text})});
  }
  async function syncState(state){
    if(!apiBase || !state) return false;
    try{
      const safe={
        balance:Number(state.balance||0),
        owned:(state.owned||[]).map(v=>({id:String(v.id),model:v.model,submodel:v.submodel,category:v.category,plate:v.plate,num:v.num,price:Number(v.price||0),currentSalary:Number(v.currentSalary||0),health:Number(v.health==null?100:v.health),maintenanceDue:!!v.maintenanceDue,repairUntil:v.repairUntil||null,repairCost:Number(v.repairCost||0),stats:v.stats||{trips:0,arrivals:0,distanceKm:0,workMinutes:0,earned:0}})),
        cards:(state.serviceCards||[]).map(c=>({id:c.id,vehicleId:c.vehicleId,active:c.active!==false,routeId:c.routeId,parkDeparture:c.parkDeparture,startTime:c.startTime,endTime:c.endTime,workUntil:c.workUntil})),
        log:(state.log||[]).slice(0,20).map(x=>({date:x.date,time:x.time,type:x.type,total:Number(x.total||0),details:Array.isArray(x.details)?x.details.slice(0,3):[]})),
        updatedAt:new Date().toISOString()
      };
      await api('/api/telegram/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:profile.id,state:safe})});
      return true;
    }catch(e){return false;}
  }
  async function pullActions(){
    if(!apiBase) return [];
    try{const r=await api('/api/telegram/actions?userId='+encodeURIComponent(profile.id));return Array.isArray(r.actions)?r.actions:[];}catch(e){return [];}
  }

  window.bpCloudReady=Promise.resolve();
  window.bpCloud={user:profile,get supabase(){return null;},configured:()=>Boolean(apiBase),startTelegramLink,telegramStatus,sendTelegram,syncState,pullActions,openAuth:function(){ if(typeof window.openTelegramProfile==='function') window.openTelegramProfile(); }};

  window.openTelegramProfile=async function(){
    const old=document.getElementById('bpTelegramModal'); if(old){old.remove();return;}
    const m=document.createElement('div');m.id='bpTelegramModal';
    const css=`<style id="bpTelegramStyle">#bpTelegramModal{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}#bpTelegramCard{width:min(430px,100%);background:var(--bp-panel,#fff);color:var(--bp-text,#111);border:1px solid var(--bp-border,#ccc);border-radius:18px;padding:18px;box-shadow:0 15px 50px #0008}#bpTelegramCard button{padding:11px 14px;border:0;border-radius:10px;font-weight:700;margin:5px 5px 0 0;cursor:pointer}#bpTelegramConnect{background:#2481cc;color:#fff}#bpTelegramClose{background:#e9e9e9;color:#111}#bpTelegramMsg{margin:12px 0;line-height:1.45;word-break:break-word}.bp-tg-code{font-size:24px;font-weight:900;letter-spacing:2px;text-align:center;padding:12px;border-radius:10px;background:rgba(30,63,102,.12)}</style>`;
    m.innerHTML=css+`<div id="bpTelegramCard"><h2 style="margin:0 0 8px">👤 My-transports</h2><div class="interactive-muted">Профиль этого устройства</div><div style="font-size:11px;opacity:.7;margin-top:4px;word-break:break-all">ID: ${profile.id}</div><div id="bpTelegramMsg">Проверяем Telegram…</div><button id="bpTelegramConnect">🤖 Подключить Telegram</button><button id="bpTelegramClose">Закрыть</button></div>`;
    document.body.appendChild(m);
    m.querySelector('#bpTelegramClose').onclick=()=>m.remove();
    const msg=m.querySelector('#bpTelegramMsg');
    const check=async()=>{const s=await telegramStatus(); if(s.connected){msg.innerHTML='✅ Telegram подключён.<br><span style="font-size:12px;opacity:.75">chat_id: '+s.chatId+'</span>';return true;} msg.textContent='Telegram ещё не подключён.';return false;};
    await check();
    m.querySelector('#bpTelegramConnect').onclick=async()=>{
      try{const r=await startTelegramLink();msg.innerHTML=`Отправь этот код своему боту:<div class="bp-tg-code">${r.code}</div><div style="font-size:12px;margin-top:7px">Код действует 10 минут. После отправки боту окно можно оставить открытым — подключение определится автоматически.</div>`;let n=0;const t=setInterval(async()=>{n++;if(await check()){clearInterval(t);if(typeof window.syncTelegramGameState==='function')window.syncTelegramGameState();}if(n>=60)clearInterval(t)},2000);}catch(e){msg.textContent='❌ '+e.message;}
    };
  };
})();
