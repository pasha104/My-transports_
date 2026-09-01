/* BUSPHOTO — компактная история по времени */
(function(){
'use strict';
if(window.__BUSPHOTO_COMPACT_HISTORY__)return;
window.__BUSPHOTO_COMPACT_HISTORY__=true;
const KEY='busphoto_interactive_game';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function timeOf(x){return String(x?.arrivalTime||x?.time||'').trim();}
function dateOf(x){return String(x?.date||'').trim()||'—';}
function stamp(x){
 const d=dateOf(x),t=timeOf(x);
 const m=/^(\d{1,2})[:.](\d{2})/.exec(t);
 return `${d} ${m?String(m[1]).padStart(2,'0')+':'+m[2]:t}`;
}
function sortLog(a,b){return stamp(b).localeCompare(stamp(a),'ru',{numeric:true});}
function vehicleLine(x){
 const model=x.vehicleModel||x.model||x.vehicle||'—';
 const route=x.routeNumber?` · маршрут №${esc(x.routeNumber)}`:'';
 const p=x.passengerCount!=null?` · 👥 ${esc(x.passengerCount)}${x.passengerCapacity?'/'+esc(x.passengerCapacity):''}`:'';
 const total=Number(x.total||x.amount||0);
 const payout=total?`<b class="interactive-positive">+${Math.round(total).toLocaleString('ru-RU')} р.</b>`:'';
 const dist=x.distancePayout!=null?` · расстояние +${Math.round(Number(x.distancePayout)||0)} р.`:'';
 const pass=x.passengerPayout!=null?` · пассажиры +${Math.round(Number(x.passengerPayout)||0)} р.`:'';
 return `<div class="history-time-item"><span>🚍 <b>${esc(model)}</b>${route}${p}${dist}${pass}</span><span>${payout}</span></div>`;
}
function compactHistory(){
 const host=document.getElementById('historyLog');if(!host)return;
 let state={};try{state=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
 const log=Array.isArray(state.log)?state.log.slice().sort(sortLog):[];
 if(!log.length){host.innerHTML='<div class="interactive-muted">Операций пока нет.</div>';return;}
 const groups=new Map();
 for(const x of log){const key=`${dateOf(x)}|${timeOf(x)||'—'}`;if(!groups.has(key))groups.set(key,{date:dateOf(x),time:timeOf(x)||'—',items:[]});groups.get(key).items.push(x)}
 let html='';
 for(const g of groups.values()){
   const arrivals=g.items.filter(x=>x.type==='route-arrival');
   const others=g.items.filter(x=>x.type!=='route-arrival');
   html+=`<div class="history-time-group"><div class="history-time-head">📅 ${esc(g.date)} <strong>🕐 ${esc(g.time)}</strong></div>`;
   if(arrivals.length)html+=arrivals.map(vehicleLine).join('');
   for(const x of others){
     const text=x.details?.[0]||x.message||x.text||x.type||'Операция';
     const amount=x.amount!=null?Number(x.amount):x.total!=null?Number(x.total):0;
     html+=`<div class="history-time-item"><span>ℹ️ ${esc(String(text).replace(/<[^>]*>/g,''))}</span>${amount?`<b class="interactive-positive">${amount>0?'+':''}${Math.round(amount).toLocaleString('ru-RU')} р.</b>`:''}</div>`;
   }
   html+='</div>';
 }
 host.innerHTML=html;
}
function install(){
 if(typeof window.renderHistorySection!=='function')return false;
 if(window.renderHistorySection.__compactV1)return true;
 const fn=compactHistory;fn.__compactV1=true;window.renderHistorySection=fn;compactHistory();return true;
}
let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(timer)},100);
})();
