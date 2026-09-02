/* BUSPHOTO остаточные исправления v1 */
(function(){
  'use strict';
  function whenReady(fn, tries){
    tries = tries || 0;
    try {
      if (typeof gameCatalog !== 'undefined' && typeof gameState !== 'undefined' && typeof saveGameState === 'function') { fn(); return; }
    } catch(e) {}
    if (tries < 120) setTimeout(function(){ whenReady(fn, tries + 1); }, 100);
  }
  whenReady(function(){
    try {
      if (gameCatalog.electrobus) gameCatalog.electrobus['БКМ-Е350'] = {price:250000,salary:[20000,25000],capacity:53,passengerCapacity:53};
    } catch(e) { console.warn('[BUSPHOTO fixes] E350 catalog', e); }
    function allowedServiceForCategory(category, service){
      if (category === 'electrobus') return service === 'city' || service === 'suburban';
      if (category === 'trolleybus') return service === 'city';
      return service === 'city' || service === 'suburban' || service === 'intercity';
    }
    function refreshServiceButtons(){
      var category=document.getElementById('gameCategory')?.value || 'bus';
      var picker=document.getElementById('gameServiceTypePicker');
      if (!picker) return;
      picker.querySelectorAll('.game-service-btn').forEach(function(btn){
        var service=btn.dataset.service;
        btn.style.display=(service==='all'||allowedServiceForCategory(category,service))?'':'none';
      });
      var hidden=document.getElementById('gameServiceType');
      if(hidden&&hidden.value!=='all'&&!allowedServiceForCategory(category,hidden.value)) hidden.value=category==='electrobus'?'suburban':'city';
    }
    var originalSelectCategory=window.selectGameCategory;
    if(typeof originalSelectCategory==='function'&&!originalSelectCategory.__bpFixed){
      var fixedSelectCategory=function(category,btn){var result=originalSelectCategory.apply(this,arguments);refreshServiceButtons();return result;};
      fixedSelectCategory.__bpFixed=true; window.selectGameCategory=fixedSelectCategory;
    }
    var originalSelectService=window.selectGameServiceType;
    if(typeof originalSelectService==='function'&&!originalSelectService.__bpFixed){
      var fixedSelectService=function(type,btn){
        var category=document.getElementById('gameCategory')?.value||'bus';
        if(type!=='all'&&!allowedServiceForCategory(category,type)) type=category==='electrobus'?'suburban':'city';
        var result=originalSelectService.call(this,type,btn);refreshServiceButtons();return result;
      };
      fixedSelectService.__bpFixed=true; window.selectGameServiceType=fixedSelectService;
    }
    var originalSupports=window.gameModelSupportsType;
    if(typeof originalSupports==='function'&&!originalSupports.__bpFixed){
      var fixedSupports=function(model,type){
        var category=document.getElementById('gameCategory')?.value||'bus';
        if(type==='all') return true;
        if(category==='electrobus') return type==='city'||type==='suburban';
        if(category==='trolleybus') return type==='city';
        return originalSupports.call(this,model,type);
      };
      fixedSupports.__bpFixed=true; window.gameModelSupportsType=fixedSupports;
    }
    var originalBuy=window.buyGameVehicle;
    if(typeof originalBuy==='function'&&!originalBuy.__bpFixed){
      var fixedBuy=function(){
        var category=document.getElementById('gameCategory')?.value;
        var model=document.getElementById('gameModel')?.value;
        var before=Array.isArray(gameState.owned)?gameState.owned.length:0;
        var result=originalBuy.apply(this,arguments);
        if(category==='electrobus'&&model==='БКМ-Е350'&&Array.isArray(gameState.owned)&&gameState.owned.length>before){
          var v=gameState.owned[gameState.owned.length-1];v.capacity=53;v.passengerCapacity=53;
          if(v.serviceType==='intercity'||v.serviceType==='all')v.serviceType='suburban';
          saveGameState();if(typeof renderInteractive==='function')renderInteractive();
        }
        return result;
      };
      fixedBuy.__bpFixed=true;window.buyGameVehicle=fixedBuy;
    }
    var originalCompatible=window.vehicleCompatibleWithRoute;
    if(typeof originalCompatible==='function'&&!originalCompatible.__bpFixed){
      var fixedCompatible=function(vehicle,route){
        if(!vehicle||!route)return false;
        if(route.routeType==='trolleybus')return vehicle.category==='trolleybus'||vehicle.category==='bus';
        if(route.routeType==='electrobus')return vehicle.category==='electrobus'||vehicle.category==='bus';
        if(route.routeType==='bus')return vehicle.category==='bus'||vehicle.category==='electrobus';
        return originalCompatible.call(this,vehicle,route);
      };
      fixedCompatible.__bpFixed=true;window.vehicleCompatibleWithRoute=fixedCompatible;
    }
    try{
      var changed=false;
      (gameState.owned||[]).forEach(function(v){
        if(v.category==='electrobus'){
          if(v.serviceType==='intercity'||v.serviceType==='all'||!v.serviceType){v.serviceType='suburban';changed=true;}
          if(v.model==='БКМ-Е350'){
            if(Number(v.capacity)!==53){v.capacity=53;changed=true;}
            if(Number(v.passengerCapacity)!==53){v.passengerCapacity=53;changed=true;}
          }
        }
      });
      if(changed)saveGameState();
    }catch(e){}
    refreshServiceButtons();
    if(typeof updateGameModelSelect==='function')updateGameModelSelect();
  });
})();
