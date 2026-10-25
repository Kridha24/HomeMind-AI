/* eslint-disable no-restricted-globals */
// Scripts for firebase messaging in service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Parse search params for dynamic Firebase configuration if supplied
const swUrl = new URL(location.href);
const apiKey = swUrl.searchParams.get('apiKey') || '';
const projectId = swUrl.searchParams.get('projectId') || '';
const messagingSenderId = swUrl.searchParams.get('messagingSenderId') || '';
const appId = swUrl.searchParams.get('appId') || '';

if (apiKey && projectId) {
  firebase.initializeApp({
    apiKey,
    projectId,
    messagingSenderId,
    appId,
  });

  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'HomeMind.AI Notification';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'You have an update from your household.',
      icon: payload.notification?.icon || '/vite.svg',
      badge: '/vite.svg',
      tag: payload.notification?.tag || payload.data?.tag || 'homemind-alert',
      data: {
        click_action: payload.data?.click_action || payload.fcmOptions?.link || payload.data?.link || '/',
        ...payload.data,
      },
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Notification Click Event Handler: Safe internal navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let targetUrl = event.notification.data?.click_action || event.notification.data?.link || '/';
  // Enforce relative safe internal route
  if (!targetUrl.startsWith('/') || targetUrl.startsWith('//')) {
    targetUrl = '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
