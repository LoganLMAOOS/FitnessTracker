const CACHE_NAME = 'fittrack-cache-v1';

// Resources to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg'
];

// Install the service worker and cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercept network requests and serve from cache if available
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if response is valid
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a one-time use stream
          const responseToCache = response.clone();
          
          // Cache the response for future use
          caches.open(CACHE_NAME)
            .then(cache => {
              // Only cache GET requests
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
            });
            
          return response;
        });
      })
  );
});

// Clean up old caches when a new service worker is activated
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches that aren't in the whitelist
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const notification = event.data.json();
  
  const options = {
    body: notification.body,
    icon: '/icon-192x192.svg',
    badge: '/icon-192x192.svg',
    vibrate: [100, 50, 100],
    data: {
      url: notification.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('FitTrack', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync offline data when back online
self.addEventListener('sync', event => {
  if (event.tag === 'sync-workouts') {
    event.waitUntil(syncWorkoutData());
  }
});

async function syncWorkoutData() {
  // Get workouts from IndexedDB that need to be synced
  const workoutsToSync = await getUnsyncdWorkoutsFromIDB();
  
  // Sync each workout
  for (const workout of workoutsToSync) {
    try {
      await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workout)
      });
      
      // Update local storage after successful sync
      await markWorkoutAsSynced(workout.id);
    } catch (error) {
      console.error('Failed to sync workout:', error);
    }
  }
}

// These functions would be implemented to use IndexedDB
function getUnsyncdWorkoutsFromIDB() {
  // Placeholder - would implement IndexedDB access
  return Promise.resolve([]);
}

function markWorkoutAsSynced(id) {
  // Placeholder - would implement IndexedDB update
  return Promise.resolve();
}
