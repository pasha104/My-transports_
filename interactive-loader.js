/* BUSPHOTO interactive bootstrap — stable core loader */
(function(){
'use strict';
if(window.__BUSPHOTO_INTERACTIVE_LOADER_STABLE__) return;
window.__BUSPHOTO_INTERACTIVE_LOADER_STABLE__=true;
const VERSION='20260831-stable1';
const CORE_URL='https://raw.githubusercontent.com/pasha104/My-transports_/bcea47e8609b1d06603cc891c71b3f066adcc371/busphoto-interactive.js';
const sections=[
 ['menu','interactive-menu.html','interactive-menu-host'],
 ['shop','interactive-shop.html','interactive-section-host-shop'],
 ['garage','interactive-garage.html','interactive-section-host-garage'],
 ['finance','interactive-finance.html','interactive-section-host-finance'],
 ['history','interactive-history.html','interactive-section-host-history'],
 ['routes','interactive-routes.html','interactive-section-host-routes'],
 ['map','interactive-map.html','interactive-section-host-map'],
 ['rules','interactive-rules.html','interactive-rules-host']
];
const byName=Object.fromEntries(sections.map(x=>[x[0],x]));
const loaded=new Set(),loading=new Map();
function status(text,error){
 const el=document.getElementById('interactiveLoadingStatus');
 if(!el)return;
 if(!text){el.style.display='none';return;}
 el.textContent=text;el.style.display='';el.style.borderColor=error?'#d32f2f':'';
}
async function fetchText(url,timeout=8000){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeout);
 try{
  const r=await fetch(url,{cache:'no-store',credentials:'omit',signal:controller.signal});
  if(!r.ok) throw new Error(url+' HTTP '+r.status);
  return await r.text();
 }finally{clearTimeout(timer)}
}
async function loadSection(name){
 const info=byName[name];
 if(!info)return false;
 if(loaded.has(name))return true;
 if(loading.has(name))return loading.get(name);
 const [,file,hostId]=info;
 const p=(async()=>{
  const host=document.getElementById(hostId);
  if(!host) throw new Error('Host not found: '+hostId);
  if(host.querySelector('#game-section-'+name)){loaded.add(name);return true;}
  const html=await fetchText(file+'?v='+VERSION);
  host.innerHTML=html;
  loaded.add(name);
  return true;
 })();
 loading.set(name,p);
 try{return await p}finally{loading.delete(name)}
}
window.openInteractiveSection=async function(name,button){
 try{
  await loadSection(name);
  if(typeof window.showGameSection==='function'){
   window.showGameSection(name,button);
   try{
    if(name==='garage'&&typeof renderGarageSection==='function')renderGarageSection();
    if(name==='history'&&typeof renderHistorySection==='function')renderHistorySection();
    if(name==='routes'&&typeof renderRoutes==='function')renderRoutes();
    if((name==='dispatch'||name==='stats'||name==='maintenance')&&typeof renderV43Panels==='function')renderV43Panels();
   }catch(e){console.warn('[BUSPHOTO] section refresh',e)}
  }
 }catch(e){
  console.error('[BUSPHOTO] section open',name,e);
  status('Раздел не удалось загрузить. Открой его ещё раз.',true);
 }
};
window.BUSPHOTOEnsureInteractiveSection=loadSection;
function loadScript(src,id){
 return new Promise((resolve,reject)=>{
  if(id&&document.getElementById(id)){resolve();return;}
  const s=document.createElement('script');
  if(id)s.id=id;
  s.src=src;
  s.async=false;
  s.onload=resolve;
  s.onerror=()=>reject(new Error('Не удалось загрузить '+src));
  document.head.appendChild(s);
 });
}
async function start(){
 status('');
 try{
  await loadSection('menu');
  await loadScript(CORE_URL+'?v='+VERSION,'busphotoStableCore');
  if(typeof window.__BUSPHOTO_INIT_INTERACTIVE_GAME__==='function' && !window.__BUSPHOTO_GAME_INITIALIZED__){
   window.__BUSPHOTO_INIT_INTERACTIVE_GAME__();
   window.__BUSPHOTO_GAME_INITIALIZED__=true;
  }
  if(typeof window.ensureLeafletLoaded==='function') Promise.resolve().then(()=>window.ensureLeafletLoaded()).catch(()=>{});
  loadScript('passenger-payout.js?v='+VERSION,'busphotoPassengerPayoutScript').catch(()=>{});
  loadScript('card-map-preview.js?v='+VERSION,'busphotoCardMapPreviewScript').catch(()=>{});
  loadSection('shop').catch(e=>console.warn('[BUSPHOTO] shop',e));
 }catch(e){
  console.error('[BUSPHOTO] bootstrap failed',e?.stack||e);
  status('Интерактив не удалось запустить. Обнови страницу.',true);
 }
}
function boot(){
 if(window.__BUSPHOTO_INTERACTIVE_STARTED_STABLE__)return;
 window.__BUSPHOTO_INTERACTIVE_STARTED_STABLE__=true;
 start();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
