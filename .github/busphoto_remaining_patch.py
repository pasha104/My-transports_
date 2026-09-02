from pathlib import Path

# Card compatibility and search binding
p=Path('creating_card.html')
s=p.read_text(encoding='utf-8')
old="function compatible(v,r){return !v||!r||v.category===r.routeType||(v.category==='bus'&&r.routeType==='bus')}"
new="""function compatible(v,r){
if(!v||!r)return false;
const cat=String(v.category||'bus').toLowerCase();
const type=String(r.routeType||'bus').toLowerCase();
const service=String(r.routeServiceType||r.serviceType||'city').toLowerCase();
if(type==='trolleybus') return cat==='trolleybus'||cat==='bus';
if(type==='electrobus') return cat==='electrobus'&&(service==='city'||service==='suburban');
return cat==='bus'&&(service==='city'||service==='suburban'||service==='intercity');
}"""
if old not in s:
    raise SystemExit('creating_card compatible target not found')
s=s.replace(old,new,1)
s=s.replace("d.querySelector('.route-search').oninput=", "d.querySelector('.routeSearch').oninput=",1)
p.write_text(s,encoding='utf-8')

# Interactive catalog, map route classes, and route compatibility
p=Path('busphoto-interactive.js')
s=p.read_text(encoding='utf-8')
old='"БКМ-Е433": { price: 90000, salary: [12000, 15000] }\n            }'
new='"БКМ-Е433": { price: 90000, salary: [12000, 15000] },\n                "БКМ-Е350": { price: 110000, salary: [10000, 14000], capacity: 53, seats: 42, rangeKm: 100, maxSpeedKmh: 90, motorKw: 220 }\n            }'
if old not in s:
    raise SystemExit('interactive E433 catalog target not found')
s=s.replace(old,new,1)
old="""function updateBusRouteClassVisibility(){
            const type=document.getElementById('mapRouteType')?.value || 'bus';
            const el=document.getElementById('mapBusRouteClass');
            if(el) el.style.display=type==='bus'?'block':'none';
        }"""
new="""function updateBusRouteClassVisibility(){
            const type=document.getElementById('mapRouteType')?.value || 'bus';
            const el=document.getElementById('mapBusRouteClass');
            if(!el) return;
            const wanted=type==='electrobus'?['city','suburban']:['city','suburban','intercity'];
            el.style.display=(type==='bus'||type==='electrobus')?'block':'none';
            const labels={city:'🏙️ Городской',suburban:'🏘️ Пригородный',intercity:'🛣️ Междугородний'};
            const current=el.value;
            el.innerHTML=wanted.map(v=>`<option value="${v}">${labels[v]}</option>`).join('');
            el.value=wanted.includes(current)?current:'city';
        }"""
if old not in s:
    raise SystemExit('interactive class visibility target not found')
s=s.replace(old,new,1)
old="const routeServiceType = type==='bus' ? (document.getElementById('mapBusRouteClass')?.value || 'city') : 'city';"
new="const routeServiceType = (type==='bus'||type==='electrobus') ? (document.getElementById('mapBusRouteClass')?.value || 'city') : 'city';"
if old not in s:
    raise SystemExit('interactive map route service target not found')
s=s.replace(old,new,1)
old="const service=type==='bus'?(document.getElementById('mapBusRouteClass')?.value||'city'):'city';"
new="const service=(type==='bus'||type==='electrobus')?(document.getElementById('mapBusRouteClass')?.value||'city'):'city';"
if old not in s:
    raise SystemExit('interactive GPX service target not found')
s=s.replace(old,new,1)
old="if (route.routeType === 'bus') { const cls=document.getElementById('mapBusRouteClass')?.value; if (GAME_SERVICE_TYPES[cls]) route.routeServiceType=cls; }"
new="if (route.routeType === 'bus' || route.routeType === 'electrobus') { const cls=document.getElementById('mapBusRouteClass')?.value; if (GAME_SERVICE_TYPES[cls] && !(route.routeType==='electrobus' && cls==='intercity')) route.routeServiceType=cls; }"
if old not in s:
    raise SystemExit('interactive save route class target not found')
s=s.replace(old,new,1)
old="""        function vehicleCompatibleWithRoute(vehicle, route) {
            if (!vehicle || !route) return false;
            if (route.routeType === 'trolleybus') return vehicle.category === 'trolleybus';
            if (route.routeType === 'electrobus') return vehicle.category === 'electrobus';
            return vehicle.category === 'bus';
        }"""
new="""        function vehicleCompatibleWithRoute(vehicle, route) {
            if (!vehicle || !route) return false;
            const cat=String(vehicle.category||'').toLowerCase();
            const type=String(route.routeType||'bus').toLowerCase();
            const service=String(route.routeServiceType||route.serviceType||'city').toLowerCase();
            if (type === 'trolleybus') return cat === 'trolleybus' || cat === 'bus';
            if (type === 'electrobus') return cat === 'electrobus' && (service === 'city' || service === 'suburban');
            return cat === 'bus' && (service === 'city' || service === 'suburban' || service === 'intercity');
        }"""
if old not in s:
    raise SystemExit('interactive vehicle compatibility target not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

# Passenger capacity for E350
p=Path('passenger-system.js')
s=p.read_text(encoding='utf-8')
old="'МАЗ-303Е':90,'МАЗ-305Е':120,'БКМ-Е321':97,'БКМ-Е433':153"
new="'МАЗ-303Е':90,'МАЗ-305Е':120,'БКМ-Е321':97,'БКМ-Е433':153,'БКМ-Е350':53"
if old not in s:
    raise SystemExit('passenger E350 capacity target not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

print('Patch applied successfully')
