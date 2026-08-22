/* BUSPHOTO Interactive modular loader v52 */
(function(){
  const sections = [
    ['menu','interactive-menu.html','interactive-menu-host'],
    ['shop','interactive-shop.html','interactive-section-host-shop'],
    ['garage','interactive-garage.html','interactive-section-host-garage'],
    ['finance','interactive-finance.html','interactive-section-host-finance'],
    ['history','interactive-history.html','interactive-section-host-history'],
    ['routes','interactive-routes.html','interactive-section-host-routes'],
    ['map','interactive-map.html','interactive-section-host-map'],
    ['dispatch','interactive-dispatch.html','interactive-section-host-dispatch'],
    ['stats','interactive-stats.html','interactive-section-host-stats'],
    ['maintenance','interactive-maintenance.html','interactive-section-host-maintenance'],
    ['rules','interactive-rules.html','interactive-rules-host']
  ];
  async function loadOne(file,hostId){
    const host=document.getElementById(hostId); if(!host) return;
    const r=await fetch(file+'?v=20260822-v52',{cache:'no-cache'});
    if(!r.ok) throw new Error(file+' HTTP '+r.status);
    host.innerHTML=await r.text();
  }
  function status(text,error){
    const el=document.getElementById('interactiveLoadingStatus'); if(!el)return;
    el.textContent=text; if(error)el.style.borderColor='#d32f2f';
  }
  async function start(){
    try{
      status('Загрузка разделов…');
      await Promise.all(sections.map(x=>loadOne(x[1],x[2])));
      status('Интерактив готов');
      const s=document.createElement('script');
      s.src='busphoto-interactive.js?v=20260822-v52';
      s.onload=()=>{const e=document.getElementById('interactiveLoadingStatus');if(e)e.style.display='none';};
      s.onerror=()=>status('Не удалось загрузить интерактивный модуль.',true);
      document.head.appendChild(s);
    }catch(e){
      console.error('[BUSPHOTO] sections load error',e);
      status('Ошибка загрузки разделов. Обнови страницу.',true);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
