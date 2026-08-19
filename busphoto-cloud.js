
(function(){
  'use strict';
  const API = String(window.BUSPHOTO_API_URL || '').replace(/\/+$/,'');
  if(!API || API.includes('YOUR-BUSPHOTO-BACKEND')) return;

  const PID_KEY='busphoto_cloud_player_id';
  const KEY_KEY='busphoto_cloud_api_key';
  const LINK_KEY='busphoto_cloud_link_code';
  let playerId=localStorage.getItem(PID_KEY);
  let apiKey=localStorage.getItem(KEY_KEY);
  let syncing=false;

  function id(){
    if(!playerId){
      playerId='p_'+crypto.randomUUID();
      localStorage.setItem(PID_KEY,playerId);
    }
    return playerId;
  }
  async function json(url,opt){
    const r=await fetch(API+url,Object.assign({headers:{'Content-Type':'application/json'}},opt||{}));
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.error||('HTTP '+r.status));
    return data;
  }
  function localState(){
    try { return window.gameState ? JSON.parse(JSON.stringify(window.gameState)) : null; } catch(e){ return null; }
  }
  async function register(){
    const data=await json('/api/players/register',{method:'POST',body:JSON.stringify({playerId:id(),state:localState()})});
    apiKey=data.apiKey; localStorage.setItem(KEY_KEY,apiKey);
    if(data.linkCode){localStorage.setItem(LINK_KEY,data.linkCode); window.busphotoLinkCode=data.linkCode;}
    if(data.state && window.gameState){
      window.gameState=Object.assign(window.gameState,data.state);
      if(typeof window.renderInteractive==='function') window.renderInteractive();
    }
    return data;
  }
  async function pull(){
    if(!apiKey || syncing) return;
    syncing=true;
    try{
      const data=await json('/api/state',{headers:{'Content-Type':'application/json','x-api-key':apiKey}});
      if(data.state && window.gameState){
        window.gameState=Object.assign(window.gameState,data.state);
        localStorage.setItem('busphoto_interactive_game',JSON.stringify(window.gameState));
        if(typeof window.renderInteractive==='function') window.renderInteractive();
      }
    }catch(e){ console.warn('BUSPHOTO cloud pull:',e.message); }
    finally{syncing=false;}
  }
  async function push(){
    if(!apiKey || syncing) return;
    const state=localState(); if(!state) return;
    syncing=true;
    try{
      const data=await json('/api/state',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey},body:JSON.stringify({state})});
      if(data.state && window.gameState){
        window.gameState=Object.assign(window.gameState,data.state);
        localStorage.setItem('busphoto_interactive_game',JSON.stringify(window.gameState));
      }
    }catch(e){ console.warn('BUSPHOTO cloud push:',e.message); }
    finally{syncing=false;}
  }
  function panel(){
    if(document.getElementById('busphotoCloudPanel')) return;
    const p=document.createElement('div'); p.id='busphotoCloudPanel';
    p.innerHTML='<div class="bp-cloud-title">☁️ Telegram / облако</div>'+
      '<div id="bpCloudStatus">Подключение…</div>'+
      '<div class="bp-cloud-code" id="bpCloudCode"></div>'+
      '<button type="button" id="bpCloudRefresh">🔄 Синхронизировать</button>';
    document.body.appendChild(p);
    document.getElementById('bpCloudRefresh').onclick=async()=>{await pull();await push();show();};
  }
  function show(){
    const st=document.getElementById('bpCloudStatus'), c=document.getElementById('bpCloudCode');
    if(!st) return;
    st.textContent=apiKey?'☁️ Облако подключено':'⏳ Подключение…';
    const code=localStorage.getItem(LINK_KEY);
    if(c) c.innerHTML=code?'В Telegram отправь: <b>/link '+code+'</b>':'';
  }
  async function boot(){
    panel(); show();
    try{ if(!apiKey) await register(); else await pull(); }catch(e){console.warn('BUSPHOTO cloud:',e.message);}
    show();
    setInterval(async()=>{ if(document.visibilityState==='visible') await push(); },10000);
    document.addEventListener('visibilitychange',async()=>{if(document.visibilityState==='visible'){await pull();}});
    window.addEventListener('beforeunload',()=>{try{navigator.sendBeacon(API+'/api/state',new Blob([JSON.stringify({state:localState()})],{type:'application/json'}));}catch(e){}});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
