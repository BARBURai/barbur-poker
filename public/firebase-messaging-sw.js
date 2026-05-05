// 🔔 Service Worker להתראות Push - גרסה v5
// קובץ זה רץ ברקע גם כשהאפליקציה סגורה
//
// תיקונים בגרסה v5:
// - תמיד משתמש ב-openWindow במקום focus (כי focus לא עובד ב-PWA בטלפון)
// - מקווה שזה יפתח את ה-PWA אם הוא מותקן

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

const APP_URL = 'https://barbur-poker.vercel.app/';

// 🔔 Handler ראשי - מטפל בכל הודעת push שמגיעה
self.addEventListener('push', (event) => {
  console.log('[SW v5] 📥 Push event received');
  
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[SW v5] Failed to parse payload:', e);
    payload = { notification: { title: 'הודעה חדשה', body: 'יש לך הודעה חדשה' } };
  }
  
  console.log('[SW v5] Payload:', JSON.stringify(payload));
  
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
      url: APP_URL,
      receivedAt: Date.now()
    },
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW v5] ✅ Notification displayed:', title))
      .catch(err => console.error('[SW v5] ❌ Show notification failed:', err))
  );
});

// 🆕 v5 - תמיד משתמש ב-openWindow (focus לא עובד ב-PWA)
self.addEventListener('notificationclick', (event) => {
  console.log('[SW v5] 👆 Notification clicked');
  
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || APP_URL;
  
  event.waitUntil(
    (async () => {
      try {
        // 🪟 v5: תמיד פותח חלון חדש - זה אמור להפעיל את ה-PWA אם מותקן
        // במקום focus (שלא עובד ב-PWA), אנחנו פותחים URL חדש
        // הדפדפן/מערכת תזהה שיש PWA מותקן ותפתח אותו
        
        console.log('[SW v5] Opening:', targetUrl);
        
        if (clients.openWindow) {
          const newWindow = await clients.openWindow(targetUrl);
          if (newWindow) {
            console.log('[SW v5] ✅ Window opened/focused');
            return newWindow;
          } else {
            console.warn('[SW v5] ⚠️ openWindow returned null');
          }
        } else {
          console.error('[SW v5] ❌ clients.openWindow not available');
        }
      } catch (err) {
        console.error('[SW v5] ❌ Error:', err);
      }
    })()
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW v5] 🗙 Notification closed');
});

self.addEventListener('install', (event) => {
  console.log('[SW v5] 🔧 Installing v5...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW v5] ✅ Activated v5');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
