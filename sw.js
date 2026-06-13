// ============================================================================
// SERVICE WORKER - Running Back Rising
// Handles caching, offline support, and background sync
// ============================================================================

const CACHE_NAME = 'running-back-rising-v1.1';
const ASSETS_CACHE = 'running-back-rising-assets-v1.1';
const RUNTIME_CACHE = 'running-back-rising-runtime-v1.1';

const urlsToCache = [
  '/',
  '/index.html',
  '/js/game.js',
  '/js/modules.js',
  '/js/config.js',
  '/manifest.json',
  '/assets/icon_192.jpg'
];

// ============================================================================
// INSTALL - Cache essential assets
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching essential files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache install failed:', error);
      })
  );
  
  // Force immediate activation
  self.skipWaiting();
});

// ============================================================================
// ACTIVATE - Clean up old caches
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old versions
          if (cacheName !== CACHE_NAME && 
              cacheName !== ASSETS_CACHE && 
              cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control immediately
  self.clients.claim();
});

// ============================================================================
// FETCH - Network-first with fallback to cache
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.includes('/js/') || url.pathname.includes('/manifest.json')) {
    // Cache-first for JavaScript and manifest
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              
              // Clone and cache the response
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
              
              return response;
            })
            .catch(() => {
              // Return cached version if offline
              return caches.match(request);
            });
        })
    );
  } else {
    // Network-first for HTML and other assets
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          
          // Cache successful responses
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request)
            .then((response) => {
              if (response) {
                return response;
              }
              
              // Return offline page if available
              if (request.destination === 'document') {
                return caches.match('/index.html');
              }
            });
        })
    );
  }
});

// ============================================================================
// MESSAGE - Handle messages from the main app
// ============================================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CLEAR_CACHE':
      console.log('[Service Worker] Clearing cache');
      caches.keys().then((cacheNames) => {
        Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      });
      event.ports[0].postMessage({ success: true });
      break;
      
    case 'GET_CACHE_SIZE':
      console.log('[Service Worker] Getting cache size');
      let totalSize = 0;
      caches.keys().then((cacheNames) => {
        Promise.all(
          cacheNames.map((cacheName) => {
            return caches.open(cacheName).then((cache) => {
              return cache.keys().then((requests) => {
                return Promise.all(
                  requests.map((request) => {
                    return cache.match(request).then((response) => {
                      if (response) {
                        const headers = response.headers;
                        const contentLength = headers.get('content-length');
                        if (contentLength) {
                          totalSize += parseInt(contentLength, 10);
                        }
                      }
                    });
                  })
                );
              });
            });
          })
        ).then(() => {
          event.ports[0].postMessage({ 
            success: true, 
            size: totalSize,
            sizeInMB: (totalSize / 1024 / 1024).toFixed(2)
          });
        });
      });
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    default:
      console.log('[Service Worker] Unknown message type:', type);
  }
});

// ============================================================================
// PUSH NOTIFICATIONS - Ready for future implementation
// ============================================================================

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Running Back Rising notification',
    icon: '/assets/icon_192.jpg',
    badge: '/assets/icon_192.jpg',
    tag: 'running-back-rising',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open Game'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Running Back Rising', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if game window already open
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if not found
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// ============================================================================
// BACKGROUND SYNC - Ready for future implementation
// ============================================================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(
      // Sync leaderboard scores with server when online
      fetch('/api/sync-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      })
      .then((response) => {
        if (response.ok) {
          console.log('[Service Worker] Score sync successful');
        }
      })
      .catch((error) => {
        console.error('[Service Worker] Score sync failed:', error);
        throw error; // Retry later
      })
    );
  }
});

console.log('[Service Worker] Loaded and ready');
