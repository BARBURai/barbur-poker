// 🔔 Service Worker להתראות Push - גרסה משופרת v3
// קובץ זה רץ ברקע גם כשהאפליקציה סגורה
// תיקונים בגרסה הזו:
// - תמיכה משופרת ב-PWA וסמסונג
// - fallback לפתיחת חלון אם הראשון נכשל
// - לוגים מפורטים יותר לדיבאג
// - בדיקה גמישה של URLs (כולל vercel.app, barbur-poker, localhost)
// - שליחת postMessage לחלון פתוח לפני focus

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
self.addEventListener('push', (event) => {
  console.log('[SW] 📥 Push event received at', new Date().toISOString());
  
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
      url: APP_URL,
      receivedAt: Date.now()
    },
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW] ✅ Notification displayed:', title))
      .catch(err => console.error('[SW] ❌ Show notification failed:', err))
  );
});

// 🆕 v3 - כשהמשתמש לוחץ על ההתראה - פותח את האפליקציה (תיקון משופר!)
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Notification clicked at', new Date().toISOString());
  console.log('[SW] Notification data:', JSON.stringify(event.notification.data || {}));
  
  // סגירת ההתראה
  event.notification.close();
  
  // קבלת ה-URL מהנתונים, או ברירת מחדל
  const targetUrl = event.notification.data?.url || APP_URL;
  
  event.waitUntil(
    (async () => {
      try {
        // 🔍 חיפוש כל החלונות הפתוחים
        const clientList = await clients.matchAll({ 
          type: 'window', 
          includeUncontrolled: true 
        });
        
        console.log('[SW] Found', clientList.length, 'window(s)');
        clientList.forEach((c, i) => {
          console.log(`[SW]   Window ${i}: ${c.url} (focused: ${c.focused}, visible: ${c.visibilityState})`);
        });
        
        // 🔍 בדיקה גמישה - מחפש barbur-poker, vercel.app או localhost
        const matchingClient = clientList.find(client => {
          const clientUrl = client.url || '';
          return (clientUrl.includes('barbur-poker') || 
                  clientUrl.includes('vercel.app') ||
                  clientUrl.includes('localhost')) && 
                 'focus' in client;
        });
        
        if (matchingClient) {
          console.log('[SW] ✅ Found matching window, focusing:', matchingClient.url);
          
          // שליחת הודעה לחלון לפני focus - לאפשר ניווט אם רוצים
          try {
            matchingClient.postMessage({ 
              type: 'notification-clicked',
              data: event.notification.data || {},
              clickedAt: Date.now()
            });
            console.log('[SW] PostMessage sent to client');
          } catch (e) {
            console.warn('[SW] PostMessage failed:', e);
          }
          
          // נסיון focus
          try {
            const focused = await matchingClient.focus();
            console.log('[SW] ✅ Focus successful');
            return focused;
          } catch (focusErr) {
            console.error('[SW] ❌ Focus failed:', focusErr);
            // fallback - אם focus נכשל, נסה לפתוח חלון חדש
          }
        }
        
        // 🪟 לא נמצא חלון פתוח (או focus נכשל) - פותחים חלון חדש
        console.log('[SW] 🪟 Opening new window:', targetUrl);
        
        if (clients.openWindow) {
          try {
            const newWindow = await clients.openWindow(targetUrl);
            if (newWindow) {
              console.log('[SW] ✅ New window opened successfully');
              try {
                await newWindow.focus();
              } catch (e) {
                console.warn('[SW] New window focus failed:', e);
              }
              return newWindow;
            } else {
              console.warn('[SW] ⚠️ openWindow returned null');
            }
          } catch (openErr) {
            console.error('[SW] ❌ openWindow failed:', openErr);
          }
        } else {
          console.error('[SW] ❌ clients.openWindow not available');
        }
      } catch (err) {
        console.error('[SW] ❌ General error in notificationclick:', err);
      }
    })()
  );
});

// 📥 Handler לסגירת התראה (לוגינג בלבד)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] 🗙 Notification closed:', event.notification.tag);
});

// install + activate - להבטיח שה-SW יופעל מיד
self.addEventListener('install', (event) => {
  console.log('[SW] 🔧 Installing v3...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Activated v3');
  event.waitUntil(self.clients.claim());
});

// 📨 Handler לקבלת הודעות מהאפליקציה (אופציונלי - לעתיד)
self.addEventListener('message', (event) => {
  console.log('[SW] 📨 Message received from app:', event.data);
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
