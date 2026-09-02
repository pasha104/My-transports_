/* BUSPHOTO — убрать выбор ТС из меню маршрутов */
(function(){
  'use strict';
  function clean(){
    try{
      const root=document.getElementById('routeAssignmentSummary');
      if(!root)return;
      root.querySelectorAll('.route-card').forEach(card=>{
        [...card.querySelectorAll('div')].forEach(el=>{
          const text=(el.textContent||'').trim();
          if(text.startsWith('🚍 ТС на маршруте —')){
            const parent=el.parentElement;
            if(parent) parent.remove();
          }
        });
        card.querySelectorAll('input[type="checkbox"]').forEach(input=>{
          const label=input.closest('label');
          if(label) label.remove();
          else input.remove();
        });
        card.querySelectorAll('.route-assignment').forEach(el=>el.remove());
      });
    }catch(e){console.warn('[BUSPHOTO route menu fix]',e);}
  }
  function start(){
    clean();
    const observer=new MutationObserver(clean);
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  window.addEventListener('load',clean);
})();
