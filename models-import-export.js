(function(){
'use strict';
const KEY='busphoto_custom_models_v1';
const TYPES=[['bus','🚌 Автобусы'],['trolleybus','🚎 Троллейбусы'],['tram','🚋 Трамваи'],['electrobus','⚡ Электробусы']];
function clone(o){return JSON.parse(JSON.stringify(o));}
function getBase(){return typeof modelsData==='object' ? clone(modelsData) : {bus:{},trolleybus:{},tram:{},electrobus:{}};}
function getData(){
  const base=getBase(); if(!base.tram) base.tram={};
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object')TYPES.forEach(([k])=>{if(saved[k]&&typeof saved[k]==='object')Object.assign(base[k],saved[k]);});}catch(e){console.warn('models import storage',e);}
  return base;
}
function saveData(data){
  const base=getBase(),custom={};
  TYPES.forEach(([k])=>{custom[k]={};Object.keys(data[k]||{}).forEach(name=>{if(!Object.prototype.hasOwnProperty.call(base[k]||{},name))custom[k][name]=data[k][name];});});
  localStorage.setItem(KEY,JSON.stringify(custom));
}
function escapeHtml(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');}
function render(){
  const data=getData();
  TYPES.forEach(([k])=>{
    const id=k==='bus'?'models-grid-bus':k==='trolleybus'?'models-grid-troll':k==='tram'?'models-grid-tram':'models-grid-electro';
    const grid=document.getElementById(id);if(!grid)return;grid.innerHTML='';
    Object.keys(data[k]||{}).forEach(name=>{const div=document.createElement('div');div.className='model-item';div.innerHTML='<b>'+escapeHtml(name)+'</b>';div.onclick=()=>openCustomModel(name,k);grid.appendChild(div);});
  });
}
function openCustomModel(name,type){
  const data=getData(),subs=Array.isArray(data[type]?.[name])?data[type][name]:[];
  const modal=document.getElementById('modelDetailsModal');
  const title=document.getElementById('mdTitle'),sub=document.getElementById('mdSubtitle'),list=document.getElementById('mdSubmodelsList');
  if(!modal||!title||!list)return;
  title.textContent=name; if(sub)sub.textContent='Подмодификации и транспортные средства в базе данных';
  list.innerHTML=subs.length?subs.map(x=>'<div class="submodel-row"><span>'+escapeHtml(x)+'</span></div>').join(''):'<div style="padding:10px;color:#777;">Подмодификации не указаны.</div>';
  modal.style.display='flex';
}
function parse(text){
  const out={bus:{},trolleybus:{},tram:{},electrobus:{}};let type=null;
  String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).forEach(raw=>{const line=raw.trim();if(!line||line.startsWith('#'))return;const h=line.match(/^\[(.+)\]$/);if(h){const x=h[1].trim().toLowerCase();type=x.includes('трол')||x.includes('trolley')?'trolleybus':x.includes('трам')||x.includes('tram')?'tram':x.includes('электро')||x.includes('electric')?'electrobus':x.includes('автоб')||x.includes('bus')?'bus':null;return;}if(!type)return;const parts=line.split('|').map(s=>s.trim()),name=parts.shift();if(!name)return;out[type][name]=parts.length&&parts[0]?parts[0].split(',').map(s=>s.trim()).filter(Boolean):[];});
  if(!Object.values(out).some(x=>Object.keys(x).length))throw new Error('Не найдено ни одной модели.');return out;
}
function exportTxt(){
  const data=getData();let text='# BUSPHOTO — список моделей\n# Формат: Модель | подмодель1, подмодель2\n# Категории: Автобусы, Троллейбусы, Трамваи, Электробусы\n\n';
  TYPES.forEach(([k,title])=>{text+='['+title.replace(/^\S+\s/,'')+']\n';Object.entries(data[k]||{}).forEach(([name,subs])=>text+=name+(subs&&subs.length?' | '+subs.join(', '):'')+'\n');text+='\n';});
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='BUSPHOTO_модели.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function importTxt(file,mode){
  const r=new FileReader();r.onload=()=>{try{const incoming=parse(r.result),data=mode==='replace'?{bus:{},trolleybus:{},tram:{},electrobus:{}}:getData();TYPES.forEach(([k])=>Object.assign(data[k],incoming[k]));saveData(data);render();alert('Готово! Импортировано моделей: '+TYPES.reduce((n,[k])=>n+Object.keys(incoming[k]).length,0)+'.');}catch(e){alert('Не удалось импортировать TXT: '+e.message);} };r.readAsText(file,'utf-8');
}
function downloadExample(){
 const text='# BUSPHOTO — пример файла моделей\n# Формат: Модель | подмодель1, подмодель2\n\n[Автобусы]\nМАЗ-103 | 103.000, 103.002\nЛиАЗ-5292\n\n[Троллейбусы]\nМАЗ-203Т | 203Т20, 203Т21\n\n[Трамваи]\nТатра T3\n\n[Электробусы]\nМАЗ-303Е | 303Э10, 303Э20\n';
 const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='BUSPHOTO_пример_моделей.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function setup(){
 const box=document.getElementById('modelsTools');if(!box)return;const input=document.getElementById('modelsTxtInput');
 document.getElementById('modelsImportBtn').onclick=()=>input.click();
 input.onchange=()=>{if(input.files[0]){const replace=confirm('Заменить список моделей полностью?\n\nОК — заменить.\nОтмена — добавить к существующим.');importTxt(input.files[0],replace?'replace':'merge');input.value='';}};
 document.getElementById('modelsExportBtn').onclick=exportTxt;document.getElementById('modelsExampleBtn').onclick=downloadExample;render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
