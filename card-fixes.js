/* BUSPHOTO — карточка ТС: только удаление поиска маршрута */
(function(){
  'use strict';

  // Не переопределяем routesFor/compatible и не фильтруем маршруты здесь.
  // creating_card.html сам заполняет обычный список маршрутов.
  function removeRouteSearch(){
    document.querySelectorAll('.stage .routeSearch,.stage input[type="search"]').forEach(function(input){
      input.remove();
    });
  }

  removeRouteSearch();
  window.addEventListener('load',removeRouteSearch);

  var observer=new MutationObserver(function(){removeRouteSearch();});
  function startObserver(){
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});
  else startObserver();
})();
