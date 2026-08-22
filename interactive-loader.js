/* BUSPHOTO Interactive modular loader v75
 * Fixes: repeated section loading, map-section race, stale cached fragments.
 */
(function(){
  'use strict';

  // The loader can be encountered more than once after GitHub Pages/browser cache
  // updates. Only the first instance is allowed to own the hosts.
  if (window.__BUSPHOTO_INTERACTIVE_LOADER_V75__) return;
  window.__BUSPHOTO_INTERACTIVE_LOADER_V75__ = true;

  const VERSION = '20260822-v75';
  const sections = [
    ['menu','interactive-menu.html','interactive-menu-host'],
    ['map','interactive-map.html','interactive-section-host-map'],
    ['shop','interactive-shop.html','interactive-section-host-shop'],
    ['garage','interactive-garage.html','interactive-section-host-garage'],
    ['finance','interactive-finance.html','interactive-section-host-finance'],
    ['history','interactive-history.html','interactive-section-host-history'],
    ['routes','interactive-routes.html','interactive-section-host-routes'],
    ['dispatch','interactive-dispatch.html','interactive-section-host-dispatch'],
    ['stats','interactive-stats.html','interactive-section-host-stats'],
    ['maintenance','interactive-maintenance.html','interactive-section-host-maintenance'],
    ['rules','interactive-rules.html','interactive-rules-host']
  ];

  const byName = Object.fromEntries(sections.map(x => [x[0], x]));
  const loaded = new Set();
  const loading = new Map();

  function status(text, error){
    const el = document.getElementById('interactiveLoadingStatus');
    if (!el) return;
    el.textContent = text;
    el.style.display = '';
    el.style.borderColor = error ? '#d32f2f' : '';
  }

  async function loadOne(name){
    const item = byName[name];
    if (!item) return false;
    if (loaded.has(name)) return true;
    if (loading.has(name)) return loading.get(name);

    const [, file, hostId] = item;
    const promise = (async () => {
      const host = document.getElementById(hostId);
      if (!host) throw new Error('Host not found: ' + hostId);

      // Replace, never append. This makes retries idempotent and prevents duplicate
      // Rules/cards/sections after a partial reload.
      host.replaceChildren();

      const r = await fetch(file + '?v=' + VERSION, {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      if (!r.ok) throw new Error(file + ' HTTP ' + r.status);

      const html = await r.text();
      host.innerHTML = html;
      loaded.add(name);
      return true;
    })();

    loading.set(name, promise);
    try {
      return await promise;
    } finally {
      loading.delete(name);
    }
  }

  // Menu buttons use this wrapper. It also works if a user taps a button while the
  // modular files are still loading.
  window.openInteractiveSection = async function(section, btn){
    try {
      if (typeof window.showGameSection === 'function') {
        window.showGameSection(section, btn);
        return;
      }
      window.__BUSPHOTO_PENDING_SECTION__ = {section, btn};
      await loadOne(section);
      if (typeof window.showGameSection === 'function') {
        const pending = window.__BUSPHOTO_PENDING_SECTION__;
        window.__BUSPHOTO_PENDING_SECTION__ = null;
        window.showGameSection(pending?.section || section, pending?.btn || btn);
      }
    } catch (e) {
      console.error('[BUSPHOTO] section open error', section, e);
      status('Не удалось открыть раздел «' + section + '». Обнови страницу.', true);
    }
  };

  window.BUSPHOTOEnsureInteractiveSection = loadOne;

  async function start(){
    try {
      status('Загрузка интерактива…');

      // Load menu/map/rules first. The map is intentionally first so its DOM always
      // exists before busphoto-interactive.js starts its lazy map initialization.
      await Promise.all(['menu','map','rules'].map(loadOne));
      await Promise.all(sections.map(x => loadOne(x[0])));

      status('Интерактив готов');

      if (!document.querySelector('script[data-busphoto-interactive-main]')) {
        const s = document.createElement('script');
        s.dataset.busphotoInteractiveMain = '1';
        s.src = 'busphoto-interactive.js?v=' + VERSION;
        s.onload = () => {
          const e = document.getElementById('interactiveLoadingStatus');
          if (e) e.style.display = 'none';

          const pending = window.__BUSPHOTO_PENDING_SECTION__;
          if (pending && typeof window.showGameSection === 'function') {
            window.__BUSPHOTO_PENDING_SECTION__ = null;
            window.showGameSection(pending.section, pending.btn);
          }
        };
        s.onerror = () => status('Не удалось загрузить интерактивный модуль. Проверь busphoto-interactive.js.', true);
        document.head.appendChild(s);
      }
    } catch(e) {
      console.error('[BUSPHOTO] sections load error', e);
      status('Ошибка загрузки разделов. Обнови страницу.', true);
    }
  }

  function boot(){
    if (window.__BUSPHOTO_INTERACTIVE_STARTED_V75__) return;
    window.__BUSPHOTO_INTERACTIVE_STARTED_V75__ = true;
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
