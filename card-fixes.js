/* BUSPHOTO карточка ТС — остаточные исправления */
(function(){
  'use strict';
  function routeServiceType(route){return String(route?.routeServiceType||route?.serviceType||'city').toLowerCase();}
  function cardRouteCompatible(vehicle,route){
    if(!vehicle||!route)return false;
    var vc=String(vehicle.category||'').toLowerCase();
    var rt=String(route.routeType||'bus').toLowerCase();
    var service=routeServiceType(route);
    if(rt==='trolleybus')return vc==='trolleybus'||vc==='bus';
    if(vc==='electrobus'){
      if(service!=='city'&&service!=='suburban')return false;
      return rt==='electrobus'||rt==='bus';
    }
    if(vc==='trolleybus')return rt==='trolleybus';
    if(vc==='bus'){
      if(rt==='bus'){
        var wanted=String(vehicle.serviceType||'').toLowerCase();
        if(!wanted||wanted==='all')return true;
        return service===wanted;
      }
      return false;
    }
    return false;
  }
  window.cardRouteCompatible=cardRouteCompatible;
  window.compatible=function(vehicle,route){return cardRouteCompatible(vehicle,route);};
  window.routesFor=function(vehicle){
    if(!vehicle||!Array.isArray(window.state?.routes))return [];
    return window.state.routes.filter(function(route){return cardRouteCompatible(vehicle,route);});
  };

  // Убираем поиск маршрута из каждого этапа карточки.
  // Сам выбор маршрута остаётся обычным выпадающим списком.
  function removeRouteSearch(){
    document.querySelectorAll('.stage .routeSearch,.stage input[type="search"]').forEach(function(input){input.remove();});
  }

  function refresh(){
    try{
      removeRouteSearch();
      var v=typeof window.vehicle==='function'?window.vehicle():null;
      document.querySelectorAll('.stage').forEach(function(stage){
        var select=stage.querySelector('.route');if(!select)return;
        var current=select.value;
        var routes=window.routesFor(v);
        select.innerHTML=routes.length?routes.map(function(r){return '<option value="'+String(r.id).replace(/"/g,'&quot;')+'">№'+String(r.number||'').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})+' — '+String(r.start||'—').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})+' → '+String(r.end||'—').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})+'</option>';}).join(''):'<option value="">Нет подходящих маршрутов</option>';
        if(routes.some(function(r){return String(r.id)===String(current);}))select.value=current;
      });
      if(typeof window.recalc==='function')window.recalc();
    }catch(e){console.warn('[BUSPHOTO card fixes]',e);}
  }

  function removeVehicleFromMapLink(){
    if(typeof window.openCardMap==='function')window.openCardMap=function(routeId){
      if(!routeId)return;
      location.href='interactive.html?open=map&routeId='+encodeURIComponent(routeId);
    };
  }
  removeVehicleFromMapLink();
  window.addEventListener('load',function(){removeVehicleFromMapLink();setTimeout(refresh,80);});
  window.addEventListener('storage',function(e){if(e.key==='busphoto_interactive_game')setTimeout(refresh,80);});
  const observer=new MutationObserver(function(){refresh();});
  function startObserver(){if(document.body)observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});else startObserver();
  setTimeout(refresh,80);
})();
