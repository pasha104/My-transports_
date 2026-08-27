/* BUSPHOTO non-blocking modular loader v78
 * Critical path: menu + shop -> main JS. All other sections are lazy/background.
 */
(function(){
  'use strict';
  if (window.__BUSPHOTO_INTERACTIVE_LOADER_V78__) return;
  window.__BUSPHOTO_INTERACTIVE_LOADER_V78__ = true;
  const VERSION='20260827-v103';
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
    ['rules','interactive-rules.html','interactive-rules-host']
  ];
  const byName=Object.fromEntries(sections.map(x=>[x[0],x]));
  const loaded=new Set(), loading=new Map();
  function status(text,error){const el=document.getElementById('interactiveLoadingStatus'); if(!el)return; el.textContent=text; el.style.display=''; el.style.borderColor=error?'#d32f2f':'';}
  async function fetchWithTimeout(url,ms){
    const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms);
    try {
      return await fetch(url,{cache:'default',credentials:'same-origin',signal:c.signal});
    } finally {
      clearTimeout(t);
    }
  }
  async function loadOne(name,opts={}){
    const item=byName[name]; if(!item)return false;
    if(loaded.has(name))return true; if(loading.has(name))return loading.get(name);
    const [,file,hostId]=item;
    const promise=(async()=>{
      const host=document.getElementById(hostId);
      if(!host)throw new Error('Host not found: '+hostId);
      // Некоторые лёгкие разделы встроены в interactive.html, чтобы они были
      // доступны даже при медленном соединении. Не скачиваем их повторно.
      if(host.querySelector('#game-section-'+name)){
        loaded.add(name);
        return true;
      }
      host.replaceChildren();
      const r=await fetchWithTimeout(file+'?v='+VERSION,opts.timeout||8000);
      if(!r.ok)throw new Error(file+' HTTP '+r.status);
      host.innerHTML=await r.text(); loaded.add(name);
      if(name==='garage' && typeof renderGarageSection==='function') renderGarageSection();
      if(name==='history' && typeof renderHistorySection==='function') renderHistorySection();
      return true;
    })();
    loading.set(name,promise);
    try{return await promise;} finally{loading.delete(name);}
  }
  function refreshSectionData(section){
    try{
      // The fragments are inserted after the main JS has already rendered.
      // Refresh only the requested section; never rebuild the whole page.
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
        window.showGameSection(section,btn);
        refreshSectionData(section);
        return;
      }
      window.__BUSPHOTO_PENDING_SECTION__={section,btn};
      await loadOne(section,{timeout:8000});
      if(typeof window.showGameSection==='function'){
        const p=window.__BUSPHOTO_PENDING_SECTION__; window.__BUSPHOTO_PENDING_SECTION__=null;
        window.showGameSection(p?.section||section,p?.btn||btn);
        refreshSectionData(p?.section||section);
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
    // Only the menu is critical. The main JS is loaded immediately; the shop is
    // fetched in the background and then explicitly starts the game state.
    try{await loadOne('menu',{timeout:8000});}
    catch(e){console.error(e); status('Не удалось загрузить меню. Проверь соединение.',true); return;}
    try{await loadMain();}
    catch(e){console.error(e); status('Не удалось запустить интерактивный модуль.',true); return;}

    const initGame=()=>{
      if(typeof window.__BUSPHOTO_INIT_INTERACTIVE_GAME__!=='function' || window.__BUSPHOTO_GAME_INITIALIZED__) return;
      try{
        window.__BUSPHOTO_INIT_INTERACTIVE_GAME__();
        window.__BUSPHOTO_GAME_INITIALIZED__=true;
        console.info('[BUSPHOTO] game initialized');
      }catch(e){
        // Не запускаем бесконечный цикл повторов: он только создавал лавину ошибок.
        window.__BUSPHOTO_GAME_INITIALIZED__=false;
        console.error('[BUSPHOTO] game init failed', e?.stack || e);
        status('Интерактив запущен частично. Открой раздел ещё раз.',true);
      }
    };

    // Карту не загружаем целиком при старте: её HTML и 10k+ остановок не должны
    // нагружать главный экран. Подготавливаем только Leaflet в фоне.
    if (typeof window.ensureLeafletLoaded === 'function') {
      Promise.resolve().then(()=>window.ensureLeafletLoaded()).catch(()=>{});
    }

    // Shop is not allowed to block the page. Once its controls arrive, initialize
    // the game against the real shared localStorage state.
    // Инициализируем игру сразу. Все функции теперь терпимы к отсутствующим
    // фрагментам DOM, поэтому магазин/гараж/карта больше не могут заблокировать init.
    initGame();
    loadOne('shop',{timeout:8000}).then(()=>{
      if(!window.__BUSPHOTO_GAME_INITIALIZED__) initGame();
    }).catch(e=>console.warn('[BUSPHOTO] shop deferred',e));

    const st=document.getElementById('interactiveLoadingStatus'); if(st)st.style.display='none';
    const p=window.__BUSPHOTO_PENDING_SECTION__;
    if(p&&typeof window.showGameSection==='function'){
      window.__BUSPHOTO_PENDING_SECTION__=null;
      window.showGameSection(p.section,p.btn);
    }

    // Background loading never blocks the main screen.
    const rest=['garage','finance','history','routes','rules'];
    let i=0;
    const next=()=>{
      if(i>=rest.length)return;
      const n=rest[i++];
      loadOne(n,{timeout:8000}).catch(e=>console.warn('[BUSPHOTO] background section',n,e));
      if('requestIdleCallback' in window) requestIdleCallback(next,{timeout:1500});
      else setTimeout(next,80);
    };
    next();
  }
  function boot(){if(window.__BUSPHOTO_INTERACTIVE_STARTED_V78__)return; window.__BUSPHOTO_INTERACTIVE_STARTED_V78__=true; start();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
