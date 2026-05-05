// 🔔 Service Worker להתראות Push - גרסה משופרת
// קובץ זה רץ ברקע גם כשהאפליקציה סגורה

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB2qU_rP_SRsjiA31e4oWoWB-HCsxvXAys",
  authDomain: "barbur-poker.firebaseapp.com",
  projectId: "barbur-poker",
  storageBucket: "barbur-poker.firebasestorage.app",
  messagingSenderId: "233472709878",
  appId: "1:233472709878:web:f6b9fed6d53c3dd28848d7"
});

const messaging = firebase.messaging();

// 🌐 כתובת מלאה של האפליקציה - חשוב לפתיחה אחרי לחיצה על התראה
const APP_URL = 'https://barbur-poker.vercel.app/';

// 🔔 Handler ראשי - מטפל בכל הודעת push שמגיעה
// משתמש ב-push event במקום onBackgroundMessage למנוע כפילויות
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[SW] Failed to parse payload:', e);
    payload = { notification: { title: 'הודעה חדשה', body: 'יש לך הודעה חדשה' } };
  }
  
  console.log('[SW] Payload:', JSON.stringify(payload));
  
  const title = payload.notification?.title || payload.data?.title || 'פוקר ברבורי תל מונד';
  const body = payload.notification?.body || payload.data?.body || '';
  
  const options = {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'he',
    tag: payload.data?.type || 'general',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { 
      ...(payload.data || {}),
      url: APP_URL  // 🆕 שומרים URL בנתונים של ההתראה
    },
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW] Notification displayed:', title))
      .catch(err => console.error('[SW] Show notification failed:', err))
  );
});

// 🆕 כשהמשתמש לוחץ על ההתראה - פותח את האפליקציה (תוקן!)
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  // קבלת ה-URL מהנתונים, או ברירת מחדל
  const targetUrl = event.notification.data?.url || APP_URL;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 🔍 חיפוש חלון של האפליקציה שכבר פתוח
      for (const client of clientList) {
        // בודקים אם זה חלון של האפליקציה שלנו
        const clientUrl = client.url || '';
        if (clientUrl.includes('barbur-poker') && 'focus' in client) {
          console.log('[SW] Found existing window, focusing:', clientUrl);
          return client.focus();
        }
      }
      // לא נמצא חלון פתוח - פותחים חדש עם URL מלא
      if (clients.openWindow) {
        console.log('[SW] Opening new window:', targetUrl);
        return clients.openWindow(targetUrl);
      }
    }).catch(err => {
      console.error('[SW] Error handling notification click:', err);
    })
  );
});

// install + activate - להבטיח שה-SW יופעל מיד
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(self.clients.claim());
});
