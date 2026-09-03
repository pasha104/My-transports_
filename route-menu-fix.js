/* BUSPHOTO — оставить «Мои маршруты», убрать только назначение/выбор ТС */
(function(){
  'use strict';
  let busy=false;
  function clean(){
    if(busy)return;
    busy=true;
    try{
      const root=document.getElementById('routeAssignmentSummary');
      if(!root)return;
      root.querySelectorAll('button').forEach(btn=>{
        const text=(btn.textContent||'').trim();
        if(/ТС\s+на\s+маршруте/i.test(text))btn.remove();
      });
      root.querySelectorAll('.route-assignment').forEach(el=>el.remove());
      root.querySelectorAll('input[type="checkbox"]').forEach(input=>{
        const label=input.closest('label');
        if(label)label.remove();
        else input.remove();
      });
      [...root.querySelectorAll('*')].forEach(el=>{
        const text=(el.textContent||'').trim();
        if(/^🚍\s*ТС\s+на\s+маршруте\s*[—-]/i.test(text)){
          const parent=el.parentElement;
          if(parent && !parent.classList.contains('route-card'))parent.remove();
        }
      });
    }catch(e){console.warn('[BUSPHOTO route menu fix]',e);}
    finally{busy=false;}
  }
  function start(){
    clean();
    let scheduled=false;
    const observer=new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      setTimeout(()=>{scheduled=false;clean();},50);
    });
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  window.addEventListener('load',clean);
})();
