// 🔔 Service Worker להתראות Push - גרסה v6 (גישה משולבת)
// קובץ זה רץ ברקע גם כשהאפליקציה סגורה
//
// תיקונים בגרסה v6:
// - שילוב של focus (לאפליקציה פתוחה) + openWindow (כשסגורה)
// - ניסיון פתיחת ה-PWA דרך כל הדרכים האפשריות
// - לוגים מפורטים לדיבאג

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
  console.log('[SW v6] 📥 Push event received');
  
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[SW v6] Failed to parse payload:', e);
    payload = { notification: { title: 'הודעה חדשה', body: 'יש לך הודעה חדשה' } };
  }
  
  console.log('[SW v6] Payload:', JSON.stringify(payload));
  
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
      .then(() => console.log('[SW v6] ✅ Notification displayed:', title))
      .catch(err => console.error('[SW v6] ❌ Show notification failed:', err))
  );
});

// 🆕 v6 - גישה משולבת: focus קודם (לאפליקציה פתוחה) ואז openWindow כ-fallback
self.addEventListener('notificationclick', (event) => {
  console.log('[SW v6] 👆 Notification clicked at', new Date().toISOString());
  
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || APP_URL;
  
  event.waitUntil(
    (async () => {
      try {
        // שלב 1: חיפוש חלון פתוח של האפליקציה
        const allClients = await clients.matchAll({ 
          type: 'window',
          includeUncontrolled: true 
        });
        
        console.log('[SW v6] Found', allClients.length, 'client(s)');
        allClients.forEach((c, i) => {
          console.log(`[SW v6]   Client ${i}: url=${c.url}, focused=${c.focused}, visibility=${c.visibilityState}, frameType=${c.frameType || 'unknown'}`);
        });
        
        // סינון רק לחלונות של האפליקציה
        const matchingClients = allClients.filter(client => {
          const clientUrl = client.url || '';
          return (clientUrl.includes('barbur-poker') || 
                  clientUrl.includes('vercel.app') ||
                  clientUrl.includes('localhost')) && 
                 'focus' in client;
        });
        
        console.log('[SW v6] Matching clients:', matchingClients.length);
        
        // שלב 2: אם יש חלון פתוח - focus (זה עבד ב-v5 כשהאפליקציה פתוחה)
        if (matchingClients.length > 0) {
          // עדיפות לחלון נראה
          const visibleClient = matchingClients.find(c => c.visibilityState === 'visible');
          const targetClient = visibleClient || matchingClients[0];
          
          console.log('[SW v6] ✅ Found existing window, trying focus:', targetClient.url);
          
          try {
            await targetClient.focus();
            console.log('[SW v6] ✅ Focus successful');
            return;
          } catch (focusErr) {
            console.error('[SW v6] ❌ Focus failed:', focusErr);
            // ממשיכים ל-openWindow
          }
        }
        
        // שלב 3: אין חלון פתוח (או focus נכשל) - openWindow
        console.log('[SW v6] 🪟 No window or focus failed, opening new:', targetUrl);
        
        if (clients.openWindow) {
          try {
            const newWindow = await clients.openWindow(targetUrl);
            if (newWindow) {
              console.log('[SW v6] ✅ New window opened');
              return;
            } else {
              console.warn('[SW v6] ⚠️ openWindow returned null - probably blocked');
            }
          } catch (openErr) {
            console.error('[SW v6] ❌ openWindow failed:', openErr);
          }
        }
        
        // שלב 4: אם הכל נכשל - ניסיון אחרון לפתוח ב-URL אחר (מחזיק bypass לזיכרון cache)
        console.log('[SW v6] 🔄 Last attempt with cache-busting URL');
        try {
          const fallbackUrl = APP_URL + '?fromNotif=' + Date.now();
          await clients.openWindow(fallbackUrl);
          console.log('[SW v6] ✅ Fallback window opened');
        } catch (lastErr) {
          console.error('[SW v6] ❌ All attempts failed:', lastErr);
        }
      } catch (err) {
        console.error('[SW v6] ❌ General error:', err);
      }
    })()
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW v6] 🗙 Notification closed');
});

self.addEventListener('install', (event) => {
  console.log('[SW v6] 🔧 Installing v6...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW v6] ✅ Activated v6');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
