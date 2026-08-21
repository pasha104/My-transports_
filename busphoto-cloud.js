/* My-transports — простой локальный профиль + Telegram без Supabase.
   Все данные игры продолжают храниться в localStorage.
   Telegram подключается через Render.
*/
(function(){
  const cfg = window.BP_TELEGRAM_CONFIG || {apiBase:"https://my-transports-telegram.onrender.com"};
  const apiBase = String(cfg.apiBase || '').replace(/\/$/,'');
  const USER_KEY = 'mytransports_local_user_v1';
  const TG_KEY = 'mytransports_telegram_status_v1';
  const KEYS = ['busphoto_interactive_game','busphoto_service_cards_v1'];

  let profile = null;
  try { profile = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch {}
  if(!profile || !profile.id){
    profile = { id: 'local-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now()+'-'+Math.random().toString(36).slice(2)), createdAt: new Date().toISOString() };
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }

  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  async function jsonFetch(path, options={}){
    const r=await fetch(apiBase+path, options);
    const j=await r.json().catch(()=>({ok:false,error:'Сервер вернул неверный ответ'}));
    if(!r.ok || j.ok===false) throw new Error(j.error || `Ошибка сервера ${r.status}`);
    return j;
  }
  async function startTelegramLink(){
    return jsonFetch('/api/telegram/link/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:profile.id})});
  }
  async function telegramStatus(){
    try{return await jsonFetch('/api/telegram/link/status?userId='+encodeURIComponent(profile.id));}
    catch(e){return {ok:false,connected:false,error:e.message};}
  }
  async function sendTelegram(text){
    return jsonFetch('/api/telegram/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:profile.id,text})});
  }
  function logout(){
    if(!confirm('Удалить локальный профиль с этого устройства?')) return;
    localStorage.removeItem(USER_KEY); localStorage.removeItem(TG_KEY); location.reload();
  }

  window.bpCloudReady = Promise.resolve();
  window.bpCloud = {
    get user(){return profile},
    get supabase(){return null},
    syncNow: async()=>true,
    startTelegramLink,
    telegramStatus,
    sendTelegram,
    logout,
    configured:()=>true,
    openAuth
  };

  function renderBar(){
    if(!document.body || document.getElementById('bpAuthBar')) return;
    const bar=document.createElement('div'); bar.id='bpAuthBar';
    bar.innerHTML='<button type="button" id="bpAuthButton">👤 Профиль</button>';
    const style=document.createElement('style'); style.textContent=`
      #bpAuthBar{position:fixed;right:10px;bottom:10px;z-index:100000}
      #bpAuthButton{border:1px solid #55718c;border-radius:999px;background:#1e3f66;color:#fff;padding:9px 13px;font-weight:700;box-shadow:0 4px 18px #0004;cursor:pointer}
      #bpAuthModal{position:fixed;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;z-index:100001;padding:15px}
      #bpAuthCard{width:min(430px,100%);background:#fff;color:#111;border-radius:16px;padding:18px;box-shadow:0 15px 60px #0008}
      #bpAuthCard h2{margin:0 0 12px} #bpAuthCard button{padding:11px 14px;border:0;border-radius:9px;margin:5px 4px 0 0;cursor:pointer;font-weight:700}
      .bp-primary{background:#1e3f66;color:#fff}.bp-secondary{background:#eee;color:#111}.bp-danger{background:#b00020;color:#fff}
      #bpAuthMsg{min-height:20px;margin:10px 0;color:#444;line-height:1.45}.bp-user-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    `; document.head.appendChild(style); document.body.appendChild(bar); bar.querySelector('button').onclick=openAuth;
  }
  function openAuth(){
    let old=document.getElementById('bpAuthModal'); if(old){old.remove();return;}
    const m=document.createElement('div'); m.id='bpAuthModal';
    m.innerHTML=`<div id="bpAuthCard">
      <h2>👤 My-transports</h2>
      <div><b>Профиль устройства</b></div>
      <div style="font-size:12px;color:#666;margin-top:5px;word-break:break-all">ID: ${esc(profile.id)}</div>
      <div id="bpAuthMsg">Профиль уже готов. Регистрация и Supabase для работы сайта не нужны.</div>
      <div class="bp-user-row">
        <button class="bp-primary" id="bpTg">🤖 Подключить Telegram</button>
        <button class="bp-secondary" id="bpClose">Закрыть</button>
        <button class="bp-danger" id="bpLogout">Сбросить профиль</button>
      </div>
    </div>`;
    document.body.appendChild(m);
    m.querySelector('#bpClose').onclick=()=>m.remove();
    m.querySelector('#bpLogout').onclick=logout;
    m.querySelector('#bpTg').onclick=async()=>{
      const msg=m.querySelector('#bpAuthMsg');
      try{
        const st=await telegramStatus();
        if(st.connected){msg.textContent='✅ Telegram уже подключён к этому профилю.';return;}
        const r=await startTelegramLink();
        msg.innerHTML=`🤖 Откройте бота и отправьте ему код <b>${esc(r.code)}</b>.<br>Код действует 10 минут.`;
        let n=0; const timer=setInterval(async()=>{n++; const s=await telegramStatus(); if(s.connected){clearInterval(timer);msg.textContent='✅ Telegram успешно подключён!';} if(n>=30)clearInterval(timer)},2000);
      }catch(e){msg.textContent='❌ '+e.message;}
    };
  }
  window.addEventListener('DOMContentLoaded',renderBar);
})();
