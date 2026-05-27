const CACHE_NAME = 'panel-turnos-v1';

const PRECACHE_URLS = [
  '/index.html',
  '/manifest.json',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@500;600;700&display=swap',
  'https://fonts.gstatic.com',
  // Phosphor Icons
  'https://unpkg.com/@phosphor-icons/web',
  // Supabase JS
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  // SweetAlert2
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  // Flatpickr CSS
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  // Flatpickr JS
  'https://cdn.jsdelivr.net/npm/flatpickr',
  // Flatpickr locale ES
  'https://npmcdn.com/flatpickr/dist/l10n/es.js'
];

// ── Install: pre-cache all static assets ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache individual URLs, ignoring failures so a single CDN hiccup
      // doesn't break the whole install.
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] No se pudo cachear:', url, err)
          )
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network first, fallback to cache ───────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Siempre dejar pasar requests a supabase.co directamente a la red
  if (url.hostname.includes('supabase.co')) {
    return; // No interceptar
  }

  // Solo manejar requests GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Si la respuesta de red es válida, guardarla en cache y devolverla
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Red falló → intentar desde cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Último recurso: si es navegación, devolver el HTML principal
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // Sin cache disponible
          return new Response('Sin conexión y sin cache disponible.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
