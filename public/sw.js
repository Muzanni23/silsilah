// Basic Service Worker to enable PWA installability
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through for now
});
