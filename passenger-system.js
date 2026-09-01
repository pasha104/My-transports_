/* BUSPHOTO — заработок от пассажиров */
(function(){
'use strict';
if(window.__BUSPHOTO_PASSENGER_SYSTEM__)return;
window.__BUSPHOTO_PASSENGER_SYSTEM__=true;
const CAPACITY={
 bus:{'МАЗ-101':123,'МАЗ-103':103,'МАЗ-104':110,'МАЗ-105':190,'МАЗ-107':150,'МАЗ-152':47,'МАЗ-203':113,'МАЗ-205':185,'МАЗ-206':72,'МАЗ-215':183,'МАЗ-216':169,'МАЗ-226':72,'МАЗ-231':80,'МАЗ-232':45,'МАЗ-241':36,'МАЗ-251':51,'МАЗ-256':43,'МАЗ-257':48,'МАЗ-303':110},
 trolleybus:{'МАЗ-103Т':108,'МАЗ-203Т':103,'МАЗ-303Т':75,'АКСМ-101':114,'БКМ-201':109,'БКМ-213':168,'БКМ-321':115,'БКМ-333':170,'БКМ-420':115,'БКМ-433':153},
 electrobus:{'МАЗ-303Е':72,'МАЗ-305Е':150,'БКМ-Е321':83,'БКМ-Е433':153}
};
function capacity(v){const m=CAPACITY[v?.category]||{},n=String(v?.model||'').trim().replace(/^МАЗ\s+/i,'МАЗ-');let x=0;for(const k of Object.keys(m))if(n===k||n.startsWith(k))x=Math.max(x,m[k]);return Math.max(1,x||50)}
function loadPercent(){const r=Math.random();if(r<.25)return 15+Math.random()*25;if(r<.70)return 40+Math.random()*35;if(r<.95)return 70+Math.random()*25;return 95+Math.random()*5}
function passengers(v){const c=capacity(v),n=Math.max(1,Math.min(c,Math.round(c*loadPercent()/100)));return{count:n,capacity:c,loadPercent:Math.round(n/c*100)}}
function install(){
 if(typeof window.processServiceCardPayouts!=='function')return false;
 const original=window.processServiceCardPayouts;if(original.__passengerWrapped)return true;
 function wrapped(now){
  const key='busphoto_interactive_game';let before={};try{before=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(e){}
  const oldBalance=Number(before.balance||0),oldLog=Array.isArray(before.log)?before.log:[];const oldTotal=Number(original(now)||0);
  let after={};try{after=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(e){}let log=Array.isArray(after.log)?after.log:[],extra=0,changed=false;
  const sig=x=>`${x?.date||''}|${x?.time||''}|${x?.routeNumber||''}|${x?.vehicleModel||''}|${x?.arrivalTime||''}`;const seen=new Set(oldLog.map(sig));
  for(const item of log){if(item.type!=='route-arrival'||item.passengerSystemV1||seen.has(sig(item)))continue;const v=(after.owned||[]).find(x=>String(x.model||'')===String(item.vehicleModel||''));if(!v)continue;
   const d=Math.max(0,Number(item.distanceKm||0)),dp=Math.max(0,Math.floor(d*2)),p=passengers(v),pp=p.count*3,total=dp+pp,delta=total-Number(item.total||0);extra+=delta;item.total=total;item.distancePayout=dp;item.passengerCount=p.count;item.passengerCapacity=p.capacity;item.passengerLoadPercent=p.loadPercent;item.passengerPayout=pp;item.passengerSystemV1=true;item.details=[`🕐 ${item.arrivalTime||item.time||'—'} · ТС ${v.model||'—'} · маршрут №${item.routeNumber||'—'} · 👥 ${p.count}/${p.capacity} пассажиров (${p.loadPercent}%) · 📏 ${d.toFixed(1)} км · расстояние +${dp} р. · пассажиры +${pp} р. · Итого +${total} р.`];changed=true;
   const s=v.stats||(v.stats={});s.earned=Number(s.earned||0)+delta;s.passengers=Number(s.passengers||0)+p.count;s.passengerEarnings=Number(s.passengerEarnings||0)+pp;v.lastPassengerCount=p.count;v.passengerCapacity=p.capacity;
  }
  if(changed){after.balance=oldBalance+oldTotal+extra;try{localStorage.setItem(key,JSON.stringify(after))}catch(e){}if(typeof window.loadGameState==='function')try{window.loadGameState()}catch(e){}if(typeof window.renderInteractiveHeaderAndLightViews==='function')window.renderInteractiveHeaderAndLightViews();if(typeof window.renderInteractive==='function')window.renderInteractive();if(typeof window.renderHistorySection==='function')window.renderHistorySection()}
  return oldTotal+extra;
 }
 wrapped.__passengerWrapped=true;window.processServiceCardPayouts=wrapped;return true;
}
const oldAppend=document.head.appendChild.bind(document.head);document.head.appendChild=function(node){if(node&&node.tagName==='SCRIPT'&&String(node.src||'').includes('busphoto-interactive.js')){const old=node.onload;node.onload=function(e){install();if(typeof old==='function')return old.call(this,e)}}return oldAppend(node)};install();
})();
