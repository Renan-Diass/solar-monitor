const ROOT = new URL('./', self.location.href);
const CACHE = 'solar-shell-v2-' + ROOT.pathname;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([ROOT.href, new URL('icon.svg', ROOT).href, new URL('manifest.webmanifest', ROOT).href])));
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Nunca intercepta/cacheia API, login ou origens externas.
  if (event.request.method !== 'GET' || event.request.headers.has('Authorization') || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.searchParams.has('code') || url.searchParams.has('state')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(ROOT.href)));
  } else if (url.pathname.startsWith(new URL('assets/', ROOT).pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache => {
      const saved = await cache.match(event.request);
      if (saved) return saved;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    }));
  }
});
