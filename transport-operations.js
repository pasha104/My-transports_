/* BUSPHOTO Transport Operations v1 */
(function(){
'use strict';
if(window.__BUSPHOTO_TRANSPORT_OPERATIONS_V1__)return;
window.__BUSPHOTO_TRANSPORT_OPERATIONS_V1__=true;
const BOARD_KEY='busphoto_stop_board_selected_v1';
const OSRM='https://router.project-osrm.org/route/v1/driving/';
const repairRequests=new Set();
function esc(v){return typeof window.escapeHtml==='function'?window.escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function hhmm(v){return new Date(v).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});}
function cards(){return Array.isArray(gameState.serviceCards)?gameState.serviceCards:[];}
function stops(){try{return getMapStops()||[]}catch(e){return [];}}
function fractionAt(route,stop,routeStop){
 const lat=Number(routeStop?.lat??routeStop?.latitude??stop.lat??stop.latitude),lon=Number(routeStop?.lon??routeStop?.lng??routeStop?.longitude??stop.lon??stop.lng??stop.longitude);
 const c=route.geometry?.coordinates||[];if(!Number.isFinite(lat)||!Number.isFinite(lon)||c.length<2)return null;
 let total=0,best=Infinity,along=0;const cos=Math.cos(lat*Math.PI/180);
 for(let i=1;i<c.length;i++){const a=c[i-1],b=c[i],dx=(b[0]-a[0])*cos,dy=b[1]-a[1],seg=Math.hypot(dx,dy),px=(lon-a[0])*cos,py=lat-a[1],t=Math.max(0,Math.min(1,(px*dx+py*dy)/(seg*seg||1))),dist=Math.hypot(px-dx*t,py-dy*t);if(dist<best){best=dist;along=total+seg*t;}total+=seg;}
 return total&&best<0.025?Math.max(0,Math.min(1,along/total)):null;
}
function arrivalsAt(stop){
 const now=new Date(),out=[];
 cards().filter(c=>c&&c.active!==false).forEach(card=>{
  const v=gameState.owned.find(x=>String(x.id)===String(card.vehicleId));if(!v||Number(v.repairUntil)>Date.now())return;
  (card.schedules||[]).forEach(s=>{
   const route=getScheduleRoute(s);if(!route?.geometry)return;
   const id=String(stop.id??stop.stopId??'');
   const rs=(route.stops||[]).find(x=>String(x.id??x.stopId)===id);
   if(!rs&&!(route.stopIds||[]).concat(route.terminalStopIds||[]).map(String).includes(id))return;
   const f=fractionAt(route,stop,rs);if(f==null)return;
   for(let off=0;off<=1;off++){
    const day=new Date(now.getFullYear(),now.getMonth(),now.getDate()+off);if(!Array.isArray(s.days)||!s.days.includes(day.getDay()))continue;
    const abs=getScheduleAbsoluteTimes(s,day,route,v),start=abs.startMin,dur=Math.max(1,abs.duration),span=Math.max(1,dur+abs.turnaround),base=day.getTime();
    const forward=String(s.startStopId||'')===String((route.terminalStopIds||route.stopIds||[])[0]||'')?f:1-f;
    for(let dep=start,trip=1;dep+dur<=abs.untilMin&&trip<=200;dep+=span,trip++){
      const t1=base+(dep+dur*forward)*60000,t2=base+(dep+dur+abs.turnaround+dur*(1-forward))*60000;
      if(t1>=now.getTime()-60000)out.push({at:t1,route,v,trip,dir:'→'});
      if(t2>=now.getTime()-60000)out.push({at:t2,route,v,trip,dir:'←'});
    }
   }
  });
 });
 return out.sort((a,b)=>a.at-b.at).filter((x,i,a)=>a.findIndex(y=>String(y.v.id)===String(x.v.id)&&Math.abs(y.at-x.at)<60000)===i);
}
function renderBoard(){
 const host=document.getElementById('stopBoardPanel');if(!host)return;
 const list=stops().filter(s=>s&&s.id!=null);
 if(!list.length){host.innerHTML='<p class="interactive-muted">Сначала загрузи остановки на вкладке «Карта». Табло использует сохранённую базу остановок.</p>';return;}
 const saved=localStorage.getItem(BOARD_KEY)||'',stop=list.find(s=>String(s.id)===saved)||list[0];
 try{localStorage.setItem(BOARD_KEY,String(stop.id));}catch(e){}
 const a=arrivalsAt(stop).slice(0,5);
 let rows=a.map((x,i)=>'<div style="display:grid;grid-template-columns:52px minmax(0,1fr) 58px;gap:9px;align-items:center;padding:10px 0;border-top:1px solid #44515a"><b style="font-size:21px;color:#ffd34e">'+esc(x.route.number||'—')+'</b><div><b>'+esc(x.dir==='←'?(x.route.start||x.route.from||'Обратное направление'):(x.route.end||x.route.to||'Направление не указано'))+'</b><div style="font-size:11px;color:#b9c7ce">'+esc(x.v.model||'ТС')+' · '+esc(vehicleNumberText(x.v))+' · рейс '+x.trip+x.dir+'</div></div><b style="font-size:18px;text-align:right;color:'+(i===0?'#9be7a5':'#f7f5e9')+'">'+hhmm(x.at)+'</b></div>').join('');
 host.innerHTML='<div style="display:grid;gap:10px"><label style="font-weight:700">🚏 Выбери остановку<select id="stopBoardSelect" class="map-mini-input" style="width:100%;margin-top:5px">'+list.slice().sort((x,y)=>String(x.name||'').localeCompare(String(y.name||''),'ru')).map(s=>'<option value="'+esc(s.id)+'" '+(String(s.id)===String(stop.id)?'selected':'')+'>'+esc(s.name||s.title||s.id)+'</option>').join('')+'</select></label><div style="background:#101820;color:#f7f5e9;border-radius:12px;padding:14px;border:3px solid #34414b"><div style="display:flex;justify-content:space-between;border-bottom:1px solid #66727a;padding-bottom:9px"><b>ЭЛЕКТРОННОЕ ТАБЛО</b><span style="color:#a7c7d8">'+hhmm(Date.now())+'</span></div><div style="font-size:18px;font-weight:800;padding:12px 0 5px">'+esc(stop.name||stop.title||'Остановка')+'</div><div style="font-size:11px;color:#b9c7ce;margin-bottom:10px">МИНСК · РАСЧЁТНОЕ РАСПИСАНИЕ</div>'+(rows||'<div style="padding:18px 0;color:#c4d0d6">Нет ближайших расчётных прибытий по активным карточкам.</div>')+'<div style="font-size:10px;color:#93a4ad;border-top:1px solid #44515a;padding-top:8px">Игровой расчёт по карточкам выезда, не GPS и не данные Минсктранса.</div></div><button class="btn-secondary" type="button" onclick="renderStopBoardV1()">↻ Обновить табло</button></div>';
 document.getElementById('stopBoardSelect')?.addEventListener('change',e=>{localStorage.setItem(BOARD_KEY,String(e.target.value));renderBoard();});
}
window.renderStopBoardV1=renderBoard;
function renderDispatch(){
 const host=document.getElementById('dispatcherPanel');if(!host)return;const now=new Date();
 host.innerHTML=gameState.owned.map(v=>{
  const repairing=Number(v.repairUntil)>Date.now(),list=cards().filter(c=>c&&c.active!==false&&String(c.vehicleId)===String(v.id));
  const sim=list.length?getCardDrivenPoint(v,list,now):getVehicleSimulationPoint(v);
  const active=getActiveServiceRouteAndSchedule(v.id,now),route=sim?.activeRoute||active?.route||sim?.route||null,s=active?.schedule||null;
  let status=repairing?'🚧 Следует в парк / ремонт':v.maintenanceDue?'🔧 Требуется обслуживание':sim?.point&&s?'🟢 На линии':sim?.point?'🟢 Движение':'🏠 В парке',trip='—';
  if(s&&route){const abs=getScheduleAbsoluteTimes(s,new Date(now.getFullYear(),now.getMonth(),now.getDate()),route,v);if(now>=abs.start&&now<=abs.lastArrival)trip=String(Math.max(1,Math.floor((now-abs.start)/60000/Math.max(1,abs.duration+abs.turnaround))+1));else if(now<abs.start)trip='ожидает';else trip='заезд';}
  return '<div class="interactive-log-row"><div style="min-width:0"><b>'+vehicleCategoryIcon(v.category||'bus')+' '+esc(v.model||'ТС')+'</b><br><span class="interactive-muted">'+esc(vehicleNumberText(v))+'</span><br><b>'+esc(route?'№'+(route.number||'—')+' · '+(route.start||'—')+' → '+(route.end||'—'):'маршрут не назначен')+'</b><br>'+status+' · '+esc(sim?.phase||'в парке')+'<br><span class="interactive-muted">Рейс: '+trip+' · заезд в парк: '+(active?.abs?.return?hhmm(active.abs.return):'—')+'</span></div><button class="btn-secondary" onclick="focusVehicleV43(\''+esc(v.id)+'\')">🛰️ Следить</button></div>';
 }).join('')||'<div class="interactive-muted">ТС нет.</div>';
}
/* Reject overlapping same-vehicle card schedules and deduplicate arrival events. */
const oldPayout=window.processServiceCardPayouts;
if(typeof oldPayout==='function' && !oldPayout.__dispatchGuardV1){
 window.processServiceCardPayouts=function(now){
  const owner=new Map(),blocked=new Map(),accepted=new Map(),seen=new Set();
  const sorted=[];
  cards().filter(c=>c&&c.active!==false).forEach(card=>(card.schedules||[]).forEach((s,i)=>{
   owner.set(s,String(card.vehicleId));
   sorted.push({card,s,i,vehicle:gameState.owned.find(v=>String(v.id)===String(card.vehicleId))});
  }));
  sorted.sort((a,b)=>String(a.card.createdAt||'').localeCompare(String(b.card.createdAt||''))||a.i-b.i);
  sorted.forEach(item=>{
   const v=item.vehicle, s=item.s, route=getScheduleRoute(s);if(!v||!route)return;
   for(let day=0;day<7;day++){
    if(!Array.isArray(s.days)||!s.days.includes(day))continue;
    const base=new Date(2026,0,4+day),abs=getScheduleAbsoluteTimes(s,base,route,v);
    const key=String(v.id)+'|'+day, list=accepted.get(key)||[];
    const start=abs.depot.getTime(),end=abs.return.getTime();
    const overlap=list.some(x=>start<x.end&&end>x.start);
    if(overlap){const days=blocked.get(s)||new Set();days.add(day);blocked.set(s,days);}
    else list.push({start,end});
    accepted.set(key,list);
   }
  });
  const oldGenerated=window.getGeneratedArrivalTimes;
  if(typeof oldGenerated!=='function')return oldPayout(now);
  window.getGeneratedArrivalTimes=function(schedule,baseDate){
   const days=blocked.get(schedule);
   if(days?.has(baseDate.getDay()))return [];
   const times=oldGenerated(schedule,baseDate),vehicleId=owner.get(schedule);
   if(!vehicleId)return times;
   return times.filter(ts=>{const key=vehicleId+'|'+ts;if(seen.has(key))return false;seen.add(key);return true;});
  };
  try{return oldPayout(now);}
  finally{window.getGeneratedArrivalTimes=oldGenerated;}
 };
 window.processServiceCardPayouts.__dispatchGuardV1=true;
}
const oldCardPoint=window.getCardDrivenPoint;
if(typeof oldCardPoint==='function')window.getCardDrivenPoint=function(v,card,now){
 if(v&&Number(v.repairUntil)>Date.now()){
  const g=v.repairRouteGeometry,d=depotForVehicle(v);
  if(g?.coordinates?.length>=2){
   const dur=Math.max(60000,Number(v.repairRouteDurationMs||60000)),p=Math.max(0,Math.min(1,(Date.now()-Number(v.repairRouteStartedAt||Date.now()))/dur));
   return {point:pathPointFromGeometry(g,p),phase:p>=1?'🏠 в парке '+d.name+' · ожидает ремонта':'🚧 следует в парк '+d.name,activeRoute:getVehicleRoute(v.id)};
  }
  return {point:v.repairRouteStartPoint||null,phase:v.repairRouteStatus==='unavailable'?'🚧 маршрут до парка не построен — ТС остановлено':'🚧 строится дорожный маршрут до парка',activeRoute:getVehicleRoute(v.id)};
 }
 return oldCardPoint(v,card,now);
};
const oldSim=window.getVehicleSimulationPoint;
if(typeof oldSim==='function')window.getVehicleSimulationPoint=function(v){
 if(!v)return oldSim(v);
 if(Number(v.repairUntil)>Date.now()&&v.repairRouteGeometry?.coordinates?.length>=2){
  const d=depotForVehicle(v),dur=Math.max(60000,Number(v.repairRouteDurationMs||60000)),p=Math.max(0,Math.min(1,(Date.now()-Number(v.repairRouteStartedAt||Date.now()))/dur));
  return {route:getVehicleRoute(v.id),point:pathPointFromGeometry(v.repairRouteGeometry,p),phase:p>=1?'🏠 в парке '+d.name+' · ожидает ремонта':'🚧 следует в парк '+d.name};
 }
 const cs=cards().filter(c=>c&&c.active!==false&&String(c.vehicleId)===String(v.id));
 if(cs.length){const x=getCardDrivenPoint(v,cs,new Date());return {route:x.activeRoute||getActiveServiceRouteAndSchedule(v.id,new Date())?.route||null,point:x.point,phase:x.phase};}
 return oldSim(v);
};
async function requestRepairRoad(v,start){
 if(!start||repairRequests.has(String(v.id)))return;repairRequests.add(String(v.id));
 try{
  const d=depotForVehicle(v),url=OSRM+Number(start[1])+','+Number(start[0])+';'+d.lon+','+d.lat+'?overview=full&geometries=geojson&steps=false',r=await fetch(url);
  if(!r.ok)throw new Error('OSRM '+r.status);const data=await r.json(),route=data.routes?.[0];if(!route?.geometry?.coordinates?.length)throw new Error('Маршрут не найден');
  v.repairRouteGeometry=route.geometry;v.repairRouteStartedAt=Number(v.repairStartedAt||Date.now());v.repairRouteDurationMs=Math.min(Math.max(60000,Number(route.duration||60)*1000),Math.max(60000,Number(v.repairDurationMs||60000)));v.repairRouteDistanceMeters=Number(route.distance||0);v.repairRouteStatus='ready';saveGameState();
 }catch(e){v.repairRouteStatus='unavailable';v.repairRouteError=String(e.message||e);saveGameState();console.warn('[BUSPHOTO] repair route unavailable',e);}
 finally{repairRequests.delete(String(v.id));if(typeof renderV43Panels==='function')renderV43Panels();}
}
const oldService=window.serviceVehicleV43;
if(typeof oldService==='function')window.serviceVehicleV43=function(id){
 const v=gameState.owned.find(x=>String(x.id)===String(id));if(!v)return oldService(id);
 const cs=cards().filter(c=>c&&c.active!==false&&String(c.vehicleId)===String(v.id));
 let sim=null;try{sim=cs.length?getCardDrivenPoint(v,cs,new Date()):getVehicleSimulationPoint(v);}catch(e){}
 const start=sim?.point||null,before=Number(v.repairUntil||0),result=oldService(id);
 if(Number(v.repairUntil)>Date.now()&&Number(v.repairUntil)!==before){v.repairRouteStatus='building';v.repairRouteStartedAt=Number(v.repairStartedAt||Date.now());v.repairRouteStartPoint=start;saveGameState();if(start)requestRepairRoad(v,start);else{const d=depotForVehicle(v);v.repairRouteGeometry={type:'LineString',coordinates:[[d.lon,d.lat],[d.lon,d.lat]]};v.repairRouteStatus='at-depot';saveGameState();}}
 return result;
};
function installBoard(){
 const menu=document.querySelector('.game-menu');
 if(menu&&!menu.querySelector('[data-stop-board-button]')){const b=document.createElement('button');b.className='game-menu-btn';b.type='button';b.dataset.stopBoardButton='1';b.textContent='📟 Табло остановок';b.addEventListener('click',()=>showGameSection('tablo',b));menu.appendChild(b);}
 if(!document.getElementById('game-section-tablo')){const h=document.createElement('div');h.className='game-section';h.id='game-section-tablo';h.innerHTML='<div class="interactive-card"><h3>📟 Электронные табло остановок</h3><div id="stopBoardPanel"></div></div>';const p=document.querySelector('.main-wrapper .tab-content')||document.querySelector('.main-wrapper')||document.body;p.appendChild(h);}
}
const oldPanels=window.renderV43Panels;
window.renderV43Panels=function(){if(typeof oldPanels==='function')oldPanels();renderDispatch();};
const oldShow=window.showGameSection;
if(typeof oldShow==='function')window.showGameSection=function(section,btn){oldShow(section,btn);if(section==='tablo')setTimeout(renderBoard,50);if(section==='dispatch')setTimeout(renderDispatch,50);};
function boot(){installBoard();if(document.getElementById('dispatcherPanel'))renderDispatch();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();