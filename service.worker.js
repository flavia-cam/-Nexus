const CACHE_NAME = 'nexus-finance-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/transacoes.html',
  '/orcamento.html',
  '/metas.html',
  '/contas.html',
  '/relatorios.html',
  '/configuracoes.html',
  '/style.css',
  '/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
    .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );
});