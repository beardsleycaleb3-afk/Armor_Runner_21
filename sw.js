const CACHE_NAME = 'dbm-runner-v1';
const assets = [
  '/',
  'index.html',
  'manifest.json',
  'icon_192.jpg',
  // Runner Animations
  'assets/runner/hs1.gif',
  'assets/runner/hs_invincible.gif',
  'assets/runner/hurdle1.gif',
  'assets/runner/pro_tuck1.gif',
  'assets/runner/hurdle_pro.gif',
  // Defenders
  'assets/defenders/d1.png',
  'assets/defenders/d2.jpeg',
  'assets/defenders/d3.png',
  'assets/defenders/d4.jpeg',
  // Collectibles
  'assets/powerups/powerups.png',
  'assets/items/item.png',
  // Backdrops (1-8)
  ...Array.from({ length: 8 }, (_, i) => `assets/backdrops/${i + 1}.jpeg`),
  // Endzones (0-7)
  ...Array.from({ length: 8 }, (_, i) => `assets/endzones/endzone${i}.png`),
  // Grass (0-8)
  ...Array.from({ length: 9 }, (_, i) => `assets/grass/grass${i}.png`)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => {
      return res || fetch(event.request);
    })
  );
});

// Clean up old caches when version updates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});
