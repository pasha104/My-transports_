/* BUSPHOTO interactive bootstrap v111 — loads the real game split into part1/part2. */
(function(){
'use strict';
if(window.__BUSPHOTO_INTERACTIVE_BOOT_V111__) return;
window.__BUSPHOTO_INTERACTIVE_BOOT_V111__=true;
const VERSION='20260831-v111';
const GAME_PARTS=['part1.txt','part2.txt'];
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
async function fetchText(url,timeout=9000){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeout);
 try{
  const r=await fetch(url,{cache:'default',credentials:'same-origin',signal:controller.signal});
  if(!r.ok) throw new Error(url+' HTTP '+r.status);
  return await r.text();
 }finally{clearTimeout(timer)}
}
function injectGlobalScript(code,name){
 return new Promise((resolve,reject)=>{
  try{
   const s=document.createElement('script');
   s.dataset.busphotoGamePart=name;
   s.text=code+'\n//# sourceURL='+name;
   document.head.appendChild(s);
   resolve();
  }catch(e){reject(e)}
 });
}
async function loadGameCore(){
 if(window.__BUSPHOTO_GAME_CORE_LOADED__) return;
 const texts=await Promise.all(GAME_PARTS.map(f=>fetchText(f+'?v='+VERSION,10000)));
 for(let i=0;i<texts.length;i++) await injectGlobalScript(texts[i],GAME_PARTS[i]);
 window.__BUSPHOTO_GAME_CORE_LOADED__=true;
}
async function loadSection(name){
 const info=byName[name];if(!info)return false;
 if(loaded.has(name))return true;
 if(loading.has(name))return loading.get(name);
 const [,file,hostId]=info;
 const p=(async()=>{
  const host=document.getElementById(hostId);
  if(!host) throw new Error('Host not found: '+hostId);
  if(host.querySelector('#game-section-'+name)){loaded.add(name);return true;}
  const html=await fetchText(file+'?v='+VERSION,8000);
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
   }catch(e){console.warn('[BUSPHOTO] section refresh',e)}
  }
 }catch(e){console.error('[BUSPHOTO] section open',e);status('Раздел не удалось загрузить. Открой его ещё раз.',true)}
};
window.BUSPHOTOEnsureInteractiveSection=loadSection;
async function loadOptionalScripts(){
 for(const file of ['passenger-payout.js','card-map-preview.js']){
  if(document.querySelector('script[data-busphoto-optional="'+file+'"]'))continue;
  const s=document.createElement('script');
  s.dataset.busphotoOptional=file;
  s.src=file+'?v='+VERSION;
  s.async=true;
  document.head.appendChild(s);
 }
}
async function start(){
 status('');
 try{
  await loadSection('menu');
  await loadGameCore();
  if(typeof window.__BUSPHOTO_INIT_INTERACTIVE_GAME__==='function' && !window.__BUSPHOTO_GAME_INITIALIZED__){
   window.__BUSPHOTO_INIT_INTERACTIVE_GAME__();
   window.__BUSPHOTO_GAME_INITIALIZED__=true;
  }
  loadOptionalScripts();
  if(typeof window.ensureLeafletLoaded==='function') Promise.resolve().then(()=>window.ensureLeafletLoaded()).catch(()=>{});
  loadSection('shop').catch(e=>console.warn('[BUSPHOTO] shop',e));
 }catch(e){
  console.error('[BUSPHOTO] bootstrap failed',e?.stack||e);
  status('Интерактив не удалось запустить. Обнови страницу.',true);
 }
}
function boot(){
 if(window.__BUSPHOTO_INTERACTIVE_STARTED_V111__)return;
 window.__BUSPHOTO_INTERACTIVE_STARTED_V111__=true;
 start();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
