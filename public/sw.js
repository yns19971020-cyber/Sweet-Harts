// Sweet Hearts Service Worker for Push Notifications
const CACHE_NAME = 'sweethearts-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/register.html',
  '/dashboard.html',
  '/images/hero-bg.jpg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received', event);
  
  let data = { title: 'Sweet Hearts', body: 'You have a new notification!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'New notification',
    icon: '/images/app-icon-192.png',
    badge: '/images/badge-icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      notificationId: data.notificationId
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ],
    requireInteraction: true,
    tag: data.tag || 'sweethearts-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Sweet Hearts', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
