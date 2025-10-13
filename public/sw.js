// Service Worker for PWA and offline support - DISABLED FOR MOBILE STABILITY
// Version v12 - Minimal no-op implementation to prevent errors
const SW_VERSION = 'v12-disabled';
const CACHE_NAME = `verification-app-${SW_VERSION}`;
const OFFLINE_CACHE = `verification-offline-${SW_VERSION}`;

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/auth',
  '/dashboard',
  '/verify',
  '/billing',
  '/profile',
  '/license',
  '/about',
  '/payment-callback',
  '/verification-dashboard',
  '/lighthouse',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// API routes that should work offline
const OFFLINE_FALLBACK_ROUTES = [
  '/api/verify',
  '/api/analytics'
];

// Install event - minimal no-op for safety
self.addEventListener('install', (event) => {
  console.log('Service Worker installing v12 (disabled mode)...');
  event.waitUntil(self.skipWaiting());
});

// Activate event - delete all caches and unregister
self.addEventListener('activate', (event) => {
  console.log('Service Worker v12 activating - cleaning up...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(cacheNames.map(name => caches.delete(name))))
      .then(() => {
        console.log('All caches deleted by v12 - unregistering self');
        return self.registration.unregister();
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - minimal passthrough (no caching)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Special endpoint to report SW version
  if (url.pathname === '/sw-version') {
    event.respondWith(
      new Response(
        JSON.stringify({ 
          version: SW_VERSION, 
          status: 'disabled', 
          message: 'Service Worker v12 is in cleanup mode - will unregister on next activation' 
        }), 
        { headers: { 'Content-Type': 'application/json' } }
      )
    );
    return;
  }

  // Pass through all other requests without caching
  event.respondWith(fetch(request));
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-72x72.png',
    image: data.image,
    data: data.data,
    actions: data.actions,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    tag: data.tag || 'default'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Verification App', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  
  event.notification.close();
  
  const data = event.notification.data;
  let url = '/dashboard';
  
  // Determine URL based on notification type
  if (data) {
    switch (data.type) {
      case 'verification_complete':
      case 'verification_failed':
        url = `/dashboard?verification=${data.verificationId}`;
        break;
      case 'usage_warning':
        url = '/billing';
        break;
      case 'maintenance':
      case 'security':
      case 'update':
        url = '/dashboard';
        break;
    }
  }
  
  // Handle action button clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        url = data?.url || url;
        break;
      case 'dismiss':
        return; // Don't open anything
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync event (for offline queue processing)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-verification') {
    event.waitUntil(processOfflineVerifications());
  }
});

// Process offline verification queue - DISABLED
async function processOfflineVerifications() {
  console.log('Offline verification processing disabled in v12');
  return Promise.resolve();
}

// Message event for communication with main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  const type = event.data && event.data.type;
  if (!type) return;

  if (type === 'SKIP_WAITING') {
    event.waitUntil(
      self.skipWaiting().then(() => {
        // Notify all clients that update is ready
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_READY', version: SW_VERSION });
          });
        });
      })
    );
    return;
  }
  
  if (type === 'CLAIM_CLIENTS') {
    event.waitUntil(self.clients.claim());
    return;
  }

  if (type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).then(() => self.clients.claim())
    );
    return;
  }

  if (type === 'CACHE_VERIFICATION') {
    caches.open(OFFLINE_CACHE)
      .then((cache) => {
        cache.put(
          `/verification/${event.data.id}`,
          new Response(JSON.stringify(event.data.data))
        );
      });
  }
});