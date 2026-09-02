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
    if(!vehicle||!Array.isArray(state?.routes))return [];
    return state.routes.filter(function(route){return cardRouteCompatible(vehicle,route);});
  };
  function refresh(){
    try{
      var v=typeof window.vehicle==='function'?window.vehicle():null;
      document.querySelectorAll('.stage').forEach(function(stage){
        var select=stage.querySelector('.route');if(!select)return;
        var current=select.value;
        var routes=window.routesFor(v);
        var q=stage.querySelector('.routeSearch');
        var term=String(q?.value||'').trim().toLowerCase();
        var filtered=routes.filter(function(r){return !term||[r.number,r.start,r.end,r.name,r.title].filter(Boolean).join(' ').toLowerCase().includes(term);});
        select.innerHTML=filtered.length?filtered.map(function(r){return '<option value="'+String(r.id).replace(/"/g,'&quot;')+'">№'+String(r.number||'').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})+' — '+String(r.start||'—').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})+' → '+String(r.end||'—').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})+'</option>';}).join(''):'<option value="">Нет подходящих маршрутов</option>';
        if(filtered.some(function(r){return String(r.id)===String(current);}))select.value=current;
      });
      if(typeof window.recalc==='function')window.recalc();
    }catch(e){console.warn('[BUSPHOTO card fixes]',e);}
  }
  setTimeout(refresh,80);
  window.addEventListener('load',function(){setTimeout(refresh,80);});
  window.addEventListener('storage',function(e){if(e.key==='busphoto_interactive_game')setTimeout(refresh,80);});
})();
