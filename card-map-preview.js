(function(){
'use strict';
let baseSelect=null;
function clear(){if(typeof mapState==='undefined')return;(mapState.cardPreviewLayers||[]).forEach(x=>{try{x.remove()}catch(e){}});mapState.cardPreviewLayers=[]}
function show(routeId,vehicleId){
 if(typeof mapState==='undefined'||!mapState.map||typeof gameState==='undefined')return;
 const route=gameState.routes.find(r=>String(r.id)===String(routeId)); if(!route)return;
 clear();
 if(baseSelect)baseSelect(route.id);
 const v=gameState.owned.find(x=>String(x.id)===String(vehicleId));
 const depot=typeof DEPOTS!=='undefined'?(DEPOTS[v?.category]||DEPOTS[route.routeType==='trolleybus'?'trolleybus':'bus']):null; if(!depot)return;
 const ls=[];
 if(route.outboundGeometry)ls.push(L.geoJSON(route.outboundGeometry,{style:{color:'#145a32',weight:6,opacity:.92,dashArray:'10 7'}}).addTo(mapState.map));
 if(route.returnGeometry)ls.push(L.geoJSON(route.returnGeometry,{style:{color:'#145a32',weight:6,opacity:.92,dashArray:'4 8'}}).addTo(mapState.map));
 const terms=typeof getRouteTerminals==='function'?getRouteTerminals(route):[];
 const pt=id=>typeof endIdPoint==='function'?endIdPoint(route,id):null;
 const a=pt(terms[0]?.id),b=pt(terms[terms.length-1]?.id);
 ls.push(L.marker([depot.lat,depot.lon]).addTo(mapState.map).bindPopup(`<b>🏠 ${escapeHtml(depot.name)}</b><br>${escapeHtml(depot.address||'')}`));
 if(a)ls.push(L.circleMarker(a,{radius:8,weight:3,color:'#145a32',fillOpacity:.95}).addTo(mapState.map).bindPopup(`<b>🚏 Начало маршрута №${escapeHtml(route.number)}</b><br>${escapeHtml(terms[0]?.name||route.start||'—')}${route.outboundDuration?`<br>🏠 → 🚏 ${formatDuration(route.outboundDuration)}`:''}`));
 if(b)ls.push(L.circleMarker(b,{radius:8,weight:3,color:'#145a32',fillOpacity:.95}).addTo(mapState.map).bindPopup(`<b>🏁 Конечная маршрута №${escapeHtml(route.number)}</b><br>${escapeHtml(terms[terms.length-1]?.name||route.end||'—')}${route.returnDuration?`<br>🚏 → 🏠 ${formatDuration(route.returnDuration)}`:''}`));
 mapState.cardPreviewLayers=ls;
 const rl=mapState.routeLayers?.get(String(route.id)); const bounds=L.featureGroup(ls.concat(rl?[rl]:[])).getBounds(); if(bounds.isValid())mapState.map.fitBounds(bounds,{padding:[28,28],maxZoom:14});
 if(typeof mapSetStatus==='function')mapSetStatus(`🗺️ Парк → №${route.number} → парк · до линии: ${route.outboundDuration?formatDuration(route.outboundDuration):'не рассчитано'} · обратно: ${route.returnDuration?formatDuration(route.returnDuration):'не рассчитано'}`);
}
function wrap(){
 if(typeof selectRouteForMap!=='function'||window.__BUSPHOTO_ROUTE_WRAP__)return;
 window.__BUSPHOTO_ROUTE_WRAP__=true; baseSelect=selectRouteForMap;
 window.selectRouteForMap=function(routeId){baseSelect(routeId);setTimeout(()=>{if(routeId&&mapState.map)show(routeId,null)},100)};
}
window.BUSPHOTOShowCardRoutePreview=show;window.BUSPHOTOClearCardRoutePreview=clear;
setTimeout(wrap,0);setTimeout(wrap,500);setTimeout(wrap,1500);
})();
