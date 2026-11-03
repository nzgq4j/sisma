// sisma service worker: earthquake alert notifications (Web Push). No caching yet (offline support is build step 10).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let msg = {};
  try { msg = e.data ? e.data.json() : {}; } catch { msg = { title: 'sisma', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(msg.title || 'sisma', {
    body: msg.body || '', tag: msg.tag, renotify: !!msg.tag, data: { url: msg.url || '/app' },
    icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || '/app', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.startsWith(self.location.origin));
    if (open) return open.focus().then(c => (c && 'navigate' in c ? c.navigate(url) : undefined));
    return self.clients.openWindow(url);
  }));
});
