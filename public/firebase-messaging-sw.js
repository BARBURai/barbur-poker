// 🔔 Service Worker להתראות Push
// קובץ זה רץ ברקע גם כשהאפליקציה סגורה
// הוא מאפשר לקבל התראות מ-Firebase Cloud Messaging (FCM)

// טעינת Firebase SDK בגרסת compat (התואמת ל-Service Workers)
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// הגדרות Firebase - אותן ההגדרות מ-src/firebase.js
firebase.initializeApp({
  apiKey: "AIzaSyB2qU_rP_SRsjiA31e4oWoWB-HCsxvXAys",
  authDomain: "barbur-poker.firebaseapp.com",
  projectId: "barbur-poker",
  storageBucket: "barbur-poker.firebasestorage.app",
  messagingSenderId: "233472709878",
  appId: "1:233472709878:web:f6b9fed6d53c3dd28848d7"
});

const messaging = firebase.messaging();

// טיפול בהתראות שמגיעות כשהאפליקציה סגורה
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] התראה ברקע:', payload);
  
  const notificationTitle = payload.notification?.title || 'פוקר ברבורי תל מונד';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',  // אייקון של האפליקציה (אם קיים)
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'he',
    tag: payload.data?.type || 'general', // התראות מאותו סוג מחליפות זו את זו
    requireInteraction: false,
    data: payload.data || {},
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// כשהמשתמש לוחץ על ההתראה - פותח את האפליקציה
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // פתיחה / החזרה של חלון האפליקציה
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // אם יש חלון פתוח - מחזיר אותו
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      // אם אין - פותח חדש
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
