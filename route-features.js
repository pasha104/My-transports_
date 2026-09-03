/* BUSPHOTO — маршруты: без назначения ТС + добавление автобуса на спецмаршрут */
(function(){
  'use strict';
  const GAME_KEY='busphoto_interactive_game';

  function readGame(){
    try{
      const x=JSON.parse(localStorage.getItem(GAME_KEY)||'{}');
      return x&&typeof x==='object'?x:{};
    }catch(e){return {};}
  }
  function routes(){const x=readGame().routes;return Array.isArray(x)?x:[];}
  function type(r){return String(r?.routeType||r?.type||'bus').toLowerCase();}
  function service(r){return String(r?.routeServiceType||r?.serviceType||'').toLowerCase();}
  function label(r){
    const n=r?.number??r?.routeNumber??'';
    const a=r?.start??r?.from??'—',b=r?.end??r?.to??'—';
    return '№'+n+' — '+a+' → '+b;
  }
  function isBusAllowed(r){const t=type(r);return t==='trolleybus'||t==='electrobus';}

  function removeAssignmentUI(){
    document.querySelectorAll('#routeAssignmentSummary .route-card').forEach(card=>{
      card.querySelectorAll('button').forEach(btn=>{
        if(/ТС\s+на\s+маршруте/i.test((btn.textContent||'').trim())) btn.remove();
      });
      card.querySelectorAll('.route-assignment').forEach(el=>el.remove());
      card.querySelectorAll('input[type="checkbox"]').forEach(el=>el.closest('label')?.remove()||el.remove());
      [...card.querySelectorAll('*')].forEach(el=>{
        if(el.children.length)return;
        if(/^(?:⏸\s*)?(?:Без\s+ТС|\d+\s+ТС(?:\s+на\s+линии)?)$/i.test((el.textContent||'').trim()))el.remove();
      });
    });
  }

  function findRouteIdInCard(card){
    const direct=card.getAttribute?.('data-route-id')||card.dataset?.routeId;
    if(direct)return String(direct);
    const nodes=[card,...card.querySelectorAll('*')];
    for(const el of nodes){
      for(const attr of ['data-route-id','data-id']){
        const v=el.getAttribute?.(attr);if(v&&routes().some(r=>String(r.id)===String(v)))return String(v);
      }
      const oc=el.getAttribute?.('onclick')||'';
      const m=oc.match(/(?:routeId|route)\s*[:=,]\s*['"]?([^'"\),\s]+)/i);
      if(m&&routes().some(r=>String(r.id)===String(m[1])))return String(m[1]);
    }
    const text=(card.textContent||'').replace(/\s+/g,' ');
    const hit=routes().find(r=>{
      const n=String(r.number??r.routeNumber??'').trim();
      return n && new RegExp('(?:№|\\b)'+n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:\\b|\s)').test(text);
    });
    return hit?String(hit.id):null;
  }

  function addButtons(){
    const list=document.getElementById('routesList');
    if(!list)return;
    const rs=routes();
    if(!rs.length)return;
    const candidates=[...list.children];
    candidates.forEach(card=>{
      if(!(card instanceof HTMLElement))return;
      if(card.querySelector('.bp-add-bus-btn'))return;
      const id=findRouteIdInCard(card);if(!id)return;
      const r=rs.find(x=>String(x.id)===id);if(!r||!isBusAllowed(r))return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='bp-add-bus-btn';btn.textContent='🚌 Добавить автобус';
      btn.style.cssText='display:block;width:100%;margin-top:8px;padding:10px 12px;border:1px solid #16843c;border-radius:9px;background:#eefaf2;color:#126b31;font-weight:800;cursor:pointer;';
      btn.onclick=()=>{location.href='card-wrapper.html?routeId='+encodeURIComponent(id)+'&addBus=1';};
      card.appendChild(btn);
    });
  }

  function fallbackRender(){
    const list=document.getElementById('routesList');
    if(!list||list.children.length)return;
    const rs=routes();
    if(!rs.length){list.innerHTML='<div class="interactive-muted">Маршрутов пока нет.</div>';return;}
    list.innerHTML=rs.map(r=>{
      const t=type(r), st=service(r), can=isBusAllowed(r);
      const typeText=t==='trolleybus'?'🚎 Троллейбус':t==='electrobus'?'⚡ Электробус':'🚌 Автобус';
      const serviceText=st?(' · '+st):'';
      const id=String(r.id).replace(/"/g,'&quot;');
      return '<div class="interactive-card bp-route-fallback" data-route-id="'+id+'" style="margin-top:8px"><b>'+label(r)+'</b><div class="interactive-muted" style="margin-top:4px">'+typeText+serviceText+'</div>'+(can?'<button type="button" class="bp-add-bus-btn" style="display:block;width:100%;margin-top:8px;padding:10px 12px;border:1px solid #16843c;border-radius:9px;background:#eefaf2;color:#126b31;font-weight:800;cursor:pointer" onclick="location.href=\'card-wrapper.html?routeId='+encodeURIComponent(id)+'&addBus=1\'">🚌 Добавить автобус</button>':'')+'</div>';
    }).join('');
  }

  async function ensureSection(){
    const host=document.getElementById('interactive-section-host-routes');
    if(!host)return;
    if(!host.querySelector('#game-section-routes')){
      try{
        const res=await fetch('interactive-routes.html?routefix=1',{cache:'no-store'});
        if(res.ok)host.innerHTML=await res.text();
      }catch(e){}
    }
    const section=host.querySelector('#game-section-routes');
    if(section){section.style.display='block';section.hidden=false;}
    if(typeof window.renderRoutes==='function'){
      try{window.renderRoutes();}catch(e){}
    }
    setTimeout(()=>{fallbackRender();addButtons();removeAssignmentUI();},80);
    setTimeout(()=>{addButtons();removeAssignmentUI();},500);
    setTimeout(()=>{addButtons();removeAssignmentUI();},1500);
  }

  function init(){ensureSection();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('load',init);
  // Никакого MutationObserver: периодическая проверка не зацикливает перерисовку.
  setInterval(()=>{addButtons();removeAssignmentUI();},1200);
})();
