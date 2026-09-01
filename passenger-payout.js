/* BUSPHOTO passenger payout add-on. Capacities checked against published specs. */
(function(){
  'use strict';

  // Maximum reliable passenger capacity used by the game for the model.
  // For variants with conflicting figures, prefer the manufacturer's/manual figure
  // or the clearly stated nominal/total passenger capacity rather than a copy-paste value.
  const CAPACITY = {
    'МАЗ-101':123,
    'МАЗ-103':110,
    'МАЗ-104':110,
    'МАЗ-105':175,
    'МАЗ-107':150,
    'МАЗ-152':47,
    'МАЗ-203':102,
    'МАЗ-205':185,
    'МАЗ-206':72,
    'МАЗ-215':183,
    'МАЗ-216':169,
    'МАЗ-226':59,
    'МАЗ-231':71,
    'МАЗ-232':59,
    'МАЗ-241':36,
    'МАЗ-251':53,
    'МАЗ-256':43,
    'МАЗ-257':48,
    'МАЗ-303':110,
    'МАЗ-103Т':110,
    'МАЗ-203Т':102,
    'МАЗ-303Т':110,
    'АКСМ-101':114,
    'БКМ-201':109,
    'БКМ-213':209,
    'БКМ-321':115,
    'БКМ-333':170,
    'БКМ-420':115,
    'БКМ-433':153,
    'БКМ-Е321':97,
    'БКМ-Е433':153
  };

  function cap(v){
    const explicit = Number(v?.passengerCapacity);
    return Number.isFinite(explicit) && explicit > 0
      ? Math.round(explicit)
      : Number(CAPACITY[String(v?.model || '')] || 80);
  }

  function load(c, type){
    // Passenger load is intentionally random on every completed trip.
    // City: weak 15–40%, normal 40–75%, high 70–95%, occasionally 95–100%.
    const r = type === 'intercity' ? [.25,.85] : type === 'suburban' ? [.30,.90] : [.15,.95];
    const peak = Math.random() < 0.08;
    const high = Math.random();
    let lo, hi;
    if (peak) { lo = .95; hi = 1; }
    else if (high < .20) { lo = r[0]; hi = .40; }
    else if (high < .70) { lo = .40; hi = .75; }
    else { lo = .70; hi = r[1]; }
    return Math.min(c, Math.max(0, Math.round(c * (lo + Math.random() * (hi - lo)))));
  }

  function pay(n){
    // Passenger part of the fare: 3 р. per passenger.
    return Math.max(0, Math.round(Number(n) || 0) * 3);
  }

  window.BUSPHOTO_PASSENGER_CAPACITY = CAPACITY;
  window.getPassengerCapacityBUSPHOTO = cap;

  const old = window.processServiceCardPayouts;
  if (typeof old !== 'function') return;

  window.processServiceCardPayouts = function(now){
    const before = JSON.parse(localStorage.getItem('busphoto_interactive_game') || '{}');
    const beforeLog = Array.isArray(before.log) ? before.log.length : 0;
    const result = old.apply(this, arguments);

    try {
      const gs = JSON.parse(localStorage.getItem('busphoto_interactive_game') || '{}');
      const logs = Array.isArray(gs.log) ? gs.log : [];
      const newCount = Math.max(0, logs.length - beforeLog);
      let extra = 0;
      let changed = false;

      // New arrival records are stored newest-first, so inspect only the records
      // created by this payout pass. This fixes the old bug where only the first
      // few historical records could receive passenger money.
      logs.slice(0, newCount).forEach(e => {
        if (!e || e.type !== 'route-arrival' || e.passengerPayoutApplied) return;
        const v = (gs.owned || []).find(x => String(x.model || '') === String(e.vehicleModel || ''));
        if (!v) return;

        const c = cap(v);
        const n = load(c, v.serviceType || 'city');
        const p = pay(n);

        e.passengers = n;
        e.passengerCapacity = c;
        e.passengerPayout = p;
        e.passengerPayoutApplied = true;
        e.total = Number(e.total || 0) + p;
        e.details = (e.details || []).concat([`👥 Пассажиры: ${n}/${c} · +${p} р.`]);

        extra += p;
        changed = true;

        v.lastPassengerCount = n;
        v.passengerCapacity = c;
        v.stats = v.stats || {};
        v.stats.passengers = Number(v.stats.passengers || 0) + n;
        v.stats.passengerEarnings = Number(v.stats.passengerEarnings || 0) + p;
        v.stats.earned = Number(v.stats.earned || 0) + p;
      });

      if (changed) {
        gs.balance = Number(gs.balance || 0) + extra;
        localStorage.setItem('busphoto_interactive_game', JSON.stringify(gs));
        window.dispatchEvent(new Event('busphoto-passenger-payout'));
        if (typeof window.renderInteractiveHeaderAndLightViews === 'function') window.renderInteractiveHeaderAndLightViews();
        if (typeof window.renderHistorySection === 'function') window.renderHistorySection();
      }

      return Number(result || 0) + extra;
    } catch (err) {
      console.warn('[BUSPHOTO passenger payout]', err);
      return result;
    }
  };
})();
