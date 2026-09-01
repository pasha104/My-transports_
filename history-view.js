/* BUSPHOTO — компактная история по времени v2 */
(function(){
'use strict';
if(window.__BUSPHOTO_COMPACT_HISTORY_V2__)return;
window.__BUSPHOTO_COMPACT_HISTORY_V2__=true;
const KEY='busphoto_interactive_game';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function timeOf(x){return String(x?.arrivalTime||x?.time||'').trim();}
function dateOf(x){return String(x?.date||'').trim()||'—';}
function minuteStamp(x){const t=timeOf(x),m=/^(\d{1,2})[:.](\d{2})/.exec(t);return m?`${String(m[1]).padStart(2,'0')}:${m[2]}`:t||'—';}
function keyOf(x){return `${dateOf(x)}|${minuteStamp(x)}`;}
function vehicleLine(x){
 const model=x.vehicleModel||x.model||x.vehicle||'ТС',number=x.vehicleNumber||x.number||'—';
 const route=x.routeNumber?` · маршрут №${esc(x.routeNumber)}`:'';
 const p=x.passengerCount!=null?` · 👥 ${esc(x.passengerCount)}${x.passengerCapacity?'/'+esc(x.passengerCapacity):''}`:'';
 const dist=x.distancePayout!=null?` · расстояние +${Math.round(Number(x.distancePayout)||0)} р.`:'';
 const pass=x.passengerPayout!=null?` · пассажиры +${Math.round(Number(x.passengerPayout)||0)} р.`:'';
 const total=Number(x.total||x.amount||0);
 return `<div class="history-time-item"><span>🚍 <b>${esc(model)}</b> (${esc(number)})${route}${p}${dist}${pass}</span><b class="interactive-positive">+${Math.round(total).toLocaleString('ru-RU')} р.</b></div>`;
}
function compactHistory(){
 const host=document.getElementById('historyLog');if(!host)return;
 let state={};try{state=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
 const log=Array.isArray(state.log)?state.log.slice():[];
 if(!log.length){host.innerHTML='<div class="interactive-muted">Операций пока нет.</div>';return;}
 const groups=new Map();
 for(const item of log){
   if(item.type==='route-arrival-batch'&&Array.isArray(item.arrivals)){
     const key=keyOf(item);if(!groups.has(key))groups.set(key,{date:dateOf(item),time:minuteStamp(item),arrivals:[],others:[]});groups.get(key).arrivals.push(...item.arrivals);
   }else if(item.type==='route-arrival'){
     const key=keyOf(item);if(!groups.has(key))groups.set(key,{date:dateOf(item),time:minuteStamp(item),arrivals:[],others:[]});groups.get(key).arrivals.push(item);
   }else{
     const key=keyOf(item);if(!groups.has(key))groups.set(key,{date:dateOf(item),time:minuteStamp(item),arrivals:[],others:[]});groups.get(key).others.push(item);
   }
 }
 const arr=[...groups.values()].sort((a,b)=>`${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`,'ru',{numeric:true}));
 host.innerHTML=arr.map(g=>{
   const total=g.arrivals.reduce((s,x)=>s+Number(x.total||0),0)+g.others.reduce((s,x)=>s+Number(x.total||x.amount||0),0);
   const rows=g.arrivals.map(vehicleLine).join('');
   const others=g.others.map(x=>{const text=x.details?.[0]||x.message||x.text||x.type||'Операция';const amount=Number(x.total??x.amount??0);return `<div class="history-time-item"><span>ℹ️ ${esc(String(text).replace(/<[^>]*>/g,''))}</span>${amount?`<b class="interactive-positive">${amount>0?'+':''}${Math.round(amount).toLocaleString('ru-RU')} р.</b>`:''}</div>`;}).join('');
   return `<div class="history-time-group"><div class="history-time-head">📅 ${esc(g.date)} <strong>🕐 ${esc(g.time)}</strong><b class="interactive-positive">+${Math.round(total).toLocaleString('ru-RU')} р.</b></div>${rows}${others}</div>`;
 }).join('');
}
function install(){window.renderHistorySection=compactHistory;compactHistory();return true;}
let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(timer)},100);
})();