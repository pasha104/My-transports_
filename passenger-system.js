/* BUSPHOTO — заработок от пассажиров v3 */
(function(){
'use strict';
if(window.__BUSPHOTO_PASSENGER_SYSTEM_V3__)return;
window.__BUSPHOTO_PASSENGER_SYSTEM_V3__=true;

const CAPACITY={
  bus:{
    'МАЗ-101':123,'МАЗ-103':123,'МАЗ-104':123,'МАЗ-105':175,'МАЗ-107':148,
    'МАЗ-152':129,'МАЗ-203':105,'МАЗ-205':185,'МАЗ-206':72,'МАЗ-215':183,
    'МАЗ-216':176,'МАЗ-226':72,'МАЗ-231':100,'МАЗ-232':71,'МАЗ-241':36,
    'МАЗ-251':53,'МАЗ-256':80,'МАЗ-257':48,'МАЗ-303':105
  },
  trolleybus:{
    'МАЗ-103Т':110,'МАЗ-203Т':102,'МАЗ-303Т':110,'АКСМ-101':114,
    'БКМ-201':109,'БКМ-213':209,'БКМ-321':115,'БКМ-333':170,
    'БКМ-420':115,'БКМ-433':153
  },
  electrobus:{
    'МАЗ-303Е':90,'МАЗ-305Е':120,'БКМ-Е321':97,'БКМ-Е433':153
  }
};
const DISTANCE_RATE=2;
const PASSENGER_RATE=3;
const KEY='busphoto_interactive_game';

function capacity(v){
  const map=CAPACITY[v?.category]||{};
  const name=String(v?.model||'').trim().replace(/^МАЗ\s+/i,'МАЗ-');
  let best=0;
  for(const k of Object.keys(map)){
    if(name===k || name.startsWith(k)) best=Math.max(best,map[k]);
  }
  const saved=Number(v?.passengerCapacity);
  return Math.max(1,Number.isFinite(saved)&&saved>0?saved:(best||50));
}

function loadPercent(){
  const r=Math.random();
  if(r<.25)return 15+Math.random()*25;
  if(r<.70)return 40+Math.random()*35;
  if(r<.95)return 70+Math.random()*25;
  return 95+Math.random()*5;
}

function passengers(v){
  const c=capacity(v);
  const count=Math.max(1,Math.min(c,Math.round(c*loadPercent()/100)));
  return {count,capacity:c,loadPercent:Math.round(count/c*100)};
}

function vehicleMatches(v,event){
  if(!v||!event)return false;
  const model=String(v.model||'');
  const em=String(event.vehicleModel||event.model||event.vehicle||'');
  if(em&&model!==em)return false;
  const ev=String(event.vehicleNumber||event.number||'').trim();
  if(!ev)return true;
  const nums=[v.num,v.boardNumber,v.garageNumber,v.plate,v.govNumber]
    .map(x=>String(x??'').trim()).filter(Boolean);
  if(!nums.length)return true;
  return nums.includes(ev)||nums.some(n=>n.replace(/^№\s*/,'')===ev.replace(/^№\s*/,''));
}

function findVehicle(state,event){
  const owned=Array.isArray(state?.owned)?state.owned:[];
  return owned.find(v=>vehicleMatches(v,event))||owned.find(v=>String(v.model||'')===String(event?.vehicleModel||event?.model||''));
}

function enrichEvent(event,state){
  if(!event||event.passengerSystemV3)return 0;
  const v=findVehicle(state,event);
  if(!v)return 0;

  const distance=Math.max(0,Number(event.distanceKm||0));
  const distancePayout=Math.max(0,Math.round(distance*DISTANCE_RATE));
  const p=passengers(v);
  const passengerPayout=p.count*PASSENGER_RATE;
  const total=distancePayout+passengerPayout;
  const oldTotal=Number(event.total||0);
  const delta=total-oldTotal;

  event.distancePayout=distancePayout;
  event.passengerCount=p.count;
  event.passengerCapacity=p.capacity;
  event.passengerLoadPercent=p.loadPercent;
  event.passengerPayout=passengerPayout;
  event.total=total;
  event.passengerSystemV3=true;
  event.details=[
    `🕐 ${event.arrivalTime||event.time||'—'} · ТС ${v.model||'—'} · маршрут №${event.routeNumber||'—'} · 👥 ${p.count}/${p.capacity} пассажиров (${p.loadPercent}%) · 📏 ${distance.toFixed(1)} км · расстояние +${distancePayout} р. · пассажиры +${passengerPayout} р. · Итого +${total} р.`
  ];

  v.passengerCapacity=p.capacity;
  v.lastPassengerCount=p.count;
  v.lastPassengerCapacity=p.capacity;
  v.lastPassengerOccupancyPercent=p.loadPercent;
  const st=v.stats||(v.stats={trips:0,arrivals:0,distanceKm:0,workMinutes:0,earned:0});
  st.passengers=Number(st.passengers||0)+p.count;
  st.passengerEarnings=Number(st.passengerEarnings||0)+passengerPayout;
  st.earned=Number(st.earned||0)+delta;
  return delta;
}

function install(){
  if(typeof window.processServiceCardPayouts!=='function')return false;
  const original=window.processServiceCardPayouts;
  if(original.__passengerSystemV3)return true;

  function wrapped(now){
    let before={};
    try{before=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
    const oldBalance=Number(before.balance||0);
    const oldTotal=Number(original(now)||0);
    let after={};
    try{after=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
    const log=Array.isArray(after.log)?after.log:[];
    let extra=0,changed=false;

    for(const item of log){
      if(item.type==='route-arrival-batch'&&Array.isArray(item.arrivals)){
        let batchDelta=0,batchChanged=false;
        for(const event of item.arrivals){
          const d=enrichEvent(event,after);
          if(d!==0||event.passengerSystemV3){batchDelta+=d;batchChanged=true;}
        }
        if(batchChanged){
          item.total=Number(item.total||0)+batchDelta;
          item.passengerPayout=item.arrivals.reduce((s,e)=>s+Number(e.passengerPayout||0),0);
          item.distancePayout=item.arrivals.reduce((s,e)=>s+Number(e.distancePayout||0),0);
          item.passengerSystemV3=true;
          item.details=item.arrivals.map(e=>e.details?.[0]||'');
          extra+=batchDelta;
          changed=true;
        }
        continue;
      }
      if(item.type!=='route-arrival'||item.passengerSystemV3)continue;
      const d=enrichEvent(item,after);
      if(d!==0||item.passengerSystemV3){extra+=d;changed=true;}
    }

    if(changed){
      after.balance=oldBalance+oldTotal+extra;
      try{localStorage.setItem(KEY,JSON.stringify(after))}catch(e){}
      try{if(typeof window.loadGameState==='function')window.loadGameState()}catch(e){}
      try{if(typeof window.renderInteractiveHeaderAndLightViews==='function')window.renderInteractiveHeaderAndLightViews()}catch(e){}
      try{if(typeof window.renderInteractive==='function')window.renderInteractive()}catch(e){}
      try{if(typeof window.renderHistorySection==='function')window.renderHistorySection()}catch(e){}
    }
    return oldTotal+extra;
  }

  wrapped.__passengerSystemV3=true;
  window.processServiceCardPayouts=wrapped;
  return true;
}

/* Интерактив загружается отдельным скриптом, поэтому ждём его появления.
   Это надёжнее, чем зависеть от порядка динамической загрузки. */
let attempts=0;
const timer=setInterval(()=>{
  if(install()||++attempts>=80)clearInterval(timer);
},250);
install();
})();
