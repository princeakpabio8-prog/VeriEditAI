// Service Worker for PWA and offline support - Force mobile updates
const SW_VERSION = 'v7';
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
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// API routes that should work offline
const OFFLINE_FALLBACK_ROUTES = [
  '/api/verify',
  '/api/analytics'
];

// Install event - cache static assets and force immediate activation
self.addEventListener('install', (event) => {
  console.log('Service Worker installing v6 - force mobile updates...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('Setting up offline cache');
        return cache.put('/offline.html', new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Offline - Verification App</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
                .offline { color: #666; max-width: 400px; margin: 0 auto; }
                .icon { font-size: 4rem; margin-bottom: 1rem; }
              </style>
            </head>
            <body>
              <div class="offline">
                <div class="icon">📡</div>
                <h1>You're Offline</h1>
                <p>This page isn't available offline. Please check your internet connection and try again.</p>
                <button onclick="window.location.reload()">Try Again</button>
              </div>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        }));
      })
    ]).then(() => {
      // Force immediate activation to replace old service workers
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches and immediately take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating v6...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker taking control of all clients...');
      // Force all clients to use new service worker immediately
      return self.clients.claim();
    }).then(() => {
      // Notify all clients to reload for latest updates on mobile
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: 'v6' });
        });
      });
    })
  );
});

// Fetch event - smarter strategy to avoid stale HTML
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Special endpoint to report SW version
  if (url.pathname === '/sw-version') {
    event.respondWith(new Response(JSON.stringify({ version: SW_VERSION, cacheName: CACHE_NAME, offlineCache: OFFLINE_CACHE }), { headers: { 'Content-Type': 'application/json' } }));
    return;
  }

  // Network-first for navigations (HTML) to prevent stale UI
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (err) {
        // Fallback to any cached page or offline page
        const cached = await caches.match(request);
        if (cached) return cached;
        return caches.match('/offline.html');
      }
    })());
    return;
  }

  // Cache-first for other same-origin GET requests with background update
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
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

// Process offline verification queue
async function processOfflineVerifications() {
  try {
    const cache = await caches.open(SW_VERSION);
    const keys = await cache.keys();
    
    for (const request of keys) {
      if (request.url.includes('offline-verification-')) {
        const response = await cache.match(request);
        if (response) {
          const verificationData = await response.json();
          
          // Skip if missing required fields
          if (!verificationData.content && !verificationData.imageBase64) {
            console.log('Skipping verification with missing content');
            await cache.delete(request);
            continue;
          }
          
          try {
            // Determine which function to call based on content type
            const isImage = verificationData.contentType === 'image' || verificationData.imageBase64;
            const functionName = isImage ? 'image-verify' : 'verify';
            const functionUrl = `https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/${functionName}`;
            
            const result = await fetch(functionUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxdGtremRzd3hhenlpa2NoZWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDM1NDEsImV4cCI6MjA3MzA3OTU0MX0.1vQ2RDB5dgsmUwfiy9KeVuS0P6gHlKSAUsMVo5-5vto`
              },
              body: JSON.stringify(verificationData)
            });
            
            if (result.ok) {
              // Success - remove from cache and store result
              await cache.delete(request);
              const resultData = await result.json();
              await cache.put(
                new Request(`verification-result-${verificationData.id}`),
                new Response(JSON.stringify(resultData))
              );
            }
          } catch (error) {
            console.log('Failed to sync verification:', error);
            // Keep in cache for retry
          }
        }
      }
    }
      
      // Update the queue
      await cache.put('/offline-queue', new Response(JSON.stringify(queue)));
    }
  } catch (error) {
    console.error('Error processing offline verifications:', error);
  }
}

// Message event for communication with main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  const type = event.data && event.data.type;
  if (!type) return;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
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