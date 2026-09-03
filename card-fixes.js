/* BUSPHOTO — исправление карточки ТС
   Поиск маршрута удалён. Выбор маршрута берётся напрямую из localStorage игры.
   Никаких MutationObserver и переопределений routesFor/compatible — чтобы не было зависаний.
*/
(function(){
  'use strict';
  const GAME_KEY='busphoto_interactive_game';

  function readGame(){
    try{
      const raw=localStorage.getItem(GAME_KEY);
      const data=raw?JSON.parse(raw):null;
      if(data && Array.isArray(data.routes)) return data;
    }catch(e){}
    return {routes:[],owned:[]};
  }

  function vehicle(){
    const sel=document.getElementById('vehicle');
    if(!sel) return null;
    const id=sel.value;
    const game=readGame();
    const list=Array.isArray(game.owned)?game.owned:[];
    return list.find(v=>String(v.id)===String(id)) || list.find(v=>String(v.vehicleId)===String(id)) || null;
  }

  function routeType(r){
    return String(r?.routeType||r?.type||'bus').toLowerCase();
  }

  function serviceType(r){
    return String(r?.routeServiceType||r?.serviceType||'').toLowerCase();
  }

  // Совместимость без жёсткой привязки к старым полям.
  function compatible(v,r){
    if(!r) return false;
    if(!v) return true;
    const vc=String(v.category||v.type||'bus').toLowerCase();
    const rt=routeType(r);
    if(vc==='trolleybus') return rt==='trolleybus' || rt==='bus';
    if(vc==='electrobus'){
      const st=serviceType(r);
      return (rt==='electrobus'||rt==='bus') && (!st||st==='city'||st==='suburban');
    }
    // Обычный автобус может работать на автобусном и троллейбусном маршруте.
    return rt==='bus' || rt==='trolleybus' || rt==='electrobus';
  }

  function esc(x){
    return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function removeRouteSearch(){
    document.querySelectorAll('.stage .routeSearch,.stage input[type="search"]').forEach(el=>el.remove());
  }

  function routeLabel(r){
    const number=String(r.number??r.routeNumber??'').trim();
    const start=String(r.start??r.from??'').trim();
    const end=String(r.end??r.to??'').trim();
    let text='';
    if(number) text+='№'+number;
    if(start||end) text+=(text?' — ':'')+(start||'—')+' → '+(end||'—');
    if(!text) text='Маршрут';
    return esc(text);
  }

  function fillRouteSelect(select,routes){
    const current=select.value;
    let html='<option value="">Выберите маршрут</option>';
    html+=routes.map(r=>'<option value="'+esc(r.id)+'">'+routeLabel(r)+'</option>').join('');
    select.innerHTML=html;
    if(routes.some(r=>String(r.id)===String(current))) select.value=current;
  }

  function refresh(){
    removeRouteSearch();
    const game=readGame();
    const all=Array.isArray(game.routes)?game.routes:[];
    const v=vehicle();
    const routes=all.filter(r=>compatible(v,r));

    document.querySelectorAll('.stage').forEach(stage=>{
      const select=stage.querySelector('select.route');
      if(select) fillRouteSelect(select,routes);
    });

    const info=document.getElementById('vehicleInfo');
    if(info && v){
      const name=v.model||v.name||'ТС';
      const board=v.boardNumber||v.stateNumber||v.plate||'—';
      const garage=v.garageNumber||'Автоматически';
      info.innerHTML='<b>'+esc(name)+'</b>'+(v.modification?' · '+esc(v.modification):'')+
        '<br>Гос. номер: <b>'+esc(board)+'</b>'+
        '<br>Гаражный номер: <b>'+esc(garage)+'</b>'+
        '<br>Подходящих маршрутов: <b>'+routes.length+'</b>';
    }

    // Даём штатному коду карточки пересчитать терминалы/расписание.
    if(typeof window.recalc==='function'){
      try{window.recalc();}catch(e){}
    }
  }

  function bind(){
    removeRouteSearch();
    const vehicleSelect=document.getElementById('vehicle');
    if(vehicleSelect && !vehicleSelect.dataset.cardFixBound){
      vehicleSelect.dataset.cardFixBound='1';
      vehicleSelect.addEventListener('change',()=>setTimeout(refresh,0));
    }
    refresh();
    // Состояние игры может подгружаться после iframe.
    setTimeout(refresh,250);
    setTimeout(refresh,800);
    setTimeout(refresh,1500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
  window.addEventListener('load',()=>setTimeout(refresh,50));
})();
