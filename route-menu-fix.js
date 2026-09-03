/* BUSPHOTO — выбор ТС из меню маршрутов удалён на уровне HTML.
   Без MutationObserver, чтобы меню не зависало.
*/
(function(){
  'use strict';
  function clean(){
    const root=document.getElementById('routeAssignmentSummary');
    if(root) root.remove();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clean,{once:true});
  else clean();
  window.addEventListener('load',clean);
})();
