const CACHE_NAME = 'gastos-v1';

// Estrategia: Solo red, pero necesario para cumplir requisitos PWA
self.addEventListener('fetch', (event) => {
  // Chrome requiere que haya un listener de fetch para habilitar el botón de instalación
  event.respondWith(fetch(event.request).catch(() => {
      return new Response("Estás sin conexión.");
  }));
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});
