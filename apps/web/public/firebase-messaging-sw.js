importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// These values are based on your Firebase configuration.
firebase.initializeApp({
  apiKey: "AIzaSyD5r4_95Jgu7oRBWIZ7xpx8fMrww3HjxjA",
  authDomain: "nakath-platform.firebaseapp.com",
  projectId: "nakath-platform",
  storageBucket: "nakath-platform.firebasestorage.app",
  messagingSenderId: "108804059292",
  appId: "1:108804059292:web:84c1fc1b40dbf5608c3d59",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-light-32x32.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
