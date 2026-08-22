// BUSPHOTO compatibility worker: unregister old workers without deleting application caches.
self.addEventListener('install',event=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.registration.unregister()));
