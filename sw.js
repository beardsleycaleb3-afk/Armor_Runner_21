// ============================================================================
// SERVICE WORKER - Running Back Rising
// Handles caching, offline support, and background sync
// v1.3- Updated with audio & power-ups modules
// ============================================================================

const CACHE_VERSION = 'v1.3';
const CACHE_NAME = `running-back-rising-${CACHE_VERSION}`;
const ASSETS_CACHE = `running-back-rising-assets-${CACHE_VERSION}`;
const RUNTIME_CACHE = `running-back-rising-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `running-back-rising-images-${CACHE_VERSION}`;

const urlsToCache = [
  '/',
  '/index.html',
  '/js/game.js',
  '/js/modules.js',
  '/js/config.js',
  '/js/audio.js',
  '/js/powerups.js',
  '/js/visual-polish.js',
  '/manifest.json',
  '/sw.js',
  '/assets/icon_192.jpg'
];

// ============================================================================
// INSTALL - Cache essential assets
// ============================================================================

self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing ${CACHE_VERSION}...`);
  
  event.waitUntil(
    Promise.all([
      // Cache core files
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching essential files');
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn('[Service Worker] Some files failed to cache (may be offline):', error);
          // Continue even if some files fail - fallback to network
          return Promise.resolve();
        });
      }),
      // Pre-open other caches
      caches.open(ASSETS_CACHE),
      caches.open(RUNTIME_CACHE),
      caches.open(IMAGE_CACHE)
    ])
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
          // Keep only current version caches
          if (cacheName !== CACHE_NAME && 
              cacheName !== ASSETS_CACHE && 
              cacheName !== RUNTIME_CACHE &&
              cacheName !== IMAGE_CACHE &&
              cacheName.includes('running-back-rising')) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control immediately
  self.clients.claim();
  
  // Notify clients that SW is ready
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'SW_READY' });
    });
  });
  
  console.log('[Service Worker] Ready for offline use');
});

// ============================================================================
// FETCH - Intelligent caching strategy
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
  
  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Define caching strategies based on content type
  const path = url.pathname;
  
  // JavaScript files - Cache-first (fast but update every 60 seconds)
  if (path.endsWith('.js')) {
    return event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            
            return response;
          })
          .catch(() => caches.match(request))
      })
    );
  }
  
  // Images - Cache-first with long expiry
  if (path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    return event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
            
            return response;
          })
          .catch(() => {
            // Return placeholder or cached version
            return caches.match(request);
          })
      })
    );
  }
  
  // Manifest and other assets - Cache-first
  if (path.includes('.json') || path.includes('.xml')) {
    return event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            
            return response;
          })
          .catch(() => caches.match(request))
      })
    );
  }
  
  // HTML files - Network-first (always try to get latest)
  if (path.endsWith('/') || path.endsWith('.html')) {
    return event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match('/index.html');
          });
        })
    );
  }
  
  // Default - Network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ============================================================================
// MESSAGE - Handle messages from the main app
// ============================================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  console.log('[Service Worker] Message received:', type);
  
  switch (type) {
    case 'CLEAR_CACHE':
      console.log('[Service Worker] Clearing all caches');
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.includes('running-back-rising')) {
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true, cleared: true });
        }
      });
      break;
      
    case 'GET_CACHE_SIZE':
      console.log('[Service Worker] Getting cache size');
      let totalSize = 0;
      caches.keys().then((cacheNames) => {
        return Promise.all(
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
        );
      }).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ 
            success: true, 
            size: totalSize,
            sizeInMB: (totalSize / 1024 / 1024).toFixed(2)
          });
        }
      });
      break;
      
    case 'SKIP_WAITING':
      console.log('[Service Worker] Skipping wait period');
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ version: CACHE_VERSION });
      }
      break;
      
    default:
      console.log('[Service Worker] Unknown message type:', type);
  }
});

// ============================================================================
// PUSH NOTIFICATIONS - Ready for future implementation
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  if (!event.data) {
    console.warn('[Service Worker] Push event without data');
    return;
  }
  
  try {
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
  } catch (error) {
    console.error('[Service Worker] Push notification error:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
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
  console.log('[Service Worker] Background sync event:', event.tag);
  
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
          console.log('[Service Worker] ✅ Score sync successful');
        }
      })
      .catch((error) => {
        console.error('[Service Worker] ❌ Score sync failed:', error);
        throw error; // Retry later
      })
    );
  }
});

// ============================================================================
// LOGGING
// ============================================================================

console.log(`[Service Worker] ${CACHE_VERSION} loaded and ready for offline use`);
console.log('[Service Worker] Caching strategy: JS=cache-first, HTML=network-first, Images=cache-first');
