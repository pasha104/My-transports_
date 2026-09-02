/* BUSPHOTO — полностью убрать назначение/выбор ТС из меню маршрутов */
(function(){
  'use strict';
  function clean(){
    try{
      const root=document.getElementById('routeAssignmentSummary');
      if(!root)return;
      root.querySelectorAll('.route-card').forEach(card=>{
        // Убираем кнопку «ТС на маршруте».
        card.querySelectorAll('button').forEach(btn=>{
          const text=(btn.textContent||'').trim();
          if(/ТС\s+на\s+маршруте/i.test(text))btn.remove();
        });
        // Убираем блок выбора ТС и подпись «Выбрано: ... ТС».
        [...card.querySelectorAll('*')].forEach(el=>{
          const text=(el.textContent||'').trim();
          if(/^🚍\s*ТС\s+на\s+маршруте\s*[—-]/i.test(text)){
            if(el.parentElement)el.parentElement.remove();
          }
        });
        card.querySelectorAll('.route-assignment').forEach(el=>el.remove());
        // На всякий случай удаляем оставшиеся чекбоксы выбора ТС.
        card.querySelectorAll('input[type="checkbox"]').forEach(input=>{
          const label=input.closest('label');
          if(label)label.remove(); else input.remove();
        });
        // Убираем счетчик «Без ТС» / «N ТС на линии».
        [...card.querySelectorAll('*')].forEach(el=>{
          if(el.children.length) return;
          const text=(el.textContent||'').trim();
          if(/^(?:⏸\s*)?(?:Без\s+ТС|\d+\s+ТС(?:\s+на\s+линии)?)$/i.test(text))el.remove();
        });
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
