/* BUSPHOTO — убрать выбор/назначение ТС из меню маршрутов */
(function(){
  'use strict';

  // Никаких MutationObserver: он мог зацикливаться при перерисовке меню.
  // Блок назначения ТС просто скрывается CSS и не влияет на список маршрутов.
  function hideVehicleAssignment(){
    if(document.getElementById('bpRouteMenuNoVehicleStyle'))return;
    var style=document.createElement('style');
    style.id='bpRouteMenuNoVehicleStyle';
    style.textContent='#routeAssignmentSummary{display:none!important}';
    (document.head||document.documentElement).appendChild(style);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideVehicleAssignment,{once:true});
  else hideVehicleAssignment();
  window.addEventListener('load',hideVehicleAssignment);
})();
