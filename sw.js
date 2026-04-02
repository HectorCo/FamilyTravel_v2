const CACHE_NAME = 'gastos-v2';

const ASSETS_TO_CACHE = [
    './index.html',
    './icon.png',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap',
];

// Al instalar: precachear todos los assets estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

// Al activar: limpiar cachés antiguas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Estrategia por tipo de petición:
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Firebase (Firestore, Auth) → siempre red. Firestore maneja su propio caché offline.
    if (url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('google.apis') ||
        url.hostname.includes('identitytoolkit')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Fuentes de Google → cache-first
    if (url.hostname.includes('fonts.g')) {
        event.respondWith(
            caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                return res;
            }))
        );
        return;
    }

    // Todo lo demás (HTML, assets, CDNs) → cache-first, red como fallback
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(res => {
                // Cachear respuestas válidas dinámicamente
                if (res && res.status === 200 && res.type !== 'opaque') {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                }
                return res;
            }).catch(() => {
                // Si es una navegación y no hay red, devolver index.html del caché
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
