/* BUSPHOTO — исправления карточки ТС */
(function(){
  'use strict';

  // Убираем только поиск маршрута из этапов.
  // Сам список маршрутов формирует creating_card.html — не перезаписываем
  // его state/routes через window, потому что state там является локальной
  // переменной страницы.
  function removeRouteSearch(){
    document.querySelectorAll('.stage .routeSearch,.stage input[type="search"]').forEach(function(input){input.remove();});
  }

  function removeVehicleFromMapLink(){
    if(typeof window.openCardMap==='function')window.openCardMap=function(routeId){
      if(!routeId)return;
      location.href='interactive.html?open=map&routeId='+encodeURIComponent(routeId);
    };
  }

  removeRouteSearch();
  removeVehicleFromMapLink();

  window.addEventListener('load',function(){
    removeRouteSearch();
    removeVehicleFromMapLink();
  });

  // Наблюдаем только за удалением поля поиска. Никаких перезаписей select,
  // поэтому бесконечного цикла MutationObserver здесь быть не может.
  var observer=new MutationObserver(function(){removeRouteSearch();});
  function startObserver(){
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});
  else startObserver();
})();
