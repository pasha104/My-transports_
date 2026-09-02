/* BUSPHOTO — убрать выбор ТС из меню маршрутов */
(function(){
  'use strict';
  function clean(){
    try{
      const root=document.getElementById('routeAssignmentSummary');
      if(!root)return;
      root.querySelectorAll('.route-card').forEach(card=>{
        // Удаляем весь блок «ТС на маршруте», где раньше были чекбоксы выбора ТС.
        card.querySelectorAll('input[type="checkbox"]').forEach(input=>{
          const label=input.closest('label');
          if(label) label.remove();
        });
        [...card.querySelectorAll('div')].forEach(el=>{
          const text=(el.textContent||'').trim();
          if(text.startsWith('🚍 ТС на маршруте —')){
            const parent=el.parentElement;
            if(parent) parent.remove();
          }
        });
        card.querySelectorAll('.route-assignment').forEach(el=>el.remove());
      });
    }catch(e){console.warn('[BUSPHOTO route menu fix]',e);}
  }
  function start(){
    clean();
    const root=document.getElementById('routeAssignmentSummary');
    if(root)new MutationObserver(clean).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  window.addEventListener('load',clean);
})();
