/* BUSPHOTO non-blocking modular loader v78
 * Critical path: menu + shop -> main JS. All other sections are lazy/background.
 */
(function(){
  'use strict';
  if (window.__BUSPHOTO_INTERACTIVE_LOADER_V78__) return;
  window.__BUSPHOTO_INTERACTIVE_LOADER_V78__ = true;
  const VERSION='20260828-v106';
  const sections=[
    ['menu','interactive-menu.html','interactive-menu-host'],
    ['map','interactive-map.html','interactive-section-host-map'],
    ['shop','interactive-shop.html','interactive-section-host-shop'],
    ['garage','interactive-garage.html','interactive-section-host-garage'],
    ['finance','interactive-finance.html','interactive-section-host-finance'],
    ['history','interactive-history.html','interactive-section-host-history'],
    ['routes','interactive-routes.html','interactive-section-host-routes'],
    ['dispatch','interactive-dispatch.html','interactive-section-host-dispatch'],
    ['stats','interactive-stats.html','interactive-section-host-stats'],
    ['maintenance','interactive-maintenance.html','interactive-section-host-maintenance'],
    ['sync','interactive-sync.html','interactive-section-host-sync'],
    ['rules','interactive-rules.html','interactive-rules-host']
  ];
  const byName=Object.fromEntries(sections.map(x=>[x[0],x]));
  const loaded=new Set(), loading=new Map();
  function status(text,error){const el=document.getElementById('interactiveLoadingStatus'); if(!el)return; el.textContent=text; el.style.display=''; el.style.borderColor=error?'#d32f2f':'';}
  async function fetchWithTimeout(url,ms){
    const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms);
    try { return await fetch(url,{cache:'default',credentials:'same-origin',signal:c.signal}); }
    finally { clearTimeout(t); }
  }
  async function loadOne(name,opts={}){
    const item=byName[name]; if(!item)return false;
    if(loaded.has(name))return true; if(loading.has(name))return loading.get(name);
    const [,file,hostId]=item;
    const promise=(async()=>{
      const host=document.getElementById(hostId);
      if(!host)throw new Error('Host not found: '+hostId);
      if(host.querySelector('#game-section-'+name)){
        loaded.add(name); return true;
      }
      host.replaceChildren();
      const r=await fetchWithTimeout(file+'?v='+VERSION,opts.timeout||8000);
      if(!r.ok)throw new Error(file+' HTTP '+r.status);
      host.innerHTML=await r.text(); loaded.add(name);
      if(name==='garage' && typeof renderGarageSection==='function') renderGarageSection();
      if(name==='history' && typeof renderHistorySection==='function') renderHistorySection();
      if(name==='sync'){
        if(!document.getElementById('busphotoSyncScript')){
          const sc=document.createElement('script');sc.id='busphotoSyncScript';sc.src='interactive-sync.js?v='+VERSION;
          document.head.appendChild(sc);
          await new Promise((resolve)=>{sc.addEventListener('load',resolve,{once:true});sc.addEventListener('error',resolve,{once:true});});
        }
        if(typeof window.BUSPHOTOInitSync==='function') await window.BUSPHOTOInitSync();
      }
      return true;
    })();
    loading.set(name,promise);
    try{return await promise;} finally{loading.delete(name);}
  }
  function refreshSectionData(section){
    try{
      if(section==='finance'){
        const el=document.getElementById('financeBalance');
        const owned=document.getElementById('financeOwned');
        const last=document.getElementById('financeLastPayout');
        if(typeof gameState!=='undefined'){
          if(el) el.textContent=typeof money==='function'?money(gameState.balance):`${Math.round(Number(gameState.balance||0)).toLocaleString('ru-RU')} р.`;
          if(owned) owned.textContent=Array.isArray(gameState.owned)?gameState.owned.length:0;
          if(last) last.textContent=gameState.lastPayoutDate||'ещё не было';
        }
      } else if(section==='garage'){
        if(typeof renderGarageSection==='function') renderGarageSection();
      } else if(section==='history'){
        if(typeof renderHistorySection==='function') renderHistorySection();
      } else if(section==='routes'){
        if(typeof renderRoutes==='function') renderRoutes();
      } else if(section==='dispatch'||section==='stats'||section==='maintenance'){
        if(typeof renderV43Panels==='function') renderV43Panels();
      }
    }catch(e){ console.warn('[BUSPHOTO] section refresh failed',section,e); }
  }
  window.openInteractiveSection=async function(section,btn){
    try{
      if(typeof window.showGameSection==='function'){
        await loadOne(section,{timeout:8000});
        window.showGameSection(section,btn); refreshSectionData(section); return;
      }
      window.__BUSPHOTO_PENDING_SECTION__={section,btn};
      await loadOne(section,{timeout:8000});
      if(typeof window.showGameSection==='function'){
        const p=window.__BUSPHOTO_PENDING_SECTION__; window.__BUSPHOTO_PENDING_SECTION__=null;
        window.showGameSection(p?.section||section,p?.btn||btn); refreshSectionData(p?.section||section);
      }
    }catch(e){console.error('[BUSPHOTO] section open error',section,e); status('Раздел не удалось загрузить. Попробуй открыть его ещё раз.',true);}
  };
  window.BUSPHOTOEnsureInteractiveSection=loadOne;
  async function loadMain(){
    if(document.querySelector('script[data-busphoto-interactive-main]'))return;
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script'); s.dataset.busphotoInteractiveMain='1'; s.src='busphoto-interactive.js?v='+VERSION; s.onload=resolve; s.onerror=()=>reject(new Error('busphoto-interactive.js')); document.head.appendChild(s);
    });
  }
  async function start(){
    status('Запуск интерактива…');
    try{await loadOne('menu',{timeout:8000});}
    catch(e){console.error(e); status('Не удалось загрузить меню. Проверь соединение.',true); return;}
    try{await loadMain();}
    catch(e){console.error(e); status('Не удалось запустить интерактивный модуль.',true); return;}
    const initGame=()=>{
      if(typeof window.__BUSPHOTO_INIT_INTERACTIVE_GAME__!=='function' || window.__BUSPHOTO_GAME_INITIALIZED__) return;
      try{ window.__BUSPHOTO_INIT_INTERACTIVE_GAME__(); window.__BUSPHOTO_GAME_INITIALIZED__=true; console.info('[BUSPHOTO] game initialized'); }
      catch(e){ console.error('[BUSPHOTO] game initialization failed',e); status('Ошибка запуска игры. Обнови страницу.',true); }
    };
    initGame();
    setTimeout(initGame,300);
    setTimeout(initGame,1000);
    setTimeout(()=>{ if(typeof window.BUSPHOTOEnsureInteractiveSection==='function') window.BUSPHOTOEnsureInteractiveSection('shop',{timeout:8000}).catch(()=>{}); },50);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
