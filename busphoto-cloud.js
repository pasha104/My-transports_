(function(){
  'use strict';
  const API = String(window.BUSPHOTO_API_URL || '').replace(/\/+$/,'');
  const PID_KEY='busphoto_cloud_player_id';
  const KEY_KEY='busphoto_cloud_api_key';
  const LINK_KEY='busphoto_cloud_link_code';
  const LINKED_KEY='busphoto_cloud_telegram_linked';
  let playerId=localStorage.getItem(PID_KEY);
  let apiKey=localStorage.getItem(KEY_KEY);
  let syncing=false;
  let booted=false;

  function makeId(){
    if(!playerId){
      playerId='p_'+(crypto.randomUUID ? crypto.randomUUID() : Date.now()+'_'+Math.random().toString(36).slice(2));
      localStorage.setItem(PID_KEY,playerId);
    }
    return playerId;
  }
  function localState(){
    try { return window.gameState ? JSON.parse(JSON.stringify(window.gameState)) : null; } catch(e){ return null; }
  }
  async function json(url,opt){
    const options=Object.assign({headers:{'Content-Type':'application/json'}},opt||{});
    const r=await fetch(API+url,options);
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.error||('HTTP '+r.status));
    return data;
  }
  function setStatus(text,kind){
    const st=document.getElementById('bpCloudStatus');
    if(!st) return;
    st.textContent=text;
    st.className='bp-cloud-status '+(kind||'');
  }
  function renderPanel(data){
    const code=localStorage.getItem(LINK_KEY);
    const linked=data?.telegramLinked ?? localStorage.getItem(LINKED_KEY)==='1';
    const c=document.getElementById('bpCloudCode');
    const copy=document.getElementById('bpCloudCopy');
    if(linked){
      localStorage.setItem(LINKED_KEY,'1');
      setStatus('✅ Telegram подключён','ok');
    }else if(apiKey){
      setStatus('☁️ Облако подключено · Telegram ещё не привязан','ok');
    }else{
      setStatus('⏳ Подключение к серверу…','loading');
    }
    if(c){
      c.innerHTML = (!linked && code)
        ? '<div class="bp-cloud-code-label">Код привязки</div><div class="bp-cloud-code-value">'+code+'</div><div class="bp-cloud-hint">В Telegram отправь: <b>/link '+code+'</b></div>'
        : linked ? '<div class="bp-cloud-hint">Баланс и данные синхронизируются с Telegram.</div>' : '<div class="bp-cloud-hint">Получаем код привязки…</div>';
    }
    if(copy){ copy.disabled=!code || linked; }
  }
  function panel(){
    if(document.getElementById('busphotoCloudPanel')) return;
    const p=document.createElement('section');
    p.id='busphotoCloudPanel';
    p.setAttribute('aria-label','Telegram и облачная синхронизация');
    p.innerHTML=''+
      '<div class="bp-cloud-head"><div><div class="bp-cloud-title">☁️ Telegram и облако</div><div class="bp-cloud-subtitle">Синхронизация баланса, ТС и прогресса</div></div><button type="button" class="bp-cloud-close" id="bpCloudClose" aria-label="Скрыть">×</button></div>'+
      '<div id="bpCloudStatus" class="bp-cloud-status loading">⏳ Подключение к серверу…</div>'+
      '<div id="bpCloudCode" class="bp-cloud-code"></div>'+
      '<div class="bp-cloud-actions"><button type="button" id="bpCloudRefresh">🔄 Синхронизировать</button><button type="button" id="bpCloudRestore">🛟 Восстановить данные с телефона</button><button type="button" id="bpCloudCopy">📋 Скопировать код</button></div>';
    document.body.appendChild(p);
    document.getElementById('bpCloudRefresh').onclick=async()=>{await sync(true);};
    document.getElementById('bpCloudRestore').onclick=async()=>{
      const state=localState();
      if(!hasMeaningfulLocalState(state)){ setStatus('⚠️ На этом устройстве нет сохранённых старых данных','error'); return; }
      if(!confirm('Заменить данные в облаке данными с этого телефона?')) return;
      try{
        if(!apiKey) await register();
        const restored=await json('/api/state/restore',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey},body:JSON.stringify({state})});
        if(restored.state && window.gameState){ window.gameState=Object.assign(window.gameState,restored.state); localStorage.setItem('busphoto_interactive_game',JSON.stringify(window.gameState)); }
        setStatus('✅ Данные с телефона восстановлены','ok');
        if(typeof window.renderInteractive==='function') window.renderInteractive();
      }catch(e){ setStatus('⚠️ Не удалось восстановить: '+e.message,'error'); }
    };
    document.getElementById('bpCloudCopy').onclick=async()=>{
      const code=localStorage.getItem(LINK_KEY); if(!code) return;
      try{ await navigator.clipboard.writeText('/link '+code); setStatus('📋 Команда скопирована','ok'); setTimeout(()=>renderPanel(),1800); }
      catch(e){ setStatus('Код: '+code,'ok'); }
    };
    document.getElementById('bpCloudClose').onclick=()=>p.classList.toggle('bp-cloud-collapsed');
  }
  function hasMeaningfulLocalState(state){
    if(!state || typeof state!=='object') return false;
    return Number(state.balance)!==50000 || (Array.isArray(state.owned)&&state.owned.length>0) ||
      (Array.isArray(state.routes)&&state.routes.length>0) || (Array.isArray(state.serviceCards)&&state.serviceCards.length>0) ||
      (Array.isArray(state.log)&&state.log.length>0);
  }
  async function register(){
    const local=localState();
    const data=await json('/api/players/register',{method:'POST',body:JSON.stringify({playerId:makeId(),state:local})});
    apiKey=data.apiKey; localStorage.setItem(KEY_KEY,apiKey);
    if(data.linkCode){localStorage.setItem(LINK_KEY,String(data.linkCode));}
    localStorage.setItem(LINKED_KEY,data.telegramLinked?'1':'0');
    // IMPORTANT: never replace an existing local game with the server default on first connection.
    // If this browser has the real progress (e.g. 600 ₽ and 1 ТС), restore it explicitly.
    if(hasMeaningfulLocalState(local) && data.state &&
       Number(data.state.balance)===50000 && (!Array.isArray(data.state.owned)||data.state.owned.length===0)){
      const restored=await json('/api/state/restore',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey},body:JSON.stringify({state:local})});
      if(restored.state && window.gameState){
        window.gameState=Object.assign(window.gameState,restored.state);
        localStorage.setItem('busphoto_interactive_game',JSON.stringify(window.gameState));
      }
      data.state=restored.state;
    } else if(data.state && window.gameState && !hasMeaningfulLocalState(local)){
      // Only adopt server state when the local browser really has no progress.
      window.gameState=Object.assign(window.gameState,data.state);
      localStorage.setItem('busphoto_interactive_game',JSON.stringify(window.gameState));
      if(typeof window.renderInteractive==='function') window.renderInteractive();
    }
    renderPanel(data); return data;
  }
  async function pull(){
    if(!apiKey || syncing) return null;
    const data=await json('/api/state',{headers:{'Content-Type':'application/json','x-api-key':apiKey}});
    if(data.state && window.gameState){
      window.gameState=Object.assign(window.gameState,data.state);
      localStorage.setItem('busphoto_interactive_game',JSON.stringify(window.gameState));
      if(typeof window.renderInteractive==='function') window.renderInteractive();
    }
    localStorage.setItem(LINKED_KEY,data.telegramLinked?'1':'0');
    renderPanel(data); return data;
  }
  async function push(){
    if(!apiKey || syncing) return null;
    const state=localState(); if(!state) return null;
    const data=await json('/api/state',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey},body:JSON.stringify({state})});
    if(data.state && window.gameState){
      window.gameState=Object.assign(window.gameState,data.state);
      localStorage.setItem('busphoto_interactive_game',JSON.stringify(window.gameState));
    }
    return data;
  }
  async function sync(showErrors){
    if(syncing || !API) return;
    syncing=true;
    try{
      setStatus('🔄 Синхронизация…','loading');
      if(!apiKey) await register();
      else await pull();
      await push();
      await pull();
      setStatus(localStorage.getItem(LINKED_KEY)==='1'?'✅ Telegram подключён':'☁️ Сервер подключён · привяжи Telegram по коду','ok');
    }catch(e){
      console.warn('BUSPHOTO cloud:',e.message);
      setStatus('⚠️ Сервер недоступен: '+e.message,'error');
      if(showErrors) console.error(e);
    }finally{ syncing=false; renderPanel(); }
  }
  async function boot(){
    if(booted || !API || API.includes('YOUR-BUSPHOTO-BACKEND')) return;
    booted=true; panel(); renderPanel();
    await sync(false);
    setInterval(()=>{ if(document.visibilityState==='visible') sync(false); },30000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible') sync(false);});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
