// Service Worker Oficial de CogniMirror (Modo Offline PWA)
const CACHE_NAME = 'cognimirror-offline-v3';

// Recursos críticos y páginas para pre-cachear al instalar
const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/reaction-game',
  '/simon-game',
  '/evaluador',
  '/remote-eval',
  '/defensa',
  '/export',
  '/manifest.json',
  '/icon.svg',
  '/logo.png',
  '/logo-corfo.png',
  '/models/brain.obj',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usar Promise.allSettled para que si un recurso opcional falla no impida la instalación
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url)
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
            .catch((err) => {
              console.warn('[SW Precache] Omitido recurso no disponible al instalar:', url, err);
            })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Eliminando caché obsoleta:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar peticiones GET
  if (request.method !== 'GET') return;

  // No interceptar peticiones internas de Chrome Extensions ni esquemas no HTTP(S)
  if (!url.protocol.startsWith('http')) return;

  // Peticiones a Supabase o endpoints de API: Network First (sin cachear errores)
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline', message: 'Sin conexión a Internet' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Peticiones de Navegación (HTML de páginas): Network First con fallback a Caché
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[SW] Modo offline: Sirviendo página desde caché para:', request.url);
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          
          // Intentar coincidencia sin searchParams
          const cleanUrl = url.origin + url.pathname;
          const cleanCached = await caches.match(cleanUrl);
          if (cleanCached) return cleanCached;

          // Si no está la ruta específica, devolver la raíz o fallback
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;

          return new Response(
            `<!DOCTYPE html>
            <html lang="es" class="dark">
              <head>
                <meta charset="utf-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <title>CogniMirror - Modo Fuera de Línea</title>
                <style>
                  body { background: #07080f; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                  .card { background: rgba(255,255,255,0.05); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); max-width: 400px; }
                  h1 { font-size: 20px; margin-bottom: 10px; color: #a855f7; }
                  p { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.5; }
                  button { margin-top: 20px; padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>CogniMirror (Offline)</h1>
                  <p>Estás en modo sin conexión. Tus pruebas y datos locales están resguardados en este dispositivo.</p>
                  <button onclick="window.location.reload()">Reintentar Conexión</button>
                </div>
              </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Recursos estáticos (_next, chunks JS, CSS, imágenes, fuentes, CDNs): Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si falla la red y no hay caché, no hacer nada
        });

      return cachedResponse || fetchPromise;
    })
  );
});
