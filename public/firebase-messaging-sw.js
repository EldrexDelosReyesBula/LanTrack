importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

fetch('/api/firebase-config')
  .then((response) => response.json())
  .then((config) => {
    if (config.apiKey) {
      firebase.initializeApp(config);
      const messaging = firebase.messaging();

      messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
          body: payload.notification.body,
          icon: '/pwa-192x192.png'
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  })
  .catch((err) => {
    console.warn('Failed to fetch Firebase config in service worker', err);
  });
