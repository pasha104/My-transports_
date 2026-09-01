/* BUSPHOTO — passenger earnings only
 * Adds random passenger loads and replaces the old fixed 100-ruble terminal payout
 * without touching routes, cards, maps, salary or other interactive mechanics.
 */
(function(){
  'use strict';
  if (window.__BUSPHOTO_PASSENGER_SYSTEM__) return;
  window.__BUSPHOTO_PASSENGER_SYSTEM__ = true;

  const CAPACITY = {
    bus: {'МАЗ-101':100,'МАЗ-103':100,'МАЗ-104':110,'МАЗ-105':176,'МАЗ-107':150,'МАЗ-152':150,'МАЗ-203':105,'МАЗ-205':185,'МАЗ-206':72,'МАЗ-215':183,'МАЗ-216':176,'МАЗ-226':72,'МАЗ-231':80,'МАЗ-232':45,'МАЗ-241':36,'МАЗ-251':53,'МАЗ-256':80,'МАЗ-257':48,'МАЗ-303':110},
    trolleybus: {'МАЗ-103Т':108,'МАЗ-203Т':97,'МАЗ-303Т':75,'АКСМ-101':114,'БКМ-201':109,'БКМ-321':115,'БКМ-420':115,'БКМ-213':209,'БКМ-333':170,'БКМ-433':153},
    electrobus: {'МАЗ-303Е':72,'МАЗ-305Е':120,'БКМ-Е321':86,'БКМ-Е433':153}
  };

  function money(v){ return Math.round(Number(v||0)).toLocaleString('ru-RU') + ' р.'; }
  function capacity(vehicle){
    const c = Number(CAPACITY?.[vehicle?.category]?.[vehicle?.model] || 0);
    return Math.max(1, c || 50);
  }
  function loadPercent(){
    const r=Math.random();
    if(r<0.25) return 15 + Math.random()*25; // 15–40%
    if(r<0.70) return 40 + Math.random()*35; // 40–75%
    if(r<0.95) return 70 + Math.random()*25; // 70–95%
    return 95 + Math.random()*5;              // 95–100%
  }
  function passengers(vehicle){
    const cap=capacity(vehicle);
    const count=Math.max(1,Math.min(cap,Math.round(cap*loadPercent()/100)));
    return {count,capacity:cap,loadPercent:Math.round(count/cap*100)};
  }

  function patchWhenReady(){
    if(typeof window.processServiceCardPayouts !== 'function'){
      setTimeout(patchWhenReady,100);
      return;
    }
    const original=window.processServiceCardPayouts;
    if(original.__passengerWrapped) return;

    function wrapped(now){
      const key='busphoto_interactive_game';
      let beforeState={};
      try{ beforeState=JSON.parse(localStorage.getItem(key)||'{}')||{}; }catch(e){}
      const beforeBalance=Number(beforeState.balance||0);
      const beforeLog=Array.isArray(beforeState.log)?beforeState.log:[];
      const oldTotal=Number(original(now)||0);
      let afterState={};
      try{ afterState=JSON.parse(localStorage.getItem(key)||'{}')||{}; }catch(e){}
      const log=Array.isArray(afterState.log)?afterState.log:[];
      let extra=0;
      let changed=false;
      const signature=(x)=>`${x?.date||''}|${x?.time||''}|${x?.routeNumber||''}|${x?.vehicleModel||''}|${x?.arrivalTime||''}`;
      const oldSignatures=new Set(beforeLog.map(signature));

      for(const item of log){
        if(item.type!=='route-arrival' || item.passengerSystemV1) continue;
        if(oldSignatures.has(signature(item))) continue;
        const vehicle=(afterState.owned||[]).find(v=>String(v.model||'')===String(item.vehicleModel||''));
        if(!vehicle) continue;
        const distanceKm=Math.max(0,Number(item.distanceKm||0));
        const distancePayout=Math.max(0,Math.floor(distanceKm*2));
        const p=passengers(vehicle);
        const passengerPayout=p.count*3;
        const newTotal=distancePayout+passengerPayout;
        const delta=newTotal-Number(item.total||0);
        extra+=delta;
        item.total=newTotal;
        item.distancePayout=distancePayout;
        item.passengerCount=p.count;
        item.passengerCapacity=p.capacity;
        item.passengerLoadPercent=p.loadPercent;
        item.passengerPayout=passengerPayout;
        item.passengerSystemV1=true;
        const t=item.arrivalTime||item.time||'—';
        item.details=[`🕐 ${t} · ТС ${vehicle.model||'—'} · маршрут №${item.routeNumber||'—'} · 👥 ${p.count}/${p.capacity} пассажиров (${p.loadPercent}%) · 📏 ${distanceKm.toFixed(1)} км · расстояние +${distancePayout} р. · пассажиры +${passengerPayout} р. · Итого +${newTotal} р.`];
        changed=true;
        const stats=vehicle.stats;
        if(stats){ stats.earned=Number(stats.earned||0)+delta; }
      }

      if(changed){
        afterState.balance=beforeBalance+oldTotal+extra;
        try{ localStorage.setItem(key,JSON.stringify(afterState)); }catch(e){}
        if(typeof window.loadGameState==='function') { try{ window.loadGameState(); }catch(e){} }
        if(typeof window.renderInteractiveHeaderAndLightViews==='function') window.renderInteractiveHeaderAndLightViews();
        if(typeof window.renderInteractive==='function') window.renderInteractive();
        if(typeof window.checkAffordableVehicleNotifications==='function') window.checkAffordableVehicleNotifications();
      }
      return oldTotal+extra;
    }
    wrapped.__passengerWrapped=true;
    window.processServiceCardPayouts=wrapped;
    console.info('[BUSPHOTO] passenger earnings enabled');
  }

  patchWhenReady();
})();
