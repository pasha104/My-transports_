/* BUSPHOTO — исправления карточки ТС */
(function(){
  'use strict';

  // Убираем только поиск маршрута из этапов.
  function removeRouteSearch(){
    document.querySelectorAll('.stage .routeSearch,.stage input[type="search"]').forEach(function(input){input.remove();});
  }

  // ВАЖНО: state в creating_card.html объявлен как глобальная let-переменная,
  // поэтому обращаться к нему нужно по имени, а не через window.state.
  function getState(){
    try{return (typeof state!=='undefined' && state) ? state : null;}catch(e){return null;}
  }

  function routeType(route){
    return String(route?.routeType||route?.type||route?.category||'bus').toLowerCase();
  }

  function routeService(route){
    return String(route?.routeServiceType||route?.serviceType||route?.service||'').toLowerCase();
  }

  function vehicleService(vehicle){
    return String(vehicle?.serviceType||vehicle?.service||'').toLowerCase();
  }

  // Совместимость ТС и маршрута для карточки.
  // Если у старого маршрута serviceType не записан — не блокируем его.
  function cardCompatible(vehicle,route){
    if(!vehicle||!route)return false;
    var vc=String(vehicle.category||vehicle.type||'bus').toLowerCase();
    var rt=routeType(route);
    var rs=routeService(route);
    var vs=vehicleService(vehicle);

    if(rt==='trolleybus') return vc==='trolleybus'||vc==='bus';

    if(vc==='trolleybus') return rt==='trolleybus';

    if(vc==='electrobus'){
      if(rs && rs!=='city' && rs!=='suburban') return false;
      return rt==='bus'||rt==='electrobus';
    }

    // Обычный автобус может работать на автобусном маршруте.
    // Сервисный тип проверяем только если он реально указан у маршрута.
    if(vc==='bus'){
      if(rt!=='bus' && rt!=='') return false;
      if(vs && vs!=='all' && rs && rs!==vs) return false;
      return true;
    }

    return vc===rt;
  }

  function routesForCard(vehicle){
    var s=getState();
    if(!s || !Array.isArray(s.routes))return [];
    return s.routes.filter(function(route){return cardCompatible(vehicle,route);});
  }

  // Перехватываем глобальные функции, которые использует creating_card.html.
  // Здесь специально не используем window.state.
  window.cardRouteCompatible=cardCompatible;
  window.compatible=cardCompatible;
  window.routesFor=routesForCard;

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

  // Наблюдаем только за полем поиска. Никаких изменений select здесь нет,
  // поэтому бесконечного MutationObserver-цикла не возникает.
  var observer=new MutationObserver(function(){removeRouteSearch();});
  function startObserver(){
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});
  else startObserver();
})();
