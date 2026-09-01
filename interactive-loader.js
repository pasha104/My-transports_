/* BUSPHOTO — быстрый загрузчик интерактива v110 */
(function(){
  'use strict';
  if(window.__BUSPHOTO_INTERACTIVE_LOADER_V110__)return;
  window.__BUSPHOTO_INTERACTIVE_LOADER_V110__=true;
  const VERSION='20260901-v110';
  const sections={
    menu:['interactive-menu.html','interactive-menu-host'],
    shop:['interactive-shop.html','interactive-section-host-shop'],
    garage:['interactive-garage.html','interactive-section-host-garage'],
    finance:['interactive-finance.html','interactive-section-host-finance'],
    history:['interactive-history.html','interactive-section-host-history'],
    routes:['interactive-routes.html','interactive-section-host-routes'],
    map:['interactive-map.html','interactive-section-host-map'],
    rules:['interactive-rules.html','interactive-rules-host'],
    dispatch:['interactive-dispatch.html','interactive-section-host-dispatch'],
    stats:['interactive-stats.html','interactive-section-host-stats'],
    maintenance:['interactive-maintenance.html','interactive-section-host-maintenance']
  };
  const loaded=new Set(),loading=new Map();
  function status(text,error){const el=document.getElementById('interactiveLoadingStatus');if(!el)return;el.textContent=text;el.style.display='';el.style.borderColor=error?'#d32f2f':'';}
  async function loadOne(name,timeout=7000){
    if(loaded.has(name))return true;
    if(loading.has(name))return loading.get(name);
    const item=sections[name];if(!item)throw new Error('Unknown section '+name);
    const promise=(async()=>{
      const host=document.getElementById(item[1]);
      if(!host)throw new Error('Host not found: '+item[1]);
      if(host.querySelector('#game-section-'+name)){loaded.add(name);return true;}
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),timeout);
      try{
        const r=await fetch(item[0]+'?v='+VERSION,{cache:'no-store',credentials:'same-origin',signal:controller.signal});
        if(!r.ok)throw new Error(item[0]+' HTTP '+r.status);
        host.innerHTML=await r.text();
        loaded.add(name);
        if(name==='garage'&&typeof renderGarageSection==='function')renderGarageSection();
        if(name==='history'&&typeof renderHistorySection==='function')renderHistorySection();
        return true;
      }finally{clearTimeout(timer);}
    })();
    loading.set(name,promise);
    try{return await promise}finally{loading.delete(name)}
  }
  function refresh(name){
    try{
      if(name==='garage'&&typeof renderGarageSection==='function')renderGarageSection();
      if(name==='history'&&typeof renderHistorySection==='function')renderHistorySection();
      if(name==='routes'&&typeof renderRoutes==='function')renderRoutes();
      if((name==='dispatch'||name==='stats'||name==='maintenance')&&typeof renderV43Panels==='function')renderV43Panels();
    }catch(e){console.warn('[BUSPHOTO] refresh',name,e)}
  }
  window.openInteractiveSection=async function(name,btn){
    try{
      await loadOne(name, name==='map'?10000:7000);
      if(typeof window.showGameSection==='function')window.showGameSection(name,btn);
      refresh(name);
    }catch(e){
      console.error('[BUSPHOTO] section open',name,e);
      status('Не удалось открыть раздел. Нажми ещё раз.',true);
    }
  };
  window.BUSPHOTOEnsureInteractiveSection=loadOne;
  async function loadMain(){
    if(document.querySelector('script[data-busphoto-interactive-main]'))return;
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.dataset.busphotoInteractiveMain='1';
      s.src='busphoto-interactive.js?v='+VERSION;
      s.onload=resolve;s.onerror=()=>reject(new Error('busphoto-interactive.js'));
      document.head.appendChild(s);
    });
  }
  async function start(){
    status('Запуск интерактива…');
    try{await loadOne('menu',5000);await loadMain();}
    catch(e){console.error(e);status('Интерактив не удалось запустить. Обнови страницу.',true);return;}
    try{
      if(typeof window.__BUSPHOTO_INIT_INTERACTIVE_GAME__==='function'&&!window.__BUSPHOTO_GAME_INITIALIZED__){
        window.__BUSPHOTO_INIT_INTERACTIVE_GAME__();window.__BUSPHOTO_GAME_INITIALIZED__=true;
      }
    }catch(e){console.error('[BUSPHOTO] init',e);}
    if(typeof window.ensureLeafletLoaded==='function')Promise.resolve().then(()=>window.ensureLeafletLoaded()).catch(()=>{});
    const st=document.getElementById('interactiveLoadingStatus');if(st)st.style.display='none';
    /* Только магазин открываем сразу. Остальные разделы загружаются по нажатию — карта и история больше не блокируют интерфейс. */
    try{await loadOne('shop',7000);if(typeof window.showGameSection==='function')window.showGameSection('shop',document.querySelector('.game-menu-btn'));refresh('shop');}catch(e){console.warn('[BUSPHOTO] shop',e)}
    const q=new URLSearchParams(location.search);
    if(q.get('open')==='map'&&q.get('routeId'))openInteractiveSection('map',null);
  }
  function boot(){if(window.__BUSPHOTO_INTERACTIVE_STARTED_V110__)return;window.__BUSPHOTO_INTERACTIVE_STARTED_V110__=true;start();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
