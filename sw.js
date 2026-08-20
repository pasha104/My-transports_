// BUSPHOTO cleanup worker.
// The project no longer uses a Service Worker. If an older version is still
// registered at this origin, this worker clears old caches and unregisters itself.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    } finally {
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => client.postMessage({ type: 'BUSPHOTO_CACHE_CLEARED' }));
    }
  })());
});
