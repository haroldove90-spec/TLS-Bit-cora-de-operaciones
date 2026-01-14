
const CACHE_NAME = 'tls-logbook-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://tritex.com.mx/tlslogo.png',
  'https://tritex.com.mx/tlsicono.png'
];

// Instalación: Cachear recursos estáticos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-cacheando recursos críticos');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: Limpiar versiones antiguas de cache para evitar conflictos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Eliminando cache antiguo', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de Fetch mejorada
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Estrategia Network-First para el documento principal (index.html)
  // Esto evita que la app se quede "trabada" en una versión vieja o rota.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 2. Estrategia Cache-First para librerías externas y activos pesados (esm.sh, fonts, unpkg)
  if (url.hostname.includes('esm.sh') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('unpkg.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        });
      })
    );
    return;
  }

  // 3. Estrategia Stale-While-Revalidate para todo lo demás
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => null);

      return cached || networked;
    })
  );
});

// Manejo de notificaciones push (si se integran en el futuro)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
