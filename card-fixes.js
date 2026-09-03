/* BUSPHOTO — карточка ТС: нормальный выбор маршрута + маршрут из «Добавить автобус» */
(function(){
  'use strict';
  const GAME_KEY='busphoto_interactive_game';
  const params=new URLSearchParams(location.search);
  const presetRouteId=params.get('routeId');
  const addBus=params.get('addBus')==='1';
  let presetApplied=false;

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
    if(!sel)return null;
    const id=sel.value;
    const list=readGame().owned||[];
    return list.find(v=>String(v.id)===String(id))||list.find(v=>String(v.vehicleId)===String(id))||null;
  }
  function routeType(r){return String(r?.routeType||r?.type||'bus').toLowerCase();}
  function serviceType(r){return String(r?.routeServiceType||r?.serviceType||'').toLowerCase();}
  function compatible(v,r){
    if(!r)return false;
    if(!v)return true;
    const vc=String(v.category||v.type||'bus').toLowerCase();
    const rt=routeType(r), st=serviceType(r);
    if(vc==='trolleybus')return rt==='trolleybus';
    if(vc==='electrobus')return (rt==='electrobus'||rt==='bus')&&(!st||st==='city'||st==='suburban');
    // Обычный автобус можно поставить на автобусный, троллейбусный и электробусный маршрут.
    return rt==='bus'||rt==='trolleybus'||rt==='electrobus';
  }
  function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function routeLabel(r){
    const n=String(r?.number??r?.routeNumber??'').trim();
    const a=String(r?.start??r?.from??'').trim(),b=String(r?.end??r?.to??'').trim();
    return esc((n?'№'+n:'Маршрут')+(a||b?' — '+(a||'—')+' → '+(b||'—'):''));
  }
  function removeRouteSearch(){document.querySelectorAll('.stage .routeSearch,.stage input[type="search"]').forEach(el=>el.remove());}
  function fill(select,list){
    const current=select.value;
    select.innerHTML='<option value="">Выберите маршрут</option>'+list.map(r=>'<option value="'+esc(r.id)+'">'+routeLabel(r)+'</option>').join('');
    if(list.some(r=>String(r.id)===String(current)))select.value=current;
  }
  function chooseBusIfRequested(game){
    if(!addBus)return;
    const sel=document.getElementById('vehicle');if(!sel)return;
    const buses=(game.owned||[]).filter(v=>String(v.category||v.type||'bus').toLowerCase()==='bus');
    const cur=game.owned?.find(v=>String(v.id)===String(sel.value));
    if(buses.length&&(!cur||String(cur.category||cur.type||'bus').toLowerCase()!=='bus')){
      sel.value=String(buses[0].id);
      sel.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }
  function applyPreset(){
    if(!presetRouteId)return;
    const game=readGame(), r=(game.routes||[]).find(x=>String(x.id)===String(presetRouteId));
    if(!r)return;
    const selects=[...document.querySelectorAll('.stage select.route')];
    if(!selects.length)return;
    for(const s of selects){
      const option=[...s.options].find(o=>String(o.value)===String(r.id));
      if(option){s.value=String(r.id);s.dispatchEvent(new Event('change',{bubbles:true}));presetApplied=true;break;}
    }
  }
  function refresh(){
    removeRouteSearch();
    const game=readGame(), all=Array.isArray(game.routes)?game.routes:[], v=vehicle();
    const list=all.filter(r=>compatible(v,r));
    document.querySelectorAll('.stage').forEach(stage=>{const s=stage.querySelector('select.route');if(s)fill(s,list);});
    const info=document.getElementById('vehicleInfo');
    if(info&&v){
      const name=v.model||v.name||'ТС', board=v.boardNumber||v.stateNumber||v.plate||'—', garage=v.garageNumber||'Автоматически';
      info.innerHTML='<b>'+esc(name)+'</b>'+(v.modification?' · '+esc(v.modification):'')+'<br>Гос. номер: <b>'+esc(board)+'</b><br>Гаражный номер: <b>'+esc(garage)+'</b><br>Доступно маршрутов: <b>'+list.length+'</b>';
    }
    if(!presetApplied){chooseBusIfRequested(game);setTimeout(applyPreset,0);setTimeout(applyPreset,250);}
    if(typeof window.recalc==='function'){try{window.recalc();}catch(e){}}
  }
  function bind(){
    removeRouteSearch();
    const s=document.getElementById('vehicle');
    if(s&&!s.dataset.cardFixBound){s.dataset.cardFixBound='1';s.addEventListener('change',()=>{presetApplied=false;setTimeout(refresh,0);});}
    refresh();setTimeout(refresh,250);setTimeout(refresh,800);setTimeout(refresh,1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.addEventListener('load',()=>setTimeout(refresh,50));
})();
