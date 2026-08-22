/* BUSPHOTO non-blocking modular loader v78
 * Critical path: menu + shop -> main JS. All other sections are lazy/background.
 */
(function(){
  'use strict';
  if (window.__BUSPHOTO_INTERACTIVE_LOADER_V78__) return;
  window.__BUSPHOTO_INTERACTIVE_LOADER_V78__ = true;
  const VERSION='20260822-v78';
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
  function fetchWithTimeout(url,ms){
    const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms);
    return fetch(url,{cache:'default',credentials:'same-origin',signal:c.signal}).finally(()=>clearTimeout(t));
  }
  async function loadOne(name,opts={}){
    const item=byName[name]; if(!item)return false;
    if(loaded.has(name))return true; if(loading.has(name))return loading.get(name);
    const [,file,hostId]=item;
    const promise=(async()=>{
      const host=document.getElementById(hostId);
      if(!host)throw new Error('Host not found: '+hostId);
      host.replaceChildren();
      const r=await fetchWithTimeout(file+'?v='+VERSION,opts.timeout||8000);
      if(!r.ok)throw new Error(file+' HTTP '+r.status);
      host.innerHTML=await r.text(); loaded.add(name); return true;
    })();
    loading.set(name,promise);
    try{return await promise;} finally{loading.delete(name);}
  }
  window.openInteractiveSection=async function(section,btn){
    try{
      if(typeof window.showGameSection==='function'){
        await loadOne(section,{timeout:7000});
        window.showGameSection(section,btn); return;
      }
      window.__BUSPHOTO_PENDING_SECTION__={section,btn};
      await loadOne(section,{timeout:7000});
      if(typeof window.showGameSection==='function'){const p=window.__BUSPHOTO_PENDING_SECTION__; window.__BUSPHOTO_PENDING_SECTION__=null; window.showGameSection(p?.section||section,p?.btn||btn);}
    }catch(e){console.error('[BUSPHOTO] section open error',section,e); status('Раздел загружается дольше обычного. Можно продолжать работу.',true);}
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
    // Only the menu and shop are on the critical path because the main JS expects
    // their purchase controls. Everything else is lazy/background.
    try{await loadOne('menu',{timeout:6000});}catch(e){console.error(e); status('Не удалось загрузить меню. Проверь соединение.',true); return;}
    try{await loadOne('shop',{timeout:6000});}catch(e){console.warn('[BUSPHOTO] shop deferred',e);}
    try{await loadMain();
      const st=document.getElementById('interactiveLoadingStatus'); if(st)st.style.display='none';
      const p=window.__BUSPHOTO_PENDING_SECTION__; if(p&&typeof window.showGameSection==='function'){window.__BUSPHOTO_PENDING_SECTION__=null; window.showGameSection(p.section,p.btn);}
    }catch(e){console.error(e); status('Не удалось запустить интерактивный модуль.',true); return;}
    // Background loading never blocks the main screen.
    const rest=['garage','finance','history','routes','map','rules','dispatch','stats','maintenance'];
    let i=0;
    const next=()=>{if(i>=rest.length)return; const n=rest[i++]; loadOne(n,{timeout:7000}).catch(e=>console.warn('[BUSPHOTO] background section',n,e)); if('requestIdleCallback' in window) requestIdleCallback(next,{timeout:1500}); else setTimeout(next,80);};
    next();
  }
  function boot(){if(window.__BUSPHOTO_INTERACTIVE_STARTED_V78__)return; window.__BUSPHOTO_INTERACTIVE_STARTED_V78__=true; start();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
