import React, { useState, useEffect, useMemo, useRef } from 'react';
import SESSIONS_DATA from './data/sessions.json';
import HOSTING_DATA from './data/hosting.json';
import QUOTES_DATA from './data/quotes.json';
import PLAYER_AVATARS from './data/avatars.json';
import BARBUR_LOGO from './assets/barbur-logo.webp';
import SWAN_IMG from './assets/swan.png';
// 🦢 3 תמונות של ברבורים בתעופה - לקונפטי מגוון
import SWAN_FLY_1 from './assets/swan-fly-1.png';
import SWAN_FLY_2 from './assets/swan-fly-2.png';
import SWAN_FLY_3 from './assets/swan-fly-3.png';
import { loadState as fbLoadState, saveState as fbSaveState } from './firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Upload, Users, TrendingUp, Calendar, Plus, X, Check, AlertCircle, Loader2, Download, RefreshCw, Crown, Skull, Flame, Target, HelpCircle, Maximize2, Filter, LayoutDashboard, Table, BarChart3, History, ChevronDown, ChevronLeft, ChevronRight, Lock, LogOut, Quote, Heart, Search, Trash2, MessageSquare, Sparkles, Image as ImageIcon, Camera, UserPlus, UserMinus, Clock, Bell, ClipboardList, MapPin } from 'lucide-react';

// 🔖 גרסה - מוצגת בתחתית האפליקציה
const APP_VERSION = 'v2.33.55';
const APP_BUILD_TIME = '08/05/2026 15:22';
const APP_NOTES = '📋 ניהול רישום הועבר להמבורגר - מסך ראשי נקי יותר';


// ===== הרשאות מנהל =====
const ADMIN_PASSWORD = 'barbur2026'; // סיסמת אדמין רגיל
// 🆕 סיסמת סופר אדמין נשמרת ב-Firebase (לא בקוד) - hash בלבד
// בכניסה ראשונה של סופר אדמין - יוצג מסך הגדרת סיסמה
const SUPER_ADMIN_PASSWORD_KEY = 'poker_super_admin_password_v1';
const ADMIN_NAMES = ['רון', 'גילי']; // ברירת מחדל - ניתן לערוך מהאפליקציה
const SUPER_ADMINS = ['רון']; // 👑 סופר אדמינים קבועים - לא ניתן לשינוי דרך ה-UI
const ADMIN_NAMES_KEY = 'poker_admin_names_v1'; // 🆕 רשימת מנהלים שמורה ב-Firebase
// 🔔 רשימת tokens להתראות Push - { 'userName_deviceId': { token, userName, registeredAt } }
const PUSH_TOKENS_KEY = 'poker_push_tokens_v1';
const ADMIN_PERMISSIONS_KEY = 'poker_admin_permissions_v1'; // 🆕 הרשאות לאדמינים רגילים
const HIDDEN_PLAYERS_KEY = 'poker_hidden_players_v1'; // 🆕 שחקנים מוסתרים מרשימת הפעילים
const KNOWN_ISSUES_KEY = 'poker_known_issues_v1'; // 🆕 בעיות תקינות שסומנו כידועות
const ANALYTICS_KEY_PREFIX = 'poker_analytics_v1'; // 🆕 תיעוד שימוש - מפתח בפורמט poker_analytics_v1::YYYY-MM-DD
const ANALYTICS_RETENTION_DAYS = 180; // 🆕 כמה ימים לשמור היסטוריית שימוש
const BIRTHDAYS_KEY = 'poker_birthdays_v1'; // 🆕 ימי הולדת של שחקנים
const LAST_LOGIN_KEY = 'poker_last_login_v1'; // 🆕 כניסה אחרונה של כל משתמש

// 🔐 רשימת כל הפיצ'רים האדמיניים - עם ברירות מחדל לאדמין רגיל
// סופר אדמין מקבל הכל אוטומטית. אדמין רגיל מקבל רק מה שמופיע פה כ-true.
const PERMISSIONS_REGISTRY = [
  { key: 'liveSession',       label: '🎰 עדכון ערב בלייב',                  defaultEnabled: true,  superOnly: false },
  { key: 'photoSession',      label: '📸 עדכון ערב בתמונה',                 defaultEnabled: true,  superOnly: false },
  { key: 'hostingEdit',       label: '📅 עריכת לוח אירוחים',                defaultEnabled: true,  superOnly: false },
  { key: 'quotesDelete',      label: '📜 מחיקת ציטוטים מהגלריה',            defaultEnabled: false, superOnly: false },
  { key: 'managePlayers',     label: '👥 ניהול משתמשים (טלפונים, הסתרה)',     defaultEnabled: false, superOnly: false },
  { key: 'backupRestore',     label: '💾 גיבוי ושחזור נתונים',              defaultEnabled: false, superOnly: false },
  { key: 'deviceLocks',       label: '🔒 ניהול נעילות מכשירים',             defaultEnabled: false, superOnly: false },
  { key: 'impersonate',       label: '🎭 התחזות למשתמש אחר',                defaultEnabled: false, superOnly: false },
  { key: 'registrationToggle',label: '📝 הפעלת/כיבוי טאב הרישום',           defaultEnabled: false, superOnly: false },
  { key: 'deleteSession',     label: '🗑️ מחיקת מפגשים מההיסטוריה',         defaultEnabled: false, superOnly: false },
  { key: 'resetData',         label: '⚠️ איפוס כל הנתונים',                 defaultEnabled: false, superOnly: true  },
  { key: 'manageAdmins',      label: '🔐 ניהול מנהלים (הוספה/הסרה)',         defaultEnabled: false, superOnly: true  },
  { key: 'managePermissions', label: '⚙️ ניהול הרשאות (המסך הזה)',          defaultEnabled: false, superOnly: true  },
];

// יוצר את ברירת המחדל של ההרשאות לאדמין רגיל
const getDefaultPermissions = () => {
  const perms = {};
  PERMISSIONS_REGISTRY.forEach(p => {
    perms[p.key] = p.superOnly ? false : p.defaultEnabled;
  });
  return perms;
};

// 🎂 ימי הולדת שחולצו מההיסטוריה של הקבוצה
const DEFAULT_BIRTHDAYS = {
  'איילון': '30/01',
  'הראל': '15/02',
  'אלון': '12/03',
  'שראל': '18/03',
  'רם': '23/03',
  'שמוליק': '02/04',
  'רועי': '08/04',
  'תומר': '24/04',
  'כליפא': '05/05',
  'ניר': '10/05',
  'ולין': '20/05',
  'רון': '31/05',
  'אסף': '24/06',
  'נועם': '27/06',
  'שגיא': '08/07',
  'בראדלי': '23/07',
  'רונן': '14/08',
  'לירון': '22/08',
  'גילי': '03/09',
  'יובל בלוך': '04/09',
  'שלומי': '18/09',
  'יניב': '09/10',
  'דניאל': '08/12',
};

// ===== לוגו BarburAI (Base64) =====

 // רשימת המנהלים - מי שמופיע פה יוכל להפוך למנהל

// ===== רשימת השחקנים הקבועה =====
// רשימה מלאה של כל השחקנים שהופיעו בכל 4 השנים
const INITIAL_PLAYERS = [
  'רם', 'אילון', 'תומר', 'ניר', 'בראדלי', 'שמוליק', 'דניאל', 'יניב',
  'יואב', 'שראל', 'בן', 'לירון', 'רון', 'יובל מילוא', 'רונן', 'אלירן',
  'גילי', 'שגיא', 'אלון', 'דני', 'שלומי', 'ולין', 'רועי', 'אסף',
  'אבי', 'איתמר', 'הילאי', 'שליו', 'כליפא', 'עידו רייטר', 'נדב', 'עידן',
  // שחקנים מהיסטוריה
  'נועם', 'נועם 2', 'אייל', 'ערן', "טל רג'וון", 'שחר', 'רז',
  'מיקי', 'יובל בלוך', 'אמנון', 'אשר/ערן',
  // שחקנים מהיסטוריה הרחוקה (2013-2022)
  'ארי', 'אשרי', 'גיא', 'הראל', 'מאיר', 'אמיר',
  'ויקטור', 'צחי', "ריצ'רד", 'טל UTG', 'איל מרזל', 'אורחים לא מזוהים'
];

// ===== היסטוריה מהאקסל (נתוני כל 4 השנים: 2023-2026) =====
const ALL_HISTORICAL_SESSIONS = SESSIONS_DATA;

const ALL_INITIAL_SESSIONS = ALL_HISTORICAL_SESSIONS;

// ===== רשימת אירוחים מתוכננים (מה-Google Sheet) =====
const HOSTING_SCHEDULE = HOSTING_DATA;
// ===== 2282 ציטוטים מהוואטסאפ =====
const ALL_QUOTES = QUOTES_DATA;

// ===== אחסון משותף - Firebase Firestore =====
const STORAGE_KEY = 'poker_group_state_v4';
const QUOTES_STORAGE_KEY = 'poker_quotes_state_v1';
const GALLERY_STORAGE_KEY = 'poker_gallery_state_v1';
// 🆕 רישום למפגש הבא - מצב מסונכרן ב-Firebase
const REGISTRATION_KEY = 'poker_next_session_registration_v1';
// 🔒 הפעלת/כיבוי טאב הרישום (אדמין בלבד) - גלובלי לכולם
const REGISTRATION_ENABLED_KEY = 'poker_registration_feature_enabled_v1';
const RANDOM_TIME_KEY = 'poker_daily_random_time_v1';
// 📌 רישום ברזל - שחקנים שמסומנים מראש להצטרף אוטומטית (סופר אדמין בלבד)
const IRON_REGISTRATION_KEY = 'poker_iron_registration_v1';
// 📅 תזכורות מארחים - מי אישר, מי דחה, מי לא ענה
const HOST_REMINDERS_KEY = 'poker_host_reminders_v1';
// 🏆 תוצאות MVP - שמירת ה-MVP של כל חודש/רבעון/שנה לצורך התראות
const MVP_RESULTS_KEY = 'poker_mvp_results_v1';
// 🔐 נעילת מכשיר לכל משתמש - {playerName: {deviceId, lockedAt, userAgent}}
const DEVICE_LOCKS_KEY = 'poker_device_locks_v1';
// 🆔 מזהה ייחודי של המכשיר הנוכחי (נוצר פעם אחת ונשמר ב-localStorage)
const DEVICE_ID_KEY = 'poker_device_id_v1';

// ===== ניהול Device ID =====
// יוצר מזהה ייחודי לכל מכשיר (נשמר בקובץ localStorage לכל החיים)
// 🔐 hashing פשוט לסיסמה (SHA-256) - לא חשוף ב-Firebase כטקסט גלוי
// 🔔 ============ Push Notifications Helpers ============
// VAPID Public Key (מהקונסולה של Firebase)
const FCM_VAPID_KEY = 'BPYwf-_fn2Glo1FnwoU2sN_UgoOqFL2HuNAaQ2sdrcu-TbrBAUebqdY-t1eBbRvyHvEiyz_1QXFh9Gw-eFPz_4A';

// בדיקה: האם הדפדפן תומך בהתראות Push?
const isPushSupported = () => {
  return typeof window !== 'undefined' 
    && 'Notification' in window 
    && 'serviceWorker' in navigator
    && 'PushManager' in window;
};

// קבלת מצב הרשאה נוכחי
const getNotificationPermission = () => {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

// רישום ל-Push וקבלת token
const registerForPushNotifications = async (userName, deviceId) => {
  if (!isPushSupported()) {
    return { success: false, reason: 'unsupported' };
  }
  
  try {
    // רישום של ה-Service Worker (אם עוד לא רשום)
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    // ייבוא דינמי של Firebase Messaging (לחסוך bundle size)
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');
    
    // וודא שיש app מאותחל (כבר יש - מ-firebase.js, אבל ליתר ביטחון)
    let app;
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp({
        apiKey: "AIzaSyB2qU_rP_SRsjiA31e4oWoWB-HCsxvXAys",
        authDomain: "barbur-poker.firebaseapp.com",
        projectId: "barbur-poker",
        storageBucket: "barbur-poker.firebasestorage.app",
        messagingSenderId: "233472709878",
        appId: "1:233472709878:web:f6b9fed6d53c3dd28848d7"
      });
    }
    
    const messaging = getMessaging(app);
    
    // בקשת token (תוצג למשתמש בקשת הרשאה אם עוד לא נשאל)
    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    
    if (!token) {
      return { success: false, reason: 'no_token' };
    }
    
    // שמירת ה-token ב-Firebase
    const tokenKey = `${userName}_${deviceId}`;
    const existing = await fbLoadState(PUSH_TOKENS_KEY) || {};
    existing[tokenKey] = {
      token,
      userName,
      deviceId,
      registeredAt: new Date().toISOString(),
      userAgent: navigator.userAgent.slice(0, 200),
    };
    await fbSaveState(existing, PUSH_TOKENS_KEY);
    
    return { success: true, token };
  } catch (e) {
    console.error('שגיאה ברישום ל-Push:', e);
    return { success: false, reason: 'error', error: e.message };
  }
};

// הסרת token (כיבוי התראות)
const unregisterFromPushNotifications = async (userName, deviceId) => {
  try {
    const existing = await fbLoadState(PUSH_TOKENS_KEY) || {};
    const tokenKey = `${userName}_${deviceId}`;
    delete existing[tokenKey];
    await fbSaveState(existing, PUSH_TOKENS_KEY);
    return { success: true };
  } catch (e) {
    console.error('שגיאה בכיבוי Push:', e);
    return { success: false };
  }
};

const hashPassword = async (password) => {
  if (!password) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'barbur_poker_salt_2026'); // salt לבטיחות
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return '';
  }
};

const getOrCreateDeviceId = () => {
  try {
    let id = window.localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      // יצירת UUID v4 בסיסי
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 11);
      window.localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // אם localStorage חסום - נחזיר ID זמני (לא יישמר)
    return 'dev_temp_' + Math.random().toString(36).slice(2, 11);
  }
};
// 🆕 מפתחות לגיבויים
const BACKUPS_INDEX_KEY = 'poker_backups_index_v1'; // רשימת מפתחות גיבויים
const BACKUP_KEY_PREFIX = 'poker_backup_'; // פרפיקס לכל גיבוי בודד
const AUTO_BACKUP_INTERVAL_DAYS = 7; // גיבוי אוטומטי כל 7 ימים
const MAX_BACKUPS_TO_KEEP = 12; // שומר 12 גיבויים אחרונים (3 חודשים)

const loadState = async (key = STORAGE_KEY) => {
  return await fbLoadState(key);
};

const saveState = async (state, key = STORAGE_KEY) => {
  return await fbSaveState(state, key);
};

// ============================================================
// 📡 שידור חי - מצב ערב חי משותף לכל המשתמשים
// ============================================================
// כשיש ערב חי בשעות 19:00-23:59 ביום אירוח - הצופים רואים את המצב בלייב
const LIVE_BROADCAST_KEY = 'poker_live_broadcast_v1';

const saveLiveBroadcast = async (broadcast) => {
  try {
    return await fbSaveState(broadcast, LIVE_BROADCAST_KEY);
  } catch (e) {
    console.warn('Failed to save live broadcast:', e);
  }
};

const loadLiveBroadcast = async () => {
  try {
    return await fbLoadState(LIVE_BROADCAST_KEY);
  } catch (e) {
    return null;
  }
};

const clearLiveBroadcast = async () => {
  try {
    return await fbSaveState({ active: false, clearedAt: new Date().toISOString() }, LIVE_BROADCAST_KEY);
  } catch (e) {}
};

// ============================================================
// 📊 מערכת אנליטיקה - תיעוד שימוש משתמשים
// ============================================================
// אסטרטגיה: Buffer בזיכרון + Flush ל-Firestore כל 60 שניות / בעת יציאה
// כל יום - מסמך יחיד ב-Firestore (poker_analytics_v1::YYYY-MM-DD) שמתעדכן ב-merge
// שמירה: 180 יום, מחיקה אוטומטית בעת פתיחת מסך הדוח (client-side)

// מפתח לתאריך בפורמט YYYY-MM-DD לפי זמן ישראל
const getAnalyticsDateKey = (date = new Date()) => {
  try {
    const israelTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    const y = israelTime.getFullYear();
    const m = String(israelTime.getMonth() + 1).padStart(2, '0');
    const d = String(israelTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

// Buffer בזיכרון - אירועים שעוד לא נשלחו
// מבנה: { screens: { screenName: count }, actions: { actionName: count }, sessionStartTime, lastSeenTime }
let analyticsBuffer = null;
let analyticsFlushTimer = null;
let analyticsCurrentUser = null;
let analyticsSessionStarted = false;

// אתחול ה-buffer לכניסה חדשה
const initAnalyticsBuffer = () => {
  analyticsBuffer = {
    screens: {},
    actions: {},
    sessionStartTime: new Date().toISOString(),
    lastSeenTime: new Date().toISOString(),
    sessionsAdded: 0,        // האם להוסיף +1 לסה"כ ה-sessions ביום
    secondsAccumulated: 0,   // שניות שצריך להוסיף לסה"כ
    device: detectDevice(),
  };
};

// זיהוי סוג מכשיר
const detectDevice = () => {
  try {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) return 'Mobile';
    return 'Desktop';
  } catch {
    return 'Unknown';
  }
};

// Flush ה-buffer ל-Firestore (merge עם המסמך היומי הקיים)
const flushAnalytics = async () => {
  if (!analyticsBuffer || !analyticsCurrentUser) return;
  
  // אם אין שום פעילות לדווח - לא עושים כלום
  const hasScreens = Object.keys(analyticsBuffer.screens).length > 0;
  const hasActions = Object.keys(analyticsBuffer.actions).length > 0;
  const hasSession = analyticsBuffer.sessionsAdded > 0;
  const hasSeconds = analyticsBuffer.secondsAccumulated > 0;
  if (!hasScreens && !hasActions && !hasSession && !hasSeconds) return;
  
  try {
    const dateKey = getAnalyticsDateKey();
    const docKey = `${ANALYTICS_KEY_PREFIX}::${dateKey}`;
    
    // טוענים את המסמך הקיים של היום (אם יש)
    const existing = (await fbLoadState(docKey)) || { date: dateKey, users: {} };
    if (!existing.users) existing.users = {};
    
    const userKey = analyticsCurrentUser;
    const userData = existing.users[userKey] || {
      sessions: 0,
      totalSeconds: 0,
      firstSeen: analyticsBuffer.sessionStartTime,
      lastSeen: analyticsBuffer.lastSeenTime,
      device: analyticsBuffer.device,
      screens: {},
      actions: {},
    };
    
    // Merge: הוספת מסכים
    Object.entries(analyticsBuffer.screens).forEach(([screen, count]) => {
      userData.screens[screen] = (userData.screens[screen] || 0) + count;
    });
    
    // Merge: הוספת פעולות
    Object.entries(analyticsBuffer.actions).forEach(([action, count]) => {
      userData.actions[action] = (userData.actions[action] || 0) + count;
    });
    
    // עדכון מטא-דאטה
    userData.sessions += analyticsBuffer.sessionsAdded;
    userData.totalSeconds += analyticsBuffer.secondsAccumulated;
    userData.lastSeen = analyticsBuffer.lastSeenTime;
    if (!userData.firstSeen) userData.firstSeen = analyticsBuffer.sessionStartTime;
    userData.device = analyticsBuffer.device;
    
    existing.users[userKey] = userData;
    existing.date = dateKey;
    
    await fbSaveState(existing, docKey);
    
    // איפוס ה-buffer אחרי flush מוצלח
    analyticsBuffer.screens = {};
    analyticsBuffer.actions = {};
    analyticsBuffer.sessionsAdded = 0;
    analyticsBuffer.secondsAccumulated = 0;
  } catch (e) {
    console.warn('Analytics flush failed:', e);
    // לא איפוס במקרה של שגיאה - ננסה שוב בflush הבא
  }
};

// API ציבורי לתיעוד אירועים

// 🚨 v2.33.33 - אנליטיקה הושבתה זמנית עקב באג שגרם לקריסת האפליקציה
// כל הפונקציות מטה הן no-op כדי לוודא שהאפליקציה עובדת.
// נחזיר את האנליטיקה אחרי שנמצא את הסיבה.
const ANALYTICS_DISABLED = false;

// אתחול תיעוד - קוראים פעם אחת בכניסה
const startAnalyticsSession = (userName) => {
  if (ANALYTICS_DISABLED) return;
  if (!userName) return;
  if (analyticsSessionStarted && analyticsCurrentUser === userName) return; // כבר פעיל
  
  analyticsCurrentUser = userName;
  analyticsSessionStarted = true;
  
  if (!analyticsBuffer) initAnalyticsBuffer();
  analyticsBuffer.sessionsAdded += 1; // ספירת כניסה חדשה
  
  // Flush אוטומטי כל 60 שניות
  if (analyticsFlushTimer) clearInterval(analyticsFlushTimer);
  analyticsFlushTimer = setInterval(() => {
    if (analyticsBuffer) {
      // הוספת זמן מאז ה-flush האחרון
      const now = new Date();
      const last = new Date(analyticsBuffer.lastSeenTime);
      const elapsed = Math.min(120, Math.round((now - last) / 1000)); // מקסימום 120 שניות (להגן מטעויות)
      if (elapsed > 0) analyticsBuffer.secondsAccumulated += elapsed;
      analyticsBuffer.lastSeenTime = now.toISOString();
      flushAnalytics();
    }
  }, 60000); // 60 שניות
  
  // Flush מיידי בעת סגירת האפליקציה
  const handleBeforeUnload = () => {
    if (analyticsBuffer) {
      const now = new Date();
      const last = new Date(analyticsBuffer.lastSeenTime);
      const elapsed = Math.min(120, Math.round((now - last) / 1000));
      if (elapsed > 0) analyticsBuffer.secondsAccumulated += elapsed;
      analyticsBuffer.lastSeenTime = now.toISOString();
    }
    flushAnalytics();
  };
  
  // Flush כאשר האפליקציה עוברת ל-background
  const handleVisibility = () => {
    if (document.hidden) {
      handleBeforeUnload();
    }
  };
  
  // הסרת listeners ישנים אם יש
  try {
    window.removeEventListener('beforeunload', window.__analyticsBeforeUnload);
    document.removeEventListener('visibilitychange', window.__analyticsVisibility);
  } catch {}
  
  window.__analyticsBeforeUnload = handleBeforeUnload;
  window.__analyticsVisibility = handleVisibility;
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibility);
};

// תיעוד צפייה במסך
const trackScreen = (screenName) => {
  if (ANALYTICS_DISABLED) return;
  if (!analyticsCurrentUser || !screenName) return;
  if (!analyticsBuffer) initAnalyticsBuffer();
  analyticsBuffer.screens[screenName] = (analyticsBuffer.screens[screenName] || 0) + 1;
  analyticsBuffer.lastSeenTime = new Date().toISOString();
};

// תיעוד פעולה
const trackAction = (actionName) => {
  if (ANALYTICS_DISABLED) return;
  if (!analyticsCurrentUser || !actionName) return;
  if (!analyticsBuffer) initAnalyticsBuffer();
  analyticsBuffer.actions[actionName] = (analyticsBuffer.actions[actionName] || 0) + 1;
  analyticsBuffer.lastSeenTime = new Date().toISOString();
};

// טעינת היסטוריה לתצוגת הדוח (וגם מחיקה אוטומטית של ישנים מעל 180 יום)
const loadAnalyticsHistory = async (days = 180) => {
  if (ANALYTICS_DISABLED) return [];
  const result = [];
  const today = new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - ANALYTICS_RETENTION_DAYS);
  const cutoffKey = getAnalyticsDateKey(cutoffDate);
  
  // טעינת ימי הנתונים (עד days ימים אחורה)
  const daysToLoad = Math.min(days, ANALYTICS_RETENTION_DAYS);
  for (let i = 0; i < daysToLoad; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = getAnalyticsDateKey(date);
    const docKey = `${ANALYTICS_KEY_PREFIX}::${key}`;
    try {
      const data = await fbLoadState(docKey);
      if (data) result.push(data);
    } catch {
      // ממשיכים גם אם יום בודד נכשל
    }
  }
  
  // 🗑️ מחיקה אוטומטית - חיפוש מסמכים ישנים מ-180 יום ומחיקתם
  // מנסים למחוק עד 30 ימי קצה - אם יש יותר, ימחקו בהפעלה הבאה
  for (let i = ANALYTICS_RETENTION_DAYS; i < ANALYTICS_RETENTION_DAYS + 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = getAnalyticsDateKey(date);
    const docKey = `${ANALYTICS_KEY_PREFIX}::${key}`;
    try {
      const data = await fbLoadState(docKey);
      if (data) {
        // מחיקה ע"י שמירת אובייקט ריק/null - תלוי איך firebase.js עובד
        // בטוח יותר לדרוס במחרוזת ריקה כי לא ידוע אם יש פונקציית delete
        await fbSaveState(null, docKey);
      }
    } catch {}
  }
  
  return result;
};

// בודק האם השעה כעת בישראל היא בין 19:00-23:59
const isLiveBroadcastTime = () => {
  try {
    const israelTime = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Jerusalem',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const [hour, minute] = israelTime.split(':').map(Number);
    return hour >= 19 && hour <= 23;
  } catch (e) {
    return false;
  }
};

// בודק האם תאריך נתון הוא יום אירוח לפי לוח האירוחים
const isHostingDay = (hostingSchedule, dateStr) => {
  if (!hostingSchedule || !Array.isArray(hostingSchedule)) return false;
  const today = dateStr || getTodayIsrael();
  return hostingSchedule.some(h => h.date === today);
};

// 📅 מחזיר את התאריך של היום לפי שעון ישראל בפורמט YYYY-MM-DD
const getTodayIsrael = () => {
  try {
    // מקבל את התאריך לפי שעון ישראל
    const israelDate = new Date().toLocaleDateString('en-CA', { 
      timeZone: 'Asia/Jerusalem' 
    });
    // en-CA מחזיר YYYY-MM-DD ישירות
    return israelDate;
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

// 🖼️ אווטר שחקן - תמונה אמיתית או אות ראשונה עם רקע צבעוני
const PlayerAvatar = ({ name, size = 40, className = '' }) => {
  const avatar = PLAYER_AVATARS[name];
  
  if (avatar) {
    return (
      <img 
        src={`data:image/jpeg;base64,${avatar}`}
        alt={name}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, border: '2px solid rgba(251,191,36,0.6)' }}
      />
    );
  }
  
  // אווטר עם אות - צבע אקראי לפי השם
  const colors = ['#dc2626', '#2563eb', '#10b981', '#a855f7', '#f97316', '#ec4899', '#14b8a6', '#eab308', '#6366f1'];
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  const letter = name.charAt(0);
  
  return (
    <div 
      className={`rounded-full flex items-center justify-center font-bold text-white ${className}`}
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: color, 
        fontSize: size * 0.5,
        border: '2px solid rgba(251,191,36,0.6)',
      }}
    >
      {letter}
    </div>
  );
};

// 🔍 קומפוננט בחירה עם חיפוש - להחלפת <select> כשיש הרבה אפשרויות
const SearchableSelect = ({ value, onChange, options, placeholder = 'בחר...', className = '', allowEmpty = false, emptyLabel = 'ללא' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPos, setDropdownPos] = useState(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  
  // סגירה בלחיצה מחוץ
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 🆕 חישוב מיקום ה-dropdown כשהוא נפתח (position: fixed)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);
  
  // אופציות מסוננות
  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return options;
    return options.filter(opt => {
      const label = typeof opt === 'string' ? opt : (opt.label || opt.value || '');
      return label.toLowerCase().includes(searchLower);
    });
  }, [options, search]);
  
  const selectOption = (opt) => {
    const val = typeof opt === 'string' ? opt : opt.value;
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-white text-right flex items-center justify-between gap-2 hover:bg-stone-800 transition">
        <ChevronDown className={`h-4 w-4 text-stone-400 transition ${isOpen ? 'rotate-180' : ''}`} />
        <span className={value ? 'text-white' : 'text-stone-500'}>
          {value || placeholder}
        </span>
      </button>
      {isOpen && dropdownPos && (
        <div 
          className="fixed rounded-lg border border-stone-700 bg-stone-900 shadow-2xl shadow-black/80 max-h-64 overflow-hidden flex flex-col" 
          style={{ 
            zIndex: 99999,
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
          }}>
          <div className="p-2 border-b border-stone-700 sticky top-0 bg-stone-900">
            <div className="relative">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="חיפוש..."
                autoFocus
                className="w-full rounded-md border border-stone-700 bg-stone-950 pr-8 pl-2 py-1.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {allowEmpty && (
              <button
                type="button"
                onClick={() => selectOption('')}
                className="w-full px-3 py-2 text-sm text-right text-stone-400 italic hover:bg-stone-800 transition">
                {emptyLabel}
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-stone-500 text-center">לא נמצאו תוצאות</div>
            ) : (
              filtered.map((opt, i) => {
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : (opt.label || opt.value);
                const isSelected = optValue === value;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectOption(opt)}
                    className={`w-full px-3 py-2 text-sm text-right transition ${
                      isSelected
                        ? 'bg-amber-700 text-white font-bold'
                        : 'text-white hover:bg-stone-800'
                    }`}>
                    {optLabel}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ===== חישובי סטטיסטיקה =====
// 🛡️ הקוד מבטיח שכל מי שיש לו תוצאות בערב יופיע בטבלה
//   גם אם הוא לא ברשימת players הפעילה (כדי שהמאזן יישאר 0)
const calculateStats = (sessions, players) => {
  const stats = {};
  // יצירת רשומה לכל שחקן ב-players
  players.forEach(p => {
    stats[p] = { name: p, total: 0, sessions: 0, wins: 0, losses: 0, ties: 0,
      maxStreak: 0, currentStreak: 0, biggestWin: 0, biggestLoss: 0, values: [], hosted: 0 };
  });
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  sortedSessions.forEach(session => {
    if (session.host && stats[session.host]) stats[session.host].hosted++;
    Object.entries(session.results || {}).forEach(([name, amount]) => {
      // 🆕 אם השחקן לא ברשימה - הוסף אותו אוטומטית (כדי לשמור על מאזן)
      if (!stats[name]) {
        stats[name] = { name, total: 0, sessions: 0, wins: 0, losses: 0, ties: 0,
          maxStreak: 0, currentStreak: 0, biggestWin: 0, biggestLoss: 0, values: [], hosted: 0 };
        console.warn(`⚠️ שחקן "${name}" יש לו תוצאות אבל לא ברשימת players - מתווסף אוטומטית`);
      }
      const s = stats[name];
      s.total += amount; s.sessions++; s.values.push(amount);
      if (amount > 0) { s.wins++; s.currentStreak++; }
      else if (amount < 0) { s.losses++; s.currentStreak = 0; }
      else { s.ties++; s.currentStreak++; } // תיקו לא שובר את הרצף
      s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
      if (amount > s.biggestWin) s.biggestWin = amount;
      if (amount < s.biggestLoss) s.biggestLoss = amount;
    });
  });
  Object.values(stats).forEach(s => {
    if (s.sessions > 0) {
      s.avg = s.total / s.sessions;
      const variance = s.values.reduce((sum, v) => sum + Math.pow(v - s.avg, 2), 0) / s.sessions;
      s.stdDev = Math.sqrt(variance);
      s.winRate = (s.wins / s.sessions) * 100;
      s.lossRate = (s.losses / s.sessions) * 100;
      s.tieRate = (s.ties / s.sessions) * 100;
      s.currentStreakDisplay = s.currentStreak;
    } else {
      s.avg = 0; s.stdDev = 0; s.winRate = 0; s.lossRate = 0; s.tieRate = 0;
      s.currentStreakDisplay = 0;
    }
  });
  return Object.values(stats).filter(s => s.sessions > 0).sort((a, b) => b.total - a.total);
};

// ============================================================
// 🛡️ אימות תקינות טבלאות - בודק שכל הטבלאות מאוזנות
// בערב פוקר - סכום הרווחים = סכום ההפסדים = 0
// אם זה לא 0 - יש שחקן חסר/מזיק/בעיה בנתונים
// ============================================================
const validateTablesIntegrity = (allSessions, hiddenPlayers = [], yearFilter = null) => {
  const issues = [];
  
  if (!allSessions || allSessions.length === 0) {
    return { isValid: true, issues: [], summary: 'אין נתונים לבדוק' };
  }
  
  // 🔍 פילטר לפי שנה
  let sessionsToCheck = allSessions;
  if (yearFilter && yearFilter !== 'all') {
    sessionsToCheck = allSessions.filter(s => {
      if (!s.date) return false;
      return new Date(s.date).getFullYear() === Number(yearFilter);
    });
  }
  
  // 🔍 בדיקה 1: מאזן לכל ערב בנפרד (חובה להיות 0)
  sessionsToCheck.forEach(session => {
    if (!session.results) return;
    const sum = Object.values(session.results).reduce((acc, val) => acc + Number(val), 0);
    if (Math.abs(sum) > 0.01) { // רף לסטיות עיגול
      issues.push({
        type: 'session_imbalance',
        date: session.date,
        sum,
        message: `ערב ${session.date}: מאזן = ${sum > 0 ? '+' : ''}${sum} (אמור להיות 0)`,
      });
    }
  });
  
  // 🔍 בדיקה 2: מאזן שנתי - סכום כל הערבים בשנה (חובה להיות 0)
  const sessionsByYear = {};
  sessionsToCheck.forEach(s => {
    if (!s.date) return;
    const year = new Date(s.date).getFullYear();
    if (!sessionsByYear[year]) sessionsByYear[year] = [];
    sessionsByYear[year].push(s);
  });
  
  Object.entries(sessionsByYear).forEach(([year, yearSessions]) => {
    const totals = {};
    yearSessions.forEach(s => {
      Object.entries(s.results || {}).forEach(([name, amount]) => {
        totals[name] = (totals[name] || 0) + Number(amount);
      });
    });
    const yearSum = Object.values(totals).reduce((a, b) => a + b, 0);
    if (Math.abs(yearSum) > 0.01) {
      issues.push({
        type: 'year_imbalance',
        year,
        sum: yearSum,
        message: `שנת ${year}: מאזן כללי = ${yearSum > 0 ? '+' : ''}${yearSum} (אמור להיות 0)`,
      });
    }
  });
  
  // 🔍 בדיקה 3: שחקנים מוסתרים שמופיעים ב-results
  if (hiddenPlayers.length > 0) {
    const playersWithResults = new Set();
    sessionsToCheck.forEach(s => {
      Object.keys(s.results || {}).forEach(name => playersWithResults.add(name));
    });
    
    const hiddenButPlaying = hiddenPlayers.filter(p => playersWithResults.has(p));
    if (hiddenButPlaying.length > 0) {
      issues.push({
        type: 'hidden_players_active',
        players: hiddenButPlaying,
        message: `שחקנים מוסתרים עם תוצאות: ${hiddenButPlaying.join(', ')} - לא יופיעו בטבלה`,
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    summary: issues.length === 0 
      ? `✅ כל הטבלאות מאוזנות (${sessionsToCheck.length} ערבים)` 
      : `⚠️ ${issues.length} בעיות נמצאו`,
  };
};

// 🆕 יוצר מזהה ייחודי לבעיה - לצורך סימון "ידועה"
// המזהה מבוסס על סוג הבעיה + מאפיין מזהה (תאריך/שנה/שמות שחקנים)
// כך שאם הבעיה תיפתר ותחזור - היא תזוהה אוטומטית כידועה ולא תיחשב חדשה
const getIssueId = (issue) => {
  if (issue.type === 'session_imbalance') {
    return `session_imbalance::${issue.date}`;
  }
  if (issue.type === 'year_imbalance') {
    return `year_imbalance::${issue.year}`;
  }
  if (issue.type === 'hidden_players_active') {
    // ממיין כדי שהמזהה יהיה יציב גם אם סדר השחקנים משתנה
    return `hidden_players_active::${[...(issue.players || [])].sort().join(',')}`;
  }
  return `unknown::${JSON.stringify(issue)}`;
};

const calculateCumulative = (sessions, selectedPlayers) => {
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const running = {};
  selectedPlayers.forEach(p => running[p] = 0);
  return sortedSessions.map(session => {
    const dateObj = new Date(session.date);
    // 🆕 כולל שנה ב-label לאיכות הגרף
    const label = dateObj.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
    const labelWithYear = dateObj.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const point = { date: session.date, label, labelWithYear };
    Object.entries(session.results || {}).forEach(([name, amount]) => {
      if (running[name] !== undefined) running[name] += amount;
    });
    selectedPlayers.forEach(p => { point[p] = running[p]; });
    return point;
  });
};

const getLatestSessionDate = (sessions) => {
  if (!sessions.length) return null;
  return [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
};

const parseHebrewDate = (dateStr) => {
  // "27.6.2021" -> Date
  const [d, m, y] = dateStr.split('.');
  return new Date(+y, +m - 1, +d);
};
// ===== מסך פתיחה טקסס הולדם =====
const SplashScreen = ({ onEnter }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden" style={{ fontFamily: 'Heebo, Assistant, sans-serif' }}>
      {/* טעינת פונט בתוך הסקרין כדי שיעבוד מיד */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;800;900&family=Rubik:wght@500;700;900&display=swap" rel="stylesheet" />
      
      {/* רקע פוקר - שולחן ירוק */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, #0f5132 0%, #052e16 50%, #000 100%)',
      }} />
      {/* מרקם שולחן */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 200px, rgba(0,0,0,0.6) 500px)'
      }} />
      {/* אורות רכים */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-700/20 rounded-full blur-3xl" />

      {/* קלפים מעופפים ברקע */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { top: '10%', left: '15%', rot: -25, suit: '♠', color: 'text-white' },
          { top: '20%', right: '10%', rot: 15, suit: '♥', color: 'text-red-500' },
          { bottom: '15%', left: '8%', rot: 30, suit: '♦', color: 'text-red-500' },
          { bottom: '25%', right: '15%', rot: -15, suit: '♣', color: 'text-white' },
          { top: '45%', left: '5%', rot: 45, suit: '♥', color: 'text-red-500' },
          { top: '50%', right: '5%', rot: -35, suit: '♠', color: 'text-white' },
        ].map((c, i) => (
          <div key={i} className="absolute" style={{
            ...c, transform: `rotate(${c.rot}deg)`, animation: `floatCard 4s ease-in-out ${i * 0.3}s infinite`
          }}>
            <div className="w-24 h-32 md:w-32 md:h-44 rounded-xl bg-gradient-to-br from-stone-100 to-stone-300 shadow-2xl flex items-center justify-center border-2 border-stone-400 opacity-30">
              <div className={`text-6xl md:text-7xl ${c.color} font-bold`}>{c.suit}</div>
            </div>
          </div>
        ))}
      </div>

      {/* תוכן מרכזי */}
      <div className="relative z-10 text-center px-6 animate-fadeIn" style={{ fontFamily: 'Heebo, Assistant, sans-serif' }}>
        
        {/* לוגו ברבור גדול */}
        <div className="mb-6 flex justify-center animate-swanFloat">
          <img src={BARBUR_LOGO} alt="BarburAI" 
            className="h-32 md:h-44 w-auto drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 10px 40px rgba(251, 191, 36, 0.4))' }} />
        </div>

        {/* כותרת ראשית */}
        <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight" style={{
          fontFamily: 'Heebo, Assistant, sans-serif',
          background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #b45309 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 4px 40px rgba(251, 191, 36, 0.3)'
        }}>
          פוקר ברבורי תל מונד
        </h1>

        {/* סמלי פוקר */}
        <div className="flex justify-center gap-4 mb-10 text-4xl md:text-5xl">
          <span className="text-white drop-shadow-lg" style={{ animation: 'pulseCard 2s ease-in-out infinite' }}>♠</span>
          <span className="text-red-500 drop-shadow-lg" style={{ animation: 'pulseCard 2s ease-in-out 0.3s infinite' }}>♥</span>
          <span className="text-red-500 drop-shadow-lg" style={{ animation: 'pulseCard 2s ease-in-out 0.6s infinite' }}>♦</span>
          <span className="text-white drop-shadow-lg" style={{ animation: 'pulseCard 2s ease-in-out 0.9s infinite' }}>♣</span>
        </div>

        {/* כפתור כניסה */}
        <button onClick={onEnter}
          className="group relative px-12 py-4 text-xl font-extrabold text-stone-900 rounded-full overflow-hidden shadow-2xl hover:scale-105 transition-transform"
          style={{
            fontFamily: 'Heebo, Assistant, sans-serif',
            background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #d97706 100%)',
            boxShadow: '0 10px 40px rgba(251, 191, 36, 0.5), inset 0 2px 10px rgba(255,255,255,0.3)'
          }}>
          <span className="relative z-10">כניסה לשולחן</span>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
        </button>

        <div className="mt-8 text-amber-200/40 text-xs tracking-widest font-bold" style={{ fontFamily: 'Heebo, Assistant, sans-serif' }}>
          ♦ הבית של הפוקר הברבורי ♦
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 1s ease-out; }
        @keyframes floatCard { 0%, 100% { transform: translateY(0) rotate(var(--rot, 0deg)); } 50% { transform: translateY(-30px) rotate(var(--rot, 0deg)); } }
        @keyframes pulseCard { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.15); opacity: 1; } }
        @keyframes swanFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-swanFloat { animation: swanFloat 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// ===== מודל התחברות מנהל =====
// ============================================================
// 🆕 ניהול רשימת מנהלים - הוספה/הסרה
// ============================================================
const ManageAdminsModal = ({ isOpen, onClose, adminNames, currentAdminName, allPlayers, onAdd, onRemove, onSwitchToPermissions }) => {
  const [selectedNew, setSelectedNew] = useState('');
  
  if (!isOpen) return null;
  
  // שחקנים שעדיין לא מנהלים
  const eligiblePlayers = allPlayers.filter(p => !adminNames.includes(p));
  
  const handleAdd = () => {
    if (!selectedNew) return;
    onAdd(selectedNew);
    setSelectedNew('');
  };
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" 
      onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border-2 border-amber-700/60 bg-gradient-to-br from-stone-900 to-stone-950 shadow-2xl" 
        onClick={e => e.stopPropagation()} dir="rtl">
        
        {/* כותרת */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800">
          <h3 className="text-xl font-bold text-amber-200 flex items-center gap-2">
            👑 ניהול אדמינים
          </h3>
          <button onClick={onClose}
            className="rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 w-8 h-8 flex items-center justify-center text-stone-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* 🆕 סאב-טאבים - מעבר מהיר להרשאות */}
        {onSwitchToPermissions && (
          <div className="flex gap-2 rounded-xl bg-stone-900/50 border border-stone-800 p-1 m-5 mb-0">
            <button
              className="flex-1 rounded-lg py-2 px-3 text-xs font-bold bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow"
            >
              👑 מנהלים
            </button>
            <button
              onClick={onSwitchToPermissions}
              className="flex-1 rounded-lg py-2 px-3 text-xs font-bold text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 transition"
            >
              ⚙️ הרשאות
            </button>
          </div>
        )}
        
        {/* תוכן */}
        <div className="p-5 space-y-4">
          
          {/* רשימת מנהלים נוכחיים */}
          <div>
            <div className="text-xs text-stone-500 mb-2 font-bold">מנהלים נוכחיים ({adminNames.length})</div>
            <div className="space-y-2">
              {adminNames.length === 0 ? (
                <div className="text-stone-500 text-sm text-center py-4">אין מנהלים</div>
              ) : (
                adminNames.map(name => (
                  <div key={name} className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-900/50 p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-sm">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-stone-100">{name}</div>
                        {name === currentAdminName && (
                          <div className="text-[10px] text-emerald-400">(אתה)</div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => onRemove(name)}
                      title="הסר מנהל"
                      disabled={adminNames.length <= 1}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-950/30 border border-rose-800/30 disabled:opacity-30 disabled:cursor-not-allowed">
                      הסר
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* הוספת מנהל חדש */}
          {eligiblePlayers.length > 0 && (
            <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-3">
              <div className="text-xs text-emerald-300 mb-2 font-bold">הוספת מנהל חדש</div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    value={selectedNew}
                    onChange={setSelectedNew}
                    options={eligiblePlayers}
                    placeholder="בחר שחקן..."
                  />
                </div>
                <button 
                  onClick={handleAdd}
                  disabled={!selectedNew}
                  className="rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-bold text-white hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed">
                  + הוסף
                </button>
              </div>
            </div>
          )}
          
          {/* הסבר */}
          <div className="rounded-xl bg-stone-800/40 border border-stone-700/40 p-3 text-xs text-stone-400 leading-relaxed">
            💡 רק שחקנים ברשימה הזו יכולים להיכנס כמנהלים (גם עם הסיסמה הנכונה).<br />
            כל שינוי כאן נשמר אוטומטית ונראה לכל המכשירים.
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminLoginModal = ({ isOpen, onClose, onLogin, currentUser, superAdminPasswordHash, onSetSuperAdminPassword }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // 🆕 מצב הגדרת סיסמה (פעם ראשונה לסופר אדמין)
  const [setupMode, setSetupMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // האם המשתמש הנוכחי הוא סופר אדמין פוטנציאלי וטרם הוגדרה סיסמה?
  const isSuperAdminCandidate = SUPER_ADMINS.includes(currentUser);
  const needsSetup = isSuperAdminCandidate && !superAdminPasswordHash;
  
  // אם הוא סופר אדמין וטרם הוגדרה סיסמה - מציג מסך הגדרה
  useEffect(() => {
    if (isOpen) {
      setSetupMode(needsSetup);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [isOpen, needsSetup]);

  const handleSubmit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    
    try {
      // 👑 אם המשתמש הוא סופר אדמין פוטנציאלי - בדיקת סיסמת סופר אדמין מול ה-hash
      if (isSuperAdminCandidate && superAdminPasswordHash) {
        const inputHash = await hashPassword(password);
        if (inputHash === superAdminPasswordHash) {
          onLogin(currentUser, 'super');
          setPassword('');
          onClose();
          setBusy(false);
          return;
        }
      }
      // 🔧 סיסמה רגילה (גם סופר אדמין יכול להיכנס כאדמין רגיל אם רוצה)
      if (password === ADMIN_PASSWORD) {
        onLogin(currentUser, 'admin');
        setPassword('');
        onClose();
        setBusy(false);
        return;
      }
      setError('סיסמה שגויה');
    } catch (e) {
      setError('שגיאה בכניסה');
    }
    setBusy(false);
  };
  
  // 🆕 הגדרת סיסמה ראשונית לסופר אדמין
  const handleSetupSubmit = async () => {
    if (busy) return;
    setError('');
    if (newPassword.length < 6) {
      setError('סיסמה חייבת לכלול לפחות 6 תווים');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות לא תואמות');
      return;
    }
    setBusy(true);
    try {
      const hash = await hashPassword(newPassword);
      await onSetSuperAdminPassword(hash);
      // אחרי הגדרה - נכנס ישירות כסופר אדמין
      onLogin(currentUser, 'super');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (e) {
      setError('שגיאה בשמירת הסיסמה');
    }
    setBusy(false);
  };

  if (!isOpen) return null;

  // 🆕 מסך הגדרת סיסמה ראשונית (רק לסופר אדמין שעוד לא הגדיר)
  if (setupMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="relative w-full max-w-sm rounded-2xl border-2 border-amber-700 bg-stone-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👑</span>
              <h2 className="text-xl font-bold text-amber-200">הגדרת סיסמת סופר אדמין</h2>
            </div>
            <button onClick={onClose} className="text-stone-500 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg bg-amber-950/30 border border-amber-800/50 p-3 text-xs text-amber-200 leading-relaxed">
              שלום <span className="font-bold">{currentUser}</span> 👑<br/>
              זוהי הכניסה הראשונה שלך כסופר אדמין. בחר סיסמה אישית - היא תישמר מוצפנת ב-Firebase ולא בקוד.<br/>
              <span className="text-amber-400 font-bold">חשוב: שמור את הסיסמה במקום בטוח!</span>
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1">סיסמה חדשה (לפחות 6 תווים)</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus
                className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white focus:border-amber-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1">אימות סיסמה</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetupSubmit()}
                className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white focus:border-amber-600 focus:outline-none" />
            </div>
            {error && <div className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</div>}
            <button onClick={handleSetupSubmit} disabled={busy}
              className="w-full rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-3 font-bold text-white hover:from-amber-500 hover:to-amber-600 transition disabled:opacity-50">
              {busy ? 'שומר...' : '👑 קבע סיסמה והתחבר'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-2xl border border-amber-900/50 bg-stone-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold text-amber-200">כניסת מנהל</h2>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-amber-950/30 border border-amber-800/50 p-3">
            <div className="text-xs text-amber-400 mb-1">המערכת תזהה אותך כמנהל</div>
            <div className="text-base font-bold text-amber-200">{currentUser}</div>
            {isSuperAdminCandidate && (
              <div className="text-xs text-amber-400 mt-1">👑 סופר אדמין - השתמש בסיסמה האישית שלך</div>
            )}
          </div>
          <div>
            <label className="block text-xs text-stone-400 mb-1">סיסמת מנהל</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white focus:border-amber-600 focus:outline-none" />
          </div>
          {error && <div className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</div>}
          <button onClick={handleSubmit} disabled={busy}
            className="w-full rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-3 font-bold text-white hover:from-amber-500 hover:to-amber-600 transition disabled:opacity-50">
            {busy ? 'בודק...' : 'הפוך למנהל'}
          </button>
          <div className="text-xs text-stone-500 text-center">תיזכר במכשיר הזה</div>
        </div>
      </div>
    </div>
  );
};

// ===== Tooltip =====
const InfoTooltip = ({ text }) => {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        className="text-stone-500 hover:text-amber-400 transition align-middle">
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-stone-700 bg-stone-900 p-3 text-xs text-stone-300 shadow-2xl z-50 normal-case font-normal" style={{ direction: 'rtl', letterSpacing: 'normal' }}>
          {text}
          <div className="absolute -bottom-1 right-3 h-2 w-2 rotate-45 bg-stone-900 border-b border-l border-stone-700" />
        </div>
      )}
    </span>
  );
};

// ===== פודיום =====
const PodiumCard = ({ rank, player }) => {
  const rankBorders = ['border-amber-500/60', 'border-stone-400/50', 'border-orange-600/50'];
  const rankGlow = ['shadow-amber-900/40', 'shadow-stone-700/30', 'shadow-orange-900/40'];
  const rankIcons = ['👑', '🥈', '🥉'];
  return (
    <div className={`relative rounded-2xl border-2 ${rankBorders[rank - 1]} bg-gradient-to-br from-stone-900 to-stone-950 p-5 shadow-2xl ${rankGlow[rank - 1]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-stone-500">מקום {rank}</div>
          <div className="mt-1 text-3xl font-extrabold text-white">{player.name}</div>
        </div>
        <div className="text-5xl">{rankIcons[rank - 1]}</div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className={`text-4xl font-extrabold tabular-nums ${player.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {player.total >= 0 ? '+' : ''}{player.total}
        </span>
        <span className="text-stone-500 text-sm">₪</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-stone-900/80 border border-stone-800 p-2 text-center">
          <div className="text-stone-500">מפגשים</div>
          <div className="font-bold text-stone-100">{player.sessions}</div>
        </div>
        <div className="rounded-lg bg-stone-900/80 border border-stone-800 p-2 text-center">
          <div className="text-stone-500">% ניצחון</div>
          <div className="font-bold text-emerald-400">{player.winRate.toFixed(0)}%</div>
        </div>
        <div className="rounded-lg bg-stone-900/80 border border-stone-800 p-2 text-center">
          <div className="text-stone-500">רצף מנצח</div>
          <div className="font-bold text-amber-400">{player.maxStreak}</div>
        </div>
      </div>
    </div>
  );
};

// ===== סטטיסטיקות מיוחדות =====
const SpecialStats = ({ stats }) => {
  const mvp = stats[0];
  const worst = stats[stats.length - 1];
  const mostConsistent = [...stats].filter(s => s.sessions >= 5).sort((a, b) => a.stdDev - b.stdDev)[0];
  const mostVolatile = [...stats].filter(s => s.sessions >= 5).sort((a, b) => b.stdDev - a.stdDev)[0];
  const bestStreak = [...stats].sort((a, b) => b.maxStreak - a.maxStreak)[0];
  const mostActive = [...stats].sort((a, b) => b.sessions - a.sessions)[0];

  const cards = [
    { icon: Crown, label: 'המוביל בטבלה', name: mvp?.name, value: `${mvp?.total >= 0 ? '+' : ''}${mvp?.total} ₪`,
      color: 'from-amber-900/30 to-yellow-900/30 border-amber-700/50 text-amber-300',
      tooltip: 'השחקן עם הרווח המצטבר הגבוה ביותר בעונה.' },
    { icon: Skull, label: 'התחתון בטבלה', name: worst?.name, value: `${worst?.total} ₪`,
      color: 'from-rose-900/30 to-red-900/30 border-rose-700/50 text-rose-300',
      tooltip: 'השחקן עם ההפסד המצטבר הגבוה ביותר בעונה.' },
    { icon: Target, label: 'השחקן היציב ביותר', name: mostConsistent?.name, value: `סטיית תקן: ${mostConsistent?.stdDev.toFixed(0)}`,
      color: 'from-blue-900/30 to-indigo-900/30 border-blue-700/50 text-blue-300',
      tooltip: 'סטיית תקן נמוכה = התוצאות שלו במפגשים דומות זו לזו. אין לו "ערבים גדולים" או "מפולות". משחק ממוצע עקבי. (מינימום 5 מפגשים)' },
    { icon: Flame, label: 'השחקן התנודתי ביותר', name: mostVolatile?.name, value: `סטיית תקן: ${mostVolatile?.stdDev.toFixed(0)}`,
      color: 'from-orange-900/30 to-red-900/30 border-orange-700/50 text-orange-300',
      tooltip: 'סטיית תקן גבוהה = התוצאות שלו במפגשים קיצוניות. ערב אחד ניצחון גדול, הבא הפסד גדול. (מינימום 5 מפגשים)' },
    { icon: TrendingUp, label: 'הרצף המנצח הארוך', name: bestStreak?.name, value: `${bestStreak?.maxStreak} ערבים ברצף`,
      color: 'from-emerald-900/30 to-green-900/30 border-emerald-700/50 text-emerald-300',
      tooltip: 'מספר הערבים המקסימלי ברצף שהשחקן סיים ברווח (ללא הפסד באמצע).' },
    { icon: Users, label: 'הנוכחות הגבוהה ביותר', name: mostActive?.name, value: `${mostActive?.sessions} מפגשים`,
      color: 'from-violet-900/30 to-purple-900/30 border-violet-700/50 text-violet-300',
      tooltip: 'השחקן שהגיע לכמות הגדולה ביותר של מפגשים בעונה.' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className={`rounded-2xl border bg-gradient-to-br ${c.color} p-4 backdrop-blur`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs opacity-90">
                <Icon className="h-4 w-4" />
                {c.label}
              </div>
              <InfoTooltip text={c.tooltip} />
            </div>
            <div className="text-lg font-extrabold">{c.name || '—'}</div>
            <div className="text-sm tabular-nums opacity-80 mt-0.5">{c.value}</div>
          </div>
        );
      })}
    </div>
  );
};
// ===== בורר שחקנים =====
const PlayerPicker = ({ allPlayers, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const toggle = (name) => {
    if (selected.includes(name)) onChange(selected.filter(n => n !== name));
    else onChange([...selected, name]);
  };
  
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-200 hover:bg-stone-800 transition">
        <Filter className="h-4 w-4" />
        <span>{selected.length} שחקנים</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl border border-stone-700 bg-stone-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-amber-400" />
                <h3 className="text-base font-bold text-amber-200">בחר שחקנים</h3>
                <span className="text-xs text-stone-500">({selected.length} נבחרו)</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* כפתורי בחירה מהירה */}
            <div className="border-b border-stone-800 p-3 flex gap-1.5 flex-wrap">
              <button onClick={() => onChange(allPlayers.map(p => p.name))} className="text-xs rounded-md bg-stone-800 px-3 py-1.5 text-stone-300 hover:bg-stone-700 font-bold">הכל</button>
              <button onClick={() => onChange(allPlayers.slice(0, 3).map(p => p.name))} className="text-xs rounded-md bg-amber-900/40 px-3 py-1.5 text-amber-300 hover:bg-amber-900/60 font-bold">טופ 3</button>
              <button onClick={() => onChange(allPlayers.slice(0, 5).map(p => p.name))} className="text-xs rounded-md bg-amber-900/40 px-3 py-1.5 text-amber-300 hover:bg-amber-900/60 font-bold">טופ 5</button>
              <button onClick={() => onChange(allPlayers.slice(0, 8).map(p => p.name))} className="text-xs rounded-md bg-amber-900/40 px-3 py-1.5 text-amber-300 hover:bg-amber-900/60 font-bold">טופ 8</button>
              <button onClick={() => onChange([])} className="text-xs rounded-md bg-stone-800 px-3 py-1.5 text-stone-300 hover:bg-stone-700 font-bold">ניקוי</button>
            </div>
            
            {/* רשימת שחקנים */}
            <div className="overflow-y-auto p-2 flex-1">
              {allPlayers.map(p => {
                const isSelected = selected.includes(p.name);
                return (
                  <label key={p.name} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition ${isSelected ? 'bg-amber-950/30 hover:bg-amber-950/50' : 'hover:bg-stone-800'}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggle(p.name)}
                      className="w-4 h-4 rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-500 flex-shrink-0" />
                    <span className="text-sm text-stone-100 font-bold flex-1 text-right">{p.name}</span>
                    <span className={`text-xs tabular-nums font-bold flex-shrink-0 ${p.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.total >= 0 ? '+' : ''}{p.total}
                    </span>
                  </label>
                );
              })}
            </div>
            
            {/* כפתור סגירה */}
            <div className="border-t border-stone-800 p-3">
              <button onClick={() => setOpen(false)}
                className="w-full rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 py-2.5 font-bold text-white hover:from-amber-500 hover:to-amber-600 transition">
                סיום ({selected.length} נבחרו)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ===== גרף רווח מצטבר =====
const CumulativeChart = ({ sessions, allSessions, stats, fullscreen, onFullscreenToggle, selectedPlayers, onPlayersChange, isMobile }) => {
  // 🆕 מצב תצוגה אופקית - משתמש מסובב את הטלפון לרוחב לראות יותר טוב
  const [landscape, setLandscape] = useState(false);
  
  // 🆕 כל השנים הזמינות בהיסטוריה
  const allYears = useMemo(() => {
    const years = new Set();
    const source = allSessions || sessions || [];
    source.forEach(s => {
      const y = s.season || (s.date ? new Date(s.date).getFullYear() : null);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a); // חדשות למעלה
  }, [allSessions, sessions]);
  
  // 🆕 שנים נבחרות לסינון - דיפולט: כל השנים
  const [selectedYears, setSelectedYears] = useState([]);
  useEffect(() => {
    if (allYears.length > 0 && selectedYears.length === 0) {
      // ברירת מחדל: כל השנים
      setSelectedYears([...allYears]);
    }
  }, [allYears.length]);
  
  // ערבים מסוננים לפי השנים שנבחרו
  const filteredSessions = useMemo(() => {
    const source = allSessions || sessions || [];
    if (selectedYears.length === 0) return source;
    return source.filter(s => {
      const y = s.season || (s.date ? new Date(s.date).getFullYear() : null);
      return y && selectedYears.includes(y);
    });
  }, [allSessions, sessions, selectedYears]);
  
  const data = useMemo(() => {
    const points = calculateCumulative(filteredSessions, selectedPlayers);
    if (points.length > 0) {
      // 🦢 מסמן את הנקודה האחרונה - שם יוצג הברבור
      points[points.length - 1] = { ...points[points.length - 1], _isLast: true };
    }
    return points;
  }, [filteredSessions, selectedPlayers]);
  
  // 🆕 שחקנים מסודרים לפי רווח על השנים הנבחרות (לכפתורי טופ X)
  // כשמסוננות שנים - הטופ נחשב לפי השנים האלה בלבד
  const playersForPicker = useMemo(() => {
    // אם אין סינון שנים פעיל, השתמש ב-stats כרגיל
    if (!allSessions || selectedYears.length === 0 || selectedYears.length === allYears.length) {
      // אם הכל נבחר - חישוב טופ על כל ההיסטוריה
      if (selectedYears.length > 1 || (selectedYears.length === allYears.length && allYears.length > 1)) {
        const totals = {};
        const sessions_count = {};
        filteredSessions.forEach(s => {
          if (!s.results) return;
          Object.entries(s.results).forEach(([name, amount]) => {
            totals[name] = (totals[name] || 0) + Number(amount);
            sessions_count[name] = (sessions_count[name] || 0) + 1;
          });
        });
        return Object.entries(totals)
          .map(([name, total]) => ({ name, total, sessions: sessions_count[name] || 0 }))
          .sort((a, b) => b.total - a.total);
      }
      return stats;
    }
    
    // יש סינון שנים - מחשב טוטאל על השנים הנבחרות
    const totals = {};
    const sessions_count = {};
    filteredSessions.forEach(s => {
      if (!s.results) return;
      Object.entries(s.results).forEach(([name, amount]) => {
        totals[name] = (totals[name] || 0) + Number(amount);
        sessions_count[name] = (sessions_count[name] || 0) + 1;
      });
    });
    return Object.entries(totals)
      .map(([name, total]) => ({ name, total, sessions: sessions_count[name] || 0 }))
      .sort((a, b) => b.total - a.total);
  }, [filteredSessions, selectedYears, allYears, allSessions, stats]);
  
  // toggle של שנה בבורר
  const toggleYear = (year) => {
    setSelectedYears(prev => {
      // אם "הכל" דלוק - לחיצה משאירה רק את השנה הזאת
      if (prev.length === allYears.length) {
        return [year];
      }
      // אם השנה כבר נבחרה
      if (prev.includes(year)) {
        const newYears = prev.filter(y => y !== year);
        // אם זאת הייתה האחרונה - חוזרים להכל
        return newYears.length === 0 ? [...allYears] : newYears;
      }
      // הוספת שנה
      return [...prev, year].sort((a, b) => b - a);
    });
  };
  const selectAllYears = () => setSelectedYears([...allYears]);
  const colors = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#2dd4bf', '#f87171', '#c084fc', '#facc15', '#4ade80', '#38bdf8', '#fb7185', '#818cf8', '#f59e0b'];
  
  // 🦢 Dot מותאם - מציג ברבור רק בנקודה האחרונה של כל קו
  // כל ברבור עם רקע צבעוני שתואם לצבע הקו - כדי להבדיל בין שחקנים
  const SWAN_VARIANTS_CHART = [SWAN_FLY_1, SWAN_FLY_2, SWAN_FLY_3];
  const SwanDot = (props) => {
    const { cx, cy, payload, dataKey, stroke, value } = props;
    if (cx === undefined || cy === undefined || cx === null || cy === null) return null;
    if (value === undefined || value === null) return null;
    if (!payload || !payload._isLast) return null;
    
    const size = 44;
    const halfSize = size / 2;
    const ringRadius = halfSize + 2;
    // 🆕 ברבור גדול יותר בתוך העיגול - קופץ החוצה מעט (כמו מדבקה)
    const swanSize = size + 10; // קצת גדול מהעיגול
    const swanOffset = (size - swanSize) / 2;
    // 🆕 בחירה אקראית יציבה לפי dataKey - כל שחקן יקבל אותה תמונה תמיד
    const variantIdx = dataKey ? Math.abs(dataKey.charCodeAt(0)) % 3 : 0;
    const swanImg = SWAN_VARIANTS_CHART[variantIdx];
    
    return (
      <g transform={`translate(${cx - halfSize}, ${cy - halfSize})`} style={{ pointerEvents: 'none' }}>
        {/* רקע צבעוני - עיגול בצבע השחקן */}
        <circle 
          cx={halfSize} 
          cy={halfSize} 
          r={ringRadius} 
          fill={stroke}
          opacity="0.92"
          stroke="white"
          strokeWidth="2"
          style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.5))` }}
        />
        {/* ברבור - גדול ויפה */}
        <image 
          href={swanImg}
          x={swanOffset}
          y={swanOffset}
          width={swanSize}
          height={swanSize}
          preserveAspectRatio="xMidYMid meet"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
        />
      </g>
    );
  };
  
  // במובייל - פחות שחקנים כברירת מחדל אם יותר מדי
  const chartHeight = fullscreen ? 'calc(100vh - 180px)' : (isMobile ? 280 : 400);

  return (
    <div className={`rounded-2xl border border-stone-800 bg-stone-950/50 p-4 md:p-6 backdrop-blur ${fullscreen ? 'h-full' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {allSessions ? 'רווח מצטבר לאורך זמן' : 'רווח מצטבר השנה'}
          </h3>
          <InfoTooltip text="הציר האופקי: תאריכי המפגשים. הציר האנכי: הרווח המצטבר של השחקן. קו עולה = צובר רווחים. קו יורד = צובר הפסדים." />
        </div>
        <div className="flex items-center gap-2">
          <PlayerPicker allPlayers={playersForPicker} selected={selectedPlayers} onChange={onPlayersChange} />
          {/* 🆕 כפתור תצוגה אופקית - מופיע רק במצב המוגדל (fullscreen) */}
          {isMobile && fullscreen && (
            <button onClick={() => setLandscape(true)}
              className="rounded-lg border border-stone-700 bg-stone-900 p-2 text-stone-300 hover:bg-stone-800 transition" title="תצוגה אופקית">
              <span style={{ display: 'inline-block', transform: 'rotate(90deg)', fontSize: '14px' }}>📱</span>
            </button>
          )}
          <button onClick={onFullscreenToggle}
            className={`rounded-lg border p-2 transition ${
              fullscreen
                ? 'border-red-600 bg-red-900/40 text-red-200 hover:bg-red-800/60'
                : 'border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800'
            }`}
            title={fullscreen ? 'סגור תצוגה מוגדלת' : 'מסך מלא'}>
            {fullscreen ? <X className="h-5 w-5" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {/* 🆕 בורר שנים */}
      {allYears.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <span className="text-xs text-stone-500 font-bold">שנים:</span>
          <button
            onClick={selectAllYears}
            className={`rounded-md px-2 py-1 text-xs font-bold border transition ${
              selectedYears.length === allYears.length
                ? 'bg-amber-700 border-amber-600 text-white'
                : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
            }`}>
            הכל
          </button>
          {allYears.map(y => (
            <button
              key={y}
              onClick={() => toggleYear(y)}
              className={`rounded-md px-2 py-1 text-xs font-bold border transition tabular-nums ${
                selectedYears.includes(y) && selectedYears.length < allYears.length
                  ? 'bg-amber-700 border-amber-600 text-white'
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
              }`}>
              {y}
            </button>
          ))}
        </div>
      )}
      
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: -15, bottom: isMobile ? 40 : 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
            <XAxis dataKey="label" stroke="#78716c" style={{ fontSize: isMobile ? '10px' : '11px' }} 
              angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 50 : 30} />
            <YAxis stroke="#78716c" style={{ fontSize: isMobile ? '10px' : '11px' }} width={45} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', fontFamily: 'Assistant', fontSize: '12px' }} 
              labelStyle={{ color: '#fbbf24' }}
              labelFormatter={(label, items) => {
                // 🆕 הצגת שנה בכותרת ה-Tooltip
                if (items && items[0]?.payload?.labelWithYear) {
                  return items[0].payload.labelWithYear;
                }
                return label;
              }}
            />
            {!isMobile && <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Assistant' }} />}
            {selectedPlayers.map((name, i) => (
              <Line 
                key={name} 
                type="monotone" 
                dataKey={name} 
                stroke={colors[i % colors.length]} 
                strokeWidth={3}
                dot={<SwanDot />} 
                activeDot={{ r: 6 }}
                animationDuration={3500}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* לגנדה ידנית במובייל - מתחת לגרף */}
      {isMobile && selectedPlayers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 justify-center text-xs">
          {selectedPlayers.map((name, i) => (
            <div key={name} className="flex items-center gap-1.5 bg-stone-900/60 rounded-full px-2.5 py-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="text-stone-300">{name}</span>
            </div>
          ))}
        </div>
      )}
      {selectedPlayers.length === 0 && (
        <div className="text-center text-stone-500 text-sm py-8">בחר שחקנים להצגה בגרף</div>
      )}
      
      {/* 🔄 תצוגה אופקית (landscape) - מודל מסובב 90° */}
      {landscape && (
        <div 
          className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
        >
          {/* תוכן הגרף מסובב 90 מעלות - תופס את כל המסך כאופקי */}
          <div 
            style={{
              width: '100vh',
              height: '100vw',
              transform: 'rotate(90deg)',
              position: 'relative',
            }}
            className="bg-stone-950 p-4"
          >
            {/* כפתור X בולט בפינה - עיצוב אדום, גדול, עם z-index גבוה */}
            <button 
              onClick={() => setLandscape(false)}
              style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 250 }}
              className="rounded-lg border-2 border-red-600 bg-red-900/80 p-3 text-red-100 hover:bg-red-800 shadow-lg"
              title="סגור תצוגה אופקית"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="flex items-center justify-between mb-3 pr-16">
              <h3 className="text-lg font-bold text-amber-200">רווח מצטבר השנה - תצוגה אופקית</h3>
            </div>
            <div style={{ width: '100%', height: 'calc(100% - 50px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: -15, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                  <XAxis dataKey="label" stroke="#78716c" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#78716c" style={{ fontSize: '12px' }} width={45} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', fontFamily: 'Assistant', fontSize: '12px' }} 
                    labelStyle={{ color: '#fbbf24' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Assistant' }} />
                  {selectedPlayers.map((name, i) => (
                    <Line 
                      key={name} 
                      type="monotone" 
                      dataKey={name} 
                      stroke={colors[i % colors.length]} 
                      strokeWidth={3}
                      dot={<SwanDot />} 
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 📊 מסך ניתוח שימוש - סופר אדמין בלבד
// מציג סטטיסטיקות מצטברות של שימוש המשתמשים באפליקציה
// טווחים: 7 / 30 / 90 / 180 ימים אחרונים
// ============================================================

// ===== מילון תרגום למסכים ופעולות =====
const ANALYTICS_SCREEN_LABELS = {
  dashboard: '🏠 דשבורד',
  table: '🏆 טבלת דירוג',
  periodic: '📅 תקופות',
  champions: '🏆 MVP',
  charts: '📈 תובנות',
  gallery: '🖼️ גלריה',
  history: '📜 היסטוריה',
  quotes: '🪶 אמרות כנף',
  registration: '📝 רישום לערב',
  hosting: '🏠 לוח אירוחים',
};

const ANALYTICS_ACTION_LABELS = {
  register_evening: '✅ הרשמה לערב',
  unregister_evening: '❌ ביטול הרשמה',
  open_combos: '🃏 פתח קומבינציות',
  view_player_stats: '👤 לחץ על שחקן',
  change_year_filter: '📅 שינוי שנה',
  change_player_filter: '🔄 שינוי שחקן בגרף',
  open_admin_menu: '👑 פתח תפריט אדמין',
  push_subscribe: '🔔 הפעיל התראות',
  upload_photo: '📸 העלה תמונה',
  add_quote: '💬 הוסיף ציטוט',
  view_yearly_report: '📊 דוח שנתי',
  open_live_session: '🎰 פתח לייב',
  toggle_landscape: '📱 תצוגה אופקית',
  toggle_fullscreen: '⛶ מסך מלא בגרף',
};

const AnalyticsModal = ({ isOpen, onClose, isSuperAdmin, activePlayers = [] }) => {
  const [days, setDays] = useState(7);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await loadAnalyticsHistory(days);
        if (!cancelled) setHistory(data || []);
      } catch (e) {
        console.warn('שגיאה בטעינת היסטוריית שימוש:', e);
        if (!cancelled) setHistory([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isOpen, days]);
  
  // אגרגציה של הנתונים
  const aggregated = useMemo(() => {
    const result = {
      totalSessions: 0,
      totalUsers: new Set(),
      totalSeconds: 0,
      perUser: {},          // { userName: { sessions, seconds, screens, actions, lastSeen, days, device } }
      screenCounts: {},     // { screenName: count }
      actionCounts: {},     // { actionName: count }
      hourlyActivity: Array(24).fill(0), // פעילות לפי שעה
      dailyTimeline: [],    // [{ date, sessions, users }]
    };
    
    history.forEach(dayData => {
      const dayUsers = new Set();
      let daySessions = 0;
      
      Object.entries(dayData.users || {}).forEach(([userName, userData]) => {
        result.totalUsers.add(userName);
        dayUsers.add(userName);
        result.totalSessions += userData.sessions || 0;
        result.totalSeconds += userData.totalSeconds || 0;
        daySessions += userData.sessions || 0;
        
        if (!result.perUser[userName]) {
          result.perUser[userName] = {
            sessions: 0,
            seconds: 0,
            screens: {},
            actions: {},
            lastSeen: null,
            firstSeen: null,
            days: new Set(),
            device: userData.device || 'Unknown',
          };
        }
        const u = result.perUser[userName];
        u.sessions += userData.sessions || 0;
        u.seconds += userData.totalSeconds || 0;
        u.days.add(dayData.date);
        u.device = userData.device || u.device;
        
        // lastSeen - הכי אחרון
        if (userData.lastSeen && (!u.lastSeen || userData.lastSeen > u.lastSeen)) {
          u.lastSeen = userData.lastSeen;
        }
        if (userData.firstSeen && (!u.firstSeen || userData.firstSeen < u.firstSeen)) {
          u.firstSeen = userData.firstSeen;
        }
        
        // אגרגציה של מסכים
        Object.entries(userData.screens || {}).forEach(([screen, count]) => {
          u.screens[screen] = (u.screens[screen] || 0) + count;
          result.screenCounts[screen] = (result.screenCounts[screen] || 0) + count;
        });
        
        // אגרגציה של פעולות
        Object.entries(userData.actions || {}).forEach(([action, count]) => {
          u.actions[action] = (u.actions[action] || 0) + count;
          result.actionCounts[action] = (result.actionCounts[action] || 0) + count;
        });
        
        // שעת פעילות (לפי lastSeen)
        if (userData.lastSeen) {
          try {
            const hour = new Date(userData.lastSeen).getHours();
            if (hour >= 0 && hour < 24) result.hourlyActivity[hour]++;
          } catch {}
        }
      });
      
      result.dailyTimeline.push({
        date: dayData.date,
        sessions: daySessions,
        users: dayUsers.size,
      });
    });
    
    result.dailyTimeline.sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  }, [history]);
  
  // המרה לרשימת משתמשים ממוינת (לפי מס' כניסות יורד)
  const userList = useMemo(() => {
    return Object.entries(aggregated.perUser)
      .map(([name, data]) => ({
        name,
        ...data,
        daysCount: data.days.size,
        favoriteScreen: Object.entries(data.screens).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [aggregated]);
  
  // שחקנים לא פעילים - מהרשימה של השחקנים הפעילים בקבוצה
  const inactiveUsers = useMemo(() => {
    return (activePlayers || []).filter(p => !aggregated.perUser[p]);
  }, [aggregated, activePlayers]);
  
  // נתונים לגרף עוגה - מסכים פופולריים
  const screenPieData = useMemo(() => {
    return Object.entries(aggregated.screenCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([screen, count]) => ({
        name: ANALYTICS_SCREEN_LABELS[screen] || screen,
        value: count,
      }));
  }, [aggregated]);
  
  // נתונים לגרף עמודות - שעות פעילות
  const hourlyBarData = useMemo(() => {
    return aggregated.hourlyActivity.map((count, hour) => ({
      hour: `${hour}:00`,
      פעילות: count,
    }));
  }, [aggregated]);
  
  // נתונים לגרף קווי - פעילות לאורך זמן
  const timelineData = useMemo(() => {
    return aggregated.dailyTimeline.map(d => ({
      date: d.date.slice(5), // MM-DD
      'כניסות': d.sessions,
      'משתמשים': d.users,
    }));
  }, [aggregated]);
  
  // תובנות אוטומטיות
  const insights = useMemo(() => {
    const items = [];
    if (userList.length === 0) return items;
    
    // המשתמש הכי פעיל
    if (userList[0]) {
      items.push(`👑 הכי פעיל: ${userList[0].name} (${userList[0].sessions} כניסות)`);
    }
    
    // זמן ממוצע למשתמש
    const avgMinutes = aggregated.totalUsers.size > 0 
      ? Math.round((aggregated.totalSeconds / aggregated.totalUsers.size) / 60) 
      : 0;
    if (avgMinutes > 0) {
      items.push(`⏱️ ממוצע ${avgMinutes} דקות למשתמש`);
    }
    
    // שעת שיא
    const peakHour = aggregated.hourlyActivity.indexOf(Math.max(...aggregated.hourlyActivity));
    if (aggregated.hourlyActivity[peakHour] > 0) {
      items.push(`🕐 שעת שיא: ${peakHour}:00`);
    }
    
    // המסך הפופולרי ביותר
    const topScreen = Object.entries(aggregated.screenCounts).sort((a, b) => b[1] - a[1])[0];
    if (topScreen) {
      items.push(`📊 מסך מועדף: ${ANALYTICS_SCREEN_LABELS[topScreen[0]] || topScreen[0]} (${topScreen[1]} צפיות)`);
    }
    
    // שחקנים לא פעילים
    if (inactiveUsers.length > 0) {
      items.push(`👻 ${inactiveUsers.length} שחקנים לא נכנסו ב-${days} הימים האחרונים`);
    }
    
    return items;
  }, [userList, aggregated, inactiveUsers, days]);
  
  if (!isSuperAdmin || !isOpen) return null;
  
  // צבעים לגרף עוגה
  const PIE_COLORS = ['#fbbf24', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#06b6d4', '#84cc16'];
  
  // פורמט זמן - שניות / דקות מדויקות / שעות
  const formatTime = (seconds) => {
    if (!seconds || seconds < 1) return '0 ש׳';
    // פחות מדקה - שניות מלאות
    if (seconds < 60) return `${Math.round(seconds)} ש׳`;
    // פחות מ-10 דקות - דקות עם עשיריות
    if (seconds < 600) {
      const mins = (seconds / 60).toFixed(1);
      return `${mins} ד׳`;
    }
    // פחות משעה - דקות שלמות
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} ד׳`;
    // יותר משעה
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${String(mins).padStart(2, '0')} ש״ע`;
  };
  
  // פורמט תאריך אחרון
  const formatLastSeen = (iso) => {
    if (!iso) return 'לא ידוע';
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now - date;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMin < 1) return 'עכשיו';
      if (diffMin < 60) return `לפני ${diffMin} ד׳`;
      if (diffHours < 24) return `לפני ${diffHours} ש׳`;
      if (diffDays < 7) return `לפני ${diffDays} ימים`;
      return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
      return iso.slice(0, 10);
    }
  };
  
  return (
    <div dir="rtl" className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-stone-950 rounded-2xl border-2 border-amber-700/50 w-full max-w-3xl my-4" onClick={e => e.stopPropagation()}>
        {/* כותרת */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-stone-800 bg-gradient-to-l from-amber-950/40 to-stone-950 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="text-lg font-extrabold text-amber-200">ניתוח שימוש</h2>
              <div className="text-xs text-stone-400">סופר אדמין בלבד 👑</div>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* בורר טווח */}
          <div className="flex flex-wrap gap-2">
            {[7, 30, 90, 180].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-lg py-1.5 px-3 text-xs font-bold transition ${
                  days === d
                    ? 'bg-amber-700 text-white'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                {d} ימים
              </button>
            ))}
          </div>
          
          {loading ? (
            <div className="text-center py-12 text-stone-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              טוען נתונים...
            </div>
          ) : history.length === 0 || aggregated.totalSessions === 0 ? (
            <div className="rounded-lg bg-stone-900/40 border border-stone-700 p-6 text-center">
              <div className="text-3xl mb-2">📭</div>
              <div className="text-sm text-stone-300 font-bold mb-1">אין נתונים עדיין</div>
              <div className="text-xs text-stone-500">
                המערכת התחילה לתעד שימוש מרגע העדכון.<br/>
                חזור לכאן בעוד יום-יומיים לראות נתונים ראשונים.
              </div>
            </div>
          ) : (
            <>
              {/* סקירה כללית */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="rounded-lg bg-stone-900 border border-stone-700 p-3 text-center">
                  <div className="text-xs text-stone-400 mb-1">משתמשים</div>
                  <div className="text-2xl font-extrabold text-amber-300">{aggregated.totalUsers.size}</div>
                </div>
                <div className="rounded-lg bg-stone-900 border border-stone-700 p-3 text-center">
                  <div className="text-xs text-stone-400 mb-1">סה״כ כניסות</div>
                  <div className="text-2xl font-extrabold text-emerald-300">{aggregated.totalSessions}</div>
                </div>
                <div className="rounded-lg bg-stone-900 border border-stone-700 p-3 text-center">
                  <div className="text-xs text-stone-400 mb-1">זמן כולל</div>
                  <div className="text-2xl font-extrabold text-blue-300">{formatTime(aggregated.totalSeconds)}</div>
                </div>
                <div className="rounded-lg bg-stone-900 border border-stone-700 p-3 text-center">
                  <div className="text-xs text-stone-400 mb-1">לא פעילים</div>
                  <div className="text-2xl font-extrabold text-rose-300">{inactiveUsers.length}</div>
                </div>
              </div>
              
              {/* תובנות */}
              {insights.length > 0 && (
                <div className="rounded-lg bg-amber-950/20 border border-amber-800/40 p-3">
                  <div className="text-xs text-amber-300 font-bold mb-2">💡 תובנות</div>
                  <div className="space-y-1">
                    {insights.map((tip, i) => (
                      <div key={i} className="text-xs text-stone-300">{tip}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* גרף עמודות אופקי - מסכים פופולריים */}
              {screenPieData.length > 0 && (
                <div className="rounded-lg bg-stone-900/50 border border-stone-700 p-3">
                  <div className="text-xs text-stone-400 font-bold mb-2">📊 מסכים פופולריים</div>
                  {(() => {
                    const maxNameLen = Math.max(...screenPieData.map(d => d.name.length));
                    const yAxisWidth = Math.min(180, Math.max(120, maxNameLen * 9));
                    return (
                  <div style={{ width: '100%', height: Math.max(200, screenPieData.length * 36 + 50), paddingTop: '8px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={screenPieData} 
                        layout="vertical"
                        margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#292524" horizontal={false} />
                        <XAxis type="number" stroke="#78716c" style={{ fontSize: '10px' }} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          stroke="#d6d3d1" 
                          style={{ fontFamily: 'Assistant' }} 
                          width={yAxisWidth}
                          interval={0}
                          tick={{ fill: '#d6d3d1', fontSize: 11, fontFamily: 'Assistant' }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', fontFamily: 'Assistant', fontSize: '11px' }}
                          cursor={{ fill: 'rgba(251, 191, 36, 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {screenPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                    );
                  })()}
                </div>
              )}
              
              {/* גרף עמודות - שעות שיא */}
              {hourlyBarData.some(d => d.פעילות > 0) && (
                <div className="rounded-lg bg-stone-900/50 border border-stone-700 p-3">
                  <div className="text-xs text-stone-400 font-bold mb-2">⏰ שעות שיא של פעילות</div>
                  <div style={{ width: '100%', height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyBarData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                        <XAxis dataKey="hour" stroke="#78716c" style={{ fontSize: '9px' }} interval={2} />
                        <YAxis stroke="#78716c" style={{ fontSize: '10px' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', fontFamily: 'Assistant', fontSize: '11px' }}
                        />
                        <Bar dataKey="פעילות" fill="#fbbf24" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {/* גרף קווי - פעילות לאורך זמן */}
              {timelineData.length > 1 && (
                <div className="rounded-lg bg-stone-900/50 border border-stone-700 p-3">
                  <div className="text-xs text-stone-400 font-bold mb-2">📈 פעילות לאורך זמן</div>
                  <div style={{ width: '100%', height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                        <XAxis dataKey="date" stroke="#78716c" style={{ fontSize: '9px' }} />
                        <YAxis stroke="#78716c" style={{ fontSize: '10px' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', fontFamily: 'Assistant', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'Assistant' }} />
                        <Line type="monotone" dataKey="כניסות" stroke="#fbbf24" strokeWidth={2} />
                        <Line type="monotone" dataKey="משתמשים" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {/* פירוט לפי משתמש */}
              {userList.length > 0 && (
                <div className="rounded-lg bg-stone-900/50 border border-stone-700">
                  <div className="text-xs text-stone-400 font-bold p-3 border-b border-stone-800">
                    👥 פירוט לפי משתמש ({userList.length})
                  </div>
                  <div className="divide-y divide-stone-800 max-h-96 overflow-y-auto">
                    {userList.map((user, idx) => {
                      const isExpanded = expandedUser === user.name;
                      return (
                        <div key={user.name} className="p-3">
                          <button 
                            onClick={() => setExpandedUser(isExpanded ? null : user.name)}
                            className="w-full text-right"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-stone-500 text-xs w-5">#{idx + 1}</span>
                                <span className="font-bold text-amber-200">{user.name}</span>
                                {user.device === 'Mobile' && <span className="text-xs">📱</span>}
                                {user.device === 'Desktop' && <span className="text-xs">💻</span>}
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-emerald-400 font-bold">{user.sessions} כניסות</span>
                                <span className="text-blue-400">{formatTime(user.seconds)}</span>
                                <ChevronDown className={`h-4 w-4 text-stone-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-stone-500">
                              <span>📅 {formatLastSeen(user.lastSeen)}</span>
                              <span>📆 {user.daysCount} ימים</span>
                              {user.favoriteScreen && (
                                <span>⭐ {ANALYTICS_SCREEN_LABELS[user.favoriteScreen] || user.favoriteScreen}</span>
                              )}
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-stone-800 space-y-2">
                              {/* מסכים */}
                              {Object.keys(user.screens).length > 0 && (
                                <div>
                                  <div className="text-[10px] text-stone-500 font-bold mb-1">מסכים שצפה:</div>
                                  <div className="space-y-0.5">
                                    {Object.entries(user.screens).sort((a, b) => b[1] - a[1]).map(([s, c]) => (
                                      <div key={s} className="flex justify-between text-xs">
                                        <span className="text-stone-300">{ANALYTICS_SCREEN_LABELS[s] || s}</span>
                                        <span className="text-amber-400 font-bold">{c}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* פעולות */}
                              {Object.keys(user.actions).length > 0 && (
                                <div>
                                  <div className="text-[10px] text-stone-500 font-bold mb-1 mt-2">פעולות:</div>
                                  <div className="space-y-0.5">
                                    {Object.entries(user.actions).sort((a, b) => b[1] - a[1]).map(([a, c]) => (
                                      <div key={a} className="flex justify-between text-xs">
                                        <span className="text-stone-300">{ANALYTICS_ACTION_LABELS[a] || a}</span>
                                        <span className="text-emerald-400 font-bold">{c}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* רשימת לא פעילים */}
              {inactiveUsers.length > 0 && (
                <details className="rounded-lg bg-stone-900/40 border border-stone-700/50 overflow-hidden">
                  <summary className="cursor-pointer p-3 text-sm text-stone-300 font-bold hover:bg-stone-900/60 transition select-none">
                    👻 לא נכנסו ב-{days} הימים האחרונים ({inactiveUsers.length})
                  </summary>
                  <div className="p-3 pt-0 flex flex-wrap gap-1.5">
                    {inactiveUsers.map(name => (
                      <span key={name} className="text-xs bg-stone-950 border border-stone-800 rounded-full px-2.5 py-1 text-stone-400">
                        {name}
                      </span>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-stone-800">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-stone-800 hover:bg-stone-700 px-4 py-2.5 text-stone-300 font-bold text-sm transition"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 🛡️ חיווי תקינות טבלאות - מציג ✓ ירוק או ⚠️ אדום
// רק לסופר אדמין. אם יש בעיה - לחיצה פותחת מודל עם פירוט
// ברירת מחדל - בדיקה רק לשנה הנוכחית
// ============================================================
const TableIntegrityIndicator = ({ allSessions, hiddenPlayers, isSuperAdmin }) => {
  const [showModal, setShowModal] = useState(false);
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState(String(currentYear));
  // 🆕 בעיות ידועות - { issueId: { markedAt, markedBy } }
  const [knownIssues, setKnownIssues] = useState({});
  const [loadingKnown, setLoadingKnown] = useState(false);
  
  // 🆕 טעינת בעיות ידועות מ-Firestore בעת טעינה
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fbLoadState(KNOWN_ISSUES_KEY);
        if (!cancelled) setKnownIssues(data || {});
      } catch (e) {
        console.error('שגיאה בטעינת בעיות ידועות:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  
  // 🆕 סימון בעיה כידועה
  const markAsKnown = async (issueId) => {
    setLoadingKnown(true);
    try {
      const updated = {
        ...knownIssues,
        [issueId]: {
          markedAt: new Date().toISOString(),
          markedBy: 'רון',
        },
      };
      await fbSaveState(updated, KNOWN_ISSUES_KEY);
      setKnownIssues(updated);
    } catch (e) {
      console.error('שגיאה בסימון בעיה כידועה:', e);
      alert('שגיאה בשמירה. נסה שוב.');
    }
    setLoadingKnown(false);
  };
  
  // 🆕 ביטול סימון "ידועה"
  const unmarkAsKnown = async (issueId) => {
    setLoadingKnown(true);
    try {
      const updated = { ...knownIssues };
      delete updated[issueId];
      await fbSaveState(updated, KNOWN_ISSUES_KEY);
      setKnownIssues(updated);
    } catch (e) {
      console.error('שגיאה בביטול סימון:', e);
      alert('שגיאה בשמירה. נסה שוב.');
    }
    setLoadingKnown(false);
  };
  
  // לא מציג למשתמשים רגילים
  if (!isSuperAdmin) return null;
  
  // רשימת שנים זמינות מהמפגשים
  const availableYears = useMemo(() => {
    if (!allSessions) return [];
    const years = new Set();
    allSessions.forEach(s => {
      if (s.date) years.add(new Date(s.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allSessions]);
  
  // התוצאה הנוכחית - לפי הפילטר
  const result = useMemo(
    () => validateTablesIntegrity(allSessions, hiddenPlayers, yearFilter),
    [allSessions, hiddenPlayers, yearFilter]
  );
  
  // החיווי בכותרת מציג את הסטטוס לשנה הנוכחית בלבד
  const currentYearResult = useMemo(
    () => validateTablesIntegrity(allSessions, hiddenPlayers, String(currentYear)),
    [allSessions, hiddenPlayers, currentYear]
  );
  
  // 🆕 חלוקה לבעיות חדשות (לא ידועות) ובעיות ידועות
  const { newIssues: currentNewIssues, knownIssuesList: currentKnownIssuesList } = useMemo(() => {
    const newOnes = [];
    const knownOnes = [];
    result.issues.forEach(issue => {
      const id = getIssueId(issue);
      if (knownIssues[id]) {
        knownOnes.push({ ...issue, _id: id, _knownInfo: knownIssues[id] });
      } else {
        newOnes.push({ ...issue, _id: id });
      }
    });
    return { newIssues: newOnes, knownIssuesList: knownOnes };
  }, [result.issues, knownIssues]);
  
  // 🆕 חלוקה גם בבדיקת השנה הנוכחית (לחיווי בכותרת)
  const newIssuesCurrentYearCount = useMemo(() => {
    return currentYearResult.issues.filter(issue => !knownIssues[getIssueId(issue)]).length;
  }, [currentYearResult.issues, knownIssues]);
  
  // 🆕 הצגת מצב סופי לפי בעיות חדשות בלבד
  const hasNewIssuesThisYear = newIssuesCurrentYearCount > 0;
  
  if (!hasNewIssuesThisYear && !showModal) {
    // אין בעיות חדשות השנה - חיווי ירוק קטן
    return (
      <button 
        onClick={() => setShowModal(true)}
        title="לחץ לבדיקת שנים נוספות"
        className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold cursor-pointer hover:text-emerald-300"
      >
        ✓ בדוק
      </button>
    );
  }
  
  // אם יש בעיות חדשות השנה או המודל פתוח
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1 text-xs font-bold cursor-pointer ${
          !hasNewIssuesThisYear
            ? 'text-emerald-400 hover:text-emerald-300' 
            : 'text-rose-400 animate-pulse hover:text-rose-300'
        }`}
        title={!hasNewIssuesThisYear ? 'לחץ לבדיקת שנים נוספות' : 'לחץ לראות פירוט הבעיות'}
      >
        {!hasNewIssuesThisYear ? '✓ בדוק' : `⚠️ ${newIssuesCurrentYearCount} ${newIssuesCurrentYearCount === 1 ? 'בעיה חדשה' : 'בעיות חדשות'}`}
      </button>
      
      {showModal && (
        <div dir="rtl" className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className={`bg-stone-950 rounded-2xl border-2 ${currentNewIssues.length === 0 ? 'border-emerald-700' : 'border-rose-700'} w-full max-w-lg my-8`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-4 border-b border-stone-800 bg-gradient-to-l ${currentNewIssues.length === 0 ? 'from-emerald-950/40' : 'from-rose-950/40'} to-stone-950`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentNewIssues.length === 0 ? '✅' : '⚠️'}</span>
                <div>
                  <h2 className={`text-lg font-extrabold ${currentNewIssues.length === 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                    בדיקת תקינות טבלאות
                  </h2>
                  <div className="text-xs text-stone-400">סופר אדמין בלבד 👑</div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {/* בורר שנים */}
              <div>
                <label className="text-xs text-stone-400 font-bold mb-2 block">בדוק שנה:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setYearFilter('all')}
                    className={`rounded-lg py-1.5 px-3 text-xs font-bold transition ${
                      yearFilter === 'all' 
                        ? 'bg-amber-700 text-white' 
                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                    }`}
                  >
                    כל השנים
                  </button>
                  {availableYears.map(year => (
                    <button
                      key={year}
                      onClick={() => setYearFilter(String(year))}
                      className={`rounded-lg py-1.5 px-3 text-xs font-bold transition ${
                        yearFilter === String(year) 
                          ? 'bg-amber-700 text-white' 
                          : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* תוצאה */}
              {result.isValid ? (
                <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/50 p-3">
                  <div className="text-sm text-emerald-200 font-bold mb-1">
                    ✅ הכל תקין
                  </div>
                  <div className="text-xs text-stone-400">
                    {result.summary}
                  </div>
                </div>
              ) : (
                <>
                  {/* 🆕 בעיות חדשות (לא מסומנות כידועות) */}
                  {currentNewIssues.length > 0 ? (
                    <>
                      <div className="rounded-lg bg-rose-950/30 border border-rose-800/50 p-3">
                        <div className="text-sm text-rose-200 font-bold mb-2">
                          ⚠️ נמצאו {currentNewIssues.length} {currentNewIssues.length === 1 ? 'בעיה חדשה' : 'בעיות חדשות'}
                        </div>
                        <div className="text-xs text-stone-400">
                          כל ערב פוקר חייב להיות מאוזן (סכום = 0). אם יש סטייה - יש בעיה בנתונים או בקוד.
                        </div>
                      </div>
                      
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {currentNewIssues.map((issue) => (
                          <div key={issue._id} className="rounded-lg bg-stone-900 border border-stone-700 p-3">
                            <div className="text-sm text-rose-300 font-bold mb-1">
                              {issue.type === 'session_imbalance' && `🎲 ערב ${issue.date}`}
                              {issue.type === 'year_imbalance' && `📅 שנת ${issue.year}`}
                              {issue.type === 'hidden_players_active' && `👻 שחקנים מוסתרים פעילים`}
                            </div>
                            <div className="text-xs text-stone-300 mb-2">
                              {issue.message}
                            </div>
                            <button
                              onClick={() => markAsKnown(issue._id)}
                              disabled={loadingKnown}
                              className="text-xs rounded-md bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 px-2 py-1 text-amber-200 font-bold transition disabled:opacity-50"
                              title="סמן בעיה זו כידועה - לא תיחשב בעיה חדשה יותר"
                            >
                              ✓ סמן כידועה
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/50 p-3">
                      <div className="text-sm text-emerald-200 font-bold mb-1">
                        ✅ אין בעיות חדשות
                      </div>
                      <div className="text-xs text-stone-400">
                        כל הבעיות בשנה הזו מסומנות כידועות
                      </div>
                    </div>
                  )}
                  
                  {/* 🆕 בעיות ידועות (מסומנות) */}
                  {currentKnownIssuesList.length > 0 && (
                    <details className="rounded-lg bg-stone-900/40 border border-stone-700/50 overflow-hidden">
                      <summary className="cursor-pointer p-3 text-sm text-stone-300 font-bold hover:bg-stone-900/60 transition select-none">
                        📌 בעיות ידועות ({currentKnownIssuesList.length})
                      </summary>
                      <div className="p-3 pt-0 space-y-2 max-h-60 overflow-y-auto">
                        {currentKnownIssuesList.map((issue) => (
                          <div key={issue._id} className="rounded-lg bg-stone-950/80 border border-stone-800 p-2.5">
                            <div className="text-xs text-stone-400 font-bold mb-1">
                              {issue.type === 'session_imbalance' && `🎲 ערב ${issue.date}`}
                              {issue.type === 'year_imbalance' && `📅 שנת ${issue.year}`}
                              {issue.type === 'hidden_players_active' && `👻 שחקנים מוסתרים פעילים`}
                            </div>
                            <div className="text-xs text-stone-500 mb-1.5">
                              {issue.message}
                            </div>
                            {issue._knownInfo?.markedAt && (
                              <div className="text-[10px] text-stone-600 mb-1.5">
                                סומן: {new Date(issue._knownInfo.markedAt).toLocaleDateString('he-IL')}
                              </div>
                            )}
                            <button
                              onClick={() => unmarkAsKnown(issue._id)}
                              disabled={loadingKnown}
                              className="text-[11px] rounded-md bg-stone-800 hover:bg-stone-700 border border-stone-600 px-2 py-0.5 text-stone-300 transition disabled:opacity-50"
                              title="בטל סימון - הבעיה תחזור להיחשב בעיה חדשה"
                            >
                              ↩️ בטל סימון
                            </button>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  
                  {currentNewIssues.length > 0 && (
                    <div className="rounded-lg bg-amber-950/30 border border-amber-800/50 p-3 text-xs text-amber-200">
                      💡 <b>מה לעשות?</b> צלם את החלון הזה ושלח לרון. הוא יבדוק ויתקן בקוד.
                      <br/>
                      <span className="text-stone-400">או לחץ "סמן כידועה" כדי שלא תופיע בכותרת יותר.</span>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="p-4 border-t border-stone-800">
              <button
                onClick={() => setShowModal(false)}
                className="w-full rounded-lg bg-stone-800 hover:bg-stone-700 px-4 py-2.5 text-stone-300 font-bold text-sm transition"
              >
                סבבה
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ===== טבלה ראשית =====
const MainLeaderboard = ({ stats, sessions, hiddenPlayers = [], allSessions, isSuperAdmin }) => {
  const latestDate = getLatestSessionDate(sessions);
  // 🎯 מסנן שחקנים פעילים - לפי אחוז מסך המפגשים בעונה
  // 'all' = כולם, 10/15/20 = מינימום אחוז השתתפות
  const [activityFilter, setActivityFilter] = useState('all');
  
  // חישוב הסינון - מסנן מוסתרים + לפי אחוז השתתפות
  const totalSessions = sessions.length;
  const filteredStats = useMemo(() => {
    // 🛡️ סינון: מסיר שחקנים מוסתרים מהטבלה
    let filtered = stats.filter(s => !hiddenPlayers.includes(s.name));
    if (activityFilter === 'all') return filtered;
    const minPct = parseInt(activityFilter); // 10, 15, 20
    const minSessions = Math.max(1, Math.ceil(totalSessions * minPct / 100));
    return filtered.filter(p => p.sessions >= minSessions);
  }, [stats, activityFilter, totalSessions, hiddenPlayers]);
  
  const columns = [
    { key: 'total', label: 'רווח' },
    { key: 'sessions', label: 'מפגשים' },
    { key: 'avg', label: 'ממוצע לערב' },
    { key: 'wins', label: 'ניצחונות' },
    { key: 'losses', label: 'הפסדים' },
    { key: 'ties', label: 'תיקו' },
    { key: 'winRate', label: '% ניצחון' },
    { key: 'maxStreak', label: 'שיא רצף ללא הפסד' },
    { key: 'currentStreakDisplay', label: 'רצף נוכחי' },
    { key: 'biggestWin', label: 'שיא רווח' },
    { key: 'biggestLoss', label: 'שיא הפסד' },
    { key: 'stdDev', label: 'סטיית תקן', tooltip: 'מדד לתנודתיות. נמוך=יציב, גבוה=תוצאות קיצוניות.' },
  ];
  const fmt = (v, key) => {
    if (v === undefined || v === null) return '—';
    if (key === 'total') return `${v >= 0 ? '+' : ''}${v}`;
    if (key === 'avg') return v.toFixed(1);
    if (key === 'winRate') return `${v.toFixed(0)}%`;
    if (key === 'biggestWin') return `+${v}`;
    if (key === 'stdDev') return v.toFixed(0);
    if (key === 'currentStreakDisplay') {
      if (v === 0) return '—';
      return `${v}`;
    }
    return v;
  };
  const color = (v, key) => {
    if (key === 'total' || key === 'avg') return v > 0 ? 'text-emerald-400 font-extrabold' : v < 0 ? 'text-rose-400 font-extrabold' : 'text-stone-400';
    if (key === 'wins' || key === 'biggestWin' || key === 'winRate') return 'text-emerald-400';
    if (key === 'losses' || key === 'biggestLoss') return 'text-rose-400';
    if (key === 'maxStreak') return 'text-amber-400';
    if (key === 'currentStreakDisplay') {
      if (v === 0) return 'text-stone-500';
      if (v >= 3) return 'text-orange-400 font-bold';
      return 'text-amber-400 font-bold';
    }
    if (key === 'stdDev') return 'text-stone-500';
    return 'text-stone-300';
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur">
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/40 to-stone-900/40 px-4 md:px-6 py-4 flex items-center justify-between flex-wrap gap-2 rounded-t-2xl">
        <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          טבלת דירוג ראשית
          <span className="text-xs text-stone-400 font-normal">
            ({filteredStats.length}/{stats.length})
          </span>
          {/* 🛡️ חיווי תקינות - רק לסופר אדמין */}
          <TableIntegrityIndicator allSessions={allSessions} hiddenPlayers={hiddenPlayers} isSuperAdmin={isSuperAdmin} />
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          {/* 🎯 מסנן שחקנים פעילים */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400">סינון:</span>
            <div className="flex rounded-lg border border-stone-700 bg-stone-900 p-0.5">
              <button onClick={() => setActivityFilter('all')}
                className={`px-2 py-1 text-[11px] rounded font-bold transition ${activityFilter === 'all' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
                הכל
              </button>
              <button onClick={() => setActivityFilter('10')}
                title={`לפחות ${Math.max(1, Math.ceil(totalSessions * 10 / 100))} מפגשים מתוך ${totalSessions}`}
                className={`px-2 py-1 text-[11px] rounded font-bold transition ${activityFilter === '10' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
                10%
              </button>
              <button onClick={() => setActivityFilter('15')}
                title={`לפחות ${Math.max(1, Math.ceil(totalSessions * 15 / 100))} מפגשים מתוך ${totalSessions}`}
                className={`px-2 py-1 text-[11px] rounded font-bold transition ${activityFilter === '15' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
                15%
              </button>
              <button onClick={() => setActivityFilter('20')}
                title={`לפחות ${Math.max(1, Math.ceil(totalSessions * 20 / 100))} מפגשים מתוך ${totalSessions}`}
                className={`px-2 py-1 text-[11px] rounded font-bold transition ${activityFilter === '20' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
                20%
              </button>
            </div>
          </div>
          {latestDate && (
            <div className="text-xs text-stone-400">
              מעודכן עד: <span className="text-amber-300 font-bold">{new Date(latestDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>
      <div className="relative overflow-x-auto rounded-b-2xl" dir="rtl" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-40">
            <tr>
              <th className="sticky top-0 right-0 z-50 bg-stone-900 border-b-2 border-l border-stone-700 px-3 py-3 text-right font-bold text-xs text-amber-200 uppercase tracking-wider min-w-[55px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]">#</th>
              <th className="sticky top-0 z-50 bg-stone-900 border-b-2 border-l border-stone-700 px-3 py-3 text-right font-bold text-xs text-amber-200 uppercase tracking-wider min-w-[90px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]" style={{ right: '55px' }}>שחקן</th>
              {columns.map(c => (
                <th key={c.key} className="sticky top-0 z-40 bg-stone-900 border-b-2 border-stone-700 px-3 py-3 text-right font-bold text-xs text-amber-200 uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">{c.label}{c.tooltip && <InfoTooltip text={c.tooltip} />}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStats.map((p, i) => {
              const rowBg = i % 2 === 0 ? 'bg-stone-950' : 'bg-stone-900/50';
              return (
                <tr key={p.name} className="group hover:bg-amber-950/10">
                  <td className={`sticky right-0 z-20 ${rowBg} group-hover:bg-amber-950/20 border-b border-l border-stone-800 px-3 py-3 font-bold text-stone-500 tabular-nums whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                    {i + 1}{i < 3 && <span className="mr-1">{['🥇','🥈','🥉'][i]}</span>}
                  </td>
                  <td className={`sticky z-20 ${rowBg} group-hover:bg-amber-950/20 border-b border-l border-stone-800 px-3 py-3 font-bold text-stone-100 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`} style={{ right: '55px' }}>
                    {p.name}
                    <FlameIcon streak={(p.currentStreak && p.currentStreak > 0) ? p.currentStreak : 0} />
                  </td>
                  {columns.map(c => (
                    <td key={c.key} className={`border-b border-stone-900 px-3 py-3 tabular-nums whitespace-nowrap ${color(p[c.key], c.key)}`}>
                      {fmt(p[c.key], c.key)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
// ===== מודל הוספת ערב =====
const AddSessionModal = ({ isOpen, onClose, onSave, players, currentSeason, adminName }) => {
  const [step, setStep] = useState('upload');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [results, setResults] = useState([]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [host, setHost] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const reset = () => {
    setStep('upload'); setImage(null); setImagePreview(null); setParsing(false);
    setResults([]); setHost(''); setError('');
  };
  const handleClose = () => { reset(); onClose(); };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImage(ev.target.result); setImagePreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const parseImage = async () => {
    if (!image) return;
    setParsing(true); setError('');
    try {
      const base64Data = image.split(',')[1];
      const mediaType = image.split(';')[0].split(':')[1];
      const playersListStr = players.join(', ');
      const prompt = `אתה מנתח צילום של טבלת סיכום ערב פוקר בעברית.
רשימת השחקנים: ${playersListStr}
כל שחקן מופיע בשורה עם כמה סכומי ביניים שמסתכמים לסכום סופי.
אל תכלול קופה או ערכי ביניים.
החזר JSON בלבד: {"players":[{"name":"שם","amount":סכום}]}`;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
            { type: "text", text: prompt }
          ] }]
        })
      });
      const data = await response.json();
      const text = data.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      setResults(parsed.players.map(p => ({ name: p.name, amount: Number(p.amount) || 0 })));
      setStep('confirm');
    } catch (e) {
      console.error(e);
      setError('לא הצלחתי לקרוא את התמונה. נסה תמונה ברורה יותר, או הכנס ידנית.');
      setStep('manual');
      setResults(players.map(p => ({ name: p, amount: 0 })));
    } finally { setParsing(false); }
  };

  const handleManualEntry = () => {
    setStep('manual');
    setResults(players.map(p => ({ name: p, amount: 0 })));
  };

  const updateResult = (idx, field, value) => {
    const updated = [...results];
    if (field === 'amount') updated[idx].amount = value === '' ? '' : Number(value);
    else updated[idx][field] = value;
    setResults(updated);
  };
  const addPlayerRow = () => setResults([...results, { name: players[0], amount: 0 }]);
  const removeRow = (idx) => setResults(results.filter((_, i) => i !== idx));

  const handleSave = () => {
    const validResults = results.filter(r => r.name && r.amount !== '' && r.amount !== 0);
    const resultsObj = {};
    validResults.forEach(r => { resultsObj[r.name] = (resultsObj[r.name] || 0) + Number(r.amount); });
    const pot = Object.values(resultsObj).filter(v => v > 0).reduce((a, b) => a + b, 0);
    onSave({ date: sessionDate, season: currentSeason, pot, results: resultsObj, host: host || undefined, addedBy: adminName, addedAt: new Date().toISOString() });
    reset(); onClose();
  };

  if (!isOpen) return null;
  const total = results.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-900/50 bg-stone-950 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-800 bg-stone-950/95 px-6 py-4 backdrop-blur">
          <h2 className="text-xl md:text-2xl font-bold text-amber-200">
            ערב חדש — {step === 'upload' ? 'העלאת תמונה' : step === 'confirm' ? 'אישור תוצאות' : 'הכנסה ידנית'}
          </h2>
          <button onClick={handleClose} className="rounded-full p-2 text-stone-400 hover:bg-stone-800 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">תאריך</label>
                  <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">מארח</label>
                  <SearchableSelect
                    value={host}
                    onChange={setHost}
                    options={players}
                    placeholder="בחר..."
                  />
                </div>
              </div>
              {!imagePreview ? (
                <div onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-700 bg-stone-900/50 p-12 cursor-pointer hover:border-amber-600/50 hover:bg-stone-900 transition group">
                  <Upload className="h-12 w-12 text-stone-600 group-hover:text-amber-400" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-stone-200">העלה צילום של סיום הערב</div>
                    <div className="text-sm text-stone-500 mt-1">תמונה של הדף עם הסכומים</div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>
              ) : (
                <div className="space-y-3">
                  <img src={imagePreview} alt="preview" className="max-h-96 mx-auto rounded-xl border border-stone-700" />
                  <div className="flex gap-3">
                    <button onClick={() => { setImage(null); setImagePreview(null); }}
                      className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-stone-300 hover:bg-stone-800">
                      תמונה אחרת
                    </button>
                    <button onClick={parseImage} disabled={parsing}
                      className="flex-1 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-2 font-bold text-white hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 flex items-center justify-center gap-2">
                      {parsing ? <><Loader2 className="h-4 w-4 animate-spin" /> מזהה...</> : 'זהה תוצאות'}
                    </button>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex gap-2 rounded-lg border border-rose-900/50 bg-rose-950/30 p-3 text-sm text-rose-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /><div>{error}</div>
                </div>
              )}
              <button onClick={handleManualEntry} className="w-full rounded-lg border border-stone-700 bg-stone-900 py-3 text-stone-300 hover:bg-stone-800 text-sm">
                או — הכנס ידנית ללא תמונה
              </button>
            </div>
          )}
          {(step === 'confirm' || step === 'manual') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">תאריך</label>
                  <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">מארח</label>
                  <SearchableSelect
                    value={host}
                    onChange={setHost}
                    options={players}
                    placeholder="בחר..."
                  />
                </div>
              </div>
              <div className="rounded-xl border border-stone-800 bg-stone-900/50">
                <div className="flex items-center justify-between border-b border-stone-800 px-4 py-3">
                  <div className="text-sm font-bold text-stone-300">
                    תוצאות ({results.filter(r => r.amount !== 0 && r.amount !== '').length} פעילים)
                  </div>
                  <div className={`text-xs tabular-nums ${Math.abs(total) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    סה"כ: {total >= 0 ? '+' : ''}{total}
                    {Math.abs(total) > 0.01 && <span className="mr-1">⚠ לא מאוזן</span>}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto p-3 space-y-2">
                  {results.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <SearchableSelect
                          value={r.name}
                          onChange={(v) => updateResult(idx, 'name', v)}
                          options={players}
                          placeholder="בחר שחקן..."
                        />
                      </div>
                      <input type="number" value={r.amount} onChange={e => updateResult(idx, 'amount', e.target.value)}
                        placeholder="סכום"
                        className={`w-28 rounded-lg border bg-stone-800 px-3 py-2 text-sm tabular-nums ${
                          Number(r.amount) > 0 ? 'border-emerald-800 text-emerald-300' :
                          Number(r.amount) < 0 ? 'border-rose-800 text-rose-300' : 'border-stone-700 text-stone-400'
                        }`} />
                      <button onClick={() => removeRow(idx)} className="rounded-lg border border-stone-700 bg-stone-800 p-2 text-stone-400 hover:bg-rose-950 hover:text-rose-300">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-stone-800 p-3">
                  <button onClick={addPlayerRow} className="w-full rounded-lg border border-stone-700 bg-stone-800 py-2 text-sm text-stone-300 hover:bg-stone-700 flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" /> הוסף שחקן
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('upload')}
                  className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-stone-300 hover:bg-stone-800">
                  חזור
                </button>
                <button onClick={handleSave}
                  className="flex-1 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 font-bold text-white hover:from-emerald-500 hover:to-emerald-600 flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" /> שמור ערב
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== היסטוריה =====
const SessionHistory = ({ sessions, onDelete, isAdmin }) => {
  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const [expandedIdx, setExpandedIdx] = useState(null);
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur">
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/40 to-stone-900/40 px-6 py-4">
        <h3 className="text-xl font-bold text-amber-200 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          היסטוריית מפגשים ({sessions.length})
        </h3>
        <div className="text-xs text-stone-500 mt-1">לחץ על מפגש כדי לראות את כל השחקנים</div>
      </div>
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
        {sorted.map((s, i) => {
          const winners = Object.entries(s.results).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]);
          const losers = Object.entries(s.results).filter(([_, v]) => v < 0).sort((a, b) => a[1] - b[1]);
          const zeros = Object.entries(s.results).filter(([_, v]) => v === 0);
          const winner = winners[0]; const loser = losers[0];
          const isExpanded = expandedIdx === i;
          return (
            <div key={i} className="border-b border-stone-900 hover:bg-stone-900/30 transition">
              <div className="p-4 cursor-pointer" onClick={() => setExpandedIdx(isExpanded ? null : i)}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    <span className={`text-stone-500 transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                    {new Date(s.date).toLocaleDateString('he-IL', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  {s.host && <div className="text-xs text-stone-500">מארח: <span className="text-amber-400">{s.host}</span></div>}
                  <div className="text-xs text-stone-500">קופה: <span className="text-stone-300 tabular-nums">{s.pot}</span></div>
                  <div className="text-xs text-stone-600">{Object.keys(s.results).length} שחקנים</div>
                  {s.addedBy && <div className="text-xs text-stone-600">הוסף ע"י: <span className="text-violet-400">{s.addedBy}</span></div>}
                </div>
                {isAdmin && onDelete && (
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('למחוק את המפגש?')) onDelete(s.date); }} className="text-stone-600 hover:text-rose-400 p-1">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="text-xs text-stone-400 flex gap-4 flex-wrap">
                {winner && <span>🏆 <span className="text-amber-300 font-bold">{winner[0]}</span> <span className="text-emerald-400 tabular-nums">+{winner[1]}</span></span>}
                {loser && <span>💀 <span className="text-rose-300 font-bold">{loser[0]}</span> <span className="text-rose-400 tabular-nums">{loser[1]}</span></span>}
              </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-stone-900/50 bg-stone-950/40">
                  <div className="text-xs text-stone-500 mb-2 font-bold">כל השחקנים במפגש:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {winners.map(([name, val]) => (
                      <div key={name} className="rounded-lg bg-emerald-950/30 border border-emerald-800/40 px-3 py-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-emerald-200">{name}</span>
                        <span className="text-sm tabular-nums font-bold text-emerald-400">+{val}</span>
                      </div>
                    ))}
                    {zeros.map(([name, val]) => (
                      <div key={name} className="rounded-lg bg-stone-900/50 border border-stone-700/40 px-3 py-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-stone-300">{name}</span>
                        <span className="text-sm tabular-nums text-stone-500">0</span>
                      </div>
                    ))}
                    {losers.map(([name, val]) => (
                      <div key={name} className="rounded-lg bg-rose-950/30 border border-rose-800/40 px-3 py-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-rose-200">{name}</span>
                        <span className="text-sm tabular-nums font-bold text-rose-400">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== סקשן ציטוטים =====
const QuotesSection = ({ deletedIds, likes, userQuotes, currentUser, players, onDelete, onLike, onAddQuote, isAdmin }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuoted, setFilterQuoted] = useState('all');
  // 🆕 סינון שנה - דיפולט: השנה הנוכחית
  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear());
  const [sortBy, setSortBy] = useState('newest'); // newest | likes
  const [addModalOpen, setAddModalOpen] = useState(false);

  // שילוב הציטוטים ההיסטוריים עם ציטוטי המשתמשים
  const combinedQuotes = useMemo(() => {
    return [...ALL_QUOTES, ...(userQuotes || [])];
  }, [userQuotes]);

  // רשימת כל המצוטטים (לפילטר)
  const allQuoted = useMemo(() => {
    const s = new Set(combinedQuotes.map(q => q.quoted));
    return Array.from(s).sort();
  }, [combinedQuotes]);
  
  // 🆕 כל השנים שיש בציטוטים (לפילטר)
  const allYears = useMemo(() => {
    const years = new Set();
    combinedQuotes.forEach(q => {
      if (q.date) {
        const parts = q.date.split('.');
        if (parts.length === 3) {
          years.add(parseInt(parts[2]));
        }
      }
      if (q.createdAt) {
        years.add(new Date(q.createdAt).getFullYear());
      }
    });
    return Array.from(years).filter(y => !isNaN(y)).sort((a, b) => b - a);
  }, [combinedQuotes]);

  // ציטוטים מסוננים
  const visibleQuotes = useMemo(() => {
    let list = combinedQuotes.filter(q => !deletedIds.includes(q.id));
    
    // סינון לפי מצוטט
    if (filterQuoted !== 'all') {
      list = list.filter(q => q.quoted === filterQuoted);
    }
    
    // 🆕 סינון לפי שנה
    if (filterYear !== 'all') {
      list = list.filter(q => {
        // ציטוטים חדשים - לפי createdAt
        if (q.createdAt) {
          return new Date(q.createdAt).getFullYear() === filterYear;
        }
        // ציטוטים היסטוריים - לפי date
        if (q.date) {
          const parts = q.date.split('.');
          if (parts.length === 3) {
            return parseInt(parts[2]) === filterYear;
          }
        }
        return false;
      });
    }
    
    // חיפוש
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(quote => 
        quote.text.toLowerCase().includes(q) ||
        quote.quoted.toLowerCase().includes(q) ||
        quote.quoter.toLowerCase().includes(q)
      );
    }
    
    // מיון
    if (sortBy === 'likes') {
      list = [...list].sort((a, b) => (likes[b.id] || 0) - (likes[a.id] || 0));
    } else {
      // newest first - ציטוטי משתמשים חדשים (עם createdAt) קודם, אחר כך לפי תאריך הודעה
      list = [...list].sort((a, b) => {
        // אם יש createdAt - זה ציטוט חדש, קודם
        if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
        if (a.createdAt) return -1;
        if (b.createdAt) return 1;
        const da = parseHebrewDate(a.date);
        const db = parseHebrewDate(b.date);
        return db - da;
      });
    }
    
    return list;
  }, [combinedQuotes, deletedIds, likes, filterQuoted, filterYear, searchQuery, sortBy]);

  const totalQuotes = combinedQuotes.length - deletedIds.length;

  return (
    <div className="space-y-4">
      {/* Header + פילטרים */}
      <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
            <Quote className="h-5 w-5" />
            ציטוטים אגדיים ({visibleQuotes.length} / {totalQuotes})
          </h3>
          <button onClick={() => setAddModalOpen(true)}
            className="rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-2 text-sm font-bold text-white hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-900/40 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            הוסף ציטוט
          </button>
        </div>
        
        {/* חיפוש */}
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="חפש ציטוט, שחקן או מילה..."
            className="w-full rounded-lg border border-stone-700 bg-stone-900 pr-10 pl-4 py-2.5 text-white text-sm focus:border-amber-600 focus:outline-none" />
        </div>
        
        {/* פילטרים */}
        <div className="flex flex-wrap gap-2">
          <select value={filterQuoted} onChange={e => setFilterQuoted(e.target.value)}
            className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-white">
            <option value="all">כל השחקנים</option>
            {allQuoted.map(name => (
              <option key={name} value={name}>ציטוטים של {name}</option>
            ))}
          </select>
          {/* 🆕 בורר שנה */}
          <select value={filterYear} onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-white">
            <option value="all">כל השנים</option>
            {allYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-stone-700 bg-stone-900 p-1">
            <button onClick={() => setSortBy('newest')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition ${sortBy === 'newest' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              מהחדש לישן
            </button>
            <button onClick={() => setSortBy('likes')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition ${sortBy === 'likes' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              הכי אהובים
            </button>
          </div>
          {(filterQuoted !== 'all' || filterYear !== new Date().getFullYear() || searchQuery || sortBy !== 'newest') && (
            <button onClick={() => { setFilterQuoted('all'); setFilterYear(new Date().getFullYear()); setSearchQuery(''); setSortBy('newest'); }}
              className="text-xs text-stone-500 hover:text-amber-300 px-2">איפוס פילטרים</button>
          )}
        </div>
      </div>

      {/* רשימת ציטוטים */}
      <div className="space-y-3">
        {visibleQuotes.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <div>אין ציטוטים שעונים לפילטרים האלה</div>
          </div>
        )}
        {visibleQuotes.map(q => (
          <QuoteCard key={q.id} quote={q}
            likeCount={likes[q.id] || 0}
            onLike={() => onLike(q.id)}
            onDelete={isAdmin ? () => onDelete(q.id) : null} />
        ))}
      </div>

      {/* מודל הוספת ציטוט */}
      <AddQuoteModal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)}
        currentUser={currentUser}
        players={players}
        onSave={onAddQuote} />
    </div>
  );
};

// ===== מודל הוספת ציטוט חדש =====
const AddQuoteModal = ({ isOpen, onClose, currentUser, players, onSave }) => {
  const [quoted, setQuoted] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');
    
    // ולידציה
    if (!quoted) {
      setError('חובה לבחור מי אמר את הציטוט');
      return;
    }
    if (!text.trim()) {
      setError('חובה להקליד את הציטוט');
      return;
    }
    if (quoted === currentUser) {
      setError('אי אפשר לצטט את עצמך 😉 (אם מישהו אחר שמע אותך - תן לו להוסיף)');
      return;
    }
    if (text.trim().length < 3) {
      setError('ציטוט קצרצר... תוסיף עוד קצת תוכן');
      return;
    }

    setSaving(true);
    const now = new Date();
    const newQuote = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      quoted,
      quoter: currentUser,
      text: text.trim(),
      date: now.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.'),
      createdAt: now.toISOString(),
      isUserAdded: true
    };
    
    await onSave(newQuote);
    
    // איפוס וסגירה
    setQuoted('');
    setText('');
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border-2 border-amber-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-5 shadow-2xl" 
        onClick={e => e.stopPropagation()} dir="rtl">
        
        {/* כותרת */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Quote className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-extrabold text-amber-200">הוסף ציטוט חדש</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-xs text-stone-400 mb-4 bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2 leading-relaxed">
          💡 שמעת משהו מצחיק בשולחן? הקלט אותו לדורות הבאים!<br />
          <span className="text-amber-300/80">⚠️ אין צורך לרשום "תומר:" או שם השחקן בתחילת הציטוט - בחר אותו ברשימה למטה.</span>
        </div>

        {/* מי אמר */}
        <div className="mb-4">
          <label className="block text-xs text-stone-400 font-bold mb-1.5">מי אמר?</label>
          <SearchableSelect
            value={quoted}
            onChange={(v) => { setQuoted(v); setError(''); }}
            options={players.filter(p => p !== currentUser)}
            placeholder="בחר שחקן..."
          />
        </div>

        {/* תוכן הציטוט */}
        <div className="mb-4">
          <label className="block text-xs text-stone-400 font-bold mb-1.5">מה הוא אמר?</label>
          <textarea value={text} onChange={e => { setText(e.target.value); setError(''); }}
            placeholder='לדוגמה: "זרקתי דאבל אייס... זה היה חייב להיות שלי"'
            rows={3}
            maxLength={300}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2.5 text-white text-sm focus:border-amber-600 focus:outline-none resize-none" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-stone-500">רשום רק את הציטוט עצמו, בלי שם בהתחלה</span>
            <span className="text-xs text-stone-500">{text.length}/300</span>
          </div>
        </div>

        {/* מי מוסיף (אוטומטי) */}
        <div className="mb-4 text-xs text-stone-400 bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2">
          המצטט: <span className="font-bold text-amber-300">{currentUser}</span>
        </div>

        {/* שגיאה */}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-700/50 bg-rose-950/30 text-rose-300 text-sm px-3 py-2 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* כפתורים */}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={saving}
            className="flex-1 rounded-lg border border-stone-700 bg-stone-900 py-2.5 text-sm font-bold text-stone-300 hover:bg-stone-800">
            ביטול
          </button>
          <button onClick={handleSave} disabled={saving || !quoted || !text.trim()}
            className="flex-1 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 py-2.5 text-sm font-bold text-white hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? 'שומר...' : 'הוסף ציטוט'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== כרטיס ציטוט בודד =====
const QuoteCard = ({ quote, likeCount, onLike, onDelete }) => {
  const [liked, setLiked] = useState(false);
  
  const handleLike = () => {
    if (!liked) {
      onLike();
      setLiked(true);
    }
  };

  return (
    <div className="group rounded-xl border border-stone-800 bg-gradient-to-br from-stone-900/80 to-stone-950/80 p-4 md:p-5 backdrop-blur hover:border-amber-900/50 transition">
      {/* הציטוט עצמו */}
      <div className="flex gap-3 mb-3">
        <Quote className="h-5 w-5 text-amber-600/60 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-stone-100 text-base md:text-lg leading-relaxed">
          "{quote.text}"
        </div>
      </div>
      
      {/* שורה תחתונה: מצוטט + תאריך + מצטט + פעולות */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-stone-800">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="text-amber-400 font-bold">— {quote.quoted}</span>
          <span className="text-stone-600">•</span>
          <span className="text-stone-500">{quote.date}</span>
          <span className="text-stone-600">•</span>
          <span className="text-stone-500">מצוטט ע״י {quote.quoter}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              liked ? 'bg-rose-900/30 text-rose-300 border border-rose-800/50' : 'bg-stone-800/80 text-stone-400 hover:bg-rose-900/20 hover:text-rose-300 border border-stone-700'
            }`}>
            <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
            {likeCount}
          </button>
          {onDelete && (
            <button onClick={() => { if (confirm('למחוק את הציטוט לצמיתות?')) onDelete(); }}
              className="rounded-full p-1.5 text-stone-600 hover:text-rose-400 hover:bg-stone-800 transition" title="מחק (מנהלים)">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
// ===== מסך אתגר סיסמת סופר אדמין =====
// מופיע כשבוחרים סופר אדמין במכשיר שלא נעול אליו
// אם אין סיסמה ב-Firebase - מציג מצב הגדרה ראשונית
const SuperAdminChallengeScreen = ({ name, passwordHash, onSuccess, onSetupPassword, onCancel }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  
  const isSetup = !passwordHash; // אם אין hash - מצב הגדרה ראשונית
  
  const handleSubmit = async () => {
    if (busy) return;
    setError('');
    
    if (isSetup) {
      // מצב הגדרה ראשונית
      if (password.length < 6) {
        setError('סיסמה חייבת לכלול לפחות 6 תווים');
        return;
      }
      if (password !== confirmPassword) {
        setError('הסיסמאות לא תואמות');
        return;
      }
      setBusy(true);
      try {
        const hash = await hashPassword(password);
        await onSetupPassword(hash);
      } catch {
        setError('שגיאה בהגדרת סיסמה');
        setBusy(false);
      }
      return;
    }
    
    // מצב כניסה רגיל
    setBusy(true);
    try {
      const inputHash = await hashPassword(password);
      if (inputHash === passwordHash) {
        await onSuccess();
      } else {
        setError('סיסמה שגויה');
        setBusy(false);
      }
    } catch {
      setError('שגיאה');
      setBusy(false);
    }
  };
  
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'radial-gradient(ellipse at center, #0f5132 0%, #0a3520 50%, #041810 100%)',
      fontFamily: 'Assistant, sans-serif'
    }}>
      <div className="max-w-md w-full rounded-2xl border-2 border-amber-700 bg-stone-950/95 p-6">
        <div className="text-center mb-5">
          <div className="text-6xl mb-3">👑</div>
          <h2 className="text-2xl font-extrabold text-amber-200 mb-1">
            {isSetup ? 'הגדרת סיסמת סופר אדמין' : 'אימות סופר אדמין'}
          </h2>
          <p className="text-sm text-stone-400">
            כניסה כ-<span className="font-bold text-amber-300">{name}</span>
          </p>
        </div>
        
        {isSetup && (
          <div className="rounded-lg bg-amber-950/30 border border-amber-800/50 p-3 text-xs text-amber-200 leading-relaxed mb-4">
            זוהי הכניסה הראשונה כסופר אדמין. בחר סיסמה אישית - היא תישמר מוצפנת ב-Firebase ולא בקוד.<br/>
            <span className="text-amber-400 font-bold">חשוב: שמור את הסיסמה במקום בטוח!</span>
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-stone-400 mb-1">
              {isSetup ? 'סיסמה חדשה (לפחות 6 תווים)' : 'סיסמת סופר אדמין'}
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoFocus
              onKeyDown={e => !isSetup && e.key === 'Enter' && handleSubmit()}
              className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white focus:border-amber-600 focus:outline-none" />
          </div>
          {isSetup && (
            <div>
              <label className="block text-xs text-stone-400 mb-1">אימות סיסמה</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white focus:border-amber-600 focus:outline-none" />
            </div>
          )}
          {error && (
            <div className="text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{error}
            </div>
          )}
          <button onClick={handleSubmit} disabled={busy}
            className="w-full rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-3 font-bold text-white hover:from-amber-500 hover:to-amber-600 transition disabled:opacity-50">
            {busy ? 'בודק...' : (isSetup ? '👑 קבע סיסמה והתחבר' : 'התחבר')}
          </button>
          <button onClick={onCancel}
            className="w-full rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 px-4 py-2 text-stone-300 transition text-sm">
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== מסך בחירת שם משתמש =====
const UserSelectScreen = ({ players, onSelect, deviceLocks = {}, currentDeviceId = '', impersonating = null, onCancelImpersonate = () => {} }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players;
    return players.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [players, searchTerm]);

  return (
    <div dir="rtl" className="min-h-screen bg-stone-950 flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: 'Assistant, sans-serif' }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, #0f5132 0%, #052e16 50%, #000 100%)',
      }} />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">{impersonating ? '🎭' : '♠'}</div>
          <h2 className="text-3xl font-extrabold text-amber-200 mb-2">
            {impersonating ? 'בחר משתמש להתחזות' : 'מי אתה?'}
          </h2>
          <p className="text-stone-400 text-sm">
            {impersonating ? `מתחזה כ-${impersonating} (לבדיקות בלבד)` : 'בחר את שמך מהרשימה'}
          </p>
          {impersonating && (
            <button
              onClick={onCancelImpersonate}
              className="mt-3 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 px-4 py-2 text-sm text-stone-200 font-bold"
            >
              ← חזרה ל-{impersonating}
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-amber-900/50 bg-stone-950/90 backdrop-blur shadow-2xl">
          <div className="border-b border-stone-800 p-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus
                placeholder="חפש את שמך..."
                className="w-full rounded-lg border border-stone-700 bg-stone-900 pr-10 pl-4 py-2.5 text-white text-sm focus:border-amber-600 focus:outline-none" />
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {filteredPlayers.map(name => {
              // 🔐 בדיקת נעילה
              const lock = deviceLocks[name];
              const isLockedToOther = lock && lock.deviceId !== currentDeviceId;
              const isLockedToMe = lock && lock.deviceId === currentDeviceId;
              return (
                <button key={name} onClick={() => onSelect(name)}
                  className={`w-full text-right rounded-lg px-4 py-3 transition flex items-center justify-between group ${
                    impersonating 
                      ? 'hover:bg-purple-950/40' 
                      : isLockedToOther 
                        ? 'opacity-50 hover:bg-red-950/20' 
                        : 'hover:bg-amber-950/30'
                  }`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* 🔐 אייקון נעילה */}
                    {!impersonating && isLockedToOther && (
                      <Lock className="h-4 w-4 text-red-400/70 shrink-0" />
                    )}
                    {!impersonating && isLockedToMe && (
                      <Check className="h-4 w-4 text-emerald-400/80 shrink-0" />
                    )}
                    <span className={`font-bold text-base truncate ${
                      isLockedToOther ? 'text-stone-400' : 'text-stone-100'
                    }`}>
                      {name}
                    </span>
                  </div>
                  <span className="text-stone-600 group-hover:text-amber-400 text-sm shrink-0">→</span>
                </button>
              );
            })}
            {filteredPlayers.length === 0 && (
              <div className="text-center py-8 text-stone-500 text-sm">אין שחקנים שמתאימים לחיפוש</div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-stone-500 leading-relaxed">
          {impersonating ? (
            <>🎭 מצב התחזות - לא יישמר בכניסה הבאה</>
          ) : (
            <>
              🔒 כל מכשיר נעול למשתמש אחד.<br/>
              <Lock className="inline h-3 w-3" /> = שם תפוס במכשיר אחר
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== כרטיסי תובנות אישיות =====
const PersonalInsights = ({ playerName, sessions, stats, hostingSchedule }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);
  
  const myStats = stats.find(s => s.name === playerName);
  if (!myStats) {
    return (
      <div className="rounded-2xl border border-amber-900/50 bg-gradient-to-br from-amber-950/30 to-stone-900/50 p-5 backdrop-blur">
        <div className="text-amber-200 font-bold text-lg mb-2">שלום {playerName}!</div>
        <div className="text-stone-400 text-sm">עוד לא השתתפת במפגשים בעונה הזאת. ברגע שתגיע - הסטטיסטיקה שלך תופיע פה.</div>
      </div>
    );
  }

  const myRank = stats.findIndex(s => s.name === playerName) + 1;
  
  // המארח האהוב עליי
  const hostStats = {};
  sessions.forEach(s => {
    if (s.host && s.results[playerName] !== undefined) {
      if (!hostStats[s.host]) hostStats[s.host] = { total: 0, count: 0, wins: 0 };
      hostStats[s.host].total += s.results[playerName];
      hostStats[s.host].count++;
      if (s.results[playerName] > 0) hostStats[s.host].wins++;
    }
  });
  const favoriteHost = Object.entries(hostStats)
    .filter(([_, v]) => v.count >= 2)
    .sort((a, b) => b[1].total - a[1].total)[0];

  // האירוח הקרוב
  const today = getTodayIsrael();
  const myNextHost = hostingSchedule
    .filter(h => h.date >= today && h.host === playerName)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  // ===== מנוע המלצות חכמות =====
  const generateRecommendations = () => {
    const recs = [];
    const totalSessions = myStats.sessions;
    const winRate = myStats.winRate;
    const avgPerSession = totalSessions > 0 ? myStats.total / totalSessions : 0;
    
    // המפגשים שלי, ממויינים מהראשון לאחרון
    const mySessionsArr = sessions
      .filter(s => s.results[playerName] !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    if (mySessionsArr.length === 0) {
      return [{ icon: '🎲', title: 'תהנה מהדרך', text: 'אחרי 3 מפגשים אתה תקבל המלצות אישיות. בינתיים - תאכל פיצה ותצחק.' }];
    }

    // ============= רובד 1: המפגש האחרון =============
    const lastSession = mySessionsArr[mySessionsArr.length - 1];
    const lastResult = lastSession.results[playerName];
    const lastHost = lastSession.host;
    const daysSinceLast = Math.floor((new Date() - new Date(lastSession.date)) / (1000*60*60*24));
    
    // ============= רובד 2: החודש האחרון =============
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const monthAgoStr = oneMonthAgo.toISOString().split('T')[0];
    
    const monthSessions = mySessionsArr.filter(s => s.date >= monthAgoStr);
    const monthTotal = monthSessions.reduce((sum, s) => sum + s.results[playerName], 0);
    const monthWins = monthSessions.filter(s => s.results[playerName] > 0).length;
    const monthAvg = monthSessions.length > 0 ? monthTotal / monthSessions.length : 0;
    const monthWinRate = monthSessions.length > 0 ? (monthWins / monthSessions.length) * 100 : 0;
    
    // ============= רובד 3: העונה הנוכחית =============
    // יש כבר ב-myStats: total, sessions, winRate, biggestWin, biggestLoss, maxStreak
    
    // ============= חישובי השוואה =============
    // האם החודש טוב יותר מהממוצע העונתי?
    const monthVsSeason = monthAvg - avgPerSession;
    
    // רצף אחרון
    let lastStreak = 0;
    let streakType = 'win';
    if (mySessionsArr.length > 0) {
      const lastVal = mySessionsArr[mySessionsArr.length - 1].results[playerName];
      streakType = lastVal >= 0 ? 'win' : 'loss';
      for (let i = mySessionsArr.length - 1; i >= 0; i--) {
        const v = mySessionsArr[i].results[playerName];
        if ((streakType === 'win' && v >= 0) || (streakType === 'loss' && v < 0)) {
          lastStreak++;
        } else break;
      }
    }
    
    // ניתוח מארחים
    const goodHosts = Object.entries(hostStats)
      .filter(([h, v]) => v.count >= 2 && h !== playerName)
      .sort((a, b) => (b[1].total/b[1].count) - (a[1].total/a[1].count));
    const badHost = goodHosts[goodHosts.length - 1];
    const luckyHost = goodHosts[0];
    
    // האירוח הקרוב הבא בלוח (לא רק שלי)
    const nextUpcoming = hostingSchedule
      .filter(h => h.date >= today && h.host)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    const myStatsAtNextHost = nextUpcoming && hostStats[nextUpcoming.host];

    // ============================================================
    // ===== המלצה 1: מבוססת על המפגש האחרון (תמיד הראשונה!) =====
    // ============================================================
    
    if (lastResult >= 100) {
      recs.push({
        icon: '🎉',
        title: `+${lastResult} ₪ בערב האחרון!`,
        text: lastStreak >= 2 ? 
          `${lastStreak} ערבים ברצף עם רווח, ואתה גם סוחב +${lastResult}? אתה ב-Zone. אל תתעורר.` :
          `כל הכבוד! לא להתבלבל עכשיו ולחשוב שאתה בלתי מנוצח. אותו סגנון, בלי להתחכם.`
      });
    } else if (lastResult >= 30) {
      recs.push({
        icon: '✅',
        title: `יצאת עם +${lastResult} ₪`,
        text: monthAvg > 0 ? 
          `סולידי, וגם החודש שלך טוב (+${Math.round(monthAvg)}/ערב בממוצע). תמשיך עם אותה משמעת.` :
          `סולידי. הערב הבא - אותה משמעת. אל תשנה כלום שעובד.`
      });
    } else if (lastResult > 0) {
      recs.push({
        icon: '🪙',
        title: `+${lastResult} ₪ - לא רע, לא מדהים`,
        text: `יצאת עם רווח קטן. בערב הבא נסה להגדיל פוטים כשיש לך יד חזקה - אל תפחד מ-value betting.`
      });
    } else if (lastResult >= -50) {
      recs.push({
        icon: '😐',
        title: `${lastResult} ₪ אחרון`,
        text: lastHost && hostStats[lastHost]?.count >= 3 && (hostStats[lastHost].total / hostStats[lastHost].count) < 0 ?
          `הפסד קל אצל ${lastHost} - שם אתה בכלל מפסיד בממוצע. תחשוב למה.` :
          `הפסד קל. תזכור איזו יד אכלה לך כסף - בערב הבא תפולד אותה מוקדם.`
      });
    } else if (lastResult >= -120) {
      recs.push({
        icon: '😬',
        title: `${lastResult} ₪ - יום קשה`,
        text: lastStreak >= 2 && streakType === 'loss' ?
          `${lastStreak} ערבים ברצף בהפסד. הגיע הזמן לעצור ולחשוב מה השתנה - תמיד ברצפים כאלה יש דליפה.` :
          `קח 5 דקות לחשוב. כנראה רדפת אחרי הפסד או שיחקת יותר מדי ידיים.`
      });
    } else {
      recs.push({
        icon: '💀',
        title: `${lastResult} ₪!! ערב לשכוח`,
        text: monthAvg > 20 ? 
          `קרה לכולם, וברמה החודשית אתה עדיין +${Math.round(monthAvg)}/ערב. תזכור את זה. בערב הבא - בלי לרדוף.` :
          `אל תנסה להחזיר הכל בערב הבא - זה הדרך לאבד עוד 200. בוא רגוע, ראש פנוי.`
      });
    }

    // ============================================================
    // ===== המלצה 2: מבוססת על החודש האחרון =====
    // ============================================================
    
    if (monthSessions.length >= 3) {
      // המגמה החודשית
      if (monthVsSeason > 30) {
        recs.push({
          icon: '📈',
          title: 'החודש שלך מצוין!',
          text: `+${Math.round(monthAvg)}/ערב החודש (לעומת ${avgPerSession >= 0 ? '+' : ''}${Math.round(avgPerSession)} בעונה). משהו השתנה לטובה - שמור על זה.`
        });
      } else if (monthVsSeason < -30) {
        recs.push({
          icon: '📉',
          title: 'החודש שלך פחות חזק',
          text: `${Math.round(monthAvg)}/ערב החודש - מתחת לממוצע העונתי (${Math.round(avgPerSession)}). אולי שווה לחזור ליסודות?`
        });
      } else if (monthWinRate >= 60 && monthSessions.length >= 4) {
        recs.push({
          icon: '🏆',
          title: `${Math.round(monthWinRate)}% ניצחון החודש`,
          text: `החודש אתה מנצח ${monthWins} מתוך ${monthSessions.length} ערבים - מספרים אלופים. תמשיך עם אותו סגנון.`
        });
      } else if (monthWinRate <= 25 && monthSessions.length >= 4) {
        recs.push({
          icon: '🎯',
          title: 'החודש לא הולך',
          text: `${monthWins} ניצחונות מ-${monthSessions.length} ערבים. הגיע הזמן לחזור ל-tight-aggressive: פחות ידיים, יותר עוצמה.`
        });
      } else if (monthSessions.length >= 5) {
        recs.push({
          icon: '⚖️',
          title: `${monthSessions.length} ערבים החודש`,
          text: monthTotal >= 0 ?
            `יציב חודש זה. +${Math.round(monthTotal)} ₪ סך הכל. עכשיו בא לעלות רמה - יותר אגרסיביות בפוטים גדולים.` :
            `${Math.round(monthTotal)} ₪ סך הכל החודש. אולי הגיע הזמן להפסקה של ערב או שניים לעצור את הדימום.`
        });
      }
    } else if (monthSessions.length === 0) {
      recs.push({
        icon: '🤔',
        title: 'מזמן לא היית בערב',
        text: daysSinceLast > 14 ?
          `${daysSinceLast} ימים מאז הערב האחרון! זמן לחזור לשולחן - הקבוצה מתגעגעת.` :
          'לא היית בערב חודש אחרון. שווה לחזור ולתפוס מומנטום.'
      });
    }

    // ============================================================
    // ===== המלצה 3: מבוססת על העונה ו/או הערב הקרוב =====
    // ============================================================
    
    // אם יש מארח לערב הקרוב - ניתוח אישי איתו
    if (nextUpcoming && myStatsAtNextHost && myStatsAtNextHost.count >= 3) {
      const avgWithHost = myStatsAtNextHost.total / myStatsAtNextHost.count;
      const daysToNext = Math.ceil((new Date(nextUpcoming.date) - new Date()) / (1000*60*60*24));
      
      if (avgWithHost > 30) {
        recs.push({
          icon: '🍀',
          title: `${daysToNext === 0 ? 'הערב' : `בעוד ${daysToNext} ימים`} אצל ${nextUpcoming.host}`,
          text: `אצלו אתה +${Math.round(avgWithHost)} ₪ בממוצע ב-${myStatsAtNextHost.count} ערבים. תכין כסף - אתה יוצא ברווח.`
        });
      } else if (avgWithHost < -30) {
        recs.push({
          icon: '⚠️',
          title: `${daysToNext === 0 ? 'הערב' : `בעוד ${daysToNext} ימים`} אצל ${nextUpcoming.host}`,
          text: `שם אתה ${Math.round(avgWithHost)} ₪ בממוצע. תיכנס מודע - שחק tight, אל תרדוף, ואל תיתפס לתבניות.`
        });
      }
    }
    // אחרת - המלצה לפי דפוסי העונה
    else if (totalSessions >= 10) {
      // הפסד מקסימלי גדול
      if (myStats.biggestLoss < -200) {
        recs.push({
          icon: '🛡️',
          title: 'יש לך נטייה להתפרצויות',
          text: `הערב הכי גרוע שלך: ${myStats.biggestLoss} ₪. הגדר לעצמך stop-loss של 100 - והכי חשוב: לציית לו.`
        });
      } else if (myStats.biggestWin > 200 && winRate < 50) {
        recs.push({
          icon: '💎',
          title: 'אתה יודע לתקוף, אבל...',
          text: `שיא +${myStats.biggestWin} ₪ זה מטורף, אבל ${winRate.toFixed(0)}% ניצחון מראה שאתה מבזבז את הרווחים. עקביות > זכיות גדולות.`
        });
      } else if (winRate < 35) {
        recs.push({
          icon: '🎯',
          title: 'בחר ידיים יותר טוב',
          text: `${winRate.toFixed(0)}% ניצחון בעונה - אתה משחק יותר מדי ידיים. שחק tight מ-early position.`
        });
      } else if (winRate >= 55) {
        recs.push({
          icon: '👑',
          title: 'אתה מלך השולחן',
          text: `${winRate.toFixed(0)}% ניצחון בעונה. הזמן לדחוף את היריבים - 3bet יותר מ-button, סטיל יותר blinds.`
        });
      } else if (luckyHost && luckyHost[1].count >= 3) {
        const avgAtHost = (luckyHost[1].total / luckyHost[1].count).toFixed(0);
        if (avgAtHost > 20) {
          recs.push({
            icon: '🍀',
            title: `${luckyHost[0]} = הבית השני שלך`,
            text: `+${avgAtHost} ₪ בממוצע אצלו ב-${luckyHost[1].count} ערבים. זאת אינפו זהב - תהיה שם תמיד.`
          });
        }
      } else if (badHost && badHost[1].count >= 3) {
        const avgAtBad = (badHost[1].total / badHost[1].count).toFixed(0);
        if (avgAtBad < -20) {
          recs.push({
            icon: '🚫',
            title: `אצל ${badHost[0]} = שדה מוקשים`,
            text: `${avgAtBad} ₪ ב-${badHost[1].count} ערבים. או שהקפה שלו מקולקל או שהשחקנים קוראים אותך.`
          });
        }
      }
    }
    
    // ============================================================
    // גיבוי - אם משום מה אין מספיק המלצות
    // ============================================================
    if (recs.length === 0) {
      recs.push({
        icon: '🃏',
        title: 'תמשיך לשחק',
        text: 'עוד אין מספיק נתונים לאבחנה מדויקת. בערב הבא נדבר.'
      });
    }

    return recs.slice(0, 3); // מקסימום 3 המלצות
  };

  const recommendations = generateRecommendations();

  // בניית רשימת slides - כל אחד עם נתון אחד גדול ובולט
  const slides = [
    {
      emoji: '🏆',
      label: 'המקום שלך בדירוג',
      value: `#${myRank}`,
      valueClass: 'text-amber-300',
      sub: `מתוך ${stats.length} שחקנים בעונה`,
      bgClass: 'from-amber-900/40 to-stone-900/50',
      borderClass: 'border-amber-700/50',
    },
    {
      emoji: myStats.total >= 0 ? '💰' : '📉',
      label: 'הרווח שלך בעונה',
      value: `${myStats.total >= 0 ? '+' : ''}${myStats.total} ₪`,
      valueClass: myStats.total >= 0 ? 'text-emerald-400' : 'text-rose-400',
      sub: myStats.total >= 0 ? 'בדרך למעלה!' : 'יש עוד הרבה זמן להשתפר',
      bgClass: myStats.total >= 0 ? 'from-emerald-900/40 to-stone-900/50' : 'from-rose-900/30 to-stone-900/50',
      borderClass: myStats.total >= 0 ? 'border-emerald-700/50' : 'border-rose-700/40',
    },
    {
      emoji: '🎯',
      label: 'אחוז ניצחון',
      value: `${myStats.winRate.toFixed(0)}%`,
      valueClass: 'text-emerald-400',
      sub: `${myStats.wins} ניצחונות מתוך ${myStats.sessions} מפגשים`,
      bgClass: 'from-emerald-900/40 to-stone-900/50',
      borderClass: 'border-emerald-700/50',
    },
    {
      emoji: '💡',
      label: 'המלצות לערב הבא',
      isRecommendations: true,
      recommendations: recommendations,
      bgClass: 'from-violet-900/30 to-stone-900/50',
      borderClass: 'border-violet-700/50',
    },
    {
      emoji: '🔥',
      label: 'הערב הכי טוב שלך',
      value: `+${myStats.biggestWin} ₪`,
      valueClass: 'text-amber-400',
      sub: 'השיא האישי בעונה',
      bgClass: 'from-amber-900/40 to-stone-900/50',
      borderClass: 'border-amber-700/50',
    },
    {
      emoji: '💔',
      label: 'הנפילה הכי גדולה',
      value: `${myStats.biggestLoss} ₪`,
      valueClass: 'text-rose-400',
      sub: 'הערב הכי קשה בעונה',
      bgClass: 'from-rose-900/30 to-stone-900/50',
      borderClass: 'border-rose-700/40',
    },
    {
      emoji: '⚡',
      label: 'רצף ניצחונות מקסימלי',
      value: myStats.maxStreak,
      valueClass: 'text-violet-300',
      sub: `${myStats.maxStreak === 1 ? 'ערב אחד' : `${myStats.maxStreak} ערבים`} ברצף ללא הפסד`,
      bgClass: 'from-violet-900/30 to-stone-900/50',
      borderClass: 'border-violet-700/40',
    },
  ];

  if (favoriteHost) {
    slides.push({
      emoji: '🍀',
      label: 'המארח שמביא לך מזל',
      value: `אצל ${favoriteHost[0]}`,
      valueClass: 'text-amber-300',
      sub: `${favoriteHost[1].total >= 0 ? '+' : ''}${favoriteHost[1].total} ₪ ב-${favoriteHost[1].count} מפגשים`,
      bgClass: 'from-emerald-900/40 to-stone-900/50',
      borderClass: 'border-emerald-700/50',
      isText: true,
    });
  }

  if (myNextHost) {
    slides.push({
      emoji: '🏠',
      label: 'התור הבא שלך לארח',
      value: new Date(myNextHost.date).toLocaleDateString('he-IL', { day: '2-digit', month: 'long' }),
      valueClass: 'text-emerald-300',
      sub: new Date(myNextHost.date).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric' }),
      bgClass: 'from-emerald-900/50 to-stone-900/50',
      borderClass: 'border-emerald-700/60',
      isText: true,
    });
  }

  const goToSlide = (idx) => {
    if (scrollRef.current) {
      const slideWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: -idx * slideWidth, behavior: 'smooth' });
      setCurrentSlide(idx);
    }
  };

  const handleScroll = (e) => {
    const slideWidth = e.target.offsetWidth;
    const scrollLeft = Math.abs(e.target.scrollLeft);
    const newIdx = Math.round(scrollLeft / slideWidth);
    if (newIdx !== currentSlide) setCurrentSlide(newIdx);
  };

  return (
    <div className="rounded-2xl border-2 border-amber-700/50 bg-gradient-to-br from-amber-950/30 via-stone-900/40 to-stone-950/40 p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h3 className="text-base md:text-lg font-extrabold text-amber-200">התובנות שלך, {playerName}</h3>
        </div>
        <div className="text-xs text-amber-300/80 font-bold bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-800/40">{currentSlide + 1}/{slides.length}</div>
      </div>

      {/* הקרוסלה עם חצים */}
      <div className="relative">
        {/* חץ ימני (חזור אחורה) */}
        {currentSlide > 0 && (
          <button 
            onClick={() => goToSlide(currentSlide - 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-amber-900/80 hover:bg-amber-800 border border-amber-600/50 text-amber-200 w-8 h-8 flex items-center justify-center shadow-lg backdrop-blur transition"
            aria-label="הקודם">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {/* חץ שמאלי (הבא) */}
        {currentSlide < slides.length - 1 && (
          <button 
            onClick={() => goToSlide(currentSlide + 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-amber-900/80 hover:bg-amber-800 border border-amber-600/50 text-amber-200 w-8 h-8 flex items-center justify-center shadow-lg backdrop-blur transition animate-pulse-subtle"
            aria-label="הבא">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar" 
          style={{ scrollbarWidth: 'none' }}
          dir="rtl">
          {slides.map((slide, i) => (
            <div key={i} className="min-w-full snap-center px-1">
              <div className={`rounded-2xl border ${slide.borderClass} bg-gradient-to-br ${slide.bgClass} ${slide.isRecommendations ? 'p-3' : 'p-5 flex flex-col items-center justify-center text-center'}`} style={{ height: '180px' }}>
                {slide.isRecommendations ? (
                  <div className="h-full flex flex-col">
                    <div className="text-center flex items-center justify-center gap-2 mb-2 flex-shrink-0">
                      <span className="text-xl">{slide.emoji}</span>
                      <span className="text-xs text-violet-200/80 font-bold uppercase tracking-wider">{slide.label}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 text-right pr-1 custom-scrollbar">
                      {slide.recommendations.map((rec, idx) => (
                        <div key={idx} className="rounded-lg bg-stone-900/60 border border-violet-800/30 p-2.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-base">{rec.icon}</span>
                            <span className="text-xs font-bold text-violet-200">{rec.title}</span>
                          </div>
                          <div className="text-[11px] text-stone-300 leading-snug">{rec.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl mb-1">{slide.emoji}</div>
                    <div className="text-xs text-amber-200/80 font-bold uppercase tracking-wider mb-1">{slide.label}</div>
                    <div className={`${slide.isText ? 'text-xl md:text-2xl' : 'text-4xl md:text-5xl'} font-extrabold tabular-nums ${slide.valueClass} mb-1 leading-none drop-shadow-lg`}>
                      {slide.value}
                    </div>
                    <div className="text-xs md:text-sm text-stone-300">{slide.sub}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* נקודות ניווט */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button 
            key={i} 
            onClick={() => goToSlide(i)}
            className={`transition-all rounded-full ${
              i === currentSlide 
                ? 'w-6 h-1.5 bg-amber-400' 
                : 'w-1.5 h-1.5 bg-stone-700 hover:bg-stone-600'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// ===== מודל ניהול הרשאות (סופר אדמין בלבד) =====
const PermissionsManager = ({ isOpen, onClose, permissions, onUpdate, adminNamesList, onSwitchToAdmins }) => {
  const [localPerms, setLocalPerms] = useState(permissions);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (isOpen) setLocalPerms(permissions);
  }, [isOpen, permissions]);
  
  if (!isOpen) return null;
  
  const handleToggle = (key) => {
    setLocalPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const handleSave = async () => {
    setSaving(true);
    await onUpdate(localPerms);
    setSaving(false);
    onClose();
  };
  
  const handleResetDefaults = () => {
    if (!confirm('להחזיר את כל ההרשאות לברירות המחדל?')) return;
    setLocalPerms(getDefaultPermissions());
  };
  
  // אדמינים רגילים (לא סופר)
  const regularAdmins = adminNamesList.filter(a => !SUPER_ADMINS.includes(a));
  
  // האם נעשו שינויים
  const hasChanges = Object.keys(localPerms).some(k => localPerms[k] !== permissions[k]);
  
  return (
    <div dir="rtl" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-stone-950 rounded-2xl border-2 border-amber-700 w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        {/* כותרת */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-gradient-to-l from-amber-950/40 to-stone-950">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-lg font-extrabold text-amber-200">ניהול הרשאות</h2>
              <div className="text-xs text-stone-400">סופר אדמין בלבד 👑</div>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* 🆕 סאב-טאבים - מעבר מהיר למנהלים */}
        {onSwitchToAdmins && (
          <div className="flex gap-2 rounded-xl bg-stone-900/50 border border-stone-800 p-1 m-4 mb-0">
            <button
              onClick={onSwitchToAdmins}
              className="flex-1 rounded-lg py-2 px-3 text-xs font-bold text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 transition"
            >
              👑 מנהלים
            </button>
            <button
              className="flex-1 rounded-lg py-2 px-3 text-xs font-bold bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow"
            >
              ⚙️ הרשאות
            </button>
          </div>
        )}
        
        {/* הסבר */}
        <div className="px-4 py-3 bg-stone-900/50 border-b border-stone-800">
          <div className="text-xs text-stone-300 leading-relaxed mb-2">
            <span className="text-amber-400 font-bold">👑 סופר אדמין</span> (אתה) - גישה מלאה לכל הפיצ'רים, תמיד.
          </div>
          <div className="text-xs text-stone-300 leading-relaxed">
            <span className="text-blue-400 font-bold">🔧 אדמין רגיל</span> ({regularAdmins.length > 0 ? regularAdmins.join(', ') : 'אין'}) - רק לפיצ'רים שמסומנים פה.
          </div>
        </div>
        
        {/* רשימת פיצ'רים */}
        <div className="p-3 max-h-96 overflow-y-auto">
          <div className="space-y-1.5">
            {PERMISSIONS_REGISTRY.map(feature => {
              const isEnabled = !!localPerms[feature.key];
              const isLocked = feature.superOnly;
              return (
                <button
                  key={feature.key}
                  onClick={() => !isLocked && handleToggle(feature.key)}
                  disabled={isLocked}
                  className={`w-full text-right rounded-lg px-3 py-2.5 flex items-center justify-between gap-3 transition ${
                    isLocked
                      ? 'bg-stone-900/40 border border-stone-800 cursor-not-allowed'
                      : isEnabled
                        ? 'bg-emerald-950/30 border border-emerald-700 hover:bg-emerald-950/50'
                        : 'bg-stone-900 border border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold ${isLocked ? 'text-stone-500' : 'text-stone-100'}`}>
                      {feature.label}
                    </div>
                    {isLocked && (
                      <div className="text-[10px] text-amber-500 mt-0.5">🔒 ננעל לסופר אדמין בלבד</div>
                    )}
                  </div>
                  <div className={`shrink-0 w-12 h-6 rounded-full border-2 transition relative ${
                    isLocked
                      ? 'bg-stone-800 border-stone-700'
                      : isEnabled
                        ? 'bg-emerald-600 border-emerald-500'
                        : 'bg-stone-800 border-stone-600'
                  }`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      isEnabled ? 'right-0.5' : 'right-6'
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* כפתורים */}
        <div className="flex gap-2 p-4 border-t border-stone-800 bg-stone-900/30">
          <button
            onClick={handleResetDefaults}
            className="rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 px-3 py-2 text-xs text-stone-300 font-bold"
          >
            ↺ ברירות מחדל
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 px-4 py-2 text-sm text-stone-300 font-bold"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:opacity-40 px-5 py-2 text-sm text-white font-bold transition"
          >
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== מודל ניהול נעילות מכשירים (אדמין בלבד) =====
const DeviceLocksManager = ({ isOpen, onClose, deviceLocks, currentDeviceId, onRelease, players, onSwitchToUsers }) => {
  const [search, setSearch] = useState('');
  
  if (!isOpen) return null;
  
  // מיון: מכשיר נוכחי בראש, אחר כך לפי תאריך נעילה (חדש -> ישן)
  const sortedLocks = Object.entries(deviceLocks)
    .filter(([name]) => !search || name.toLowerCase().includes(search.toLowerCase()))
    .sort(([nameA, lockA], [nameB, lockB]) => {
      if (lockA.deviceId === currentDeviceId) return -1;
      if (lockB.deviceId === currentDeviceId) return 1;
      return new Date(lockB.lockedAt || 0) - new Date(lockA.lockedAt || 0);
    });
  
  // משתמשים ללא נעילה
  const unlockedPlayers = players.filter(p => !deviceLocks[p]);
  
  // זיהוי דפדפן/מכשיר
  const detectDevice = (ua) => {
    if (!ua) return '?';
    if (/iPhone/.test(ua)) return '📱 iPhone';
    if (/iPad/.test(ua)) return '📱 iPad';
    if (/Android/.test(ua)) return '📱 Android';
    if (/Mac/.test(ua)) return '💻 Mac';
    if (/Windows/.test(ua)) return '💻 Windows';
    return '🌐 דפדפן';
  };
  
  return (
    <div dir="rtl" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-stone-950 rounded-2xl border-2 border-rose-800 w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        {/* כותרת */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-gradient-to-l from-rose-950/40 to-stone-950">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-extrabold text-rose-200">🔒 ניהול נעילות מכשירים</h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* 🆕 סאב-טאבים - מעבר מהיר לניהול משתמשים */}
        {onSwitchToUsers && (
          <div className="flex gap-2 rounded-xl bg-stone-900/50 border border-stone-800 p-1 m-4 mb-0">
            <button
              onClick={onSwitchToUsers}
              className="flex-1 rounded-lg py-2 px-3 text-xs font-bold text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 transition"
            >
              👥 משתמשים
            </button>
            <button
              className="flex-1 rounded-lg py-2 px-3 text-xs font-bold bg-gradient-to-r from-rose-700 to-rose-800 text-white shadow"
            >
              🔒 נעילות מכשירים
            </button>
          </div>
        )}
        
        {/* הסבר */}
        <div className="px-4 py-3 bg-stone-900/50 border-b border-stone-800">
          <div className="text-xs text-stone-400 leading-relaxed">
            כל מכשיר נעול למשתמש אחד. אם משתמש מחליף טלפון או מנקה דפדפן - שחרר את הנעילה כדי שיוכל להירשם שוב במכשיר חדש.
          </div>
        </div>
        
        {/* חיפוש */}
        <div className="p-4 border-b border-stone-800">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש משתמש..."
              className="w-full rounded-lg border border-stone-700 bg-stone-900 pr-10 pl-4 py-2 text-sm text-white focus:outline-none focus:border-rose-600"
            />
          </div>
        </div>
        
        {/* רשימת נעילות */}
        <div className="p-3 max-h-96 overflow-y-auto">
          {sortedLocks.length === 0 ? (
            <div className="text-center py-8 text-stone-500 text-sm">
              {search ? 'לא נמצאו תוצאות' : 'עדיין אין נעילות פעילות'}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedLocks.map(([name, lock]) => {
                const isCurrentDevice = lock.deviceId === currentDeviceId;
                return (
                  <div key={name}
                    className={`rounded-lg border p-3 ${
                      isCurrentDevice 
                        ? 'bg-emerald-950/30 border-emerald-800' 
                        : 'bg-stone-900 border-stone-800'
                    }`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-bold text-stone-100">{name}</div>
                      {isCurrentDevice && (
                        <span className="text-xs text-emerald-400 font-bold">📍 המכשיר הזה</span>
                      )}
                    </div>
                    <div className="text-xs text-stone-400 flex flex-wrap gap-x-3 gap-y-1 mb-2">
                      <span>{detectDevice(lock.userAgent)}</span>
                      <span>נעול מ-{lock.lockedAt ? new Date(lock.lockedAt).toLocaleDateString('he-IL') : '?'}</span>
                      {lock.autoLocked && <span className="text-amber-500">(הצמדה אוטומטית)</span>}
                    </div>
                    <div className="text-[10px] text-stone-600 font-mono mb-2 truncate" dir="ltr">
                      {lock.deviceId}
                    </div>
                    {!isCurrentDevice && (
                      <button
                        onClick={() => onRelease(name)}
                        className="w-full rounded-md bg-red-900/40 hover:bg-red-900/70 border border-red-800 py-1.5 text-xs text-red-200 font-bold transition"
                      >
                        🔓 שחרר נעילה
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* משתמשים ללא נעילה */}
        {!search && unlockedPlayers.length > 0 && (
          <div className="border-t border-stone-800">
            <div className="px-4 py-2 bg-stone-900/50 text-xs text-stone-500 font-bold tracking-widest">
              ללא נעילה ({unlockedPlayers.length})
            </div>
            <div className="px-4 py-2 text-xs text-stone-400 leading-relaxed">
              {unlockedPlayers.join(' • ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// המארח של המפגש הבא רשום אוטומטית במקום #1
// שחקנים אחרים לוחצים "אני בא" כדי להירשם למקומות 2-11 או לסטנד ביי (12+)
// הרישום נפתח ב-12:00 בצהריים למחרת המפגש האחרון
const RegistrationTab = ({ 
  hostingSchedule, 
  sessions,
  currentUser, 
  isAdmin, 
  isSuperAdmin,
  registration, 
  onUpdate, 
  players,
  ironRegistration,
  onIronUpdate
}) => {
  const MAX_SLOTS = 11; // מספר מקומות רשמיים
  const randomOpenTimeRef = React.useRef(null); // זמן פתיחה אקראי מ-Cloud Function
  
  // טעינת זמן פתיחה אקראי מ-Firestore
  React.useEffect(() => {
    loadState(RANDOM_TIME_KEY).then(data => {
      if (data?.targetTimestamp) {
        randomOpenTimeRef.current = new Date(data.targetTimestamp);
      }
    }).catch(() => {});
  }, []);
  
  // 🗓️ זיהוי המפגש הבא מ-hostingSchedule - גם אם אין מארח עדיין
  const today = getTodayIsrael();
  const nextSession = useMemo(() => {
    if (!hostingSchedule || !Array.isArray(hostingSchedule)) return null;
    return hostingSchedule
      .filter(h => h.date >= today)  // ⬅️ אין יותר && h.host - גם תאריכים בלי מארח
      .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
  }, [hostingSchedule, today]);
  
  // 🕐 חישוב מצב פתיחה: 
  // - הרשימה מתאפסת ב-10:00 בבוקר למחרת המפגש האחרון
  // - הרישום נפתח ב-12:00 בצהריים למחרת המפגש האחרון  
  const lastSessionDate = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0]?.date || null;
  }, [sessions]);
  
  // האם הרישום נפתח (אחרי 12:00 ביום שלמחרת המפגש האחרון, ולפני המפגש הבא)
  const registrationOpenInfo = useMemo(() => {
    if (!nextSession) return { isOpen: false, opensAt: null, reason: 'אין מפגש מתוכנן' };
    
    const now = new Date();
    const nextDate = new Date(nextSession.date + 'T00:00:00');
    
    // אם המפגש כבר עבר - סגור
    if (now > new Date(nextSession.date + 'T23:59:59')) {
      return { isOpen: false, opensAt: null, reason: 'המפגש הסתיים' };
    }
    
    // הרישום נפתח ביום אחרי המפגש הקודם - בשעה האקראית מ-Cloud Function
    let opensAt;
    if (lastSessionDate && lastSessionDate < nextSession.date) {
      if (randomOpenTimeRef.current) {
        opensAt = randomOpenTimeRef.current;
      } else {
        const lastDate = new Date(lastSessionDate + 'T00:00:00');
        opensAt = new Date(lastDate);
        opensAt.setDate(opensAt.getDate() + 1);
        opensAt.setHours(12, 0, 0, 0);
      }
    } else {
      opensAt = new Date(now.getTime() - 1000);
    }
    
    if (now < opensAt) {
      return { isOpen: false, opensAt, reason: 'הרישום עדיין לא נפתח' };
    }
    
    return { isOpen: true, opensAt, reason: null };
  }, [nextSession, lastSessionDate]);
  
  // 🔄 איפוס אוטומטי ב-11:55 ביום אחרי המפגש - רק סופר אדמין מבצע
  // (כדי למנוע race condition של משתמשים מרובים שמאפסים בו זמנית)
  // איפוסים נוספים = ידנית בלבד דרך כפתור "🔄 אפס רישום"
  useEffect(() => {
    if (!nextSession || !registration) return;
    
    // איפוס ראשוני: אין registration כלל - אכלס את המארח (כל משתמש יכול)
    if (!registration.sessionDate || !registration.entries) {
      const fresh = {
        sessionDate: nextSession.date,
        host: nextSession.host || '',
        entries: nextSession.host 
          ? [{ name: nextSession.host, addedAt: new Date().toISOString(), isHost: true }]
          : [],  // ⬅️ אם אין מארח - רשימה ריקה (מקום #1 שמור)
        resetAt: new Date().toISOString(),
      };
      onUpdate(fresh);
      return;
    }
    
    // איפוס מעבר בין מפגשים ב-11:55 - רק סופר אדמין
    if (!isSuperAdmin) return;
    
    if (registration.sessionDate && registration.sessionDate !== nextSession.date) {
      // 🔧 v2.33.36: איפוס מיידי - ברגע שהמארח/תאריך משתנה (בלי לחכות ל-6:00 בבוקר)
      const fresh = {
        sessionDate: nextSession.date,
        host: nextSession.host || '',
        entries: nextSession.host
          ? [{ name: nextSession.host, addedAt: new Date().toISOString(), isHost: true }]
          : [],
        resetAt: new Date().toISOString(),
      };
      onUpdate(fresh);
      // 📌 איפוס רישום ברזל יחד עם איפוס המפגש
      if (onIronUpdate && (ironRegistration?.players?.length || ironRegistration?.refused?.length)) {
        onIronUpdate({ players: [], refused: [] });
      }
    }
  }, [nextSession, registration, onUpdate, isSuperAdmin]);
  
  // 📌 גיבוי - בדיקה כל 30 שניות אם יש ברזל ממתין שלא נכנס לזמן ארוך
  // (מקרה קצה: ההרשמה האחרונה הייתה לפני יותר מ-2 דקות אבל הברזל לא נכנס)
  useEffect(() => {
    if (!ironRegistration?.players?.length) return;
    if (!registration?.entries) return;
    
    const interval = setInterval(() => {
      // 🔒 בדיקה: רק אם הרישום פתוח רשמית
      if (!registrationOpenInfo.isOpen) return;
      
      const entries = registration.entries || [];
      const enrolled = new Set(entries.map(e => e.name));
      const refused = new Set(ironRegistration.refused || []);
      const ironsLeft = ironRegistration.players.filter(n => !enrolled.has(n) && !refused.has(n));
      if (ironsLeft.length === 0) return;
      
      // אם המפגש מלא - לא עושה כלום
      if (entries.length >= MAX_SLOTS) return;
      
      // בדיקה: ההרשמה האחרונה הייתה לפני יותר מ-2 דקות?
      const lastEntry = entries[entries.length - 1];
      if (!lastEntry?.addedAt) return;
      const lastTime = new Date(lastEntry.addedAt).getTime();
      const now = Date.now();
      const minutesSinceLast = (now - lastTime) / 60000;
      
      if (minutesSinceLast >= 2) {
        // הוסף ברזל אקראי
        const chosen = ironsLeft[Math.floor(Math.random() * ironsLeft.length)];
        const newEntries = [...entries, {
          name: chosen,
          addedAt: new Date().toISOString(),
          isHost: false,
          isIron: true,
        }];
        onUpdate({ ...registration, entries: newEntries });
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [ironRegistration, registration, onUpdate, registrationOpenInfo.isOpen]);
  
  // 📋 רשימת רשומים מסודרת לפי סדר ההצטרפות
  const entries = registration?.entries || [];
  const myEntry = entries.find(e => e.name === currentUser);
  const myPosition = myEntry ? entries.indexOf(myEntry) + 1 : null;
  const myStatus = myPosition ? (myPosition <= MAX_SLOTS ? 'registered' : 'standby') : null;
  
  // 📌 רשימת שמות הברזל הממתינים (שטרם נכנסו לרשימה ולא סורבו)
  const pendingIron = useMemo(() => {
    if (!ironRegistration?.players) return [];
    const enrolled = new Set(entries.map(e => e.name));
    const refused = new Set(ironRegistration.refused || []);
    return ironRegistration.players.filter(name => !enrolled.has(name) && !refused.has(name));
  }, [ironRegistration, entries]);
  
  // 🎲 פונקציה להגרלת הצטרפות ברזל
  // החלטה אם להוסיף ברזל ב-setTimeout, ואיזה - לפי האלגוריתם הדינמי
  const tryAddIronAfterDelay = (currentEntries) => {
    if (!ironRegistration?.players?.length) return;
    if (!registrationOpenInfo.isOpen) return;
    
    // חישוב כמה ברזלים ממתינים וכמה מקומות פנויים
    const enrolled = new Set(currentEntries.map(e => e.name));
    const refused = new Set(ironRegistration.refused || []);
    const ironsLeft = ironRegistration.players.filter(n => !enrolled.has(n) && !refused.has(n));
    if (ironsLeft.length === 0) return;
    
    const remainingSlots = MAX_SLOTS - currentEntries.length;
    if (remainingSlots <= 0) return; // כל המקומות תפוסים
    
    // 🎲 הסיכוי = (ברזלים שנותרו) / (מקומות פנויים)
    // אם 100% או יותר - חייבים להכניס
    const chance = ironsLeft.length / remainingSlots;
    const shouldAdd = Math.random() < chance;
    if (!shouldAdd) return;
    
    // מתזמן הצטרפות תוך 5-15 שניות אקראיות
    const delayMs = 5000 + Math.random() * 10000;
    setTimeout(async () => {
      // בודק שוב לפני ההוספה - אולי המצב השתנה
      const latestEntries = registration?.entries || [];
      const latestEnrolled = new Set(latestEntries.map(e => e.name));
      const latestRefused = new Set(ironRegistration.refused || []);
      const stillPending = ironRegistration.players.filter(n => !latestEnrolled.has(n) && !latestRefused.has(n));
      if (stillPending.length === 0) return;
      if (latestEntries.length >= MAX_SLOTS) return;
      
      // בוחר ברזל אקראי מהממתינים
      const chosen = stillPending[Math.floor(Math.random() * stillPending.length)];
      const newEntries = [...latestEntries, {
        name: chosen,
        addedAt: new Date().toISOString(),
        isHost: false,
        isIron: true, // סימון פנימי שזה הצטרפות ברזל (לא נחשף ל-UI הציבורי)
      }];
      await onUpdate({ ...registration, entries: newEntries });
    }, delayMs);
  };
  
  // ➕ פעולה: אני בא
  const handleJoin = async () => {
    if (!currentUser) return;
    if (entries.some(e => e.name === currentUser)) return; // כבר רשום
    
    const newEntries = [...entries, { 
      name: currentUser, 
      addedAt: new Date().toISOString(),
      isHost: false 
    }];
    await onUpdate({ ...registration, entries: newEntries });
    
    // 📌 אחרי הרישום - מנסה להוסיף ברזל באקראי
    tryAddIronAfterDelay(newEntries);
  };
  
  // ➖ פעולה: ביטול (השחקן עצמו או אדמין)
  const handleLeave = async (name) => {
    if (!name) return;
    // אדמין לא יכול להסיר את המארח (הוא שורש המפגש)
    const entry = entries.find(e => e.name === name);
    if (entry?.isHost) {
      alert('לא ניתן להסיר את המארח. אם המארח לא יכול - שנה את לוח האירוחים.');
      return;
    }
    const newEntries = entries.filter(e => e.name !== name);
    
    // 📌 אם זה שחקן ברזל שמבטל - מוסיף אותו לרשימת המסורבים (לא ננסה להחזיר אותו)
    const wasIronPlayer = ironRegistration?.players?.includes(name);
    if (wasIronPlayer && onIronUpdate) {
      const refused = [...(ironRegistration.refused || []), name];
      await onIronUpdate({ ...ironRegistration, refused });
    }
    
    await onUpdate({ ...registration, entries: newEntries });
  };
  
  // 📌 הפעלת/ביטול סימון של שחקן ברזל
  const toggleIron = async (name) => {
    if (!onIronUpdate) return;
    const current = ironRegistration?.players || [];
    const newPlayers = current.includes(name) 
      ? current.filter(p => p !== name)
      : [...current, name];
    // אם הוספנו - נוודא שהוא לא ברשימת המסורבים (לאפשר רישום מחדש)
    const refused = (ironRegistration?.refused || []).filter(p => p !== name);
    await onIronUpdate({ players: newPlayers, refused });
  };
  
  // ➕ אדמין: הוספת שחקן ידנית
  const [adminAddOpen, setAdminAddOpen] = useState(false);
  const [adminAddSearch, setAdminAddSearch] = useState('');
  // 📌 רישום ברזל - פאנל פתוח/סגור (סופר אדמין בלבד)
  const [ironPanelOpen, setIronPanelOpen] = useState(false);
  const [ironSearch, setIronSearch] = useState('');
  const handleAdminAdd = async (name) => {
    if (entries.some(e => e.name === name)) return;
    const newEntries = [...entries, {
      name,
      addedAt: new Date().toISOString(),
      isHost: false,
      addedByAdmin: true,
    }];
    await onUpdate({ ...registration, entries: newEntries });
    setAdminAddOpen(false);
    setAdminAddSearch('');
  };
  
  const availableForAdmin = useMemo(() => {
    const taken = new Set(entries.map(e => e.name));
    return players.filter(p => !taken.has(p));
  }, [players, entries]);
  
  // 🎨 רינדור
  if (!nextSession) {
    return (
      <div className="rounded-2xl border border-stone-700 bg-stone-900/50 p-8 text-center text-stone-400">
        <ClipboardList className="h-12 w-12 mx-auto mb-3 text-stone-600" />
        <div className="text-lg font-bold mb-2">אין מפגש מתוכנן</div>
        <div className="text-sm text-stone-500">רישום ייפתח ברגע שיוגדר מפגש בלוח האירוחים</div>
      </div>
    );
  }
  
  const sessionDateFormatted = new Date(nextSession.date + 'T00:00:00').toLocaleDateString('he-IL', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
  
  const opensAtFormatted = registrationOpenInfo.opensAt ? 
    registrationOpenInfo.opensAt.toLocaleDateString('he-IL', {
      weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
    }) : null;
  
  return (
    <div className="space-y-4">
      {/* 🏆 כותרת המפגש */}
      <div className="rounded-2xl overflow-hidden border-2 border-amber-700 bg-gradient-to-br from-amber-950/60 via-stone-900 to-stone-950">
        <div className="p-5 border-b border-amber-900/40">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-5 w-5 text-amber-400" />
            <div className="text-xs text-amber-400 font-bold tracking-widest">REGISTRATION</div>
          </div>
          <div className="text-2xl font-extrabold text-amber-200 mb-1">המפגש הבא</div>
          <div className="text-base text-stone-300">{sessionDateFormatted}</div>
          {nextSession.host ? (
            <>
              <div className="text-sm text-stone-400 mt-1">
                מארח: <span className="font-bold text-amber-300">{nextSession.host}</span>
              </div>
              {nextSession.address && (
                <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-stone-500" />
                    {nextSession.address}
                  </span>
                  <a
                    href={`https://waze.com/ul?q=${encodeURIComponent(nextSession.address)}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-600/40 hover:border-cyan-500 px-2 py-0.5 text-cyan-300 hover:text-cyan-200 transition text-[11px] font-bold"
                    title="פתח ב-Waze"
                  >
                    🚗 Waze
                  </a>
                </div>
              )}
              {nextSession.notes && (
                <div className="text-xs text-stone-500 italic mt-0.5">
                  {nextSession.notes}
                </div>
              )}
            </>
          ) : (
            <div className="mt-2 rounded-lg bg-amber-950/40 border border-amber-700/40 px-3 py-2">
              <div className="text-sm text-amber-300 font-bold flex items-center gap-2">
                <span>⏳</span>
                <span>עדיין לא נקבע מארח</span>
              </div>
              <div className="text-xs text-amber-400/70 mt-0.5">
                ניתן להירשם - מקום #1 ישמר למארח
              </div>
            </div>
          )}
        </div>
        
        {/* מצב הרישום */}
        {!registrationOpenInfo.isOpen ? (
          <div className="p-4 bg-stone-900/60 border-t border-stone-800">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-stone-500" />
              <span className="text-stone-400">{registrationOpenInfo.reason}</span>
            </div>
            {opensAtFormatted && (
              <div className="text-xs text-stone-500 mt-1">
                ⏰ הרישום נפתח: <span className="text-amber-400 font-bold">{opensAtFormatted}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-emerald-950/30 border-t border-emerald-900/40">
            <div className="flex items-center gap-2 text-sm text-emerald-300 font-bold">
              <Check className="h-4 w-4" />
              <span>הרישום פתוח</span>
              <span className="text-stone-400 font-normal mr-auto">
                {entries.length} / {MAX_SLOTS} {entries.length > MAX_SLOTS ? `(+${entries.length - MAX_SLOTS} סטנד-ביי)` : ''}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* כפתור "אני בא" / "ביטול" - לעצמי */}
      {registrationOpenInfo.isOpen && currentUser && (
        <div>
          {!myEntry ? (
            <button
              onClick={handleJoin}
              className="w-full rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-extrabold text-lg py-4 shadow-lg shadow-emerald-900/30 border border-emerald-500/40 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <UserPlus className="h-5 w-5" />
              אני בא 🎰
            </button>
          ) : (
            <div className={`rounded-xl border-2 p-4 ${
              myStatus === 'registered' 
                ? 'bg-emerald-950/40 border-emerald-700' 
                : 'bg-amber-950/40 border-amber-700'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-stone-400 mb-0.5">סטטוס שלך</div>
                  <div className={`text-base font-extrabold ${
                    myStatus === 'registered' ? 'text-emerald-300' : 'text-amber-300'
                  }`}>
                    {myStatus === 'registered' 
                      ? `✓ רשום במקום #${myPosition}` 
                      : `⏳ סטנד-ביי #${myPosition - MAX_SLOTS}`}
                  </div>
                </div>
                {!myEntry.isHost && (
                  <button
                    onClick={() => handleLeave(currentUser)}
                    className="rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700 px-3 py-2 text-sm text-red-200 font-bold flex items-center gap-1.5"
                  >
                    <UserMinus className="h-4 w-4" />
                    ביטול
                  </button>
                )}
                {myEntry.isHost && (
                  <div className="text-xs text-amber-500 italic">המארח 🏠</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* רשימת רשומים */}
      <div className="rounded-2xl border border-stone-700 bg-stone-900/50 overflow-hidden">
        <div className="px-4 py-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-400" />
            <div className="text-sm font-bold text-stone-200">רשימת נרשמים</div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* 📌 כפתור רישום ברזל - רק לסופר אדמין */}
            {isSuperAdmin && (
              <button
                onClick={() => setIronPanelOpen(!ironPanelOpen)}
                className={`text-xs rounded-md border px-2 py-1 font-bold flex items-center gap-1 transition ${
                  ironPanelOpen
                    ? 'bg-rose-700 border-rose-500 text-white'
                    : 'bg-rose-950/40 hover:bg-rose-950/60 border-rose-900 text-rose-300'
                }`}
                title="רישום ברזל - שחקנים שיצטרפו אוטומטית"
              >
                📌 ברזל {ironRegistration?.players?.length > 0 && `(${ironRegistration.players.length})`}
              </button>
            )}
            {isSuperAdmin && (
              <button
                onClick={() => setAdminAddOpen(!adminAddOpen)}
                className="text-xs rounded-md bg-amber-900/40 hover:bg-amber-900/60 border border-amber-800 px-2 py-1 text-amber-300 font-bold flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> אדמין
              </button>
            )}
          </div>
        </div>
        
        {/* 📌 פאנל רישום ברזל - סופר אדמין בלבד */}
        {ironPanelOpen && isSuperAdmin && (
          <div className="p-3 bg-rose-950/20 border-b border-rose-900/40">
            <div className="text-xs text-rose-300 mb-1 font-bold">📌 רישום ברזל</div>
            <div className="text-[11px] text-stone-400 mb-2 leading-relaxed">
              סמן שחקנים שיצטרפו אוטומטית לרשימה כשהרישום פתוח. ההצטרפות נראית טבעית - השחקנים נכנסים אחרי שאחרים נרשמים, באקראיות.
            </div>
            <div className="relative mb-2">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="text"
                value={ironSearch}
                onChange={e => setIronSearch(e.target.value)}
                placeholder="חיפוש..."
                className="w-full rounded-md border border-stone-700 bg-stone-950 pr-8 pl-2 py-1.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-rose-600"
              />
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
              {players
                .filter(p => !ironSearch || p.toLowerCase().includes(ironSearch.toLowerCase()))
                .map(p => {
                  const isMarked = ironRegistration?.players?.includes(p);
                  const isAlreadyRegistered = entries.some(e => e.name === p);
                  const wasRefused = ironRegistration?.refused?.includes(p);
                  return (
                    <button key={p} onClick={() => toggleIron(p)}
                      disabled={isAlreadyRegistered}
                      className={`rounded-md px-2 py-1.5 text-sm transition flex items-center justify-center gap-1 ${
                        isAlreadyRegistered
                          ? 'bg-stone-900 text-stone-600 cursor-not-allowed line-through'
                          : isMarked
                            ? 'bg-rose-700 text-white font-bold ring-2 ring-rose-400'
                            : wasRefused
                              ? 'bg-stone-800 text-stone-500'
                              : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                      }`}
                      title={isAlreadyRegistered ? 'כבר רשום' : (wasRefused ? 'ביטל הרשמה - לא ינסה שוב' : '')}
                    >
                      {isMarked && '📌'}
                      <span>{p}</span>
                    </button>
                  );
                })}
            </div>
            {ironRegistration?.players?.length > 0 && (
              <div className="mt-2 text-[10px] text-rose-300">
                ממתינים להצטרפות: {pendingIron.length} מתוך {ironRegistration.players.length}
              </div>
            )}
          </div>
        )}
        
        {/* פאנל סופר אדמין להוספה ידנית */}
        {adminAddOpen && isSuperAdmin && (
          <div className="p-3 bg-amber-950/20 border-b border-amber-900/40">
            <div className="text-xs text-amber-300 mb-2">בחר שחקן להוספה (כאדמין):</div>
            <div className="relative mb-2">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="text"
                value={adminAddSearch}
                onChange={e => setAdminAddSearch(e.target.value)}
                placeholder="חיפוש..."
                className="w-full rounded-md border border-stone-700 bg-stone-950 pr-8 pl-2 py-1.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-600"
              />
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
              {availableForAdmin
                .filter(p => !adminAddSearch || p.toLowerCase().includes(adminAddSearch.toLowerCase()))
                .map(p => (
                  <button key={p} onClick={() => handleAdminAdd(p)}
                    className="rounded-md px-2 py-1.5 text-sm bg-stone-800 text-stone-200 hover:bg-amber-700 hover:text-white transition">
                    {p}
                  </button>
                ))}
            </div>
          </div>
        )}
        
        {/* רשומים רשמיים (1-11) */}
        {entries.length === 0 ? (
          <div className="p-6 text-center text-stone-500 text-sm">
            עדיין אין רשומים
          </div>
        ) : (
          <div className="divide-y divide-stone-800">
            {/* 🟡 שורה ב-#1 כשאין מארח - מקום שמור */}
            {!nextSession.host && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-950/20 border-r-4 border-amber-700/60">
                <div className="w-8 h-8 rounded-full bg-amber-700/40 border border-amber-700 text-amber-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-amber-300/90 truncate flex items-center gap-2">
                    <span>⏳</span>
                    <span className="italic">ממתין למארח</span>
                  </div>
                  <div className="text-xs text-amber-500/60">המקום שמור</div>
                </div>
              </div>
            )}
            {entries.slice(0, MAX_SLOTS - (!nextSession.host ? 1 : 0)).map((entry, idx) => {
              const position = idx + 1 + (!nextSession.host ? 1 : 0);
              const isMe = entry.name === currentUser;
              return (
                <div key={entry.name} 
                  className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? 'bg-emerald-950/20' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                    {position}
                  </div>
                  {PLAYER_AVATARS[entry.name] && (
                    <PlayerAvatar name={entry.name} size={36} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-stone-100 truncate">
                      {entry.name}
                      {entry.isHost && <span className="text-amber-400 mr-1.5">🏠</span>}
                      {isMe && <span className="text-emerald-400 text-xs mr-1.5">(אני)</span>}
                    </div>
                  </div>
                  {(isSuperAdmin || isMe) && !entry.isHost && (
                    <button
                      onClick={() => handleLeave(entry.name)}
                      className="text-stone-500 hover:text-red-400 p-1"
                      title="הסר"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
            
            {/* סטנד ביי (12+) */}
            {entries.length > MAX_SLOTS && (
              <>
                <div className="px-4 py-2 bg-amber-950/20 border-y border-amber-900/40">
                  <div className="text-xs font-bold text-amber-400 tracking-widest">סטנד ביי</div>
                </div>
                {entries.slice(MAX_SLOTS).map((entry, idx) => {
                  const standbyPos = idx + 1;
                  const isMe = entry.name === currentUser;
                  return (
                    <div key={entry.name}
                      className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? 'bg-amber-950/20' : 'bg-stone-900/30'}`}>
                      <div className="w-8 h-8 rounded-full bg-amber-900/60 text-amber-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                        SB-{standbyPos}
                      </div>
                      {PLAYER_AVATARS[entry.name] && (
                        <PlayerAvatar name={entry.name} size={36} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-stone-300 truncate">
                          {entry.name}
                          {isMe && <span className="text-amber-400 text-xs mr-1.5">(אני)</span>}
                        </div>
                      </div>
                      {(isSuperAdmin || isMe) && (
                        <button
                          onClick={() => handleLeave(entry.name)}
                          className="text-stone-500 hover:text-red-400 p-1"
                          title="הסר"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* הסבר */}
      <div className="rounded-xl bg-stone-900/40 border border-stone-800 p-3 text-xs text-stone-400 leading-relaxed">
        <div className="font-bold text-stone-300 mb-1">📜 כללי הרישום</div>
        <div>• {MAX_SLOTS} מקומות רשמיים • כל הקודם זוכה</div>
        <div>• מקום 12 ומעלה - סטנד ביי, יעלה אוטומטית אם מישהו יבטל</div>
        <div>• הרישום נפתח ב-12:00 בצהריים למחרת המפגש הקודם</div>
      </div>
    </div>
  );
};


// ===== באנר 3 המארחים הבאים בדשבורד =====
const NextHostsBanner = ({ hostingSchedule, onSeeAll }) => {
  const today = getTodayIsrael();
  const upcoming = hostingSchedule
    .filter(h => h.date >= today && h.host)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-2xl border border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950 p-4 md:p-5 backdrop-blur">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm md:text-base font-bold text-amber-200 flex items-center gap-2">
          🏠 המארחים הבאים
        </h3>
        <button onClick={onSeeAll} className="text-xs text-amber-400 hover:text-amber-300 underline">
          ראה את כל הלוח →
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {upcoming.map((h, i) => {
          const date = new Date(h.date);
          const isFirst = i === 0;
          return (
            <div key={h.date} className={`rounded-xl border p-3 ${
              isFirst ? 'border-amber-700/50 bg-amber-950/20' : 'border-stone-800 bg-stone-900/40'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <div className={`text-xs ${isFirst ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
                  {isFirst ? 'הקרוב' : `בעוד ${i+1}`}
                </div>
                <div className="text-xs text-stone-500">{h.dayName}</div>
              </div>
              <div className="text-lg font-extrabold text-stone-100">{h.host}</div>
              <div className="text-xs text-stone-400 mt-0.5">
                {date.toLocaleDateString('he-IL', { day: '2-digit', month: 'long' })}
              </div>
              {h.notes && <div className="text-xs text-stone-500 mt-1 italic">{h.notes}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== טבלת ריכוז אירוחים =====
const HostingSummaryTable = ({ allSessions, players }) => {
  // ספירת אירוחים לכל שחקן לפי שנה
  const { yearCounts, years, totalCounts, sortedPlayers } = useMemo(() => {
    const byPlayerYear = {}; // {name: {year: count}}
    const years = new Set();
    
    allSessions.forEach(s => {
      if (!s.host) return;
      const year = s.season || new Date(s.date).getFullYear();
      years.add(year);
      if (!byPlayerYear[s.host]) byPlayerYear[s.host] = {};
      byPlayerYear[s.host][year] = (byPlayerYear[s.host][year] || 0) + 1;
    });
    
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    
    // חישוב סה"כ לכל שחקן
    const totals = {};
    Object.entries(byPlayerYear).forEach(([name, yrs]) => {
      totals[name] = Object.values(yrs).reduce((s, c) => s + c, 0);
    });
    
    // מיון שחקנים לפי סה"כ אירוחים (גבוה לנמוך)
    const sorted = Object.keys(byPlayerYear).sort((a, b) => totals[b] - totals[a]);
    
    return { yearCounts: byPlayerYear, years: sortedYears, totalCounts: totals, sortedPlayers: sorted };
  }, [allSessions]);
  
  if (sortedPlayers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur">
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/40 to-stone-900/40 px-4 md:px-6 py-4 rounded-t-2xl">
        <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
          🏠 סיכום אירוחים לפי שחקן
        </h3>
        <div className="text-xs text-stone-400 mt-1">מספר הפעמים שכל אחד אירח לפי שנה</div>
      </div>
      <div className="relative overflow-auto rounded-b-2xl" style={{ maxHeight: '60vh', WebkitOverflowScrolling: 'touch' }} dir="rtl">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-40">
            <tr>
              <th className="sticky top-0 right-0 z-50 bg-stone-900 border-b-2 border-l border-stone-700 px-3 py-3 text-right font-bold text-xs text-amber-200 uppercase min-w-[90px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]">
                שחקן
              </th>
              {years.map(y => (
                <th key={y} className="sticky top-0 z-40 bg-stone-900 border-b-2 border-stone-700 px-3 py-3 text-center font-bold text-xs text-amber-200 whitespace-nowrap min-w-[70px]">
                  {y}
                </th>
              ))}
              <th className="sticky top-0 left-0 z-50 bg-amber-950/70 border-b-2 border-r border-amber-700 px-3 py-3 text-center font-bold text-xs text-amber-200 whitespace-nowrap min-w-[70px]">
                סה״כ
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((name, i) => {
              const rowBg = i % 2 === 0 ? 'bg-stone-950' : 'bg-stone-900/50';
              return (
                <tr key={name} className="group hover:bg-amber-950/10">
                  <td className={`sticky right-0 z-10 ${rowBg} group-hover:bg-amber-950/20 border-b border-l border-stone-800 px-3 py-2.5 font-bold text-stone-100 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                    {name}
                  </td>
                  {years.map(y => {
                    const count = yearCounts[name]?.[y] || 0;
                    return (
                      <td key={y} className={`border-b border-stone-900 px-3 py-2.5 text-center tabular-nums whitespace-nowrap ${count > 0 ? 'text-stone-200' : 'text-stone-600'}`}>
                        {count || '—'}
                      </td>
                    );
                  })}
                  <td className={`sticky left-0 z-10 border-b border-r border-amber-800/50 px-3 py-2.5 tabular-nums text-center font-extrabold whitespace-nowrap bg-amber-950/50 text-amber-200`}>
                    {totalCounts[name]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===== טאב אירוחים מלא =====
const HostingTab = ({ hostingSchedule, isAdmin, onUpdate, players, addedBy, defaultFilter = 'upcoming', registration, onRegistrationUpdate }) => {
  const [editingDate, setEditingDate] = useState(null);
  const [editHost, setEditHost] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newHost, setNewHost] = useState({ date: '', dayName: 'שני', host: '', notes: '', address: '' });
  const [filter, setFilter] = useState(defaultFilter); // upcoming | past | all
  const [filterHost, setFilterHost] = useState('all'); // 🆕 פילטר לפי שם המארח
  const [hostReminders, setHostReminders] = useState({}); // 🍻 תזכורות מארחים - מי אישר/דחה/ממתין
  const [reminderMenuOpen, setReminderMenuOpen] = useState(null); // איזה תאריך פתוח לתפריט "סמן ידנית"
  const today = getTodayIsrael();
  
  // 🍻 טעינה ראשונית של תזכורות מארחים + רענון כל 30 שניות
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fbLoadState(HOST_REMINDERS_KEY);
        if (!cancelled && data && typeof data === 'object') {
          setHostReminders(data);
        }
      } catch (e) {
        console.error('שגיאה בטעינת תזכורות:', e);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
  
  // 🍻 פונקציה לסימון ידני (רק לאדמינים)
  const markReminderManually = async (date, host, response) => {
    try {
      const reminders = (await fbLoadState(HOST_REMINDERS_KEY)) || {};
      const key = `${date}_${host}`;
      reminders[key] = {
        ...(reminders[key] || {}),
        sessionDate: date,
        sessionHost: host,
        response: response, // 'confirmed' | 'declined' | null (clear)
        respondedAt: response ? new Date().toISOString() : null,
        markedManuallyBy: response ? addedBy : null,
      };
      // אם clear - מוחקים את הרשומה
      if (response === null) {
        delete reminders[key];
      }
      await fbSaveState(reminders, HOST_REMINDERS_KEY);
      setHostReminders(reminders);
      setReminderMenuOpen(null);
    } catch (e) {
      console.error('שגיאה בסימון:', e);
      alert('❌ שגיאה - נסה שוב');
    }
  };
  
  // 🆕 רשימת מארחים ייחודיים מהלוח (מסודרים אלפבית)
  const allHosts = useMemo(() => {
    const s = new Set();
    hostingSchedule.forEach(h => { if (h.host) s.add(h.host); });
    return Array.from(s).sort();
  }, [hostingSchedule]);

  const filtered = useMemo(() => {
    let list = [...hostingSchedule];
    if (filter === 'upcoming') list = list.filter(h => h.date >= today);
    else if (filter === 'past') list = list.filter(h => h.date < today);
    // 🆕 סינון לפי שם המארח
    if (filterHost !== 'all') {
      list = list.filter(h => h.host === filterHost);
    }
    return list.sort((a, b) => filter === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }, [hostingSchedule, filter, filterHost, today]);

  const startEdit = (h) => {
    setEditingDate(h.date);
    setEditHost(h.host || '');
    setEditNotes(h.notes || '');
    setEditAddress(h.address || '');
  };

  const saveEdit = () => {
    const updated = hostingSchedule.map(h => 
      h.date === editingDate ? { ...h, host: editHost || null, notes: editNotes || null, address: editAddress || null } : h
    );
    onUpdate(updated);
    
    // 🔄 בדיקה: האם המפגש שערכנו הוא המפגש הקרוב? אם כן - הצע סנכרון לרישום
    if (registration && onRegistrationUpdate && registration.sessionDate === editingDate) {
      const newHost = editHost || '';
      const oldHost = registration.host || '';
      
      if (newHost !== oldHost) {
        // המארח של המפגש הקרוב השתנה - שואלים את האדמין
        let message;
        if (newHost && !oldHost) {
          message = `📅 הוספת מארח: ${newHost}\n\nלעדכן את הרשימה? (${newHost} ייכנס למקום #1)`;
        } else if (!newHost && oldHost) {
          message = `📅 הסרת את המארח (${oldHost})\n\nלהסיר אותו גם מהרשימה? המקום #1 ישאר פנוי למארח שייקבע.`;
        } else {
          message = `📅 שינית את המארח:\n${oldHost} ← ${newHost}\n\nלעדכן את הרשימה? ${newHost} ייכנס במקום ${oldHost} ב-#1.`;
        }
        
        if (confirm(message)) {
          // העדכון:
          // 1. הסר את המארח הישן (isHost: true)
          // 2. אם המארח החדש קיים במקום אחר - הסר אותו משם
          // 3. הכנס את המארח החדש ל-#1
          let newEntries = (registration.entries || []).filter(e => !e.isHost);
          
          if (newHost) {
            newEntries = newEntries.filter(e => e.name !== newHost);
            newEntries = [
              { name: newHost, addedAt: new Date().toISOString(), isHost: true },
              ...newEntries
            ];
          }
          
          onRegistrationUpdate({
            ...registration,
            host: newHost,
            entries: newEntries,
            hostChangedAt: new Date().toISOString(),
            hostChangedBy: addedBy,
          });
        }
      }
    }
    
    setEditingDate(null);
  };

  const addNewHost = () => {
    if (!newHost.date) return alert('נא לבחור תאריך');
    const dayName = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][new Date(newHost.date).getDay()];
    const updated = [...hostingSchedule, { ...newHost, dayName, host: newHost.host || null, notes: newHost.notes || null, address: newHost.address || null }];
    onUpdate(updated);
    setShowAddNew(false);
    setNewHost({ date: '', dayName: 'שני', host: '', notes: '', address: '' });
  };

  const deleteEntry = (date) => {
    if (!confirm('למחוק את האירוח?')) return;
    onUpdate(hostingSchedule.filter(h => h.date !== date));
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur">
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/40 to-stone-900/40 px-4 md:px-6 py-4 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
          🏠 לוח אירוחים ({filtered.length}{filterHost !== 'all' ? ` / ${hostingSchedule.length}` : ''})
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 🆕 בורר מארח */}
          <select value={filterHost} onChange={e => setFilterHost(e.target.value)}
            className="rounded-lg border border-stone-700 bg-stone-900 px-2 py-1 text-xs text-white">
            <option value="all">כל המארחים</option>
            {allHosts.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-stone-700 bg-stone-900 p-1">
            <button onClick={() => setFilter('upcoming')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition ${filter === 'upcoming' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}>
              עתידיים
            </button>
            <button onClick={() => setFilter('past')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition ${filter === 'past' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}>
              עברו
            </button>
            <button onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition ${filter === 'all' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}>
              הכל
            </button>
          </div>
          {isAdmin && (
            <button onClick={() => setShowAddNew(true)}
              className="rounded-lg bg-amber-700 hover:bg-amber-600 px-3 py-1.5 text-sm text-white font-bold flex items-center gap-1">
              <Plus className="h-4 w-4" /> חדש
            </button>
          )}
        </div>
      </div>

      {showAddNew && isAdmin && (
        <div className="border-b border-stone-800 bg-amber-950/20 p-4">
          <div className="text-sm font-bold text-amber-200 mb-3">הוספת אירוח חדש</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input type="date" value={newHost.date} onChange={e => setNewHost({...newHost, date: e.target.value})}
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white text-sm" />
            <SearchableSelect
              value={newHost.host}
              onChange={(selectedHost) => {
                // 🆕 כתובת אוטומטית מהאירוח האחרון של המארח
                let autoAddress = newHost.address || '';
                if (selectedHost) {
                  const lastEntry = [...hostingSchedule]
                    .filter(x => x.host === selectedHost && x.address)
                    .sort((a, b) => b.date.localeCompare(a.date))[0];
                  if (lastEntry && lastEntry.address) {
                    autoAddress = lastEntry.address;
                  }
                }
                setNewHost({...newHost, host: selectedHost, address: autoAddress});
              }}
              options={players}
              placeholder="בחר מארח..."
            />
          </div>
          <input type="text" value={newHost.address} onChange={e => setNewHost({...newHost, address: e.target.value})}
            placeholder="📍 כתובת (לדוגמה: רחוב הרצל 5, תל מונד)"
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white text-sm mb-2" />
          <input type="text" value={newHost.notes} onChange={e => setNewHost({...newHost, notes: e.target.value})}
            placeholder="הערות (אופציונלי)"
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white text-sm mb-2" />
          <div className="flex gap-2">
            <button onClick={() => setShowAddNew(false)} className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-stone-300 text-sm">בטל</button>
            <button onClick={addNewHost} className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-white font-bold text-sm">שמור</button>
          </div>
        </div>
      )}

      <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
        {filtered.map(h => {
          const isFuture = h.date >= today;
          const isEditing = editingDate === h.date;
          const dateObj = new Date(h.date);
          const dayNum = dateObj.getDate();
          const monthShort = dateObj.toLocaleDateString('he-IL', { month: 'short' });
          const wazeUrl = h.address ? `https://waze.com/ul?q=${encodeURIComponent(h.address)}&navigate=yes` : null;
          const isHolidayConflict = h.notes && h.notes.includes('לטיפול');
          return (
            <div key={h.date} className={`border-b border-stone-900 p-4 ${isFuture ? '' : 'opacity-60'} ${
              editingDate === h.date ? 'bg-amber-950/20' : 
              isHolidayConflict ? 'bg-orange-950/20 hover:bg-orange-950/30' : 
              'hover:bg-stone-900/30'
            } transition`}>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="text-sm text-stone-400">{h.dayName} • {dateObj.toLocaleDateString('he-IL', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  <SearchableSelect
                    value={editHost}
                    onChange={(newHost) => {
                      setEditHost(newHost);
                      // 🆕 אם בחרו מארח חדש - מצא את הכתובת האחרונה שלו אוטומטית
                      if (newHost && newHost !== editHost) {
                        const lastEntry = [...hostingSchedule]
                          .filter(x => x.host === newHost && x.address)
                          .sort((a, b) => b.date.localeCompare(a.date))[0];
                        if (lastEntry && lastEntry.address) {
                          setEditAddress(lastEntry.address);
                        } else {
                          setEditAddress('');
                        }
                      } else if (!newHost) {
                        setEditAddress('');
                      }
                    }}
                    options={players}
                    placeholder="ללא מארח"
                    allowEmpty
                    emptyLabel="ללא מארח"
                  />
                  <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)}
                    placeholder="📍 כתובת (לדוגמה: רחוב הרצל 5, תל מונד)"
                    className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-white text-sm" />
                  <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                    placeholder="הערות"
                    className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-white text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingDate(null)} className="flex-1 rounded-lg border border-stone-700 bg-stone-800 py-1.5 text-xs text-stone-300">בטל</button>
                    <button onClick={() => deleteEntry(h.date)} className="rounded-lg border border-rose-800 bg-rose-950/50 py-1.5 px-3 text-xs text-rose-300">מחק</button>
                    <button onClick={saveEdit} className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs text-white font-bold">שמור</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* אייקון לוח שנה משופר */}
                    <div className={`flex-shrink-0 w-14 h-16 rounded-lg overflow-hidden border-2 shadow-lg ${
                      isHolidayConflict ? 'border-orange-500/80' : 
                      isFuture ? 'border-amber-700/60' : 'border-stone-700'
                    }`}>
                      {/* כותרת */}
                      <div className={`h-4 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider ${
                        isHolidayConflict ? 'bg-orange-600 text-white' :
                        isFuture ? 'bg-rose-700 text-white' : 'bg-stone-700 text-stone-300'
                      }`}>
                        {monthShort}
                      </div>
                      {/* היום בחודש */}
                      <div className={`h-12 flex items-center justify-center ${
                        isFuture ? 'bg-stone-100' : 'bg-stone-800'
                      }`}>
                        <span className={`text-2xl font-extrabold ${
                          isFuture ? 'text-stone-900' : 'text-stone-400'
                        }`}>{dayNum}</span>
                      </div>
                    </div>
                    {/* פרטי האירוח */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-stone-400 flex items-center gap-2">
                        יום {h.dayName}
                        {isHolidayConflict && (
                          <span className="rounded-md bg-orange-900/60 border border-orange-700/60 px-1.5 py-0.5 text-[10px] font-bold text-orange-200">
                            ⚠️ לטיפול
                          </span>
                        )}
                      </div>
                      <div className="text-base font-bold text-stone-100 flex items-center gap-2 flex-wrap">
                        <span>{h.host || <span className="text-stone-500 italic">לא נקבע</span>}</span>
                        {/* 🍻 סטטוס תזכורת אירוח - רק למפגשים עתידיים עם מארח */}
                        {isFuture && h.host && (() => {
                          const reminder = hostReminders[`${h.date}_${h.host}`];
                          if (!reminder) return null;
                          if (reminder.response === 'confirmed') {
                            return (
                              <span className="rounded-md bg-emerald-900/60 border border-emerald-700/60 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200" title={`אישר ב-${new Date(reminder.respondedAt).toLocaleString('he-IL')}${reminder.markedManuallyBy ? ' (סומן ידנית ע"י ' + reminder.markedManuallyBy + ')' : ''}`}>
                                ✅ אישר
                              </span>
                            );
                          }
                          if (reminder.response === 'declined') {
                            return (
                              <span className="rounded-md bg-rose-900/60 border border-rose-700/60 px-1.5 py-0.5 text-[10px] font-bold text-rose-200" title={`דחה ב-${new Date(reminder.respondedAt).toLocaleString('he-IL')}${reminder.markedManuallyBy ? ' (סומן ידנית ע"י ' + reminder.markedManuallyBy + ')' : ''}`}>
                                ❌ דחה
                              </span>
                            );
                          }
                          if (reminder.sentAt) {
                            return (
                              <span className="rounded-md bg-amber-900/60 border border-amber-700/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-200" title={`תזכורת נשלחה ב-${new Date(reminder.sentAt).toLocaleString('he-IL')}, עדיין לא ענה`}>
                                ⏳ ממתין
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      {h.address && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-stone-400 truncate">📍 {h.address}</span>
                          {wazeUrl && (
                            <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
                              className="flex-shrink-0 inline-flex items-center gap-1 rounded-md bg-cyan-600 hover:bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white transition">
                              Waze 🚗
                            </a>
                          )}
                        </div>
                      )}
                      {h.notes && <div className="text-xs text-stone-500 mt-0.5 italic">{h.notes}</div>}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* 🍻 כפתור "סמן ידנית" לאדמינים - רק למפגשים עתידיים עם מארח */}
                      {isFuture && h.host && (
                        <div className="relative">
                          <button 
                            onClick={() => setReminderMenuOpen(reminderMenuOpen === h.date ? null : h.date)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1"
                            title="סמן את האישור של המארח ידנית"
                          >
                            📝 סמן
                          </button>
                          {reminderMenuOpen === h.date && (
                            <div className="absolute left-0 top-full mt-1 z-20 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl py-1 min-w-[140px]">
                              <button
                                onClick={() => markReminderManually(h.date, h.host, 'confirmed')}
                                className="w-full text-right px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-900/30 transition"
                              >
                                ✅ סמן כמאושר
                              </button>
                              <button
                                onClick={() => markReminderManually(h.date, h.host, 'declined')}
                                className="w-full text-right px-3 py-2 text-xs text-rose-300 hover:bg-rose-900/30 transition"
                              >
                                ❌ סמן כדחוי
                              </button>
                              {hostReminders[`${h.date}_${h.host}`] && (
                                <>
                                  <div className="border-t border-stone-700 my-1"></div>
                                  <button
                                    onClick={() => markReminderManually(h.date, h.host, null)}
                                    className="w-full text-right px-3 py-2 text-xs text-stone-400 hover:bg-stone-800 transition"
                                  >
                                    ↩ נקה סימון
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <button onClick={() => startEdit(h)} className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1">
                        ערוך
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== טאב אירוחים עם בורר תצוגה =====
const HostingWrapper = ({ allSessions, hostingSchedule, players, sortedPlayers, isAdmin, onUpdate, adminName, registration, onRegistrationUpdate }) => {
  const [view, setView] = useState('upcoming'); // upcoming | history
  
  return (
    <div className="space-y-4">
      {/* בורר תצוגה */}
      <div className="flex rounded-2xl border border-stone-800 bg-stone-950/70 p-1.5 backdrop-blur">
        <button onClick={() => setView('upcoming')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 ${
            view === 'upcoming'
              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/40'
              : 'text-stone-400 hover:text-amber-200'
          }`}>
          🏠 מארחים הבאים
        </button>
        <button onClick={() => setView('history')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 ${
            view === 'history'
              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/40'
              : 'text-stone-400 hover:text-amber-200'
          }`}>
          📜 היסטוריה
        </button>
      </div>

      {/* תוכן לפי הבחירה */}
      {view === 'upcoming' ? (
        <HostingTab hostingSchedule={hostingSchedule} isAdmin={isAdmin}
          onUpdate={onUpdate} players={sortedPlayers} addedBy={adminName} defaultFilter="upcoming"
          registration={registration} onRegistrationUpdate={onRegistrationUpdate} />
      ) : (
        <div className="space-y-4">
          <HostingSummaryTable allSessions={allSessions} players={players} />
          <HostingTab hostingSchedule={hostingSchedule} isAdmin={isAdmin}
            onUpdate={onUpdate} players={sortedPlayers} addedBy={adminName} defaultFilter="past" />
        </div>
      )}
    </div>
  );
};

// ===== מודל ניהול חי של ערב =====
const LIVE_SESSION_KEY = 'poker_live_session_v1';

// ===== אלגוריתם חלוקת כספים חכמה - מינימום העברות =====
const calculateSettlements = (results) => {
  // results = { name: profit }
  const creditors = [];
  const debtors = [];
  
  Object.entries(results).forEach(([name, amount]) => {
    if (amount > 0) creditors.push({ name, amount });
    else if (amount < 0) debtors.push({ name, amount: -amount });
  });
  
  if (creditors.length === 0 || debtors.length === 0) return [];
  
  const transfers = [];
  
  // 🆕 שלב 1: התאמות מדויקות 1-ל-1 (זוכה X = מפסיד X)
  // העברה אחת מאזנת את שניהם - הכי יעיל
  for (let i = creditors.length - 1; i >= 0; i--) {
    for (let j = debtors.length - 1; j >= 0; j--) {
      if (Math.abs(creditors[i].amount - debtors[j].amount) < 0.01) {
        transfers.push({
          from: debtors[j].name,
          to: creditors[i].name,
          amount: creditors[i].amount,
        });
        creditors.splice(i, 1);
        debtors.splice(j, 1);
        break;
      }
    }
  }
  
  // 🆕 שלב 2: subset-sum - מחפש תת-קבוצה של מפסידים שמסכומם = זוכה אחד (או להפך)
  // למשל: זוכה 60 = מפסיד 40 + מפסיד 20 → 2 העברות שמסיימות 3 שחקנים
  // נריץ את זה עד שלא נמצאות התאמות
  let foundSubsetMatch = true;
  while (foundSubsetMatch) {
    foundSubsetMatch = false;
    
    // נסה לכל זוכה למצוא תת-קבוצה של מפסידים שסכומם שווה לו
    for (let cIdx = 0; cIdx < creditors.length; cIdx++) {
      const target = creditors[cIdx].amount;
      const subset = findSubsetWithSum(debtors, target);
      if (subset && subset.length >= 2) {
        // נמצאה התאמה! צור העברות
        const creditor = creditors[cIdx];
        subset.forEach(dIdx => {
          transfers.push({
            from: debtors[dIdx].name,
            to: creditor.name,
            amount: debtors[dIdx].amount,
          });
        });
        // הסר את הזוכה
        creditors.splice(cIdx, 1);
        // הסר את המפסידים (מהגדול לקטן כדי לא לשבור אינדקסים)
        const sortedIndices = [...subset].sort((a, b) => b - a);
        sortedIndices.forEach(idx => debtors.splice(idx, 1));
        foundSubsetMatch = true;
        break;
      }
    }
    
    if (foundSubsetMatch) continue;
    
    // נסה לכל מפסיד למצוא תת-קבוצה של זוכים שסכומם שווה לו
    for (let dIdx = 0; dIdx < debtors.length; dIdx++) {
      const target = debtors[dIdx].amount;
      const subset = findSubsetWithSum(creditors, target);
      if (subset && subset.length >= 2) {
        const debtor = debtors[dIdx];
        subset.forEach(cIdx => {
          transfers.push({
            from: debtor.name,
            to: creditors[cIdx].name,
            amount: creditors[cIdx].amount,
          });
        });
        debtors.splice(dIdx, 1);
        const sortedIndices = [...subset].sort((a, b) => b - a);
        sortedIndices.forEach(idx => creditors.splice(idx, 1));
        foundSubsetMatch = true;
        break;
      }
    }
  }
  
  // 🆕 שלב 3: greedy לשארית (מהגדול לקטן)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const transfer = Math.min(creditor.amount, debtor.amount);
    
    transfers.push({
      from: debtor.name,
      to: creditor.name,
      amount: transfer,
    });
    
    creditor.amount -= transfer;
    debtor.amount -= transfer;
    
    if (creditor.amount < 0.01) creditors.shift();
    if (debtor.amount < 0.01) debtors.shift();
  }
  
  return transfers;
};

// 🆕 פונקציית עזר - מחפשת תת-קבוצה של 2-4 פריטים שסכומם שווה לערך מטרה
// מחזירה מערך של אינדקסים אם נמצא, null אם לא
const findSubsetWithSum = (items, target) => {
  if (items.length === 0) return null;
  const epsilon = 0.01;
  
  // 2 פריטים
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (Math.abs(items[i].amount + items[j].amount - target) < epsilon) {
        return [i, j];
      }
    }
  }
  
  // 3 פריטים
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      for (let k = j + 1; k < items.length; k++) {
        if (Math.abs(items[i].amount + items[j].amount + items[k].amount - target) < epsilon) {
          return [i, j, k];
        }
      }
    }
  }
  
  // 4 פריטים (רק אם יש לפחות 5 פריטים - אחרת לא יתרום משמעותית)
  if (items.length >= 5) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        for (let k = j + 1; k < items.length; k++) {
          for (let l = k + 1; l < items.length; l++) {
            if (Math.abs(items[i].amount + items[j].amount + items[k].amount + items[l].amount - target) < epsilon) {
              return [i, j, k, l];
            }
          }
        }
      }
    }
  }
  
  return null;
};


// ============================================================
// 🔥 חישוב רצף ניצחונות נוכחי לשחקן
// ============================================================
const calculateStreakHelper = (playerName, sessions) => {
  if (!playerName || !sessions || sessions.length === 0) return 0;
  const playerSessions = sessions
    .filter(s => s.results && typeof s.results[playerName] === 'number')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (playerSessions.length === 0) return 0;
  let streak = 0;
  for (const s of playerSessions) {
    const r = Number(s.results[playerName]);
    if (r >= 0) streak++; // תיקו לא שובר
    else break;
  }
  return streak;
};

// ============================================================
// 📊 גרפים אישיים - 3 גרפים לכל שחקן
// ============================================================
// 1. ביצועים לאורך החודשים (bar chart)
// 2. דירוג השחקן לאורך זמן (line chart)
// 3. התפלגות תוצאות - ניצחונות/הפסדים/תיקו (pie chart)
// ============================================================
// 🦢 תובנות אישיות - על המשתמש המחובר בלבד
// ============================================================
// תובנות מעולם המשחק, מגמה, והשוואה לקבוצה
const PersonalInsightsBox = ({ sessions, allSessions, stats, currentUser }) => {
  const insights = useMemo(() => {
    if (!currentUser || !sessions || sessions.length === 0 || !stats) return [];
    
    const myStats = stats.find(s => s.name === currentUser);
    if (!myStats || myStats.sessions === 0) return [];
    
    const result = [];
    
    // ========================================================
    // קטגוריה 1: משחק (Game performance)
    // ========================================================
    
    // אחוז ניצחונות
    const winRate = (myStats.wins / myStats.sessions) * 100;
    if (winRate >= 60) {
      result.push({
        icon: '🏆',
        category: 'משחק',
        title: 'מנצח כרוני',
        text: `${winRate.toFixed(0)}% מהמשחקים שלך נגמרים ברווח — מצוין!`,
        color: 'emerald',
      });
    } else if (winRate >= 50) {
      result.push({
        icon: '✨',
        category: 'משחק',
        title: 'יותר מאוזן',
        text: `${winRate.toFixed(0)}% מהמשחקים שלך נגמרים ברווח — מעל הממוצע`,
        color: 'amber',
      });
    } else if (winRate < 40) {
      result.push({
        icon: '💪',
        category: 'משחק',
        title: 'יש מקום לשיפור',
        text: `${winRate.toFixed(0)}% ניצחונות — תמשיך לעבוד על זה`,
        color: 'rose',
      });
    }
    
    // ביצועים בקופות גדולות מול קטנות
    const mySessions = sessions.filter(s => s.results && s.results[currentUser] !== undefined);
    if (mySessions.length >= 5) {
      const pots = mySessions.map(s => s.pot || 0);
      const medianPot = [...pots].sort((a, b) => a - b)[Math.floor(pots.length / 2)];
      
      let bigPotProfit = 0, bigPotCount = 0;
      let smallPotProfit = 0, smallPotCount = 0;
      
      mySessions.forEach(s => {
        const pot = s.pot || 0;
        const profit = Number(s.results[currentUser]) || 0;
        if (pot >= medianPot) {
          bigPotProfit += profit;
          bigPotCount++;
        } else {
          smallPotProfit += profit;
          smallPotCount++;
        }
      });
      
      if (bigPotCount > 0 && smallPotCount > 0) {
        const bigAvg = bigPotProfit / bigPotCount;
        const smallAvg = smallPotProfit / smallPotCount;
        if (bigAvg > smallAvg + 10) {
          result.push({
            icon: '💰',
            category: 'משחק',
            title: 'שורד בקופה גדולה',
            text: `אתה זוכה יותר בקופות גדולות (₪${medianPot}+) — ממוצע ${bigAvg > 0 ? '+' : ''}${bigAvg.toFixed(0)}₪`,
            color: 'purple',
          });
        } else if (smallAvg > bigAvg + 10) {
          result.push({
            icon: '🎯',
            category: 'משחק',
            title: 'מצליח בערבים שקטים',
            text: `אתה מנצח יותר בערבים עם קופות קטנות — ממוצע ${smallAvg > 0 ? '+' : ''}${smallAvg.toFixed(0)}₪`,
            color: 'blue',
          });
        }
      }
    }
    
    // הקופה הגדולה ביותר שזכית בה
    if (mySessions.length > 0) {
      const winningSessions = mySessions.filter(s => Number(s.results[currentUser]) > 0);
      if (winningSessions.length > 0) {
        const biggestWinSession = winningSessions.reduce((a, b) => 
          (a.pot || 0) > (b.pot || 0) ? a : b);
        const biggestPot = biggestWinSession.pot || 0;
        if (biggestPot >= 200) {
          result.push({
            icon: '🎰',
            category: 'משחק',
            title: 'גדול בגדולים',
            text: `הקופה הכי גדולה שזכית בה: ₪${biggestPot} (+${biggestWinSession.results[currentUser]}₪)`,
            color: 'purple',
          });
        }
      }
    }
    
    // ========================================================
    // קטגוריה 2: מגמה (Trends)
    // ========================================================
    
    const sortedMySessions = [...mySessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 5 ערבים אחרונים
    if (sortedMySessions.length >= 3) {
      const lastN = Math.min(5, sortedMySessions.length);
      const recent = sortedMySessions.slice(0, lastN);
      const recentTotal = recent.reduce((sum, s) => sum + (Number(s.results[currentUser]) || 0), 0);
      const recentAvg = recentTotal / lastN;
      
      if (recentAvg >= 30) {
        result.push({
          icon: '🔥',
          category: 'מגמה',
          title: 'אתה בעלייה',
          text: `${lastN} הערבים האחרונים: ממוצע +${recentAvg.toFixed(0)}₪ — בלהט!`,
          color: 'orange',
        });
      } else if (recentAvg <= -30) {
        result.push({
          icon: '🌧️',
          category: 'מגמה',
          title: 'תקופה קשה',
          text: `${lastN} הערבים האחרונים: ממוצע ${recentAvg.toFixed(0)}₪ — תיזהר`,
          color: 'rose',
        });
      } else if (Math.abs(recentAvg) < 15) {
        result.push({
          icon: '⚖️',
          category: 'מגמה',
          title: 'יציב',
          text: `${lastN} הערבים האחרונים מאוזנים סביב ${recentAvg > 0 ? '+' : ''}${recentAvg.toFixed(0)}₪`,
          color: 'stone',
        });
      }
    }
    
    // רצף ניצחונות נוכחי
    if (myStats.currentStreak >= 3) {
      result.push({
        icon: '⚡',
        category: 'מגמה',
        title: 'רצף בוער!',
        text: `אתה ב-${myStats.currentStreak} ערבים רצופים בלי הפסד — אש 🔥`,
        color: 'orange',
      });
    }
    
    // החודש הכי טוב
    const byMonth = {};
    mySessions.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
      if (!byMonth[key]) byMonth[key] = { profit: 0, label: HEBREW_MONTHS[d.getMonth()] };
      byMonth[key].profit += Number(s.results[currentUser]) || 0;
    });
    
    const monthEntries = Object.values(byMonth);
    if (monthEntries.length >= 2) {
      const bestMonth = monthEntries.reduce((a, b) => a.profit > b.profit ? a : b);
      if (bestMonth.profit > 100) {
        result.push({
          icon: '🌟',
          category: 'מגמה',
          title: 'החודש המוצלח שלך',
          text: `${bestMonth.label} היה החודש הכי טוב: +${bestMonth.profit}₪`,
          color: 'amber',
        });
      }
    }
    
    // ========================================================
    // קטגוריה 3: השוואה (Comparison)
    // ========================================================
    
    // המקום שלך בדירוג
    const sortedStats = [...stats].sort((a, b) => b.total - a.total);
    const myRank = sortedStats.findIndex(s => s.name === currentUser) + 1;
    const totalActive = sortedStats.length;
    
    if (myRank > 0) {
      if (myRank === 1) {
        result.push({
          icon: '👑',
          category: 'השוואה',
          title: 'מלך הברבורים',
          text: `אתה במקום הראשון מתוך ${totalActive} שחקנים פעילים`,
          color: 'amber',
        });
      } else if (myRank <= 3) {
        result.push({
          icon: ['🥈', '🥉'][myRank - 2],
          category: 'השוואה',
          title: `מקום ${myRank} מבריק`,
          text: `אתה ב-${myRank === 2 ? 'שני' : 'שלישי'} מתוך ${totalActive} שחקנים פעילים`,
          color: 'amber',
        });
      } else if (myRank <= Math.ceil(totalActive / 3)) {
        result.push({
          icon: '⭐',
          category: 'השוואה',
          title: 'בשליש העליון',
          text: `מקום #${myRank} מתוך ${totalActive} — מעל המוביל הממוצע`,
          color: 'emerald',
        });
      } else if (myRank > totalActive * 2 / 3) {
        result.push({
          icon: '🎯',
          category: 'השוואה',
          title: 'יש לאן להתפתח',
          text: `מקום #${myRank} מתוך ${totalActive} — תפיל את הבכירים`,
          color: 'blue',
        });
      } else {
        result.push({
          icon: '📊',
          category: 'השוואה',
          title: 'באמצע הטבלה',
          text: `מקום #${myRank} מתוך ${totalActive} שחקנים פעילים`,
          color: 'stone',
        });
      }
    }
    
    // יריבות ראש בראש - מי שאיתו שיחקת הכי הרבה
    const sharedSessionsCount = {};
    const sharedWinsAgainst = {};
    
    mySessions.forEach(s => {
      const myProfit = Number(s.results[currentUser]) || 0;
      Object.entries(s.results).forEach(([name, profit]) => {
        if (name === currentUser) return;
        sharedSessionsCount[name] = (sharedSessionsCount[name] || 0) + 1;
        // "מנצח אותו" = הרווח שלי גדול יותר מהרווח שלו
        if (myProfit > Number(profit)) {
          sharedWinsAgainst[name] = (sharedWinsAgainst[name] || 0) + 1;
        }
      });
    });
    
    // מצא את היריב שאיתו שיחקת הכי הרבה
    const rivals = Object.entries(sharedSessionsCount)
      .filter(([_, count]) => count >= 3)
      .map(([name, count]) => ({
        name,
        total: count,
        wins: sharedWinsAgainst[name] || 0,
        winRate: ((sharedWinsAgainst[name] || 0) / count) * 100,
      }))
      .sort((a, b) => b.total - a.total);
    
    if (rivals.length > 0) {
      // יריב הכי קרוב (הרבה משחקים)
      const topRival = rivals[0];
      if (topRival.winRate >= 60) {
        result.push({
          icon: '⚔️',
          category: 'השוואה',
          title: `נמסיס - ${topRival.name}`,
          text: `אתה מנצח את ${topRival.name} ב-${topRival.winRate.toFixed(0)}% מהמשחקים שלכם (${topRival.total} משחקים)`,
          color: 'purple',
        });
      } else if (topRival.winRate <= 40) {
        result.push({
          icon: '😬',
          category: 'השוואה',
          title: `${topRival.name} מציק לך`,
          text: `${topRival.name} מנצח אותך ב-${(100 - topRival.winRate).toFixed(0)}% מהמשחקים שלכם`,
          color: 'rose',
        });
      }
    }
    
    // ========================================================
    // קטגוריה 4: היסטורי (Multi-year)
    // ========================================================
    
    if (allSessions && allSessions.length > 0) {
      const myAllSessions = allSessions.filter(s => 
        s.results && s.results[currentUser] !== undefined
      );
      
      if (myAllSessions.length > 0) {
        // סך הכל לאורך השנים
        const totalAllTime = myAllSessions.reduce((sum, s) => 
          sum + (Number(s.results[currentUser]) || 0), 0);
        const yearsActive = new Set(
          myAllSessions.map(s => s.season || new Date(s.date).getFullYear())
        );
        
        if (yearsActive.size >= 2) {
          // משתתף ביותר משנה אחת - יש מקום לתובנות רב-שנתיות
          const yearLabel = yearsActive.size === 1 ? 'שנה' : `${yearsActive.size} שנים`;
          
          if (totalAllTime > 200) {
            result.push({
              icon: '🌟',
              category: 'היסטורי',
              title: 'מנצח כולל',
              text: `לאורך ${yearLabel}: +${totalAllTime}₪ ב-${myAllSessions.length} מפגשים — וירטואוז 🏅`,
              color: 'amber',
            });
          } else if (totalAllTime > 0) {
            result.push({
              icon: '📈',
              category: 'היסטורי',
              title: 'מצטבר חיובי',
              text: `לאורך ${yearLabel}: +${totalAllTime}₪ ב-${myAllSessions.length} מפגשים`,
              color: 'emerald',
            });
          } else if (totalAllTime < -200) {
            result.push({
              icon: '😅',
              category: 'היסטורי',
              title: 'משלם הוצאות לאורך השנים',
              text: `לאורך ${yearLabel}: ${totalAllTime}₪ — הזמן לתת רביו`,
              color: 'rose',
            });
          } else {
            result.push({
              icon: '⚖️',
              category: 'היסטורי',
              title: 'מאוזן לאורך השנים',
              text: `לאורך ${yearLabel}: ${totalAllTime > 0 ? '+' : ''}${totalAllTime}₪ ב-${myAllSessions.length} מפגשים`,
              color: 'stone',
            });
          }
          
          // השנה הכי טובה
          const byYear = {};
          myAllSessions.forEach(s => {
            const y = s.season || new Date(s.date).getFullYear();
            byYear[y] = (byYear[y] || 0) + (Number(s.results[currentUser]) || 0);
          });
          const yearEntries = Object.entries(byYear);
          if (yearEntries.length >= 2) {
            const bestYear = yearEntries.reduce((a, b) => a[1] > b[1] ? a : b);
            const worstYear = yearEntries.reduce((a, b) => a[1] < b[1] ? a : b);
            
            if (bestYear[1] > 100) {
              result.push({
                icon: '🏆',
                category: 'היסטורי',
                title: `${bestYear[0]} - שנת זהב`,
                text: `השנה הכי טובה שלך: +${bestYear[1]}₪ סה״כ`,
                color: 'amber',
              });
            }
            
            if (worstYear[1] < -100 && worstYear[0] != bestYear[0]) {
              result.push({
                icon: '💸',
                category: 'היסטורי',
                title: `${worstYear[0]} - שנה לשכוח`,
                text: `השנה הקשה שלך: ${worstYear[1]}₪ סה״כ`,
                color: 'rose',
              });
            }
          }
          
          // הקופה הכי גדולה אי פעם
          const winningAllTime = myAllSessions.filter(s => 
            Number(s.results[currentUser]) > 0
          );
          if (winningAllTime.length > 0) {
            const biggestEverWin = winningAllTime.reduce((a, b) => 
              Number(a.results[currentUser]) > Number(b.results[currentUser]) ? a : b);
            const biggestProfit = Number(biggestEverWin.results[currentUser]);
            const biggestPot = biggestEverWin.pot || 0;
            const dateStr = new Date(biggestEverWin.date).toLocaleDateString('he-IL', { 
              day: '2-digit', month: '2-digit', year: 'numeric' 
            });
            
            if (biggestProfit >= 100) {
              result.push({
                icon: '💎',
                category: 'היסטורי',
                title: 'הזכיה הכי גדולה אי פעם',
                text: `+${biggestProfit}₪ ב-${dateStr}${biggestPot ? ` (קופה: ₪${biggestPot})` : ''}`,
                color: 'purple',
              });
            }
          }
          
          // התקדמות מהשנה הקודמת
          if (yearEntries.length >= 2) {
            const sortedYears = yearEntries.sort((a, b) => a[0] - b[0]);
            const lastYear = sortedYears[sortedYears.length - 1];
            const prevYear = sortedYears[sortedYears.length - 2];
            const diff = lastYear[1] - prevYear[1];
            
            if (Math.abs(diff) >= 100) {
              if (diff > 0) {
                result.push({
                  icon: '🚀',
                  category: 'היסטורי',
                  title: 'משתפר משנה לשנה',
                  text: `${lastYear[0]}: ${lastYear[1] > 0 ? '+' : ''}${lastYear[1]}₪, שיפור של +${diff}₪ ביחס ל-${prevYear[0]}`,
                  color: 'emerald',
                });
              } else {
                result.push({
                  icon: '📉',
                  category: 'היסטורי',
                  title: 'ירידה מהשנה הקודמת',
                  text: `${lastYear[0]}: ${lastYear[1] > 0 ? '+' : ''}${lastYear[1]}₪, ירידה של ${diff}₪ ביחס ל-${prevYear[0]}`,
                  color: 'orange',
                });
              }
            }
          }
        }
        
        // ========================================================
        // 4ב. משחק היסטורי (Game - All-time)
        // ========================================================
        
        if (myAllSessions.length >= 10) {
          // אחוז ניצחונות לאורך כל הזמן
          const allTimeWins = myAllSessions.filter(s => Number(s.results[currentUser]) > 0).length;
          const allTimeLosses = myAllSessions.filter(s => Number(s.results[currentUser]) < 0).length;
          const allTimeWinRate = (allTimeWins / myAllSessions.length) * 100;
          
          if (allTimeWinRate >= 65) {
            result.push({
              icon: '🎖️',
              category: 'משחק היסטורי',
              title: 'מנצח עקבי לאורך השנים',
              text: `${allTimeWinRate.toFixed(0)}% ניצחונות מתוך ${myAllSessions.length} מפגשים — מקצועני`,
              color: 'amber',
            });
          } else if (allTimeWinRate < 35) {
            result.push({
              icon: '🎓',
              category: 'משחק היסטורי',
              title: 'תהליך למידה',
              text: `${allTimeWinRate.toFixed(0)}% ניצחונות לאורך ${myAllSessions.length} מפגשים — בדרך אל הפיסגה`,
              color: 'blue',
            });
          }
          
          // הקופה הכי גדולה שזכית בה אי פעם (גם אם לא היתה הרבה רווח)
          const allTimeWinning = myAllSessions.filter(s => Number(s.results[currentUser]) > 0);
          if (allTimeWinning.length > 0) {
            const biggestPotEver = allTimeWinning.reduce((a, b) => 
              (a.pot || 0) > (b.pot || 0) ? a : b);
            const potValue = biggestPotEver.pot || 0;
            const profitOnIt = Number(biggestPotEver.results[currentUser]);
            const dateStr = new Date(biggestPotEver.date).toLocaleDateString('he-IL', { 
              day: '2-digit', month: '2-digit', year: 'numeric' 
            });
            
            if (potValue >= 300 && profitOnIt > 0) {
              result.push({
                icon: '🎰',
                category: 'משחק היסטורי',
                title: 'מהקופות הכי גדולות',
                text: `קופה של ₪${potValue} ב-${dateStr} — וניצחת בה (+${profitOnIt}₪) 💪`,
                color: 'purple',
              });
            }
          }
          
          // ההפסד הגדול אי פעם
          const allTimeLosing = myAllSessions.filter(s => Number(s.results[currentUser]) < 0);
          if (allTimeLosing.length > 0) {
            const biggestLossEver = allTimeLosing.reduce((a, b) => 
              Number(a.results[currentUser]) < Number(b.results[currentUser]) ? a : b);
            const lossValue = Number(biggestLossEver.results[currentUser]);
            const dateStr = new Date(biggestLossEver.date).toLocaleDateString('he-IL', { 
              day: '2-digit', month: '2-digit', year: 'numeric' 
            });
            
            if (lossValue <= -150) {
              result.push({
                icon: '😱',
                category: 'משחק היסטורי',
                title: 'ההפסד הכי כואב אי פעם',
                text: `${lossValue}₪ ב-${dateStr} — אבל קמת מאז 💪`,
                color: 'rose',
              });
            }
          }
          
          // רצף ניצחונות הכי ארוך אי פעם
          const sortedAll = [...myAllSessions].sort((a, b) => new Date(a.date) - new Date(b.date));
          let maxStreak = 0;
          let curStreak = 0;
          sortedAll.forEach(s => {
            const r = Number(s.results[currentUser]);
            if (r >= 0) {
              curStreak++;
              if (curStreak > maxStreak) maxStreak = curStreak;
            } else {
              curStreak = 0;
            }
          });
          
          if (maxStreak >= 5) {
            result.push({
              icon: '🌋',
              category: 'משחק היסטורי',
              title: 'הרצף הארוך אי פעם',
              text: `הרצף הכי ארוך שלך ללא הפסד: ${maxStreak} מפגשים רצופים`,
              color: 'orange',
            });
          }
          
          // ממוצע רווח לערב לאורך כל השנים
          const allTimeAvg = totalAllTime / myAllSessions.length;
          if (Math.abs(allTimeAvg) >= 5) {
            result.push({
              icon: allTimeAvg > 0 ? '💹' : '📉',
              category: 'משחק היסטורי',
              title: 'הממוצע שלך לערב',
              text: `${allTimeAvg > 0 ? '+' : ''}${allTimeAvg.toFixed(1)}₪ בכל מפגש לאורך השנים`,
              color: allTimeAvg > 0 ? 'emerald' : 'rose',
            });
          }
        }
        
        // ========================================================
        // 4ג. השוואה היסטורית (Comparison - All-time)
        // ========================================================
        
        if (myAllSessions.length >= 5) {
          // המקום הממוצע שלך לאורך כל השנים
          // צובר רווח של כל שחקן לאורך כל הזמן
          const allTimeStats = {};
          allSessions.forEach(s => {
            if (!s.results) return;
            Object.entries(s.results).forEach(([name, profit]) => {
              if (!allTimeStats[name]) allTimeStats[name] = { profit: 0, sessions: 0 };
              allTimeStats[name].profit += Number(profit) || 0;
              allTimeStats[name].sessions++;
            });
          });
          
          // דירוג כללי לאורך כל הזמן
          const totalRanking = Object.entries(allTimeStats)
            .filter(([_, s]) => s.sessions >= 5) // רק מי שלפחות 5 מפגשים
            .sort((a, b) => b[1].profit - a[1].profit)
            .map(([name]) => name);
          
          const myAllTimeRank = totalRanking.indexOf(currentUser) + 1;
          const totalActiveAllTime = totalRanking.length;
          
          if (myAllTimeRank > 0 && totalActiveAllTime >= 5) {
            if (myAllTimeRank === 1) {
              result.push({
                icon: '🏅',
                category: 'השוואה היסטורית',
                title: 'אגדה בקבוצה',
                text: `מקום ראשון בכל הזמנים מתוך ${totalActiveAllTime} שחקנים`,
                color: 'amber',
              });
            } else if (myAllTimeRank <= 3) {
              const medals = ['', '🥇', '🥈', '🥉'];
              result.push({
                icon: medals[myAllTimeRank],
                category: 'השוואה היסטורית',
                title: `מקום ${myAllTimeRank} בכל הזמנים`,
                text: `מתוך ${totalActiveAllTime} שחקנים פעילים בקבוצה`,
                color: 'amber',
              });
            }
          }
          
          // יריב הסטורי - מי הכי שיחקת איתו לאורך השנים
          const allTimeShared = {};
          const allTimeWinsAgainst = {};
          
          myAllSessions.forEach(s => {
            const myProfit = Number(s.results[currentUser]) || 0;
            Object.entries(s.results).forEach(([name, profit]) => {
              if (name === currentUser) return;
              allTimeShared[name] = (allTimeShared[name] || 0) + 1;
              if (myProfit > Number(profit)) {
                allTimeWinsAgainst[name] = (allTimeWinsAgainst[name] || 0) + 1;
              }
            });
          });
          
          const allTimeRivals = Object.entries(allTimeShared)
            .filter(([_, count]) => count >= 10)
            .map(([name, count]) => ({
              name,
              total: count,
              wins: allTimeWinsAgainst[name] || 0,
              winRate: ((allTimeWinsAgainst[name] || 0) / count) * 100,
            }))
            .sort((a, b) => b.total - a.total);
          
          if (allTimeRivals.length > 0) {
            const longestRival = allTimeRivals[0];
            result.push({
              icon: '🤝',
              category: 'השוואה היסטורית',
              title: 'היריב הוותיק שלך',
              text: `${longestRival.name} - שיחקתם יחד ${longestRival.total} מפגשים, אתה מנצח ${longestRival.winRate.toFixed(0)}% מהזמן`,
              color: 'purple',
            });
            
            // היריב שאתה הכי טוב מולו
            const easiest = [...allTimeRivals].sort((a, b) => b.winRate - a.winRate)[0];
            if (easiest.winRate >= 60 && easiest !== longestRival) {
              result.push({
                icon: '😈',
                category: 'השוואה היסטורית',
                title: `הקורבן שלך`,
                text: `אתה מנצח את ${easiest.name} ב-${easiest.winRate.toFixed(0)}% מ-${easiest.total} מפגשים`,
                color: 'emerald',
              });
            }
            
            // היריב שהכי קשה לך מולו
            const hardest = [...allTimeRivals].sort((a, b) => a.winRate - b.winRate)[0];
            if (hardest.winRate <= 40 && hardest !== longestRival && hardest !== easiest) {
              result.push({
                icon: '👹',
                category: 'השוואה היסטורית',
                title: `האויב המושבע`,
                text: `${hardest.name} מנצח אותך ב-${(100 - hardest.winRate).toFixed(0)}% מ-${hardest.total} מפגשים`,
                color: 'rose',
              });
            }
          }
        }
      }
    }
    
    return result;
  }, [sessions, allSessions, stats, currentUser]);
  
  if (insights.length === 0) {
    return null;
  }
  
  // צבעים לכרטיסיות
  const colorClasses = {
    emerald: 'border-emerald-700/50 bg-emerald-950/30',
    amber: 'border-amber-700/50 bg-amber-950/30',
    rose: 'border-rose-700/50 bg-rose-950/30',
    purple: 'border-purple-700/50 bg-purple-950/30',
    blue: 'border-blue-700/50 bg-blue-950/30',
    orange: 'border-orange-700/50 bg-orange-950/30',
    stone: 'border-stone-700/50 bg-stone-900/50',
  };
  
  const textClasses = {
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    rose: 'text-rose-300',
    purple: 'text-purple-300',
    blue: 'text-blue-300',
    orange: 'text-orange-300',
    stone: 'text-stone-300',
  };
  
  // קיבוץ לפי קטגוריה
  const grouped = insights.reduce((acc, ins) => {
    if (!acc[ins.category]) acc[ins.category] = [];
    acc[ins.category].push(ins);
    return acc;
  }, {});
  
  const categoryIcons = {
    'משחק': '🎲',
    'מגמה': '📈',
    'השוואה': '⚖️',
    'היסטורי': '📜',
    'משחק היסטורי': '🏛️',
    'השוואה היסטורית': '🤺',
  };
  
  return (
    <PersonalInsightsCarousel 
      grouped={grouped} 
      categoryIcons={categoryIcons}
      colorClasses={colorClasses}
      textClasses={textClasses}
      currentUser={currentUser} />
  );
};

// קרוסלה לתובנות אישיות - כל קטגוריה = סלייד
const PersonalInsightsCarousel = ({ grouped, categoryIcons, colorClasses, textClasses, currentUser }) => {
  const categories = Object.keys(grouped);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);
  
  const scrollToSlide = (idx) => {
    if (!scrollRef.current) return;
    const slide = scrollRef.current.children[idx];
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      setCurrentSlide(idx);
    }
  };
  
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const slideWidth = scrollRef.current.children[0]?.offsetWidth || 0;
    if (slideWidth > 0) {
      const newSlide = Math.round(Math.abs(scrollLeft) / slideWidth);
      if (newSlide !== currentSlide) setCurrentSlide(newSlide);
    }
  };
  
  if (categories.length === 0) return null;
  
  return (
    <div className="rounded-2xl border-2 border-amber-700/50 bg-gradient-to-br from-amber-950/40 via-stone-950/60 to-stone-950/40 backdrop-blur p-4 md:p-6">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
            🦢 התובנות שלך
          </h3>
          <span className="text-xs text-stone-500">— אישי לך, {currentUser}</span>
        </div>
        {/* כפתורי ניווט */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => scrollToSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 w-7 h-7 flex items-center justify-center disabled:opacity-30 transition">
            <ChevronRight className="h-4 w-4 text-stone-300" />
          </button>
          <span className="text-xs text-stone-500 tabular-nums px-1">
            {currentSlide + 1}/{categories.length}
          </span>
          <button 
            onClick={() => scrollToSlide(Math.min(categories.length - 1, currentSlide + 1))}
            disabled={currentSlide === categories.length - 1}
            className="rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 w-7 h-7 flex items-center justify-center disabled:opacity-30 transition">
            <ChevronLeft className="h-4 w-4 text-stone-300" />
          </button>
        </div>
      </div>
      
      {/* קרוסלה - גלילה אופקית עם snap */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {categories.map((cat) => (
          <div 
            key={cat} 
            className="flex-shrink-0 w-full snap-center min-h-[220px]">
            <div className="text-xs text-stone-400 mb-3 flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="text-base">{categoryIcons[cat]}</span>
              <span>{cat}</span>
              <span className="text-stone-600 normal-case">({grouped[cat].length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {grouped[cat].map((ins, i) => (
                <div 
                  key={i} 
                  className={`rounded-xl border p-3 ${colorClasses[ins.color] || colorClasses.stone}`}>
                  <div className="flex items-start gap-2">
                    <div className="text-2xl flex-shrink-0">{ins.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm ${textClasses[ins.color] || textClasses.stone}`}>
                        {ins.title}
                      </div>
                      <div className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                        {ins.text}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* נקודות נווטיות */}
      <div className="flex justify-center gap-1.5 mt-4">
        {categories.map((cat, i) => (
          <button
            key={i}
            onClick={() => scrollToSlide(i)}
            title={cat}
            className={`h-2 rounded-full transition-all ${
              currentSlide === i 
                ? 'w-6 bg-amber-500' 
                : 'w-2 bg-stone-700 hover:bg-stone-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const PersonalCharts = ({ sessions, allSessions, stats, currentUser, isMobile, hiddenPlayers = [] }) => {
  const players = useMemo(() => 
    stats.filter(s => s.sessions > 0 && !hiddenPlayers.includes(s.name)).map(s => s.name)
  , [stats, hiddenPlayers]);
  
  const [selectedPlayer, setSelectedPlayer] = useState('');
  
  // 🆕 כשcurrentUser מתעדכן (טעינה אסינכרונית) - מגדיר אותו כברירת מחדל
  useEffect(() => {
    if (!selectedPlayer && currentUser && players.includes(currentUser)) {
      setSelectedPlayer(currentUser);
    } else if (!selectedPlayer && players.length > 0) {
      setSelectedPlayer(players[0]);
    }
  }, [currentUser, players.length]);
  
  // 🆕 כל השנים הזמינות בהיסטוריה
  const allYears = useMemo(() => {
    const years = new Set();
    (allSessions || []).forEach(s => {
      const y = s.season || (s.date ? new Date(s.date).getFullYear() : null);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a); // חדשות למעלה
  }, [allSessions]);
  
  // 🆕 שנים נבחרות לסינון - דיפולט: השנה הנוכחית
  const [selectedYears, setSelectedYears] = useState([]);
  useEffect(() => {
    if (allYears.length > 0 && selectedYears.length === 0) {
      // ברירת מחדל: השנה הכי חדשה
      setSelectedYears([allYears[0]]);
    }
  }, [allYears.length]);
  
  // 🆕 בוררי שנים נפרדים - רק לגרפים הרלוונטיים: ביצועים חודשיים, דירוג לאורך זמן, התפלגות
  const [yearsMonthly, setYearsMonthly] = useState([]);
  const [yearsRankOverTime, setYearsRankOverTime] = useState([]);
  const [yearsDistribution, setYearsDistribution] = useState([]);
  
  useEffect(() => {
    if (allYears.length > 0 && yearsMonthly.length === 0) setYearsMonthly([...allYears]);
  }, [allYears.length]);
  useEffect(() => {
    if (allYears.length > 0 && yearsRankOverTime.length === 0) setYearsRankOverTime([...allYears]);
  }, [allYears.length]);
  useEffect(() => {
    if (allYears.length > 0 && yearsDistribution.length === 0) setYearsDistribution([...allYears]);
  }, [allYears.length]);
  
  const toggleYearLocal = (year, currentYears, setFn) => {
    // אם "הכל" דלוק (כל השנים נבחרו) - לחיצה על שנה משאירה רק אותה
    if (currentYears.length === allYears.length) {
      setFn([year]);
      return;
    }
    // אם השנה כבר נבחרה
    if (currentYears.includes(year)) {
      const newYears = currentYears.filter(y => y !== year);
      // אם זאת הייתה האחרונה - חוזרים להכל
      setFn(newYears.length === 0 ? [...allYears] : newYears);
    } else {
      // הוספת שנה לבחירה
      setFn([...currentYears, year]);
    }
  };
  
  // ערבים מסוננים לפי השנים שנבחרו
  const filteredSessions = useMemo(() => {
    if (!allSessions) return [];
    if (selectedYears.length === 0) return allSessions;
    return allSessions.filter(s => {
      const y = s.season || (s.date ? new Date(s.date).getFullYear() : null);
      return y && selectedYears.includes(y);
    });
  }, [allSessions, selectedYears]);
  
  // 1️⃣ נתונים לגרף ביצועים לאורך החודשים (כולל בחירת שנים)
  const monthlyData = useMemo(() => {
    if (!selectedPlayer) return [];
    const HEBREW_MONTHS_SHORT = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
    const byMonth = {};
    // 🆕 משתמש ב-yearsMonthly במקום selectedYears
    const filteredForMonthly = (allSessions || []).filter(s => {
      const y = s.season || (s.date ? new Date(s.date).getFullYear() : null);
      return y && yearsMonthly.includes(y);
    });
    filteredForMonthly.forEach(s => {
      if (!s.results || s.results[selectedPlayer] === undefined) return;
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const yearShort = String(d.getFullYear()).slice(-2);
      const label = yearsMonthly.length > 1 
        ? `${HEBREW_MONTHS_SHORT[d.getMonth()]} '${yearShort}` 
        : HEBREW_MONTHS_SHORT[d.getMonth()];
      if (!byMonth[key]) byMonth[key] = { key, label, profit: 0, count: 0 };
      byMonth[key].profit += Number(s.results[selectedPlayer]) || 0;
      byMonth[key].count++;
    });
    return Object.values(byMonth).sort((a, b) => a.key.localeCompare(b.key));
  }, [allSessions, selectedPlayer, yearsMonthly]);
  
  // 2️⃣ נתונים לגרף דירוג לאורך זמן (כולל בחירת שנים)
  // הדירוג מחושב **בתוך כל עונה בנפרד** (כמו הטבלה הראשית)
  const rankData = useMemo(() => {
    if (!selectedPlayer || !allSessions) return [];
    const allSorted = [...allSessions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // מקבץ ערבים לפי שנה/עונה
    const sessionsBySeason = {};
    allSorted.forEach(s => {
      if (!s.results) return;
      const seasonKey = s.season || (s.date ? new Date(s.date).getFullYear() : 'unknown');
      if (!sessionsBySeason[seasonKey]) sessionsBySeason[seasonKey] = [];
      sessionsBySeason[seasonKey].push(s);
    });
    
    const rankings = [];
    
    Object.entries(sessionsBySeason).forEach(([seasonKey, seasonSessions]) => {
      const cumulativeBySeason = {};
      
      seasonSessions.forEach(session => {
        Object.entries(session.results).forEach(([name, amount]) => {
          cumulativeBySeason[name] = (cumulativeBySeason[name] || 0) + Number(amount);
        });
        
        if (session.results[selectedPlayer] === undefined) return;
        
        // 🆕 שימוש ב-yearsRankOverTime
        const y = session.season || (session.date ? new Date(session.date).getFullYear() : null);
        if (yearsRankOverTime.length > 0 && !yearsRankOverTime.includes(y)) return;
        
        const sortedPlayers = Object.entries(cumulativeBySeason)
          .sort((a, b) => b[1] - a[1])
          .map(([name]) => name);
        const rank = sortedPlayers.indexOf(selectedPlayer) + 1;
        
        const d = new Date(session.date);
        const yearShort = String(d.getFullYear()).slice(-2);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        // 🆕 כולל שנה תמיד ב-tooltip
        const labelWithYear = `${d.getDate()}/${d.getMonth() + 1}/${yearShort}`;
        rankings.push({
          date: session.date,
          label,
          labelWithYear,
          rank,
          profit: cumulativeBySeason[selectedPlayer],
        });
      });
    });
    
    return rankings;
  }, [allSessions, selectedPlayer, yearsRankOverTime]);
  
  // 3️⃣ נתונים לגרף התפלגות תוצאות (לפי שנים נבחרות)
  const distributionData = useMemo(() => {
    if (!selectedPlayer) return [];
    let wins = 0, losses = 0, ties = 0;
    // 🆕 שימוש ב-yearsDistribution
    const filteredForDistribution = (allSessions || []).filter(s => {
      const y = s.season || (s.date ? new Date(s.date).getFullYear() : null);
      return y && yearsDistribution.includes(y);
    });
    filteredForDistribution.forEach(s => {
      if (!s.results || s.results[selectedPlayer] === undefined) return;
      const v = Number(s.results[selectedPlayer]);
      if (v > 0) wins++;
      else if (v < 0) losses++;
      else ties++;
    });
    return [
      { name: 'ניצחונות', value: wins, color: '#10b981' },
      { name: 'הפסדים', value: losses, color: '#ef4444' },
      { name: 'תיקו', value: ties, color: '#94a3b8' },
    ].filter(d => d.value > 0);
  }, [allSessions, selectedPlayer, yearsDistribution]);
  
  const distributionStats = useMemo(() => {
    const total = distributionData.reduce((s, d) => s + d.value, 0);
    const wins = distributionData.find(d => d.name === 'ניצחונות')?.value || 0;
    return { total, wins, winRate: total > 0 ? (wins / total) * 100 : 0 };
  }, [distributionData]);
  
  // 4️⃣ גרף ביצועים שנתיים - רווח לכל שנה (כל השנים)
  const yearlyData = useMemo(() => {
    if (!selectedPlayer || !allSessions) return [];
    const byYear = {};
    allSessions.forEach(s => {
      if (!s.results || s.results[selectedPlayer] === undefined) return;
      const y = s.season || new Date(s.date).getFullYear();
      if (!byYear[y]) byYear[y] = { year: y, profit: 0, sessions: 0 };
      byYear[y].profit += Number(s.results[selectedPlayer]) || 0;
      byYear[y].sessions++;
    });
    return Object.values(byYear).sort((a, b) => a.year - b.year);
  }, [allSessions, selectedPlayer]);
  
  // 5️⃣ גרף דירוג שנתי - הדירוג הסופי של השחקן בכל שנה (כל השנים)
  const yearlyRankData = useMemo(() => {
    if (!selectedPlayer || !allSessions) return [];
    const yearGroups = {};
    allSessions.forEach(s => {
      if (!s.results) return;
      const y = s.season || new Date(s.date).getFullYear();
      if (!yearGroups[y]) yearGroups[y] = [];
      yearGroups[y].push(s);
    });
    
    const result = [];
    Object.entries(yearGroups).forEach(([year, yearSessions]) => {
      const cumulativeByPlayer = {};
      yearSessions.forEach(s => {
        Object.entries(s.results).forEach(([name, amount]) => {
          cumulativeByPlayer[name] = (cumulativeByPlayer[name] || 0) + Number(amount);
        });
      });
      // האם השחקן השתתף השנה?
      if (cumulativeByPlayer[selectedPlayer] === undefined) return;
      const sortedPlayers = Object.entries(cumulativeByPlayer)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);
      const rank = sortedPlayers.indexOf(selectedPlayer) + 1;
      result.push({
        year: parseInt(year),
        rank,
        totalPlayers: sortedPlayers.length,
        profit: cumulativeByPlayer[selectedPlayer],
      });
    });
    return result.sort((a, b) => a.year - b.year);
  }, [allSessions, selectedPlayer]);
  
  // toggle של שנה בבורר
  const toggleYear = (year) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        return prev.length === 1 ? prev : prev.filter(y => y !== year);
      }
      return [...prev, year].sort((a, b) => b - a);
    });
  };
  
  const selectAllYears = () => setSelectedYears([...allYears]);
  const selectLatestYear = () => setSelectedYears([allYears[0]]);
  
  
  if (players.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-800 bg-stone-950/50 p-6 text-center text-stone-500">
        אין נתונים להצגה
      </div>
    );
  }
  
  const playerStats = stats.find(s => s.name === selectedPlayer);
  const maxRank = Math.max(...rankData.map(r => r.rank), 1);
  
  // סטטיסטיקה מסוננת לפי שנים נבחרות
  const filteredStats = useMemo(() => {
    if (!selectedPlayer) return null;
    let total = 0, sessions = 0, wins = 0, losses = 0, ties = 0;
    filteredSessions.forEach(s => {
      if (!s.results || s.results[selectedPlayer] === undefined) return;
      const v = Number(s.results[selectedPlayer]);
      total += v;
      sessions++;
      if (v > 0) wins++;
      else if (v < 0) losses++;
      else ties++;
    });
    return { total, sessions, wins, losses, ties };
  }, [filteredSessions, selectedPlayer]);
  
  return (
    <div className="space-y-3">
      {/* בוחר שחקן + שנים */}
      <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur p-3 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="font-bold text-amber-200 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            גרפים אישיים
          </div>
          <select 
            value={selectedPlayer} 
            onChange={e => setSelectedPlayer(e.target.value)}
            className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm text-white font-bold flex-1 min-w-[150px]">
            {players.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {filteredStats && (
            <div className="text-xs text-stone-400 flex items-center gap-3 flex-wrap">
              <span>סה״כ: <span className={`font-bold ${filteredStats.total > 0 ? 'text-emerald-400' : filteredStats.total < 0 ? 'text-rose-400' : 'text-stone-300'}`}>
                {filteredStats.total > 0 ? '+' : ''}{filteredStats.total}₪
              </span></span>
              <span>מפגשים: <span className="text-stone-200 font-bold">{filteredStats.sessions}</span></span>
            </div>
          )}
        </div>
      </div>
      
      {/* 🆕 גרף ביצועים שנתיים - רווח לכל שנה */}
      {yearlyData.length >= 1 && (
        <div className="rounded-2xl border border-yellow-800/40 bg-gradient-to-br from-yellow-950/20 via-stone-950/60 to-stone-950/40 backdrop-blur p-4">
          <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-base md:text-lg font-bold text-yellow-200 flex items-center gap-2">
              💰 ביצועים שנתיים
              <span className="text-xs text-stone-500 font-normal">סה״כ רווח לכל שנה</span>
            </h3>
            {(() => {
              const best = yearlyData.reduce((a, b) => a.profit > b.profit ? a : b);
              return (
                <span className="rounded-full bg-yellow-900/40 border border-yellow-700/40 px-2 py-0.5 text-yellow-300 font-bold text-xs">
                  🏆 {best.year}: {best.profit > 0 ? '+' : ''}{best.profit}₪
                </span>
              );
            })()}
          </div>
          <div style={{ width: '100%', height: isMobile ? 220 : 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="yearGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#facc15" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#ca8a04" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="yearRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="year" stroke="#78716c" tick={{ fontSize: 12, fill: '#a8a29e', fontWeight: 'bold' }} />
                <YAxis stroke="#78716c" tick={{ fontSize: 12, fill: '#a8a29e' }} tickFormatter={(v) => v > 0 ? `+${v}` : v} />
                <Tooltip 
                  contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(v, _, props) => [`${v > 0 ? '+' : ''}${v} ₪ (${props.payload.sessions} מפגשים)`, 'רווח']}
                  cursor={{ fill: '#44403c33' }}
                />
                <Bar dataKey="profit" radius={[6, 6, 0, 0]} animationDuration={1500}>
                  {yearlyData.map((d, i) => (
                    <Cell 
                      key={i} 
                      fill={d.profit > 0 ? 'url(#yearGreen)' : 'url(#yearRed)'}
                      stroke={d.profit > 0 ? '#ca8a04' : '#dc2626'}
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* 🆕 גרף דירוג שנתי */}
      {yearlyRankData.length >= 1 && (
        <div className="rounded-2xl border border-amber-800/40 bg-gradient-to-br from-amber-950/20 via-stone-950/60 to-stone-950/40 backdrop-blur p-4">
          <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-base md:text-lg font-bold text-amber-200 flex items-center gap-2">
              🏆 דירוג שנתי
              <span className="text-xs text-stone-500 font-normal">המקום שלך בכל שנה</span>
            </h3>
            {(() => {
              const best = yearlyRankData.reduce((a, b) => a.rank < b.rank ? a : b);
              return (
                <span className="rounded-full bg-amber-900/40 border border-amber-700/40 px-2 py-0.5 text-amber-300 font-bold text-xs">
                  🥇 {best.year}: מקום #{best.rank}
                </span>
              );
            })()}
          </div>
          <div style={{ width: '100%', height: isMobile ? 220 : 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyRankData} margin={{ top: 15, right: 15, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="year" stroke="#78716c" tick={{ fontSize: 12, fill: '#a8a29e', fontWeight: 'bold' }} />
                <YAxis 
                  stroke="#78716c" 
                  tick={{ fontSize: 12, fill: '#a8a29e', fontWeight: 'bold' }}
                  reversed 
                  domain={[1, 'dataMax + 1']}
                  allowDecimals={false}
                  tickFormatter={(v) => `#${v}`}
                />
                <Tooltip 
                  contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', color: '#fff' }}
                  formatter={(v, _, props) => {
                    const r = props.payload;
                    return [`מקום #${v} מתוך ${r.totalPlayers} | רווח: ${r.profit > 0 ? '+' : ''}${r.profit}₪`, ''];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rank" 
                  stroke="#fbbf24" 
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (cx === undefined || cy === undefined) return null;
                    let icon = null;
                    if (payload.rank === 1) icon = '👑';
                    else if (payload.rank === 2) icon = '🥈';
                    else if (payload.rank === 3) icon = '🥉';
                    
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={6} fill="#fbbf24" stroke="#78350f" strokeWidth={2} />
                        {icon && (
                          <text x={cx} y={cy - 14} textAnchor="middle" fontSize={16}>
                            {icon}
                          </text>
                        )}
                      </g>
                    );
                  }}
                  activeDot={{ r: 8, fill: '#fcd34d', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* 1️⃣ גרף ביצועים לאורך החודשים */}
      <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/20 via-stone-950/60 to-stone-950/40 backdrop-blur p-4">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-base md:text-lg font-bold text-emerald-200 flex items-center gap-2">
            📊 ביצועים חודשיים
          </h3>
          {monthlyData.length > 0 && (() => {
            const best = monthlyData.reduce((a, b) => a.profit > b.profit ? a : b);
            const worst = monthlyData.reduce((a, b) => a.profit < b.profit ? a : b);
            return (
              <div className="flex gap-2 text-xs">
                <span className="rounded-full bg-emerald-900/40 border border-emerald-700/40 px-2 py-0.5 text-emerald-300 font-bold">
                  🏆 {best.label}: {best.profit > 0 ? '+' : ''}{best.profit}₪
                </span>
                {worst.profit < 0 && (
                  <span className="rounded-full bg-rose-900/40 border border-rose-700/40 px-2 py-0.5 text-rose-300 font-bold">
                    💀 {worst.label}: {worst.profit}₪
                  </span>
                )}
              </div>
            );
          })()}
        </div>
        {/* 🆕 בורר שנים נפרד לביצועים חודשיים */}
        {allYears.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <span className="text-xs text-stone-500 font-bold">שנים:</span>
            <button
              onClick={() => setYearsMonthly([...allYears])}
              className={`rounded-md px-2 py-1 text-xs font-bold border transition ${
                yearsMonthly.length === allYears.length
                  ? 'bg-amber-700 border-amber-600 text-white'
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
              }`}>
              הכל
            </button>
            {allYears.map(y => (
              <button
                key={y}
                onClick={() => toggleYearLocal(y, yearsMonthly, setYearsMonthly)}
                className={`rounded-md px-2 py-1 text-xs font-bold border transition tabular-nums ${
                  yearsMonthly.includes(y) && yearsMonthly.length < allYears.length
                    ? 'bg-amber-700 border-amber-600 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
                }`}>
                {y}
              </button>
            ))}
          </div>
        )}
        {monthlyData.length === 0 ? (
          <div className="py-8 text-center text-stone-500 text-sm">אין נתונים זמינים</div>
        ) : (
          <div style={{ width: '100%', height: isMobile ? 240 : 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="barGrey" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a8a29e" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#57534e" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="label" stroke="#78716c" tick={{ fontSize: 12, fill: '#a8a29e', fontWeight: 'bold' }} />
                <YAxis stroke="#78716c" tick={{ fontSize: 12, fill: '#a8a29e' }} tickFormatter={(v) => v > 0 ? `+${v}` : v} />
                <Tooltip 
                  contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(v) => [`${v > 0 ? '+' : ''}${v} ₪`, 'רווח']}
                  cursor={{ fill: '#44403c33' }}
                />
                <Bar dataKey="profit" radius={[6, 6, 0, 0]} animationDuration={1500}>
                  {monthlyData.map((d, i) => (
                    <Cell 
                      key={i} 
                      fill={d.profit > 0 ? 'url(#barGreen)' : d.profit < 0 ? 'url(#barRed)' : 'url(#barGrey)'}
                      stroke={d.profit > 0 ? '#10b981' : d.profit < 0 ? '#dc2626' : '#57534e'}
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      {/* 2️⃣ גרף דירוג לאורך זמן */}
      <div className="rounded-2xl border border-blue-800/40 bg-gradient-to-br from-blue-950/20 via-stone-950/60 to-stone-950/40 backdrop-blur p-4">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-base md:text-lg font-bold text-blue-200 flex items-center gap-2">
            📈 דירוג לאורך הזמן
          </h3>
          {rankData.length > 0 && (() => {
            const bestRank = Math.min(...rankData.map(r => r.rank));
            const currentRank = rankData[rankData.length - 1]?.rank;
            return (
              <div className="flex gap-2 text-xs">
                <span className="rounded-full bg-amber-900/40 border border-amber-700/40 px-2 py-0.5 text-amber-300 font-bold">
                  🏆 שיא: #{bestRank}
                </span>
                <span className="rounded-full bg-blue-900/40 border border-blue-700/40 px-2 py-0.5 text-blue-300 font-bold">
                  📍 כעת: #{currentRank}
                </span>
              </div>
            );
          })()}
        </div>
        {/* 🆕 בורר שנים נפרד */}
        {allYears.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <span className="text-xs text-stone-500 font-bold">שנים:</span>
            <button
              onClick={() => setYearsRankOverTime([...allYears])}
              className={`rounded-md px-2 py-1 text-xs font-bold border transition ${
                yearsRankOverTime.length === allYears.length
                  ? 'bg-amber-700 border-amber-600 text-white'
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
              }`}>
              הכל
            </button>
            {allYears.map(y => (
              <button
                key={y}
                onClick={() => toggleYearLocal(y, yearsRankOverTime, setYearsRankOverTime)}
                className={`rounded-md px-2 py-1 text-xs font-bold border transition tabular-nums ${
                  yearsRankOverTime.includes(y) && yearsRankOverTime.length < allYears.length
                    ? 'bg-amber-700 border-amber-600 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
                }`}>
                {y}
              </button>
            ))}
          </div>
        )}
        {rankData.length === 0 ? (
          <div className="py-8 text-center text-stone-500 text-sm">אין נתונים זמינים</div>
        ) : (
          <div style={{ width: '100%', height: isMobile ? 240 : 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rankData} margin={{ top: 15, right: 15, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="label" stroke="#78716c" tick={{ fontSize: 11, fill: '#a8a29e' }} />
                <YAxis 
                  stroke="#78716c" 
                  tick={{ fontSize: 12, fill: '#a8a29e', fontWeight: 'bold' }}
                  reversed 
                  domain={[1, maxRank]} 
                  allowDecimals={false}
                  tickFormatter={(v) => `#${v}`}
                />
                <Tooltip 
                  contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(v, name) => name === 'rank' ? [`מקום #${v}`, 'דירוג'] : [v, name]}
                  labelFormatter={(label, items) => {
                    if (items && items[0]?.payload?.labelWithYear) {
                      return items[0].payload.labelWithYear;
                    }
                    return label;
                  }}
                  cursor={{ stroke: '#60a5fa', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rank" 
                  stroke="#60a5fa" 
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (cx === undefined || cy === undefined) return null;
                    // אייקון שונה למקום ראשון/שני/שלישי
                    let icon = null;
                    if (payload.rank === 1) icon = '👑';
                    else if (payload.rank === 2) icon = '🥈';
                    else if (payload.rank === 3) icon = '🥉';
                    
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={5} fill="#60a5fa" stroke="#1e3a8a" strokeWidth={2} />
                        {icon && (
                          <text x={cx} y={cy - 12} textAnchor="middle" fontSize={14}>
                            {icon}
                          </text>
                        )}
                      </g>
                    );
                  }}
                  activeDot={{ r: 7, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="text-[10px] text-stone-500 text-center mt-1">
          ככל שהקו גבוה יותר ⬆ הדירוג טוב יותר (1 = ראשון)
        </div>
      </div>
      
      {/* 3️⃣ גרף התפלגות תוצאות */}
      <div className="rounded-2xl border border-purple-800/40 bg-gradient-to-br from-purple-950/20 via-stone-950/60 to-stone-950/40 backdrop-blur p-4">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-base md:text-lg font-bold text-purple-200 flex items-center gap-2">
            🥧 התפלגות תוצאות
          </h3>
          <span className="text-xs text-purple-300/80 font-bold rounded-full bg-purple-900/40 border border-purple-700/40 px-2 py-0.5">
            {distributionStats.total} מפגשים
          </span>
        </div>
        {/* 🆕 בורר שנים נפרד */}
        {allYears.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <span className="text-xs text-stone-500 font-bold">שנים:</span>
            <button
              onClick={() => setYearsDistribution([...allYears])}
              className={`rounded-md px-2 py-1 text-xs font-bold border transition ${
                yearsDistribution.length === allYears.length
                  ? 'bg-amber-700 border-amber-600 text-white'
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
              }`}>
              הכל
            </button>
            {allYears.map(y => (
              <button
                key={y}
                onClick={() => toggleYearLocal(y, yearsDistribution, setYearsDistribution)}
                className={`rounded-md px-2 py-1 text-xs font-bold border transition tabular-nums ${
                  yearsDistribution.includes(y) && yearsDistribution.length < allYears.length
                    ? 'bg-amber-700 border-amber-600 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
                }`}>
                {y}
              </button>
            ))}
          </div>
        )}
        {distributionData.length === 0 ? (
          <div className="py-8 text-center text-stone-500 text-sm">אין נתונים זמינים</div>
        ) : (
          <div style={{ width: '100%', height: isMobile ? 280 : 340 }} className="relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={distributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 50 : 65}
                  outerRadius={isMobile ? 90 : 115}
                  paddingAngle={3}
                  label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#78716c', strokeWidth: 1 }}
                  animationDuration={1500}
                >
                  {distributionData.map((d, i) => (
                    <Cell 
                      key={i} 
                      fill={d.color} 
                      stroke="#0c0a09" 
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', color: '#fff' }}
                  formatter={(v) => [`${v} מפגשים`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* טקסט במרכז ה-donut */}
            {distributionStats.total > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-3xl md:text-4xl font-extrabold text-amber-300 tabular-nums">
                  {distributionStats.winRate.toFixed(0)}%
                </div>
                <div className="text-xs text-stone-400 mt-1">אחוז ניצחונות</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// 🔥 קומפוננטת להבה - SVG מצויר עם אנימציה
// ============================================================
const FlameIcon = ({ streak }) => {
  if (!streak || streak < 3) return null;
  let size, intensity;
  if (streak >= 7) { size = 24; intensity = 'mega'; }
  else if (streak >= 5) { size = 20; intensity = 'high'; }
  else { size = 17; intensity = 'medium'; }
  
  const colors = {
    medium: { outer: '#ea580c', mid: '#fb923c', inner: '#fbbf24' },
    high:   { outer: '#dc2626', mid: '#f97316', inner: '#fde047' },
    mega:   { outer: '#7f1d1d', mid: '#dc2626', inner: '#fbbf24' },
  };
  const c = colors[intensity];
  const id = `flame-${intensity}-${streak}`;
  
  return (
    <span 
      className={`inline-flex items-center gap-0.5 align-middle ml-1 streak-flame streak-${intensity}`}
      title={`${streak} ניצחונות ברציפות 🔥`}>
      <svg width={size} height={size * 1.3} viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <defs>
          <radialGradient id={`${id}-grad`} cx="50%" cy="70%" r="60%">
            <stop offset="0%" stopColor={c.inner}/>
            <stop offset="50%" stopColor={c.mid}/>
            <stop offset="100%" stopColor={c.outer}/>
          </radialGradient>
        </defs>
        <path 
          d="M12 2 C 14 6, 18 9, 18 15 C 18 22, 15 26, 12 30 C 9 26, 6 22, 6 15 C 6 11, 8 9, 12 2 Z"
          fill={`url(#${id}-grad)`} stroke={c.outer} strokeWidth="0.5"/>
        <path 
          d="M12 10 C 13 13, 14.5 15, 14.5 19 C 14.5 23, 13 26, 12 28 C 11 26, 9.5 23, 9.5 19 C 9.5 16, 10.5 14, 12 10 Z"
          fill={c.inner} opacity="0.85"/>
        {streak >= 5 && <circle cx="12" cy="22" r="1.5" fill="white" opacity="0.7"/>}
      </svg>
      <span className={`text-[10px] font-extrabold tabular-nums ${
        intensity === 'mega' ? 'text-red-400' :
        intensity === 'high' ? 'text-orange-400' :
        'text-amber-400'
      }`}>
        {streak}
      </span>
    </span>
  );
};

// ============================================================
// 💸 מערכת תזכורות תשלום
// ============================================================
const PAYMENTS_STORAGE_KEY = 'poker_payment_reminders_v1';
const PAYMENTS_HANDLED_KEY = 'poker_payment_handled_v1'; // legacy - localStorage
// Firestore-based handled reminders - לפי שם משתמש
const getHandledRemindersKey = (userName) => `poker_handled_v2_${userName}`;

const loadHandledFromFirestore = async (userName) => {
  if (!userName) return {};
  try {
    const data = await loadState(getHandledRemindersKey(userName));
    return data || {};
  } catch (e) { return {}; }
};

const saveHandledToFirestore = async (userName, handled) => {
  if (!userName) return;
  try {
    await saveState(handled, getHandledRemindersKey(userName));
  } catch (e) {}
};
const EVENING_SUMMARY_KEY = 'poker_evening_summary_v1'; // 🆕 v2.33.36 - סיכום הערב האחרון לפרסום בדשבורד
const PAYMENT_EXPIRY_DAYS = 7;
const PAYMENT_HANDLED_EXPIRY_DAYS = 30; // תזכורות שטופלו נשמרות 30 יום

const loadPaymentReminders = () => {
  try {
    const data = window.localStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (!data) return [];
    const reminders = JSON.parse(data);
    if (!Array.isArray(reminders)) return [];
    const now = Date.now();
    const expiryMs = PAYMENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    return reminders.filter(r => {
      const created = new Date(r.createdAt).getTime();
      return (now - created) < expiryMs;
    });
  } catch (e) {
    return [];
  }
};

const savePaymentReminders = (reminders) => {
  try {
    window.localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(reminders));
  } catch (e) {}
};

// 🆕 רשימה של signatures שמשתמש סימן ידנית כ"טופלו"
// מבנה: { 'id1': timestamp, 'id2': timestamp }
// id = דטרמיניסטי: host_date_from_to או settle_date_from_to
const loadHandledSignatures = () => {
  try {
    const data = window.localStorage.getItem(PAYMENTS_HANDLED_KEY);
    if (!data) return {};
    const handled = JSON.parse(data);
    if (typeof handled !== 'object' || handled === null) return {};
    // ניקוי ישנים (אחרי 30 ימים)
    const now = Date.now();
    const expiryMs = PAYMENT_HANDLED_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const cleaned = {};
    Object.entries(handled).forEach(([key, ts]) => {
      if (typeof ts === 'number' && (now - ts) < expiryMs) {
        cleaned[key] = ts;
      }
    });
    return cleaned;
  } catch (e) {
    return {};
  }
};

const saveHandledSignatures = (handled) => {
  try {
    window.localStorage.setItem(PAYMENTS_HANDLED_KEY, JSON.stringify(handled));
  } catch (e) {}
};

// מסמן signature כ"טופל" - נמנע מסנכרון מחדש
const markSignatureHandled = (sig, uniqueKey) => {
  const handled = loadHandledSignatures();
  const now = Date.now();
  handled[sig] = now;
  if (uniqueKey) handled[uniqueKey] = now;
  saveHandledSignatures(handled);
};

const reminderSignature = (r) => 
  `${r.sessionDate}|${r.from}|${r.to}|${r.type}`;

const buildRemindersFromSession = (session) => {
  const reminders = [];
  const now = new Date().toISOString();
  
  if (!session || !session.results) return reminders;
  
  const transfers = calculateSettlements(session.results);
  transfers.forEach(t => {
    // id דטרמיניסטי - אותו ערב+אנשים = אותו id תמיד, מונע כפולות
    reminders.push({
      id: `settle_${session.date}_${t.from}_${t.to}`,
      sessionDate: session.date,
      type: 'settlement',
      from: t.from,
      to: t.to,
      amount: t.amount,
      status: 'pending',
      createdAt: now,
    });
  });
  
  if (session.hostingPayment && session.hostingPayment.amount > 0 && session.hostingPayment.recipient) {
    const participants = Object.keys(session.results);
    const hostRecipient = session.hostingPayment.recipient;
    const amount = session.hostingPayment.amount;
    participants.forEach(name => {
      if (name === hostRecipient) return;
      // id דטרמיניסטי - אותו ערב+אנשים = אותו id תמיד, מונע כפולות
      reminders.push({
        id: `host_${session.date}_${name}_${hostRecipient}`,
        sessionDate: session.date,
        type: 'hosting',
        from: name,
        to: hostRecipient,
        amount: amount,
        status: 'pending',
        createdAt: now,
      });
    });
  }
  
  return reminders;
};

const openPaymentApp = (phone, app) => {
  if (phone && navigator.clipboard) {
    try {
      navigator.clipboard.writeText(phone);
    } catch (e) {
      try {
        const input = document.createElement('input');
        input.value = phone;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      } catch {}
    }
  }
  const url = app === 'bit' ? 'https://www.bitpay.co.il/app' : 'https://links.payboxapp.com/';
  window.open(url, '_blank');
};

// ============================================================
// 🎉 קומפוננטת Confetti
// ============================================================
const Confetti = ({ active, onComplete, message, showPipes = true }) => {
  const SOURCES = useMemo(() => [
    { side: 'left',  offsetPct: 12, angle: 60 },
    { side: 'left',  offsetPct: 32, angle: 80 },
    { side: 'right', offsetPct: 32, angle: 80 },
    { side: 'right', offsetPct: 12, angle: 60 },
  ], []);
  
  const swans = useMemo(() => {
    const all = [];
    SOURCES.forEach((src, srcIdx) => {
      for (let i = 0; i < 18; i++) {
        const directionMultiplier = src.side === 'left' ? 1 : -1;
        const angle = src.angle + (Math.random() - 0.5) * 30;
        const distance = 200 + Math.random() * 250;
        const radians = (angle * Math.PI) / 180;
        const peakX = Math.cos(radians) * distance * directionMultiplier;
        const peakY = -Math.sin(radians) * distance;
        const driftX = (Math.random() - 0.5) * 80;
        all.push({
          id: srcIdx * 100 + i,
          side: src.side,
          offsetPct: src.offsetPct,
          peakX, peakY,
          fallX: peakX + driftX,
          fallY: -peakY * 1.3,
          delay: Math.random() * 1.2,
          duration: 4 + Math.random() * 2,
          flipped: directionMultiplier < 0,
          bobDelay: Math.random() * 1.5,
          bobDuration: 1.2 + Math.random() * 0.8,
          // 🆕 גודל מעורב בין קטן (80-110) ובינוני (100-140)
          size: 80 + Math.random() * 60,
          // 🆕 תמונה אקראית מתוך 3 הברבורים השונים
          variant: Math.floor(Math.random() * 3),
        });
      }
    });
    return all;
  }, [active, SOURCES]);
  
  useEffect(() => {
    if (!active) return;
    
    // 🔊 סאונד מים נופלים - 4 צינורות שיורים
    let audioCtx = null;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
        // צליל "whoosh" של מים - white noise עם filter שמשתנה לאורך הזמן
        const duration = 1.4; // משך הסאונד
        const sampleRate = audioCtx.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        // יוצר white noise
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.4;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        // filter דינמי - מתחיל גבוה ויורד (אפקט splash)
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2500, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + duration);
        // gain - fade in מהיר ו-fade out איטי
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        // חיבור: source → filter → gain → speakers
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(audioCtx.currentTime);
      }
    } catch (e) {
      // iOS Safari דורש user gesture - אם לא מצליח, פשוט מתעלם
    }
    
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
      if (audioCtx) {
        try { audioCtx.close(); } catch {}
      }
    }, 7000);
    return () => {
      clearTimeout(timer);
      if (audioCtx) {
        try { audioCtx.close(); } catch {}
      }
    };
  }, [active, onComplete]);
  
  if (!active) return null;
  
  const renderPipe = (size, idSuffix) => {
    const isLarge = size === 'large';
    const w = isLarge ? 46 : 40;
    const h = isLarge ? 150 : 125;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`waterPipe-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e3a5f"/>
            <stop offset="15%" stopColor="#3b6996"/>
            <stop offset="40%" stopColor="#7eb1d7"/>
            <stop offset="55%" stopColor="#b8d4e8"/>
            <stop offset="75%" stopColor="#5b8bb5"/>
            <stop offset="100%" stopColor="#1e3a5f"/>
          </linearGradient>
          <linearGradient id={`coupling-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0f172a"/>
            <stop offset="20%" stopColor="#334155"/>
            <stop offset="50%" stopColor="#94a3b8"/>
            <stop offset="80%" stopColor="#334155"/>
            <stop offset="100%" stopColor="#0f172a"/>
          </linearGradient>
          <radialGradient id={`water-${idSuffix}`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#67e8f9"/>
            <stop offset="60%" stopColor="#0891b2"/>
            <stop offset="100%" stopColor="#0e7490"/>
          </radialGradient>
        </defs>
        {isLarge ? (
          <>
            <rect x="11" y="35" width="24" height="100" fill={`url(#waterPipe-${idSuffix})`} stroke="#0f172a" strokeWidth="1"/>
            <rect x="16" y="35" width="2" height="100" fill="white" opacity="0.5"/>
            <ellipse cx="23" cy="135" rx="14" ry="3" fill="#0f172a"/>
            <rect x="9" y="128" width="28" height="9" rx="1" fill={`url(#coupling-${idSuffix})`} stroke="#0f172a" strokeWidth="1"/>
            <rect x="7" y="78" width="32" height="14" rx="2" fill={`url(#coupling-${idSuffix})`} stroke="#0f172a" strokeWidth="1"/>
            <circle cx="11" cy="85" r="1.5" fill="#1e293b"/>
            <circle cx="35" cy="85" r="1.5" fill="#1e293b"/>
            <rect x="6" y="20" width="34" height="14" rx="2" fill={`url(#coupling-${idSuffix})`} stroke="#0f172a" strokeWidth="1"/>
            <circle cx="10" cy="27" r="1.5" fill="#1e293b"/>
            <circle cx="36" cy="27" r="1.5" fill="#1e293b"/>
            <ellipse cx="23" cy="20" rx="17" ry="5" fill={`url(#water-${idSuffix})`} stroke="#0f172a" strokeWidth="1"/>
            <ellipse cx="20" cy="18.5" rx="5" ry="1" fill="white" opacity="0.7"/>
          </>
        ) : (
          <>
            <rect x="9" y="30" width="22" height="85" fill={`url(#waterPipe-${idSuffix})`} stroke="#0f172a" strokeWidth="1"/>
            <rect x="14" y="30" width="2" height="85" fill="white" opacity="0.5"/>
            <ellipse cx="20" cy="115" rx="12" ry="3" fill="#0f172a"/>
            <rect x="7" y="108" width="26" height="8" rx="1" fill={`url(#coupling-${idSuffix})`} stroke="#0f172a" strokeWidth="1"/>
            <rect x="5" y="65" width="30" height="13" rx="2" fill={`url(#coupling-${idSuffix})`} stroke="#0f172a" strokeWidth="1"/>
            <circle cx="9" cy="71.5" r="1.3" fill="#1e293b"/>
            <circle cx="31" cy="71.5" r="1.3" fill="#1e293b"/>
            <rect x="4" y="17" width="32" height="13" rx="2" fill={`url(#coupling-${idSuffix})`} stroke="#0f172a" strokeWidth="1"/>
            <circle cx="8" cy="23.5" r="1.3" fill="#1e293b"/>
            <circle cx="32" cy="23.5" r="1.3" fill="#1e293b"/>
            <ellipse cx="20" cy="17" rx="16" ry="4.5" fill={`url(#water-${idSuffix})`} stroke="#0f172a" strokeWidth="1"/>
            <ellipse cx="17" cy="15.5" rx="4" ry="0.8" fill="white" opacity="0.7"/>
          </>
        )}
      </svg>
    );
  };
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {message && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center animate-confetti-message">
          <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-amber-400 px-6 py-4 shadow-2xl shadow-amber-900/50">
            <div className="text-2xl md:text-3xl font-extrabold text-white whitespace-nowrap">
              {message}
            </div>
          </div>
        </div>
      )}
      <div className="absolute" style={{ bottom: '8%', left: '6%', transform: 'rotate(-25deg)', transformOrigin: 'bottom center', display: showPipes ? 'block' : 'none' }}>
        {renderPipe('large', 'L')}
      </div>
      <div className="absolute" style={{ bottom: '8%', left: '30%', transform: 'rotate(-12deg)', transformOrigin: 'bottom center', display: showPipes ? 'block' : 'none' }}>
        {renderPipe('medium', 'LC')}
      </div>
      <div className="absolute" style={{ bottom: '8%', right: '30%', transform: 'rotate(12deg)', transformOrigin: 'bottom center', display: showPipes ? 'block' : 'none' }}>
        {renderPipe('medium', 'RC')}
      </div>
      <div className="absolute" style={{ bottom: '8%', right: '6%', transform: 'rotate(25deg)', transformOrigin: 'bottom center', display: showPipes ? 'block' : 'none' }}>
        {renderPipe('large', 'R')}
      </div>
      {swans.map(s => (
        <div
          key={s.id}
          className="absolute"
          style={{
            bottom: 'calc(8% + 140px)',
            [s.side]: `${s.offsetPct}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            '--peak-x': `${s.peakX}px`,
            '--peak-y': `${s.peakY}px`,
            '--fall-x': `${s.fallX}px`,
            '--fall-y': `${s.fallY}px`,
            animation: `swan-arc ${s.duration}s ${s.delay}s ease-out forwards`,
            opacity: 0,
            willChange: 'transform, opacity',
          }}>
          <div style={{
            animation: `swan-bob ${s.bobDuration}s ${s.bobDelay}s ease-in-out infinite`,
            transformOrigin: 'center',
          }}>
            <img 
              src={[SWAN_FLY_1, SWAN_FLY_2, SWAN_FLY_3][s.variant]}
              alt="ברבור"
              width={s.size}
              height={s.size}
              style={{ 
                transform: s.flipped ? 'scaleX(-1)' : 'none', 
                display: 'block',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// 📢 v2.33.36 - כרטיס סיכום ערב בדשבורד
// ============================================================
// מוצג אחרי שאדמין שמר ערב + לחץ "שלח לכולם"
// כל משתמש יכול לסגור עבור עצמו (ב-localStorage)
// 🔒 בדיקות:
//   - מוצג רק למי שהשתתף בערב (מופיע ב-results)
//   - לא מוצג לאדמין שיצר את הסיכום (אלא אם הוא סופר אדמין - מצב בדיקה)
//   - מתחלף אוטומטית כשערב חדש נשמר (כי משתמש את אותו KEY ב-Firestore)
//   - לא מוצג לערב ניסיון (לא נשמר מלכתחילה)
// ============================================================
const EveningSummaryCard = ({ playerName, isSuperAdmin }) => {
  const [summary, setSummary] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // טעינת הסיכום מ-Firebase
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fbLoadState(EVENING_SUMMARY_KEY);
        if (!mounted) return;
        if (!data || !data.publishedAt) return;
        
        // 🔒 v2.33.37: סיכום של ערב ניסיון - רק הסופר אדמין רואה
        if (data.isTestEvening && !isSuperAdmin) {
          return;
        }
        
        // 🔒 בדיקה: המשתמש השתתף בערב הזה?
        if (!data.results || data.results[playerName] === undefined) {
          // לא השתתף - אל תציג כלל
          return;
        }
        
        // 🔒 בדיקה: האם המשתמש הוא האדמין שפרסם?
        // אם כן - לא להציג, אלא אם הוא סופר אדמין (לצורכי בדיקה)
        if (data.publishedBy && data.publishedBy === playerName && !isSuperAdmin) {
          return;
        }
        
        // האם המשתמש סגר את הסיכום הזה?
        const dismissKey = `poker_dismissed_summary_${data.id || data.sessionDate}`;
        const isDismissed = window.localStorage.getItem(dismissKey) === 'true';
        if (isDismissed) {
          setDismissed(true);
          return;
        }
        
        setSummary(data);
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, [playerName, isSuperAdmin]);
  
  const handleDismiss = () => {
    if (!summary) return;
    try {
      const dismissKey = `poker_dismissed_summary_${summary.id || summary.sessionDate}`;
      window.localStorage.setItem(dismissKey, 'true');
      setDismissed(true);
    } catch {}
  };
  
  if (!summary || dismissed) return null;
  
  // הכנת הנתונים לתצוגה
  const sortedResults = Object.entries(summary.results || {})
    .sort(([, a], [, b]) => b - a);
  const dateFormatted = new Date(summary.sessionDate).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const myResult = summary.results?.[playerName];
  const myResultText = myResult !== undefined
    ? (myResult > 0 ? `+${myResult}` : myResult === 0 ? '0' : `${myResult}`)
    : null;
  
  // האם זה הסיכום של האדמין שיצר אותו (= מצב בדיקה)?
  const isMyOwnSummary = summary.publishedBy === playerName;
  const isTestSummary = summary.isTestEvening === true;
  const showTestLabel = (isTestSummary || isMyOwnSummary) && isSuperAdmin;
  const labelText = isTestSummary 
    ? '🧪 ערב ניסיון • סיכום זה לא מוצג למשתתפים אחרים'
    : '🧪 מצב בדיקה • זו התצוגה שהמשתתפים רואים';
  
  return (
    <div className="rounded-2xl border border-amber-700/40 bg-gradient-to-br from-amber-950/40 via-stone-950 to-stone-950 p-4 relative overflow-hidden" style={{
      boxShadow: '0 0 20px rgba(251,191,36,0.15)',
    }}>
      {/* 🧪 תווית "מצב בדיקה" - מוצגת לסופר אדמין */}
      {showTestLabel && (
        <div className="absolute top-0 right-0 left-0 bg-yellow-600/90 text-stone-900 text-[10px] font-extrabold tracking-widest px-3 py-1 text-center z-10">
          {labelText}
        </div>
      )}
      
      {/* כפתור X לסגירה */}
      <button onClick={handleDismiss}
        className={`absolute ${showTestLabel ? 'top-9' : 'top-2'} left-2 z-10 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-white w-7 h-7 flex items-center justify-center transition`}
        title="הסתר">
        <X className="h-4 w-4" />
      </button>
      
      {/* כותרת */}
      <div className={`flex items-start gap-3 mb-3 pr-8 ${showTestLabel ? 'mt-6' : ''}`}>
        <div className="text-3xl">🎰</div>
        <div className="flex-1">
          <div className="text-xs text-amber-300 font-bold tracking-widest mb-0.5">סיכום הערב</div>
          <div className="text-base font-extrabold text-amber-100">
            {dateFormatted}
          </div>
          <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-2 flex-wrap">
            {summary.host && <span>🏠 מארח: <span className="text-amber-300 font-bold">{summary.host}</span></span>}
            {summary.pot > 0 && <span>💰 קופה: <span className="text-amber-300 font-bold">{summary.pot} ₪</span></span>}
          </div>
        </div>
      </div>
      
      {/* התוצאה האישית של המשתמש */}
      {myResultText !== null && (
        <div className={`rounded-lg p-3 mb-3 text-center font-bold text-lg ${
          myResult > 0 ? 'bg-emerald-950/40 border border-emerald-700/40 text-emerald-300'
          : myResult < 0 ? 'bg-rose-950/40 border border-rose-700/40 text-rose-300'
          : 'bg-stone-900 border border-stone-700 text-stone-300'
        }`}>
          {myResult > 0 ? `🎉 ` : myResult < 0 ? `💔 ` : ''}
          התוצאה שלך: {myResultText} ₪
        </div>
      )}
      
      {/* כפתור הרחבה */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full rounded-lg bg-stone-900/60 hover:bg-stone-900 border border-stone-700 text-stone-300 px-3 py-2 text-sm font-bold transition flex items-center justify-center gap-2">
        {expanded ? '▲ הסתר פירוט' : '▼ הצג פירוט מלא'}
      </button>
      
      {/* תוכן מורחב */}
      {expanded && (
        <div className="mt-3 space-y-3">
          {/* טבלת תוצאות */}
          <div className="rounded-lg bg-black/30 border border-stone-800 p-3">
            <div className="text-xs text-amber-300 font-bold mb-2">📊 תוצאות הערב</div>
            <div className="space-y-1">
              {sortedResults.map(([name, amount], idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
                const isMe = name === playerName;
                const colorClass = amount > 0 ? 'text-emerald-300' : amount < 0 ? 'text-rose-300' : 'text-stone-400';
                return (
                  <div key={name} className={`flex justify-between items-center text-sm py-1 ${isMe ? 'bg-amber-900/20 rounded px-2 -mx-1' : ''}`}>
                    <span className="flex items-center gap-1">
                      {medal && <span>{medal}</span>}
                      <span className={isMe ? 'text-amber-200 font-bold' : 'text-stone-200'}>{name}</span>
                      {isMe && <span className="text-xs text-amber-400">(אני)</span>}
                    </span>
                    <span className={`font-bold ${colorClass}`}>
                      {amount > 0 ? `+${amount}` : amount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* טבלת העברות */}
          {summary.transfers && summary.transfers.length > 0 && (
            <div className="rounded-lg bg-black/30 border border-stone-800 p-3">
              <div className="text-xs text-amber-300 font-bold mb-2">💸 העברות</div>
              <div className="space-y-1">
                {summary.transfers.map((t, i) => {
                  const isMe = t.from === playerName || t.to === playerName;
                  return (
                    <div key={i} className={`flex justify-between items-center text-sm py-1 ${isMe ? 'bg-amber-900/20 rounded px-2 -mx-1' : ''}`}>
                      <span className="text-stone-200">
                        <span className={t.from === playerName ? 'text-amber-200 font-bold' : ''}>{t.from}</span>
                        {' → '}
                        <span className={t.to === playerName ? 'text-amber-200 font-bold' : ''}>{t.to}</span>
                      </span>
                      <span className="text-amber-300 font-bold">{t.amount} ₪</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* תשלום אירוח */}
          {summary.hostingPayment && summary.hostingPayment.amount > 0 && summary.hostingPayment.recipient && (
            <div className="rounded-lg bg-purple-950/30 border border-purple-800/40 p-3">
              <div className="text-xs text-purple-300 font-bold mb-1">🏠 תשלום אירוח</div>
              <div className="text-sm text-stone-300">
                כל משתתף → <span className="font-bold text-purple-300">{summary.hostingPayment.recipient}</span>: {summary.hostingPayment.amount} ₪
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// 💸 קומפוננטת תזכורות תשלום בדשבורד
// ============================================================
const PaymentReminders = ({ playerName, reminders, phones, onUpdateReminders, handledReminders, onUpdateHandled }) => {
  // Hooks first - לפני early return!
  const filtered = useMemo(() => {
    if (!playerName || !reminders || reminders.length === 0) {
      return { toSend: [], toReceive: [] };
    }
    // מציג רק תזכורות פעילות (לא ארכיון)
    const toSend = reminders.filter(r => 
      r.from === playerName && r.status !== 'confirmed' && r.status !== 'archived'
    );
    const toReceive = reminders.filter(r => 
      r.to === playerName && r.status !== 'confirmed' && r.status !== 'archived'
    );
    return { toSend, toReceive };
  }, [playerName, reminders]);
  
  const { toSend, toReceive } = filtered;
  
  if (toSend.length === 0 && toReceive.length === 0) return null;
  
  // עדכון סטטוס + העברה לארכיון אחרי "קיבלתי"
  const updateStatus = (id, newStatus) => {
    const target = reminders.find(r => r.id === id);
    if ((newStatus === 'confirmed' || newStatus === 'archived') && target) {
      // שמור ב-Firestore
      const newHandled = { ...handledReminders, [target.id]: Date.now() };
      onUpdateHandled(newHandled);
      // גם localStorage legacy
      markSignatureHandled(reminderSignature(target), `${target.sessionDate}|${target.from}|${target.to}`);
    }
    const archivedAt = (newStatus === 'confirmed' || newStatus === 'archived') 
      ? new Date().toISOString() 
      : undefined;
    const updated = reminders.map(r => {
      if (r.id !== id) return r;
      // 🆕 אם confirmed - מעבירים לארכיון במקום למחוק
      if (newStatus === 'confirmed') {
        return { ...r, status: 'archived', archivedAt, archivedAction: 'received' };
      }
      return { ...r, status: newStatus };
    });
    onUpdateReminders(updated);
  };
  
  // 🆕 "כבר העברתי" - מעביר לארכיון במקום למחוק
  const archiveReminder = (id) => {
    const target = reminders.find(r => r.id === id);
    if (target) {
      // שמור ב-Firestore
      const newHandled = { ...handledReminders, [target.id]: Date.now() };
      onUpdateHandled(newHandled);
      // גם localStorage legacy
      markSignatureHandled(reminderSignature(target), `${target.sessionDate}|${target.from}|${target.to}`);
    }
    const archivedAt = new Date().toISOString();
    const updated = reminders.map(r => 
      r.id === id 
        ? { ...r, status: 'archived', archivedAt, archivedAction: 'sent' }
        : r
    );
    onUpdateReminders(updated);
  };
  
  const handlePaymentApp = (reminder, app) => {
    const recipientPhone = phones && phones[reminder.to];
    const phoneNum = recipientPhone ? recipientPhone.phone : '';
    openPaymentApp(phoneNum, app);
    updateStatus(reminder.id, 'marked_sent');
  };
  
  const totalToSend = toSend.reduce((s, r) => s + r.amount, 0);
  const totalToReceive = toReceive.reduce((s, r) => s + r.amount, 0);
  
  return (
    <div className="rounded-2xl border border-amber-800/50 bg-gradient-to-br from-amber-950/30 to-stone-950/40 backdrop-blur p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-bold text-amber-200 flex items-center gap-2">
          💸 תזכורות תשלום
        </div>
        <div className="text-xs text-stone-500">
          {toSend.length + toReceive.length} פעילות
        </div>
      </div>
      
      {toSend.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-rose-300 font-bold">🔴 צריך להעביר</span>
            <span className="text-rose-400 font-extrabold tabular-nums">{totalToSend} ₪</span>
          </div>
          {toSend.map(r => {
            const recipientPhone = phones && phones[r.to];
            const phoneNum = recipientPhone ? recipientPhone.phone : null;
            const isHosting = r.type === 'hosting';
            const isMarkedSent = r.status === 'marked_sent';
            
            return (
              <div key={r.id} className={`rounded-lg border p-2.5 ${
                isHosting 
                  ? 'border-purple-800/50 bg-purple-950/20' 
                  : 'border-stone-800 bg-stone-900/50'
              } ${isMarkedSent ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">
                    <span className="text-stone-100 font-bold">{r.amount} ₪</span>
                    <span className="text-stone-400"> ל-</span>
                    <span className="text-stone-100 font-bold">{r.to}</span>
                    {isHosting && <span className="text-purple-300 text-xs"> (אירוח)</span>}
                  </div>
                  {isMarkedSent && (
                    <span className="text-xs text-emerald-400">✓ סימנת כשולם</span>
                  )}
                </div>
                {!isMarkedSent && (
                  <div className="flex gap-1.5">
                    {phoneNum && (
                      <>
                        <button 
                          onClick={() => handlePaymentApp(r, 'bit')}
                          className="flex-1 rounded bg-blue-600 hover:bg-blue-500 px-2 py-1.5 text-xs font-bold text-white">
                          💙 Bit
                        </button>
                        <button 
                          onClick={() => handlePaymentApp(r, 'paybox')}
                          className="flex-1 rounded bg-purple-600 hover:bg-purple-500 px-2 py-1.5 text-xs font-bold text-white">
                          💜 PayBox
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => archiveReminder(r.id)}
                      title="כבר העברתי - הסר תזכורת"
                      className="rounded bg-stone-800 hover:bg-stone-700 border border-stone-700 px-2 py-1.5 text-xs font-bold text-stone-300 whitespace-nowrap">
                      ✓ כבר העברתי
                    </button>
                  </div>
                )}
                {!phoneNum && !isMarkedSent && (
                  <div className="text-xs text-amber-400/80 mt-1">
                    ⚠ אין טלפון של {r.to} - העבר ידנית ולחץ "כבר העברתי"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {toReceive.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-300 font-bold">🟢 לקבל</span>
            <span className="text-emerald-400 font-extrabold tabular-nums">{totalToReceive} ₪</span>
          </div>
          {toReceive.map(r => {
            const isHosting = r.type === 'hosting';
            const isMarkedSent = r.status === 'marked_sent';
            
            return (
              <div key={r.id} className={`rounded-lg border p-2.5 ${
                isHosting 
                  ? 'border-purple-800/50 bg-purple-950/20' 
                  : 'border-stone-800 bg-stone-900/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">
                    <span className="text-stone-100 font-bold">{r.amount} ₪</span>
                    <span className="text-stone-400"> מ-</span>
                    <span className="text-stone-100 font-bold">{r.from}</span>
                    {isHosting && <span className="text-purple-300 text-xs"> (אירוח)</span>}
                  </div>
                  {isMarkedSent ? (
                    <span className="text-xs text-amber-400">✓ סימן ששלח</span>
                  ) : (
                    <span className="text-xs text-stone-500">⏳ ממתין</span>
                  )}
                </div>
                <button 
                  onClick={() => updateStatus(r.id, 'confirmed')}
                  className={`w-full rounded px-3 py-1.5 text-xs font-bold transition ${
                    isMarkedSent 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300'
                  }`}>
                  ✓ קיבלתי
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


// ============================================================
// 📡 צופה בשידור חי - מסך נפרד שעולה אוטומטית למשתמשים
// ============================================================
// 📢 מסך שליחת התראה מותאמת אישית - לסופר אדמין בלבד
// בחירת נמענים (קבוצות או פרטני) + כותרת + תוכן + שליחה
// ============================================================
const CustomNotificationModal = ({ isOpen, onClose, players, registration, adminNamesList, onSend }) => {
  const [recipientMode, setRecipientMode] = useState('all'); // 'all' | 'registered' | 'admins' | 'custom'
  const [customRecipients, setCustomRecipients] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  
  if (!isOpen) return null;
  
  // חישוב נמענים בפועל
  const finalRecipients = (() => {
    if (recipientMode === 'all') return [...new Set(players)];
    if (recipientMode === 'registered') {
      const entries = registration?.entries || [];
      return entries.map(e => e.name);
    }
    if (recipientMode === 'admins') return [...adminNamesList];
    return customRecipients;
  })();
  
  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      alert('נא למלא כותרת ותוכן');
      return;
    }
    if (finalRecipients.length === 0) {
      alert('נא לבחור לפחות נמען אחד');
      return;
    }
    
    const confirmMsg = `לשלוח התראה ל-${finalRecipients.length} נמענים?\n\nכותרת: ${title}\nתוכן: ${body}`;
    if (!confirm(confirmMsg)) return;
    
    setSending(true);
    try {
      await onSend(finalRecipients, title, body);
      // איפוס וסגירה
      setTitle('');
      setBody('');
      setCustomRecipients([]);
      setRecipientMode('all');
      onClose();
    } catch (e) {
      console.error('שגיאה בשליחה:', e);
      alert('❌ שגיאה בשליחה - נסה שוב');
    } finally {
      setSending(false);
    }
  };
  
  const toggleCustomRecipient = (name) => {
    setCustomRecipients(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };
  
  return (
    <div dir="rtl" className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-stone-950 rounded-2xl border-2 border-blue-700 w-full max-w-lg my-8" onClick={e => e.stopPropagation()}>
        {/* כותרת */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-gradient-to-l from-blue-950/40 to-stone-950">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📢</span>
            <div>
              <h2 className="text-lg font-extrabold text-blue-200">שלח התראה</h2>
              <div className="text-xs text-stone-400">סופר אדמין בלבד 👑</div>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* בחירת נמענים - קבוצות */}
          <div>
            <label className="text-xs text-stone-400 font-bold mb-2 block">נמענים:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRecipientMode('all')}
                className={`rounded-lg py-2 px-3 text-xs font-bold transition ${
                  recipientMode === 'all' 
                    ? 'bg-blue-700 text-white shadow' 
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                👥 כולם ({players.length})
              </button>
              <button
                onClick={() => setRecipientMode('registered')}
                className={`rounded-lg py-2 px-3 text-xs font-bold transition ${
                  recipientMode === 'registered' 
                    ? 'bg-blue-700 text-white shadow' 
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                📝 רק נרשמים ({registration?.entries?.length || 0})
              </button>
              <button
                onClick={() => setRecipientMode('admins')}
                className={`rounded-lg py-2 px-3 text-xs font-bold transition ${
                  recipientMode === 'admins' 
                    ? 'bg-blue-700 text-white shadow' 
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                👑 רק אדמינים ({adminNamesList.length})
              </button>
              <button
                onClick={() => setRecipientMode('custom')}
                className={`rounded-lg py-2 px-3 text-xs font-bold transition ${
                  recipientMode === 'custom' 
                    ? 'bg-blue-700 text-white shadow' 
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                ✏️ בחירה ידנית ({customRecipients.length})
              </button>
            </div>
          </div>
          
          {/* בחירה ידנית - מציג רק במצב custom */}
          {recipientMode === 'custom' && (
            <div className="rounded-lg border border-stone-800 bg-stone-900/40 p-3 max-h-48 overflow-y-auto">
              <div className="text-xs text-stone-400 mb-2 font-bold">בחר שחקנים:</div>
              <div className="grid grid-cols-2 gap-1">
                {players.map(name => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-stone-800/50 rounded p-1">
                    <input 
                      type="checkbox"
                      checked={customRecipients.includes(name)}
                      onChange={() => toggleCustomRecipient(name)}
                      className="rounded"
                    />
                    <span className="text-stone-200">{name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* כותרת */}
          <div>
            <label className="text-xs text-stone-400 font-bold mb-1 block">כותרת:</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="לדוגמה: הודעה חשובה"
              maxLength={100}
              className="w-full rounded-lg bg-stone-900 border border-stone-700 px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
            />
            <div className="text-[10px] text-stone-500 mt-1">{title.length}/100</div>
          </div>
          
          {/* תוכן */}
          <div>
            <label className="text-xs text-stone-400 font-bold mb-1 block">תוכן:</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="תוכן ההתראה..."
              maxLength={300}
              rows={4}
              className="w-full rounded-lg bg-stone-900 border border-stone-700 px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
            />
            <div className="text-[10px] text-stone-500 mt-1">{body.length}/300</div>
          </div>
          
          {/* תצוגה מקדימה של נמענים */}
          {finalRecipients.length > 0 && (
            <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/50 p-3">
              <div className="text-xs text-emerald-300 font-bold mb-1">
                ✓ ההתראה תישלח ל-{finalRecipients.length} נמענים:
              </div>
              <div className="text-xs text-emerald-400/80 leading-relaxed">
                {finalRecipients.slice(0, 10).join(', ')}
                {finalRecipients.length > 10 && ` ועוד ${finalRecipients.length - 10}...`}
              </div>
            </div>
          )}
        </div>
        
        {/* כפתורי פעולה */}
        <div className="p-4 border-t border-stone-800 flex gap-2">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 rounded-lg bg-stone-800 hover:bg-stone-700 px-4 py-2.5 text-stone-300 font-bold text-sm transition disabled:opacity-50"
          >
            ביטול
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim() || finalRecipients.length === 0}
            className="flex-2 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 px-4 py-2.5 text-white font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? '⏳ שולח...' : '📤 שלח התראה'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 🏆 פופ-אפ ברכה ל-MVP - מציג חודשי/רבעוני/שנתי בסוויפר
// מופיע פעם אחת לכל משתמש (נשמר ב-localStorage)
// ============================================================
const MVPCelebrationPopup = ({ data, onClose, currentUser }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);
  
  if (!data) return null;
  
  // איסוף הכרטיסים שיש להציג
  const cards = [];
  if (data.monthly) cards.push({ ...data.monthly, label: `MVP חודשי - ${data.monthly.monthName}`, color: 'amber', emoji: '⭐' });
  if (data.quarterly) cards.push({ ...data.quarterly, label: `MVP רבעוני - Q${data.quarterly.quarter}`, color: 'blue', emoji: '🥈' });
  if (data.yearly) cards.push({ ...data.yearly, label: `MVP שנתי - ${data.yearly.year}`, color: 'purple', emoji: '🏆' });
  
  if (cards.length === 0) return null;
  
  // 🎉 קונפטי לכולם בעת פתיחת הפופ-אפ (חוויה חגיגית)
  useEffect(() => {
    // עיכוב קטן כדי שהפופ-אפ יספיק להיפתח
    const timer = setTimeout(() => setConfettiActive(true), 400);
    return () => clearTimeout(timer);
  }, []);
  
  // כותרת ראשית
  let mainTitle;
  if (data.yearly) mainTitle = `🏆 סיכום עונת ${data.yearly.year}!`;
  else if (data.quarterly && data.monthly) mainTitle = `🏆 סיכום ${data.monthly.monthName} ורבעון ${data.quarterly.quarter}!`;
  else if (data.quarterly) mainTitle = `🏆 סיכום רבעון ${data.quarterly.quarter}!`;
  else mainTitle = `🏆 ה-MVP של ${data.monthly.monthName}!`;
  
  const card = cards[activeIndex];
  const colorClasses = {
    amber: 'from-amber-700 to-orange-700 border-amber-500',
    blue: 'from-blue-700 to-indigo-700 border-blue-500',
    purple: 'from-purple-700 to-fuchsia-700 border-purple-500',
  };
  
  const isWinnerView = card.name === currentUser;
  
  return (
    <div dir="rtl" className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" style={{ fontFamily: 'Assistant, sans-serif' }}>
      {/* 🎉 קונפטי לכולם (בלי הודעה - הפופ-אפ עצמו מציג הכל) */}
      <Confetti 
        active={confettiActive} 
        onComplete={() => setConfettiActive(false)}
      />
      
      <div className="max-w-md w-full bg-gradient-to-br from-stone-900 to-stone-950 border-2 border-amber-700/60 rounded-3xl shadow-2xl overflow-hidden">
        {/* כותרת ראשית */}
        <div className="bg-gradient-to-l from-amber-950/50 to-stone-900 p-5 border-b border-amber-800/40 text-center">
          <div className="text-2xl font-extrabold text-amber-200">{mainTitle}</div>
          {cards.length > 1 && (
            <div className="text-xs text-amber-400/70 mt-1">החלק לראות עוד ({activeIndex + 1}/{cards.length})</div>
          )}
        </div>
        
        {/* כרטיס פעיל */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="text-xs text-stone-400 mb-2 font-bold">{card.label}</div>
            <div className="text-4xl mb-3">{card.emoji}</div>
            
            {/* תמונה גדולה */}
            <div className="flex justify-center mb-3">
              {PLAYER_AVATARS[card.name] ? (
                <img 
                  src={`data:image/jpeg;base64,${PLAYER_AVATARS[card.name]}`}
                  alt={card.name}
                  className="rounded-full object-cover"
                  style={{ width: 120, height: 120, border: '4px solid rgba(251,191,36,0.8)' }}
                />
              ) : (
                <div 
                  className={`rounded-full flex items-center justify-center bg-gradient-to-br ${colorClasses[card.color]} border-4 border-amber-500/80 text-white text-5xl font-extrabold`}
                  style={{ width: 120, height: 120 }}
                >
                  {card.name.charAt(0)}
                </div>
              )}
            </div>
            
            {/* שם */}
            <div className="text-2xl font-extrabold text-amber-100 mb-1">
              {card.name}
              {isWinnerView && <span className="text-base font-normal text-emerald-400 mr-2">(זה אתה! 🎉)</span>}
            </div>
            
            {/* רווח */}
            <div className="text-3xl font-extrabold text-emerald-400 mb-1">+{card.profit}₪</div>
            
            {/* מפגשים */}
            <div className="text-sm text-stone-400">ב-{card.sessionsCount} מפגשים</div>
          </div>
          
          {/* נקודות סוויפר (אם יש כמה כרטיסים) */}
          {cards.length > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              {cards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition ${
                    idx === activeIndex ? 'bg-amber-400 w-8' : 'bg-stone-600 hover:bg-stone-500'
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* כפתורי ניווט (אם יש כמה כרטיסים) */}
          {cards.length > 1 && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                className="flex-1 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 px-3 py-2 text-stone-300 font-bold text-sm transition"
              >
                ← הקודם
              </button>
              <button
                onClick={() => setActiveIndex(Math.min(cards.length - 1, activeIndex + 1))}
                disabled={activeIndex === cards.length - 1}
                className="flex-1 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 px-3 py-2 text-stone-300 font-bold text-sm transition"
              >
                הבא →
              </button>
            </div>
          )}
          
          {/* כל הכבוד */}
          <div className="text-center text-lg font-bold text-amber-300 pt-2">
            כל הכבוד! 🎉
          </div>
        </div>
        
        {/* כפתור סגירה */}
        <div className="p-4 border-t border-stone-800">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base py-3 px-4 transition shadow-lg"
          >
            סבבה 👍
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 🍻 מסך אישור אירוח - למארח שצריך לאשר אירוח עתידי
// מופיע כשהמשתמש לוחץ על התראת תזכורת או כשנכנס לאפליקציה
// ============================================================
const HostReminderModal = ({ sessionDate, sessionHost, onConfirm, onDecline, onLater }) => {
  if (!sessionDate || !sessionHost) return null;
  
  // עיצוב התאריך לעברית
  let formattedDate = sessionDate;
  try {
    const date = new Date(sessionDate);
    formattedDate = date.toLocaleDateString('he-IL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'Asia/Jerusalem'
    });
  } catch (e) {}
  
  return (
    <div dir="rtl" className="fixed inset-0 z-[200] bg-stone-950/95 backdrop-blur-sm flex items-center justify-center p-4" style={{ fontFamily: 'Assistant, sans-serif' }}>
      <div className="max-w-md w-full bg-gradient-to-br from-stone-900 to-stone-950 border-2 border-amber-700/50 rounded-2xl shadow-2xl p-6 space-y-5">
        {/* אייקון וכותרת */}
        <div className="text-center">
          <div className="text-6xl mb-3">🍻</div>
          <h2 className="text-2xl font-bold text-amber-300">תזכורת אירוח</h2>
        </div>
        
        {/* תוכן */}
        <div className="text-center space-y-2 py-3">
          <p className="text-stone-200 text-base">
            <span className="font-bold text-amber-200">{sessionHost}</span>, אתה מארח את המפגש
          </p>
          <p className="text-amber-100 text-lg font-bold">
            {formattedDate}
          </p>
          <p className="text-stone-400 text-sm pt-2">
            האם אתה מאשר את האירוח?
          </p>
        </div>
        
        {/* כפתורי תגובה */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onConfirm}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-base py-3 px-4 transition shadow-lg"
          >
            ✅ מאשר! אהיה שם
          </button>
          <button
            onClick={onDecline}
            className="w-full rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold text-base py-3 px-4 transition shadow-lg"
          >
            ❌ לא יכול לארח
          </button>
          <button
            onClick={onLater}
            className="w-full rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm py-2 px-4 transition border border-stone-700"
          >
            אחר כך
          </button>
        </div>
        
        {/* הערה */}
        <div className="text-center text-xs text-stone-500 pt-2">
          לא יכול? ההודעה תישלח מיידית לאדמינים והם יחזרו אליך
        </div>
      </div>
    </div>
  );
};

// ============================================================
// מציג רשימת משתתפים + buy-ins של ערב חי שמתנהל כעת
const LiveBroadcastViewer = ({ broadcast, onClose, currentUser }) => {
  const [sortByAlphabet, setSortByAlphabet] = useState(false);
  
  if (!broadcast || !broadcast.active) return null;
  
  const participants = broadcast.participants || [];
  const totalBuyIns = participants.reduce((sum, p) => sum + (p.buyIns || 0), 0);
  const totalPot = totalBuyIns * 20;
  const lastUpdate = broadcast.updatedAt ? new Date(broadcast.updatedAt) : null;
  const formattedTime = lastUpdate 
    ? lastUpdate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' })
    : '';
  
  // האם המשתמש המחובר משתתף בערב?
  const isParticipating = participants.some(p => p.name === currentUser);
  
  return (
    <div dir="rtl" className="fixed inset-0 z-[100] bg-stone-950 overflow-auto" style={{ fontFamily: 'Assistant, sans-serif' }}>
      {/* רקע אנימטיבי */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-amber-950/30 via-stone-950 to-stone-950"></div>
      
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        {/* כותרת */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
            </div>
            <span className="text-rose-400 font-bold text-sm tracking-wider uppercase">משדר חי</span>
          </div>
          {onClose && (
            <button onClick={onClose}
              className="rounded-full bg-stone-800/80 border border-stone-700 p-2 text-stone-300 hover:bg-stone-700 transition">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* תיבה ראשית */}
        <div className="rounded-3xl border-2 border-amber-700/40 bg-gradient-to-br from-amber-950/40 via-stone-950/80 to-stone-950 backdrop-blur p-6 md:p-8 text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <img src={BARBUR_LOGO} alt="ברבור" width={120} height={120} className="opacity-95" style={{ filter: 'drop-shadow(0 4px 12px rgba(251,191,36,0.3))' }} />
            <h1 className="text-2xl md:text-3xl font-extrabold text-amber-200">
              ערב פוקר ברבורי תל מונד
            </h1>
            <div className="text-sm text-stone-400">
              {new Date(broadcast.sessionDate).toLocaleDateString('he-IL', { 
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' 
              })}
            </div>
          </div>
          
          {broadcast.host && (
            <div className="inline-block rounded-full bg-purple-900/40 border border-purple-700/50 px-4 py-1.5">
              <span className="text-sm text-purple-200">
                🏠 מארח: <span className="font-bold">{broadcast.host}</span>
              </span>
            </div>
          )}
          
          {/* סכומים */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
            <div className="rounded-xl bg-stone-900/60 border border-stone-800 p-3">
              <div className="text-xs text-stone-500 mb-1">משתתפים</div>
              <div className="text-2xl font-extrabold text-stone-100 tabular-nums">
                {participants.length}
              </div>
            </div>
            <div className="rounded-xl bg-emerald-900/30 border border-emerald-700/40 p-3">
              <div className="text-xs text-emerald-400/80 mb-1">קופה כוללת</div>
              <div className="text-2xl font-extrabold text-emerald-300 tabular-nums">
                {totalPot} ₪
              </div>
            </div>
          </div>
          
          {isParticipating && (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-900/40 border border-emerald-700/50 px-3 py-1 text-xs text-emerald-300">
              ✓ אתה בערב הזה, {currentUser}
            </div>
          )}
        </div>
        
        {/* רשימת משתתפים */}
        {participants.length > 0 && (
          <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur p-4">
            <h3 className="text-base font-bold text-amber-200 mb-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">👥 משתתפים ({participants.length})</span>
              <button
                onClick={() => setSortByAlphabet(!sortByAlphabet)}
                className="text-xs rounded-md bg-stone-800 hover:bg-stone-700 border border-stone-700 px-2 py-1 text-stone-300 font-bold transition"
                title={sortByAlphabet ? 'מיון לפי סדר רישום' : 'מיון לפי א"ב'}
              >
                {sortByAlphabet ? '🔤 לפי א"ב' : '🔢 סדר רישום'}
              </button>
            </h3>
            <div className="space-y-2">
              {(sortByAlphabet 
                ? [...participants].sort((a, b) => a.name.localeCompare(b.name, 'he'))
                : participants
              ).map((p, i) => {
                const isMe = p.name === currentUser;
                return (
                  <div 
                    key={p.name + i} 
                    className={`flex items-center justify-between rounded-xl border p-3 ${
                      typeof p.earlyClose === 'number'
                        ? 'border-stone-700 bg-stone-900/30 opacity-70'
                        : isMe 
                        ? 'border-amber-700/60 bg-amber-950/30' 
                        : 'border-stone-800 bg-stone-900/40'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        isMe ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-300'
                      }`}>
                        {i + 1}
                      </div>
                      <div className={`font-bold ${isMe ? 'text-amber-200' : 'text-stone-100'}`}>
                        {p.name}
                        {isMe && <span className="text-xs text-amber-400 mr-2">(אתה)</span>}
                        {typeof p.earlyClose === 'number' && (
                          <span className="text-[10px] bg-purple-900/50 border border-purple-700/50 text-purple-300 rounded-full px-2 py-0.5 font-bold mr-2">
                            ✓ עזב
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-bold tabular-nums px-2.5 py-1 rounded-lg ${
                        p.buyIns > 1 
                          ? 'bg-orange-900/40 text-orange-300 border border-orange-700/40'
                          : 'bg-stone-800 text-stone-300 border border-stone-700'
                      }`}>
                        {p.buyIns} {p.buyIns === 1 ? 'באיין' : 'באיינים'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* פוטר */}
        <div className="text-center text-xs text-stone-600 space-y-1">
          {formattedTime && (
            <div>עודכן לאחרונה: {formattedTime}</div>
          )}
          {broadcast.adminName && (
            <div>מנוהל ע״י: <span className="text-stone-400">{broadcast.adminName}</span></div>
          )}
          <div className="text-stone-700 text-[10px] mt-2">
            המסך מתעדכן אוטומטית — תוצאות לא מוצגות בלייב
          </div>
        </div>
      </div>
    </div>
  );
};

const LiveSessionModal = ({ isOpen, onClose, onSave, players, currentSeason, adminName, registration }) => {
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [host, setHost] = useState('');
  const [participants, setParticipants] = useState([]); // [{name, buyIns: 1}]
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [pendingAdditions, setPendingAdditions] = useState([]); // שחקנים שנבחרו בבחירה מרובה לפני אישור
  const [sortByAlphabet, setSortByAlphabet] = useState(false); // 🔤 מצב מיון - false=סדר רישום, true=לפי א"ב
  const [closing, setClosing] = useState(false);
  const [finalChips, setFinalChips] = useState({});
  const [settlementOpen, setSettlementOpen] = useState(false); // מודל חלוקת כספים
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false); // מודל אישור איפוס
  const [hasLoadedSaved, setHasLoadedSaved] = useState(false);
  const [savedEvening, setSavedEvening] = useState(false); // האם הערב כבר נשמר
  // 💸 העברת אירוח
  const [hostingRecipient, setHostingRecipient] = useState('');
  const [hostingAmount, setHostingAmount] = useState(50);
  // 🧪 ערב ניסיון - לא יוצר תזכורות תשלום
  const [isTestEvening, setIsTestEvening] = useState(false);
  // 🧪 מצב בדיקה לשידור חי - מתעלם מתנאי יום אירוח ושעה
  const [broadcastTestMode, setBroadcastTestMode] = useState(false);
  
  // 🆕 סגירה מוקדמת של שחקן - חלון לעדכון צ'יפים תוך כדי הערב
  const [earlyCloseModal, setEarlyCloseModal] = useState(null); // { name, currentChips }
  
  // 🆕 חיפוש שחקנים בהוספה
  const [playerSearch, setPlayerSearch] = useState('');

  // שמירה אוטומטית של מצב הערב לאחסון מקומי בדפדפן
  useEffect(() => {
    if (!isOpen || !hasLoadedSaved) return;
    const state = { sessionDate, host, participants, closing, finalChips };
    try {
      window.localStorage.setItem(LIVE_SESSION_KEY, JSON.stringify(state));
    } catch {}
  }, [sessionDate, host, participants, closing, finalChips, isOpen, hasLoadedSaved]);

  // טעינת מצב שמור כשפותחים
  useEffect(() => {
    if (!isOpen || hasLoadedSaved) return;
    try {
      const saved = window.localStorage.getItem(LIVE_SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.participants && state.participants.length > 0) {
          setSessionDate(state.sessionDate || new Date().toISOString().split('T')[0]);
          setHost(state.host || '');
          setParticipants(state.participants);
          setClosing(!!state.closing);
          setFinalChips(state.finalChips || {});
        }
      }
    } catch {}
    setHasLoadedSaved(true);
  }, [isOpen, hasLoadedSaved]);

  // 💸 סנכרון אוטומטי - hostingRecipient תמיד עוקב אחרי המארח (host)
  // 🔧 תיקון באג v2.33.35: לפני התיקון, אם hostingRecipient כבר היה מלא (מערב קודם בlocalStorage),
  // הוא לא היה מתעדכן כשהמארח השתנה. עכשיו הוא מתעדכן בכל שינוי של host.
  useEffect(() => {
    if (host) {
      // אם המארח השתנה - תמיד עדכן את hostingRecipient בהתאם
      if (hostingRecipient !== host) {
        setHostingRecipient(host);
      }
    }
  }, [host]);

  // 📡 שידור חי ל-Firebase - כל פעם שמשתתפים/buy-ins משתנים
  useEffect(() => {
    if (!isOpen) return;
    if (isTestEvening) return;
    if (participants.length === 0) return;
    
    const broadcast = {
      active: true,
      sessionDate,
      host: host || null,
      participants: participants.map(p => ({ name: p.name, buyIns: p.buyIns, earlyClose: p.earlyClose })),
      adminName: adminName || null,
      updatedAt: new Date().toISOString(),
      season: currentSeason,
      testMode: broadcastTestMode,
    };
    
    saveLiveBroadcast(broadcast).catch(() => {});
  }, [participants, host, sessionDate, isOpen, isTestEvening, adminName, currentSeason, broadcastTestMode]);
  
  // 📡 שידור מחדש בפתיחה - גם אם הנתונים זהים (למקרה של סגירה בטעות וחזרה)
  useEffect(() => {
    if (!isOpen || isTestEvening || participants.length === 0) return;
    
    const broadcast = {
      active: true,
      sessionDate,
      host: host || null,
      participants: participants.map(p => ({ name: p.name, buyIns: p.buyIns, earlyClose: p.earlyClose })),
      adminName: adminName || null,
      updatedAt: new Date().toISOString(),
      season: currentSeason,
      testMode: broadcastTestMode,
    };
    
    saveLiveBroadcast(broadcast).catch(() => {});
  }, [isOpen]); // רץ רק כשהמודל נפתח
  
  // 📡 ניקוי שידור כשהמודל נסגר
  // נשתמש ב-ref כדי לזהות סגירה אמיתית (לא mount)
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      // היה פתוח ועכשיו סגור = ניקוי
      wasOpenRef.current = false;
      clearLiveBroadcast().catch(() => {});
    }
  }, [isOpen]);

  const reset = () => {
    setParticipants([]); setHost(''); setClosing(false); setFinalChips({});
    setPendingAdditions([]); setShowAddPlayer(false);
    setSavedEvening(false);
    setSessionDate(new Date().toISOString().split('T')[0]);
    // 🔧 v2.33.36: איפוס שדות אירוח שלא נוקו בעבר וגרמו לבאגים בערב הבא
    setHostingRecipient('');
    setHostingAmount(50);
    try { window.localStorage.removeItem(LIVE_SESSION_KEY); } catch {}
  };

  const handleClose = () => {
    // סוגרים בלי לאפס - המצב נשמר וייטען בפעם הבאה שייפתח
    setHasLoadedSaved(false);
    onClose();
  };

  const handleStartFresh = () => {
    setResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    reset();
    setResetConfirmOpen(false);
  };

  if (!isOpen) return null;

  // בחירה מרובה
  const togglePending = (name) => {
    if (pendingAdditions.includes(name)) {
      setPendingAdditions(pendingAdditions.filter(n => n !== name));
    } else {
      setPendingAdditions([...pendingAdditions, name]);
    }
  };

  const confirmAddPlayers = () => {
    const newOnes = pendingAdditions
      .filter(name => !participants.find(p => p.name === name))
      .map(name => ({ name, buyIns: 1 }));
    setParticipants([...participants, ...newOnes]);
    setPendingAdditions([]);
    setShowAddPlayer(false);
  };

  const cancelAddPlayers = () => {
    setPendingAdditions([]);
    setShowAddPlayer(false);
  };

  const addBuyIn = (name) => {
    if (!confirm(`+20 ל${name}?`)) return;
    setParticipants(participants.map(p => p.name === name ? { ...p, buyIns: p.buyIns + 1 } : p));
  };

  const removeBuyIn = (name) => {
    if (!confirm(`-20 מ${name}?`)) return;
    setParticipants(participants.map(p => p.name === name ? { ...p, buyIns: Math.max(1, p.buyIns - 1) } : p));
  };

  const removePlayer = (name) => {
    setParticipants(participants.filter(p => p.name !== name));
  };

  const totalPot = participants.reduce((sum, p) => sum + p.buyIns * 20, 0);
  const totalChipsOut = Object.values(finalChips).reduce((sum, c) => sum + (Number(c) || 0), 0);
  const balance = totalChipsOut - totalPot;
  const isBalanced = Math.abs(balance) < 0.01;

  const handleStartClosing = () => {
    if (participants.length < 2) return alert('צריך לפחות 2 שחקנים');
    setClosing(true);
    const initial = {};
    participants.forEach(p => {
      // עדיפות: 1) ערך שכבר הוזן ב-finalChips, 2) earlyClose אם קיים, 3) ריק
      if (finalChips[p.name] !== undefined && finalChips[p.name] !== '') {
        initial[p.name] = finalChips[p.name];
      } else if (typeof p.earlyClose === 'number') {
        initial[p.name] = p.earlyClose;
      } else {
        initial[p.name] = '';
      }
    });
    setFinalChips(initial);
  };

  const handleFinalSave = () => {
    if (!isBalanced) return alert(`הסכומים לא מאוזנים! יש פער של ${balance > 0 ? '+' : ''}${balance} ₪`);
    if (savedEvening) return;
    
    const results = {};
    participants.forEach(p => {
      const chips = Number(finalChips[p.name]) || 0;
      const buyIn = p.buyIns * 20;
      results[p.name] = chips - buyIn;
    });
    
    const hostingPayment = (hostingRecipient && hostingAmount > 0) 
      ? { recipient: hostingRecipient, amount: hostingAmount }
      : null;
    
    const sessionData = {
      date: sessionDate, season: currentSeason, pot: totalPot, results,
      host: host || undefined, addedBy: adminName, addedAt: new Date().toISOString(), liveTracked: true,
      hostingPayment,
      isTestEvening: isTestEvening || undefined, // 🧪 דגל ערב ניסיון
    };
    
    onSave(sessionData);
    
    // 🧪 לא יוצרים תזכורות לערב ניסיון
    if (!isTestEvening) {
      try {
        const newReminders = buildRemindersFromSession(sessionData);
        if (newReminders.length > 0) {
          const existing = loadPaymentReminders();
          const existingSigs = new Set(existing.map(r => r.id)); // id דטרמיניסטי
          const toAdd = newReminders.filter(r => !existingSigs.has(reminderSignature(r)));
          savePaymentReminders([...existing, ...toAdd]);
        }
      } catch (e) {}
    }
    
    // 📡 ניקוי שידור חי - הערב נגמר
    clearLiveBroadcast().catch(() => {});
    
    // 📢 v2.33.37: פרסום סיכום הערב לדשבורד
    // גם לערב ניסיון - הסיכום נשמר עם דגל. רק סופר אדמין יראה סיכום של ערב ניסיון
    try {
      const transfers = calculateSettlements(results);
      const summary = {
        sessionDate,
        host: host || '',
        pot: totalPot,
        results,
        transfers,
        hostingPayment,
        publishedAt: new Date().toISOString(),
        publishedBy: adminName,
        id: `summary_${sessionDate}_${Date.now()}`,
        isTestEvening: isTestEvening || false, // 🧪 דגל לשלוט בתצוגה
      };
      saveState(summary, EVENING_SUMMARY_KEY).catch(() => {});
    } catch (e) {}
    
    setSavedEvening(true);
    // 🔧 v2.33.36: לא מאפסים ולא סוגרים - האדמין נשאר עם הסיכום על המסך לצילום
    // האיפוס יקרה רק כשהאדמין ילחץ ידנית על "🗑️ נקה הכל"
  };

  // שמירה ממסך החלוקה - שומר בלי לסגור את המודל
  const handleSaveFromSettlement = () => {
    if (!isBalanced) return alert(`הסכומים לא מאוזנים! יש פער של ${balance > 0 ? '+' : ''}${balance} ₪`);
    if (savedEvening) return;
    
    const results = {};
    participants.forEach(p => {
      const chips = Number(finalChips[p.name]) || 0;
      const buyIn = p.buyIns * 20;
      results[p.name] = chips - buyIn;
    });
    
    const hostingPayment = (hostingRecipient && hostingAmount > 0) 
      ? { recipient: hostingRecipient, amount: hostingAmount }
      : null;
    
    const sessionData = {
      date: sessionDate, season: currentSeason, pot: totalPot, results,
      host: host || undefined, addedBy: adminName, addedAt: new Date().toISOString(), liveTracked: true,
      hostingPayment,
      isTestEvening: isTestEvening || undefined, // 🧪 דגל ערב ניסיון
    };
    
    onSave(sessionData);
    
    // 🧪 לא יוצרים תזכורות לערב ניסיון
    if (!isTestEvening) {
      try {
        const newReminders = buildRemindersFromSession(sessionData);
        if (newReminders.length > 0) {
          const existing = loadPaymentReminders();
          const existingSigs = new Set(existing.map(r => r.id)); // id דטרמיניסטי
          const toAdd = newReminders.filter(r => !existingSigs.has(reminderSignature(r)));
          savePaymentReminders([...existing, ...toAdd]);
        }
      } catch (e) {}
    }
    
    // 📡 ניקוי שידור חי - הערב נגמר
    clearLiveBroadcast().catch(() => {});
    
    // 📢 v2.33.37: פרסום סיכום הערב לדשבורד
    // גם לערב ניסיון - הסיכום נשמר עם דגל. רק סופר אדמין יראה סיכום של ערב ניסיון
    try {
      const transfers = calculateSettlements(results);
      const summary = {
        sessionDate,
        host: host || '',
        pot: totalPot,
        results,
        transfers,
        hostingPayment,
        publishedAt: new Date().toISOString(),
        publishedBy: adminName,
        id: `summary_${sessionDate}_${Date.now()}`,
        isTestEvening: isTestEvening || false, // 🧪 דגל לשלוט בתצוגה
      };
      saveState(summary, EVENING_SUMMARY_KEY).catch(() => {});
    } catch (e) {}
    
    setSavedEvening(true);
  };

  const availablePlayers = players.filter(p => !participants.find(part => part.name === p));
  const hasActiveSession = participants.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-700/50 bg-stone-950 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-800 bg-stone-950/95 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-emerald-300 flex items-center gap-2">
              🎰 {closing ? 'סגירת ערב' : 'ניהול ערב חי'}
            </h2>
            <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
              <span>{closing ? 'הזן את הצ׳יפים הסופיים' : 'הקניות נשמרות אוטומטית'}</span>
              {hasActiveSession && (
                <span className="text-emerald-400">• ערב פעיל</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveSession && !closing && (
              <button onClick={handleStartFresh}
                className="rounded-lg border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-300 hover:bg-rose-900/50 hover:border-rose-700 transition flex items-center gap-1.5 font-bold" title="התחל ערב מחדש - מחיקת כל הנתונים">
                <Trash2 className="h-4 w-4" />
                <span>נקה הכל</span>
              </button>
            )}
            <button onClick={handleClose}
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 transition flex items-center gap-1.5 font-bold">
              <X className="h-4 w-4" />
              <span>סגור</span>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {!closing && (
            <>
              {hasActiveSession && (
                <div className="rounded-xl bg-blue-950/30 border border-blue-800/50 p-3 text-xs text-blue-300 flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>נשמר אוטומטית. אפשר לצאת ולחזור מתי שתרצה - הכל יישאר.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">תאריך</label>
                  <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">מארח</label>
                  <SearchableSelect
                    value={host}
                    onChange={setHost}
                    options={players}
                    placeholder="בחר..."
                  />
                </div>
              </div>

              {/* סיכום הקופה */}
              <div className="rounded-xl bg-gradient-to-br from-emerald-950/50 to-stone-900 border border-emerald-800/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-400">קופה כוללת</div>
                    <div className="text-3xl font-extrabold text-white tabular-nums">{totalPot} ₪</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-stone-400">שחקנים</div>
                    <div className="text-xl font-bold text-emerald-300">{participants.length}</div>
                    <div className="text-xs text-stone-500">סה״כ {participants.reduce((s, p) => s + p.buyIns, 0)} קניות</div>
                  </div>
                </div>
              </div>

              {/* רשימת השחקנים */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-stone-300">שחקנים פעילים</div>
                  <div className="flex items-center gap-2">
                    {participants.length > 1 && (
                      <button
                        onClick={() => setSortByAlphabet(!sortByAlphabet)}
                        className="text-xs rounded-md bg-stone-800 hover:bg-stone-700 border border-stone-700 px-2 py-1.5 text-stone-300 font-bold transition"
                        title={sortByAlphabet ? 'מיון לפי סדר רישום' : 'מיון לפי א"ב'}
                      >
                        {sortByAlphabet ? '🔤 לפי א"ב' : '🔢 סדר'}
                      </button>
                    )}
                    <button onClick={() => setShowAddPlayer(true)} disabled={availablePlayers.length === 0}
                      className="rounded-lg bg-amber-700 hover:bg-amber-600 px-3 py-1.5 text-xs text-white font-bold flex items-center gap-1 disabled:opacity-50">
                      <Plus className="h-3.5 w-3.5" /> הוסף שחקנים
                    </button>
                  </div>
                </div>
                
                {showAddPlayer && (
                  <div className="rounded-xl border border-amber-800 bg-stone-900 p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-stone-400">בחר שחקנים (מספר אנשים בו זמנית):</div>
                      <div className="text-xs text-amber-400 font-bold">{pendingAdditions.length} נבחרו</div>
                    </div>
                    {/* 🆕 הסבר סימונים - אם יש רישום פעיל */}
                    {registration?.entries && registration.entries.length > 0 && (
                      <div className="text-[10px] text-stone-500 mb-2 flex flex-wrap gap-x-3 gap-y-1">
                        <span>⭐ רשום למפגש (להכניס קודם)</span>
                        <span>⏳ סטנד-ביי</span>
                      </div>
                    )}
                    {/* 🆕 שדה חיפוש */}
                    <div className="relative mb-2">
                      <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                      <input
                        type="text"
                        value={playerSearch}
                        onChange={e => setPlayerSearch(e.target.value)}
                        placeholder="חיפוש שחקן..."
                        className="w-full rounded-md border border-stone-700 bg-stone-950 pr-8 pl-2 py-1.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 max-h-60 overflow-y-auto">
                      {(() => {
                        // 🆕 שחקנים רשומים מראש (מתוך טאב הרישום)
                        const registeredSet = new Set((registration?.entries || []).map(e => e.name));
                        const filtered = availablePlayers
                          .filter(p => !playerSearch || p.toLowerCase().includes(playerSearch.toLowerCase()));
                        // מיון: רשומים קודם, אחרי זה לפי סדר א-ב המקורי
                        const sorted = [...filtered].sort((a, b) => {
                          const aReg = registeredSet.has(a);
                          const bReg = registeredSet.has(b);
                          if (aReg && !bReg) return -1;
                          if (!aReg && bReg) return 1;
                          return 0;
                        });
                        return sorted.map(p => {
                          const isSelected = pendingAdditions.includes(p);
                          const isRegistered = registeredSet.has(p);
                          // מיקום ברשימת הרישום (1-11 רשמי, 12+ סטנד-ביי)
                          const regIdx = isRegistered ? 
                            (registration?.entries || []).findIndex(e => e.name === p) : -1;
                          const isStandby = regIdx >= 11;
                          return (
                            <button key={p} onClick={() => togglePending(p)}
                              className={`rounded-md px-2 py-2 text-sm transition flex items-center justify-center gap-1 relative ${
                                isSelected
                                  ? 'bg-amber-700 text-white font-bold ring-2 ring-amber-400'
                                  : isRegistered
                                    ? (isStandby
                                        ? 'bg-amber-950/50 text-amber-200 ring-1 ring-amber-700 hover:bg-amber-900/60'
                                        : 'bg-emerald-950/60 text-emerald-200 ring-1 ring-emerald-600 hover:bg-emerald-900/60')
                                    : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                              }`}>
                              {isSelected ? <Check className="h-3 w-3" /> : 
                                isRegistered ? (isStandby ? '⏳' : '⭐') : null}
                              <span>{p}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { cancelAddPlayers(); setPlayerSearch(''); }} className="flex-1 rounded-lg border border-stone-700 bg-stone-800 py-2 text-xs text-stone-300">ביטול</button>
                      <button onClick={() => { confirmAddPlayers(); setPlayerSearch(''); }} disabled={pendingAdditions.length === 0}
                        className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-sm text-white font-bold disabled:opacity-50">
                        הוסף {pendingAdditions.length > 0 ? `(${pendingAdditions.length})` : ''}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {participants.length === 0 && !showAddPlayer && (
                    <div className="text-center py-8 text-stone-500 text-sm border border-dashed border-stone-700 rounded-xl">
                      עדיין לא הוספת שחקנים. לחץ "הוסף שחקנים" כדי להתחיל.
                    </div>
                  )}
                  {(sortByAlphabet 
                    ? [...participants].sort((a, b) => a.name.localeCompare(b.name, 'he'))
                    : participants
                  ).map(p => {
                    const hasEarlyClose = typeof p.earlyClose === 'number';
                    return (
                    <div key={p.name} className={`rounded-xl border p-3 ${
                      hasEarlyClose 
                        ? 'border-stone-700 bg-stone-900/30 opacity-75' 
                        : 'border-stone-800 bg-stone-900/50'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-bold text-stone-100 flex items-center gap-2">
                            {p.name}
                            {hasEarlyClose && (
                              <span className="text-[10px] bg-purple-900/50 border border-purple-700/50 text-purple-300 rounded-full px-2 py-0.5 font-bold">
                                ✓ נסגר {p.earlyClose}₪
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500">{p.buyIns} {p.buyIns === 1 ? 'קניה' : 'קניות'} • {p.buyIns * 20} ₪</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => removeBuyIn(p.name)} disabled={p.buyIns <= 1 || hasEarlyClose}
                            className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-300 hover:text-rose-300 font-bold disabled:opacity-30">−</button>
                          <div className="w-12 text-center text-xl font-extrabold text-amber-300 tabular-nums">{p.buyIns * 20}</div>
                          <button onClick={() => addBuyIn(p.name)} disabled={hasEarlyClose}
                            className="w-9 h-9 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 font-bold disabled:opacity-30">+</button>
                          {/* 🆕 כפתור סגירה מוקדמת */}
                          <button 
                            onClick={() => setEarlyCloseModal({ name: p.name, currentChips: p.earlyClose ?? '' })}
                            title={hasEarlyClose ? 'ערוך צ׳יפים סופיים' : 'סגירה מוקדמת - שחקן עוזב'}
                            className={`ml-1 rounded-lg p-2 ${
                              hasEarlyClose 
                                ? 'text-purple-400 hover:bg-purple-950/30 bg-purple-950/20'
                                : 'text-stone-500 hover:text-purple-400 hover:bg-stone-800'
                            }`}>
                            {hasEarlyClose ? '📝' : '✋'}
                          </button>
                          <button onClick={() => removePlayer(p.name)} disabled={hasEarlyClose}
                            className="rounded-lg p-2 text-stone-600 hover:text-rose-400 hover:bg-stone-800 disabled:opacity-30">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>

              {/* 🧪 דגלי בדיקה */}
              {participants.length > 0 && (
                <div className="space-y-2">
                  <div className={`rounded-xl border p-3 transition ${isTestEvening ? 'border-yellow-700/70 bg-yellow-950/30' : 'border-stone-800 bg-stone-900/30'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isTestEvening}
                        onChange={e => setIsTestEvening(e.target.checked)}
                        className="w-5 h-5 rounded border-stone-600 bg-stone-800 cursor-pointer accent-yellow-500" />
                      <div className="flex-1">
                        <div className="font-bold text-stone-100 flex items-center gap-2 text-sm">
                          🧪 ערב ניסיון
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              alert('🧪 ערב ניסיון\n\nכשמסומן - הערב נשמר רגיל אבל לא נוצרות תזכורות תשלום בדשבורד של השחקנים.\n\nשימושי כשבודקים את האפליקציה ולא רוצים להפעיל תזכורות מזויפות לאנשים אחרים.');
                            }}
                            title="מה זה?"
                            className="rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-600 w-5 h-5 flex items-center justify-center text-xs text-stone-400 hover:text-yellow-400 font-bold">
                            ?
                          </button>
                          {isTestEvening && <span className="text-xs text-yellow-400 font-normal">(לא יוצר תזכורות)</span>}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          לא יוצר תזכורות תשלום בדשבורד של השחקנים
                        </div>
                      </div>
                    </label>
                  </div>
                  <div className={`rounded-xl border p-3 transition ${broadcastTestMode ? 'border-cyan-700/70 bg-cyan-950/30' : 'border-stone-800 bg-stone-900/30'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={broadcastTestMode}
                        onChange={e => setBroadcastTestMode(e.target.checked)}
                        className="w-5 h-5 rounded border-stone-600 bg-stone-800 cursor-pointer accent-cyan-500" />
                      <div className="flex-1">
                        <div className="font-bold text-stone-100 flex items-center gap-2 text-sm">
                          📡 מצב בדיקה לשידור חי
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              alert('📡 מצב בדיקה לשידור חי\n\nכשמסומן - השידור החי של הערב יוצג לכל המשתמשים גם אם:\n• היום לא יום אירוח לפי הלוח\n• השעה מחוץ ל-19:00-23:59\n\nשימושי לבדוק שהשידור עובד כמו שצריך.\n\nכשלא מסומן - שידור יוצג רק ביום אירוח ובין 19:00 ל-23:59 שעון ישראל.');
                            }}
                            title="מה זה?"
                            className="rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-600 w-5 h-5 flex items-center justify-center text-xs text-stone-400 hover:text-cyan-400 font-bold">
                            ?
                          </button>
                          {broadcastTestMode && <span className="text-xs text-cyan-400 font-normal">(שידור גם מחוץ לשעות אירוח)</span>}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          לבדיקת השידור החי גם כשהיום לא יום אירוח או השעה מחוץ ל-19:00-23:59
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {participants.length >= 2 && (
                <button onClick={handleStartClosing}
                  className="w-full rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3.5 font-bold text-white hover:from-emerald-500 hover:to-emerald-600 transition flex items-center justify-center gap-2">
                  <Check className="h-5 w-5" /> סיים ערב והכנס תוצאות
                </button>
              )}
            </>
          )}

          {closing && (
            <>
              <div className="rounded-xl bg-amber-950/30 border border-amber-800/50 p-3 text-sm text-amber-200">
                <div className="font-bold mb-1">⚠ הזן את הסכום הסופי של כל שחקן</div>
                <div className="text-xs text-amber-300/80">סה״כ הצ׳יפים שכל השחקנים מסיימים איתם חייב להיות שווה לקופה ({totalPot} ₪)</div>
              </div>

              <div className="space-y-2">
                {participants.map(p => {
                  const chips = Number(finalChips[p.name]) || 0;
                  const profit = chips - p.buyIns * 20;
                  const currentChips = Number(finalChips[p.name]) || 0;
                  return (
                    <div key={p.name} className="rounded-xl border border-stone-800 bg-stone-900/50 p-3 space-y-2">
                      {/* שורה 1: שם + השקעה + רווח */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-stone-100 text-base">{p.name}</div>
                          <div className="text-xs text-stone-500">השקעה: {p.buyIns * 20} ₪</div>
                        </div>
                        <div className={`text-lg font-extrabold tabular-nums whitespace-nowrap ${profit > 0 ? 'text-emerald-400' : profit < 0 ? 'text-rose-400' : 'text-stone-500'}`}>
                          {profit > 0 ? '+' : ''}{profit}
                        </div>
                      </div>
                      {/* שורה 2: כפתורים + שדה */}
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          type="button"
                          onClick={() => setFinalChips({...finalChips, [p.name]: Math.max(0, currentChips - 10)})}
                          className="w-11 h-10 flex-shrink-0 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 font-bold text-xl active:scale-95 transition"
                          title="הפחת 10">
                          −
                        </button>
                        <input 
                          type="number" 
                          value={finalChips[p.name]} 
                          onChange={e => setFinalChips({...finalChips, [p.name]: e.target.value})}
                          placeholder="0"
                          className="flex-1 max-w-[120px] rounded-lg border border-stone-700 bg-stone-800 px-2 py-2 text-white text-center text-base tabular-nums font-bold" />
                        <button 
                          type="button"
                          onClick={() => setFinalChips({...finalChips, [p.name]: currentChips + 10})}
                          className="w-11 h-10 flex-shrink-0 rounded-lg bg-amber-700 hover:bg-amber-600 border border-amber-600 text-white font-bold text-xl active:scale-95 transition"
                          title="הוסף 10">
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 💸 בלוק העברת אירוח */}
              <div className="rounded-xl border border-purple-800/50 bg-purple-950/20 p-3 space-y-3">
                <div className="font-bold text-purple-200 flex items-center gap-2">
                  🏠 העברת אירוח
                </div>
                <div>
                  <label className="block text-xs text-purple-300/80 mb-1.5">למי משלמים?</label>
                  <SearchableSelect
                    value={hostingRecipient}
                    onChange={setHostingRecipient}
                    options={participants.map(p => ({
                      value: p.name,
                      label: p.name === host ? `🏠 ${p.name} (מארח)` : `🍿 ${p.name}`
                    }))}
                    placeholder="❌ ללא תשלום אירוח"
                    allowEmpty
                    emptyLabel="❌ ללא תשלום אירוח"
                  />
                </div>
                {hostingRecipient && (
                  <div>
                    <label className="block text-xs text-purple-300/80 mb-1.5">סכום למשתתף:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        type="button"
                        onClick={() => setHostingAmount(50)}
                        className={`rounded-lg px-3 py-2 text-sm font-bold border transition ${
                          hostingAmount === 50 
                            ? 'bg-purple-600 text-white border-purple-500' 
                            : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
                        }`}>
                        50 ₪
                      </button>
                      <button 
                        type="button"
                        onClick={() => setHostingAmount(80)}
                        className={`rounded-lg px-3 py-2 text-sm font-bold border transition ${
                          hostingAmount === 80 
                            ? 'bg-purple-600 text-white border-purple-500' 
                            : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
                        }`}>
                        80 ₪ ⭐
                      </button>
                      <input 
                        type="number"
                        value={hostingAmount === 50 || hostingAmount === 80 ? '' : hostingAmount}
                        onChange={e => setHostingAmount(Number(e.target.value) || 0)}
                        placeholder="אחר"
                        className="rounded-lg border border-stone-700 bg-stone-800 px-2 py-2 text-white text-center text-sm tabular-nums" />
                    </div>
                    {hostingAmount > 0 && participants.length > 1 && (
                      <div className="mt-2 text-xs text-purple-300/80 text-center">
                        סה״כ: {hostingAmount} × {participants.length - 1} משתתפים = 
                        <span className="font-bold text-purple-200"> {hostingAmount * (participants.length - 1)} ₪</span>
                        {' → '}
                        <span className="font-bold text-purple-100">{hostingRecipient}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`rounded-xl border-2 p-3 ${isBalanced ? 'border-emerald-600 bg-emerald-950/30' : 'border-rose-700 bg-rose-950/30'}`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-bold ${isBalanced ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {isBalanced ? '✓ מאוזן! מוכן לשמירה' : `✗ פער של ${balance > 0 ? '+' : ''}${balance} ₪`}
                  </div>
                  <div className="text-xs text-stone-400">
                    {totalChipsOut} / {totalPot} ₪
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* כפתור חלוקת כספים - רק כשמאוזן */}
                {isBalanced && (
                  <button onClick={() => setSettlementOpen(true)}
                    className="w-full rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-3 font-bold text-white hover:from-amber-500 shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2">
                    💰 חלוקת כספים - הצגה ושיתוף
                  </button>
                )}
                
                <div className="flex gap-2">
                  <button onClick={() => setClosing(false)} className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-stone-300">חזור</button>
                  <button onClick={handleFinalSave} disabled={!isBalanced || savedEvening}
                    className="flex-1 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 font-bold text-white hover:from-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" /> {savedEvening ? '✓ נשמר' : 'שמור ערב'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 🆕 מודל סגירה מוקדמת של שחקן */}
      {earlyCloseModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" 
          onClick={() => setEarlyCloseModal(null)}>
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-purple-800/60 bg-gradient-to-br from-stone-900 to-stone-950 p-6 shadow-2xl" 
            onClick={e => e.stopPropagation()} dir="rtl">
            
            <div className="flex flex-col items-center text-center mb-4">
              <div className="text-3xl mb-2">✋</div>
              <h3 className="text-xl font-bold text-purple-200 mb-1">
                סגירת {earlyCloseModal.name}
              </h3>
              <p className="text-sm text-stone-400">
                {participants.find(p => p.name === earlyCloseModal.name && typeof p.earlyClose === 'number')
                  ? 'עדכן את הצ׳יפים הסופיים'
                  : 'השחקן עוזב באמצע - הזן את הצ׳יפים הסופיים שלו'}
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 font-bold">
                  צ׳יפים סופיים (השקעה: {(participants.find(p => p.name === earlyCloseModal.name)?.buyIns || 0) * 20} ₪)
                </label>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setEarlyCloseModal({
                      ...earlyCloseModal,
                      currentChips: Math.max(0, (Number(earlyCloseModal.currentChips) || 0) - 10)
                    })}
                    className="w-11 h-11 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 font-bold text-xl">−</button>
                  <input 
                    type="number"
                    autoFocus
                    value={earlyCloseModal.currentChips}
                    onChange={e => setEarlyCloseModal({...earlyCloseModal, currentChips: e.target.value})}
                    placeholder="0"
                    className="flex-1 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2.5 text-white text-center text-xl tabular-nums font-bold" />
                  <button 
                    type="button"
                    onClick={() => setEarlyCloseModal({
                      ...earlyCloseModal,
                      currentChips: (Number(earlyCloseModal.currentChips) || 0) + 10
                    })}
                    className="w-11 h-11 rounded-lg bg-purple-700 hover:bg-purple-600 border border-purple-600 text-white font-bold text-xl">+</button>
                </div>
              </div>
              
              {/* תצוגת רווח/הפסד */}
              {earlyCloseModal.currentChips !== '' && (() => {
                const player = participants.find(p => p.name === earlyCloseModal.name);
                if (!player) return null;
                const chips = Number(earlyCloseModal.currentChips) || 0;
                const profit = chips - player.buyIns * 20;
                return (
                  <div className={`rounded-lg p-2 text-center text-sm font-bold ${
                    profit > 0 ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40' :
                    profit < 0 ? 'bg-rose-900/40 text-rose-300 border border-rose-700/40' :
                    'bg-stone-800 text-stone-400 border border-stone-700'
                  }`}>
                    {profit > 0 ? `רווח: +${profit} ₪` : profit < 0 ? `הפסד: ${profit} ₪` : 'מאוזן'}
                  </div>
                );
              })()}
              
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setEarlyCloseModal(null)}
                  className="flex-1 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 px-4 py-2.5 font-bold text-stone-300">
                  ביטול
                </button>
                {/* כפתור הסר סגירה (אם כבר נסגר) */}
                {participants.find(p => p.name === earlyCloseModal.name && typeof p.earlyClose === 'number') && (
                  <button 
                    onClick={() => {
                      setParticipants(participants.map(p => 
                        p.name === earlyCloseModal.name 
                          ? { ...p, earlyClose: undefined }
                          : p
                      ));
                      setEarlyCloseModal(null);
                    }}
                    className="rounded-lg border border-rose-800/50 bg-rose-950/30 hover:bg-rose-950/50 px-3 py-2.5 font-bold text-rose-300 text-sm">
                    בטל סגירה
                  </button>
                )}
                <button 
                  onClick={() => {
                    const chips = Number(earlyCloseModal.currentChips);
                    if (isNaN(chips) || chips < 0) {
                      alert('הזן סכום תקין');
                      return;
                    }
                    setParticipants(participants.map(p => 
                      p.name === earlyCloseModal.name 
                        ? { ...p, earlyClose: chips }
                        : p
                    ));
                    setEarlyCloseModal(null);
                  }}
                  className="flex-1 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 px-4 py-2.5 font-bold text-white">
                  ✓ אישור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* מודל חלוקת כספים */}
      <SettlementModal 
        isOpen={settlementOpen} 
        onClose={() => setSettlementOpen(false)}
        participants={participants}
        finalChips={finalChips}
        host={host}
        sessionDate={sessionDate}
        totalPot={totalPot}
        onSaveEvening={handleSaveFromSettlement}
        alreadySaved={savedEvening} />

      {/* מודל אישור איפוס */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setResetConfirmOpen(false)}>
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-rose-800/60 bg-gradient-to-br from-stone-900 to-stone-950 p-6 shadow-2xl" 
            onClick={e => e.stopPropagation()} dir="rtl">
            
            <div className="flex flex-col items-center text-center mb-4">
              <div className="rounded-full bg-rose-900/30 border border-rose-700/50 p-3 mb-3">
                <AlertCircle className="h-8 w-8 text-rose-400" />
              </div>
              <h3 className="text-lg font-extrabold text-rose-200 mb-2">למחוק את הכל?</h3>
              <p className="text-sm text-stone-300 leading-relaxed">
                כל הקניות והנתונים של הערב הנוכחי יימחקו לצמיתות.
                <br/>
                <span className="text-rose-300 font-bold">זו פעולה שאי אפשר לבטל!</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setResetConfirmOpen(false)}
                className="flex-1 rounded-lg border border-stone-700 bg-stone-900 py-2.5 text-sm font-bold text-stone-300 hover:bg-stone-800">
                ביטול
              </button>
              <button onClick={handleConfirmReset}
                className="flex-1 rounded-lg bg-gradient-to-br from-rose-600 to-rose-700 py-2.5 text-sm font-bold text-white hover:from-rose-500 shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2">
                <Trash2 className="h-4 w-4" />
                כן, מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== מודל חלוקת כספים ושיתוף =====
const SettlementModal = ({ isOpen, onClose, participants, finalChips, host, sessionDate, totalPot, onSaveEvening, alreadySaved }) => {
  const shareCardRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  // חישוב תוצאות וחלוקה
  const { results, playerData, transfers } = useMemo(() => {
    if (!participants || participants.length === 0) return { results: {}, playerData: [], transfers: [] };
    
    const results = {};
    const playerData = participants.map(p => {
      const chips = Number(finalChips[p.name]) || 0;
      const buyIn = p.buyIns * 20;
      const profit = chips - buyIn;
      results[p.name] = profit;
      return {
        name: p.name,
        buyIns: p.buyIns,
        buyInAmount: buyIn,
        finalChips: chips,
        profit
      };
    }).sort((a, b) => b.profit - a.profit);

    const transfers = calculateSettlements(results);
    return { results, playerData, transfers };
  }, [participants, finalChips]);

  const totalProfit = Object.values(results).reduce((s, v) => s + v, 0);
  const isBalanced = Math.abs(totalProfit) < 0.01;

  // הורדת תמונה
  const handleDownload = async () => {
    if (!shareCardRef.current) return;
    setSharing(true);
    try {
      // טעינת html2canvas דינמית
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const canvas = await window.html2canvas(shareCardRef.current, {
        backgroundColor: '#041810',
        scale: 2,
        logging: false,
        useCORS: true
      });

      canvas.toBlob(async (blob) => {
        const fileName = `פוקר_ברבורי_${sessionDate}.png`;
        
        // נסיון שיתוף native (מוביל לוואטסאפ)
        if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
          try {
            await navigator.share({
              files: [new File([blob], fileName, { type: 'image/png' })],
              title: 'חלוקת כספים - פוקר ברבורי תל מונד'
            });
            setSharing(false);
            return;
          } catch (e) {
            // אם ביטל - נוריד את הקובץ
          }
        }

        // fallback - הורדת קובץ
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSharing(false);
      }, 'image/png');
    } catch (e) {
      console.error('Failed to generate image:', e);
      alert('שגיאה ביצירת התמונה');
      setSharing(false);
    }
  };

  if (!isOpen) return null;

  const sessionDateObj = new Date(sessionDate);
  const dateStr = sessionDateObj.toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-lg my-4" onClick={e => e.stopPropagation()} dir="rtl">
        
        {/* כפתור סגירה */}
        <button onClick={onClose} 
          className="absolute -top-2 -left-2 z-10 rounded-full bg-stone-800 border border-stone-700 p-2 text-stone-300 hover:bg-stone-700 shadow-lg">
          <X className="h-5 w-5" />
        </button>

        {/* הכרטיס לשיתוף */}
        <div ref={shareCardRef} className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'radial-gradient(ellipse at center, #0f5132 0%, #0a3520 50%, #041810 100%)' }}>
          
          {/* כותרת */}
          <div className="text-center py-5 px-4 border-b border-amber-900/30"
            style={{ background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.05) 0%, transparent 100%)' }}>
            <div className="text-4xl mb-1">🃏</div>
            <div className="text-xs text-amber-300/80 tracking-[0.2em] font-bold mb-1">פוקר ברבורי תל מונד</div>
            <div className="text-lg font-extrabold text-amber-200">חלוקת כספים</div>
            <div className="text-xs text-stone-300 mt-1">{dateStr}</div>
            {host && <div className="text-xs text-emerald-300 mt-0.5">🏠 מארח: {host}</div>}
          </div>

          {/* טבלת תוצאות */}
          <div className="p-4">
            <div className="text-xs text-amber-300/80 font-bold tracking-wider uppercase mb-2 text-center">📊 סיכום הערב</div>
            <div className="rounded-xl bg-black/30 border border-stone-700/50 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-amber-950/40 border-b border-stone-700/50 text-xs font-bold text-amber-200">
                <div>שחקן</div>
                <div className="w-12 text-center">קניות</div>
                <div className="w-14 text-center">החזר</div>
                <div className="w-16 text-center">סופי</div>
              </div>
              {playerData.map((p, i) => (
                <div key={p.name} className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 text-sm ${
                  i % 2 === 0 ? 'bg-black/20' : 'bg-black/10'
                }`}>
                  <div className="font-bold text-stone-100">{p.name}</div>
                  <div className="w-12 text-center text-stone-400 tabular-nums">{p.buyInAmount}</div>
                  <div className="w-14 text-center text-stone-300 tabular-nums">{p.finalChips}</div>
                  <div className={`w-16 text-center font-extrabold tabular-nums ${
                    p.profit > 0 ? 'text-emerald-400' : p.profit < 0 ? 'text-rose-400' : 'text-stone-500'
                  }`}>
                    {p.profit > 0 ? '+' : ''}{p.profit}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 bg-amber-950/30 border-t border-stone-700/50 text-xs text-amber-200 font-bold">
                <div>קופה כוללת</div>
                <div className="text-center tabular-nums">{totalPot} ₪</div>
              </div>
            </div>
          </div>

          {/* חלוקת העברות */}
          {transfers.length > 0 && (
            <div className="px-4 pb-4">
              <div className="text-xs text-amber-300/80 font-bold tracking-wider uppercase mb-2 text-center">
                💸 העברות ({transfers.length})
              </div>
              <div className="space-y-1.5">
                {transfers.map((t, i) => (
                  <div key={i} className="rounded-lg bg-gradient-to-r from-rose-950/30 via-stone-900/50 to-emerald-950/30 border border-stone-700/40 px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-rose-300">{t.from}</span>
                      <span className="text-stone-400">←</span>
                      <span className="font-bold text-emerald-300">{t.to}</span>
                    </div>
                    <div className="text-base font-extrabold text-amber-300 tabular-nums">
                      {t.amount} ₪
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* אישור איזון */}
          <div className="px-4 pb-4">
            <div className={`rounded-lg border px-3 py-2 text-xs font-bold text-center ${
              isBalanced 
                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
            }`}>
              {isBalanced ? '✓ הכל מאוזן - סה״כ העברות: ' + transfers.reduce((s, t) => s + t.amount, 0) + ' ₪' : '⚠ חוסר איזון!'}
            </div>
          </div>

          {/* חתימה */}
          <div className="text-center py-3 px-4 bg-black/30 border-t border-amber-900/20">
            <div className="text-xs text-amber-300/60 tracking-widest">♠ BARBUR AI ♠</div>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div className="mt-4 space-y-2">
          {/* 🆕 כפתור שמירה - מוצג כשהפונקציה זמינה */}
          {onSaveEvening && (
            <button 
              onClick={onSaveEvening} 
              disabled={alreadySaved || !isBalanced}
              className={`w-full rounded-lg px-4 py-3 font-bold flex items-center justify-center gap-2 transition ${
                alreadySaved 
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed' 
                  : !isBalanced
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white hover:from-emerald-500 shadow-lg shadow-emerald-900/40'
              }`}>
              <Check className="h-4 w-4" /> 
              {alreadySaved ? '✓ נשמר' : !isBalanced ? 'לא מאוזן - לא ניתן לשמור' : 'שמור ערב'}
            </button>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onClose}
              className="rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-stone-300 hover:bg-stone-800 font-bold">
              סגור
            </button>
            <button onClick={handleDownload} disabled={sharing}
              className="rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-3 font-bold text-white hover:from-amber-500 shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 disabled:opacity-50">
              {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {sharing ? 'מכין...' : 'שתף / הורד'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// ===== טאב טבלאות תקופתיות =====
const getDayKey = (dateStr) => {
  // YYYY-MM-DD - שומר תאריך מלא
  return dateStr;
};

// 🛡️ פיצול מחרוזת התאריך ישירות - מונע בעיות Timezone של new Date()
// בנוסף - אם יש session עם season, מעדיפים את ה-season על השנה מהתאריך
// (זה מטפל בערבים שגויים שיש להם date='2024-01-13' אבל season=2025)
const getMonthKey = (dateStr, session) => {
  const [y, m] = dateStr.split('-');
  const year = session?.season || y;
  return `${year}-${m}`;
};

const getQuarterKey = (dateStr, session) => {
  const [y, m] = dateStr.split('-');
  const month = parseInt(m, 10);
  const q = Math.ceil(month / 3);
  const year = session?.season || y;
  return `${year}-Q${q}`;
};

const getHalfKey = (dateStr, session) => {
  const [y, m] = dateStr.split('-');
  const month = parseInt(m, 10);
  const h = month <= 6 ? 1 : 2;
  const year = session?.season || y;
  return `${year}-H${h}`;
};

const getYearKey = (dateStr, session) => {
  const y = dateStr.split('-')[0];
  return `${session?.season || y}`;
};
const getYearLabel = (key) => key;

const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const HEBREW_MONTHS_SHORT = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

const getDayLabel = (key) => {
  // מ-YYYY-MM-DD → DD/MMM (לדוגמה: 23/אפר)
  const parts = key.split('-');
  if (parts.length < 3) return key;
  const [y, m, d] = parts;
  return `${parseInt(d)}/${HEBREW_MONTHS_SHORT[parseInt(m) - 1] || m}`;
};

const getMonthLabel = (key) => {
  const [y, m] = key.split('-');
  return HEBREW_MONTHS[parseInt(m) - 1];
};

const getQuarterLabel = (key) => {
  const [y, q] = key.split('-');
  return q;
};

const getHalfLabel = (key) => {
  const [y, h] = key.split('-');
  return h;
};

const aggregateByPeriod = (sessions, players, keyFn) => {
  // מקבץ תוצאות לפי תקופה
  // byPeriod[periodKey][playerName] = sum (יכול להיות 0 אם השתתף בתיקו)
  // participated[periodKey][playerName] = true (אם השתתף לפחות פעם אחת בתקופה)
  const byPeriod = {};
  const participated = {};
  const allKeys = new Set();
  
  sessions.forEach(s => {
    // 🛡️ העברת ה-session המלא לפונקציה כדי שתוכל להשתמש ב-season אם קיים
    const key = keyFn(s.date, s);
    allKeys.add(key);
    if (!byPeriod[key]) byPeriod[key] = {};
    if (!participated[key]) participated[key] = {};
    Object.entries(s.results || {}).forEach(([name, amount]) => {
      byPeriod[key][name] = (byPeriod[key][name] || 0) + amount;
      participated[key][name] = true; // השתתף - גם אם התוצאה 0
    });
  });
  
  const sortedKeys = Array.from(allKeys).sort();
  return { sortedKeys, byPeriod, participated };
};

// ===== 🏆 אלופים - חישוב MVP חודשי, רבעוני, ושנתי =====
const ChampionsTab = ({ allSessions, hostingSchedule = [], userQuotes = [], quoteLikes = {}, allQuotes = [], deletedQuoteIds = [] }) => {
  const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  
  // זיהוי כל השנים הזמינות
  const availableYears = useMemo(() => {
    const years = new Set(allSessions.map(s => s.season || new Date(s.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [allSessions]);
  
  const currentYear = new Date().getFullYear();
  
  // 🆕 שנים נבחרות לאלוף השנה (בחירה מרובה)
  const [yearChampionYears, setYearChampionYears] = useState([]);
  // 🆕 בורר שנה לרבעונים (בחירה יחידה)
  const [quartersYear, setQuartersYear] = useState(currentYear);
  // 🆕 בורר שנה לחודשים (בחירה יחידה)
  const [monthsYear, setMonthsYear] = useState(currentYear);
  
  // אתחול ראשוני
  useEffect(() => {
    if (availableYears.length > 0) {
      // אלוף השנה - דיפולט שנה נוכחית
      if (yearChampionYears.length === 0) {
        const initial = availableYears.includes(currentYear) ? currentYear : availableYears[0];
        setYearChampionYears([initial]);
      }
      // רבעונים - דיפולט שנה נוכחית
      if (!availableYears.includes(quartersYear)) {
        setQuartersYear(availableYears.includes(currentYear) ? currentYear : availableYears[0]);
      }
      // חודשים - דיפולט שנה נוכחית
      if (!availableYears.includes(monthsYear)) {
        setMonthsYear(availableYears.includes(currentYear) ? currentYear : availableYears[0]);
      }
    }
  }, [availableYears.join(',')]);
  
  // 🆕 toggle של שנה לאלוף - אם הכל דלוק, לחיצה משאירה רק אותה. אחרת מוסיף/מסיר
  const toggleChampionYear = (year) => {
    if (yearChampionYears.includes(year)) {
      // הסרה - אם זאת האחרונה, להחזיר לשנה הנוכחית
      const filtered = yearChampionYears.filter(y => y !== year);
      setYearChampionYears(filtered.length === 0 ? [currentYear] : filtered);
    } else {
      setYearChampionYears([...yearChampionYears, year]);
    }
  };
  
  // חישוב פונקציה כללית - מי האלוף בסשנים נתונים
  const computeMVP = (sessions) => {
    if (sessions.length === 0) return null;
    const totals = {};
    sessions.forEach(s => {
      Object.entries(s.results || {}).forEach(([name, amount]) => {
        totals[name] = (totals[name] || 0) + Number(amount);
      });
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const [winner, profit] = sorted[0];
    return { name: winner, profit };
  };
  
  // 🏆 אלוף השנים הנבחרות
  const yearChampion = useMemo(() => {
    if (yearChampionYears.length === 0) return null;
    const sessions = allSessions.filter(s => {
      const y = s.season || new Date(s.date).getFullYear();
      return yearChampionYears.includes(y);
    });
    if (sessions.length === 0) return null;
    
    // האם השנה האחרונה הסתיימה?
    const today = new Date();
    const isMultiYear = yearChampionYears.length > 1;
    const includesCurrentYear = yearChampionYears.includes(currentYear);
    const finished = !includesCurrentYear; // אם לא כולל השנה הנוכחית - הסתיים
    
    const mvp = computeMVP(sessions);
    if (!mvp) return null;
    
    return { 
      ...mvp, 
      sessions: sessions.length,
      finished,
      isMultiYear,
      yearsLabel: isMultiYear 
        ? yearChampionYears.sort((a,b) => a-b).join(', ')
        : yearChampionYears[0]
    };
  }, [allSessions, yearChampionYears, currentYear]);
  
  // 🏆 רבעונים לשנה הנבחרת
  const quarterlyMVPs = useMemo(() => {
    const yearSessions = allSessions.filter(s => (s.season || new Date(s.date).getFullYear()) === quartersYear);
    const today = new Date();
    const isCurrentYear = quartersYear === currentYear;
    
    const result = [];
    for (let q = 0; q < 4; q++) {
      const startMonth = q * 3;
      const endMonth = startMonth + 2;
      const qSessions = yearSessions.filter(s => {
        const m = new Date(s.date).getMonth();
        return m >= startMonth && m <= endMonth;
      });
      if (qSessions.length === 0) continue;
      const qEndDate = new Date(quartersYear, endMonth + 1, 0);
      const isQuarterFinished = !isCurrentYear || qEndDate < today;
      const mvp = computeMVP(qSessions);
      if (isQuarterFinished && mvp) {
        result.push({ 
          quarter: q + 1,
          ...mvp, 
          sessions: qSessions.length 
        });
      }
    }
    return result;
  }, [allSessions, quartersYear, currentYear]);
  
  // ⭐ חודשים לשנה הנבחרת
  const monthlyMVPs = useMemo(() => {
    const yearSessions = allSessions.filter(s => (s.season || new Date(s.date).getFullYear()) === monthsYear);
    const today = new Date();
    const isCurrentYear = monthsYear === currentYear;
    
    const result = [];
    for (let m = 0; m < 12; m++) {
      const monthSessions = yearSessions.filter(s => new Date(s.date).getMonth() === m);
      if (monthSessions.length === 0) continue;
      const monthDate = new Date(monthsYear, m + 1, 0);
      const isMonthFinished = !isCurrentYear || monthDate < today;
      const mvp = computeMVP(monthSessions);
      if (isMonthFinished && mvp) {
        result.push({ 
          monthIdx: m,
          month: HEBREW_MONTHS[m], 
          ...mvp, 
          sessions: monthSessions.length 
        });
      }
    }
    return result;
  }, [allSessions, monthsYear, currentYear]);
  
  // צבעי סרטים מחזוריים לחודשים
  const RIBBON_COLORS = ['#dc2626', '#2563eb', '#10b981', '#a855f7', '#f97316', '#ec4899', '#14b8a6', '#eab308', '#6366f1', '#84cc16', '#f43f5e', '#06b6d4'];
  
  // 🌟 חביב הקהל - 3 קטגוריות (רק לשנה הנוכחית)
  const popularityChampions = useMemo(() => {
    const yearSessions = allSessions.filter(s => (s.season || new Date(s.date).getFullYear()) === currentYear);
    
    // 1. הכי הרבה ציטוטים השנה הנוכחית
    const combinedQuotes = [...allQuotes, ...userQuotes].filter(q => !deletedQuoteIds.includes(q.id));
    const quoteCounts = {};
    combinedQuotes.forEach(q => {
      // שנת הציטוט - תומך ב-DD.MM.YYYY (פורמט הציטוטים) וגם createdAt
      let year = null;
      if (q.date && typeof q.date === 'string') {
        const parts = q.date.split('.');
        if (parts.length === 3) {
          year = parseInt(parts[2]);
        }
      }
      if (!year && q.createdAt) {
        year = new Date(q.createdAt).getFullYear();
      }
      if (year !== currentYear) return;
      const quoter = q.quoted || q.who;
      if (quoter) quoteCounts[quoter] = (quoteCounts[quoter] || 0) + 1;
    });
    const topQuoted = Object.entries(quoteCounts).sort((a, b) => b[1] - a[1])[0];
    
    // 2. הכי הרבה אירוחים השנה
    const hostCounts = {};
    (hostingSchedule || []).forEach(h => {
      if (!h.date || !h.host) return;
      const d = new Date(h.date);
      if (d.getFullYear() !== currentYear) return;
      // רק אירוחים שעברו (לא עתידיים)
      const today = new Date();
      if (d > today) return;
      hostCounts[h.host] = (hostCounts[h.host] || 0) + 1;
    });
    const topHost = Object.entries(hostCounts).sort((a, b) => b[1] - a[1])[0];
    
    // 3. הכי הרבה נוכחות במפגשים השנה
    const attendanceCounts = {};
    yearSessions.forEach(s => {
      Object.keys(s.results || {}).forEach(name => {
        attendanceCounts[name] = (attendanceCounts[name] || 0) + 1;
      });
    });
    const topAttender = Object.entries(attendanceCounts).sort((a, b) => b[1] - a[1])[0];
    
    return {
      topQuoted: topQuoted ? { name: topQuoted[0], count: topQuoted[1] } : null,
      topHost: topHost ? { name: topHost[0], count: topHost[1] } : null,
      topAttender: topAttender ? { name: topAttender[0], count: topAttender[1] } : null,
    };
  }, [allSessions, userQuotes, allQuotes, deletedQuoteIds, hostingSchedule, currentYear]);
  
  // 📈 השחקן המשתפר - השוואת רווח השנה (מצטבר עד היום) מול רווח באותה תקופה אשתקד
  const mostImproved = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // השנה - מתחילת השנה עד היום
    const thisYearSessions = allSessions.filter(s => {
      const d = new Date(s.date);
      return d.getFullYear() === currentYear;
    });
    
    // שנה שעברה - אותה תקופה (1 בינואר עד אותו יום בשנה)
    const lastYear = currentYear - 1;
    const cutoffLastYear = new Date(lastYear, 0, dayOfYear);
    const lastYearSessions = allSessions.filter(s => {
      const d = new Date(s.date);
      return d.getFullYear() === lastYear && d <= cutoffLastYear;
    });
    
    if (thisYearSessions.length === 0 || lastYearSessions.length === 0) return null;
    
    // חישוב רווחים
    const thisYearTotals = {};
    thisYearSessions.forEach(s => {
      Object.entries(s.results || {}).forEach(([name, amount]) => {
        thisYearTotals[name] = (thisYearTotals[name] || 0) + Number(amount);
      });
    });
    
    const lastYearTotals = {};
    lastYearSessions.forEach(s => {
      Object.entries(s.results || {}).forEach(([name, amount]) => {
        lastYearTotals[name] = (lastYearTotals[name] || 0) + Number(amount);
      });
    });
    
    // מי שיחק בשתי השנים?
    const playedBoth = Object.keys(thisYearTotals).filter(name => name in lastYearTotals);
    if (playedBoth.length === 0) return null;
    
    // השיפור הגדול ביותר
    const improvements = playedBoth.map(name => ({
      name,
      thisYear: thisYearTotals[name],
      lastYear: lastYearTotals[name],
      improvement: thisYearTotals[name] - lastYearTotals[name],
    })).sort((a, b) => b.improvement - a.improvement);
    
    if (improvements.length === 0 || improvements[0].improvement <= 0) return null;
    
    return improvements[0];
  }, [allSessions, currentYear]);
  
  if (availableYears.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500">
        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <div>אין נתונים זמינים</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* 👑 ריבוע אלוף השנה - בחירה מרובה */}
      <div>
        {/* בורר שנים - בחירה מרובה */}
        <div className="rounded-xl border border-amber-900/40 bg-stone-950/80 backdrop-blur p-2 mb-3">
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <span className="text-[10px] text-amber-700 font-bold ml-1">SEASON</span>
            {availableYears.map(y => (
              <button
                key={y}
                onClick={() => toggleChampionYear(y)}
                className={`rounded px-2.5 py-1 text-xs font-bold border tabular-nums transition ${
                  yearChampionYears.includes(y)
                    ? 'bg-amber-700 border-amber-500 text-white shadow-lg shadow-amber-900/40'
                    : 'bg-stone-900 border-stone-700 text-stone-400 hover:bg-stone-800'
                }`}>
                {y}
              </button>
            ))}
          </div>
          {yearChampionYears.length > 1 && (
            <div className="text-center text-[10px] text-amber-400 mt-1.5">
              מחושב על פני {yearChampionYears.length} שנים
            </div>
          )}
        </div>
        
        {yearChampion ? (
          <div style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #92400e 25%, #fbbf24 50%, #92400e 75%, #fbbf24 100%)',
            backgroundSize: '200% 200%',
            padding: '3px',
            borderRadius: '1.5rem',
            animation: 'shimmer 4s linear infinite',
          }}>
            <div className="rounded-[1.4rem] py-6 px-4 text-center relative overflow-hidden" style={{
              background: 'radial-gradient(ellipse at top, rgba(251,191,36,0.2) 0%, transparent 60%), linear-gradient(180deg, rgba(45,24,16,0.9) 0%, rgba(0,0,0,0.95) 100%)',
              border: '2px solid rgba(251,191,36,0.4)',
            }}>
              <div className="text-[10px] text-amber-500 font-bold tracking-[0.4em] mb-1">★ ★ ★</div>
              <div className="text-[11px] text-amber-400 font-bold tracking-widest mb-3">
                {yearChampion.finished ? 'CHAMPION' : 'LEADING'} {yearChampion.yearsLabel}
              </div>
              
              <div className="relative inline-block" style={{ filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.7)) drop-shadow(0 0 60px rgba(251,191,36,0.4))' }}>
                <svg width="160" height="200" viewBox="0 0 160 200">
                  <defs>
                    <linearGradient id="megaGold" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="#fffbeb"/>
                      <stop offset="15%" stopColor="#fef3c7"/>
                      <stop offset="35%" stopColor="#fbbf24"/>
                      <stop offset="65%" stopColor="#d97706"/>
                      <stop offset="100%" stopColor="#451a03"/>
                    </linearGradient>
                    <linearGradient id="megaShine" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.6"/>
                      <stop offset="50%" stopColor="#fffbeb" stopOpacity="0.1"/>
                      <stop offset="100%" stopColor="#fffbeb" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="baseGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="#92400e"/>
                      <stop offset="50%" stopColor="#451a03"/>
                      <stop offset="100%" stopColor="#1c0a01"/>
                    </linearGradient>
                    {/* clipPath עגול לתמונת השחקן בתוך הגביע */}
                    <clipPath id="trophyAvatarClip">
                      <circle cx="80" cy="82" r="32"/>
                    </clipPath>
                  </defs>
                  
                  {/* ידיות הגביע */}
                  <path d="M 25 65 Q 10 60 10 80 Q 10 100 25 100" fill="none" stroke="url(#megaGold)" strokeWidth="9" strokeLinecap="round"/>
                  <path d="M 135 65 Q 150 60 150 80 Q 150 100 135 100" fill="none" stroke="url(#megaGold)" strokeWidth="9" strokeLinecap="round"/>
                  
                  {/* גוף הגביע */}
                  <path d="M 35 35 L 125 35 L 122 100 Q 122 130 80 138 Q 38 130 38 100 Z" fill="url(#megaGold)"/>
                  
                  {/* פתח הגביע */}
                  <ellipse cx="80" cy="35" rx="48" ry="9" fill="url(#megaGold)"/>
                  <ellipse cx="80" cy="32" rx="48" ry="4" fill="#fef3c7" opacity="0.9"/>
                  <ellipse cx="80" cy="35" rx="44" ry="3" fill="#92400e" opacity="0.4"/>
                  
                  {/* תכשיטים בפתח */}
                  <circle cx="50" cy="28" r="4" fill="url(#megaGold)" stroke="#92400e" strokeWidth="0.5"/>
                  <circle cx="65" cy="22" r="4" fill="url(#megaGold)" stroke="#92400e" strokeWidth="0.5"/>
                  <circle cx="80" cy="18" r="6" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
                  <circle cx="80" cy="18" r="3" fill="#fbbf24"/>
                  <circle cx="95" cy="22" r="4" fill="url(#megaGold)" stroke="#92400e" strokeWidth="0.5"/>
                  <circle cx="110" cy="28" r="4" fill="url(#megaGold)" stroke="#92400e" strokeWidth="0.5"/>
                  
                  {/* 🖼️ תמונת האלוף בתוך הגביע (רק לשנים שהסתיימו ובחירת שנה אחת) */}
                  {yearChampion.finished && yearChampionYears.length === 1 && PLAYER_AVATARS[yearChampion.name] ? (
                    <>
                      {/* רקע כהה מאחורי התמונה (לבליטה) */}
                      <circle cx="80" cy="82" r="34" fill="#1c0a01"/>
                      {/* התמונה עצמה */}
                      <image
                        href={`data:image/jpeg;base64,${PLAYER_AVATARS[yearChampion.name]}`}
                        x="48" y="50" width="64" height="64"
                        clipPath="url(#trophyAvatarClip)"
                        preserveAspectRatio="xMidYMid slice"
                      />
                      {/* טבעת זהב מסביב לתמונה */}
                      <circle cx="80" cy="82" r="32" fill="none" stroke="url(#megaGold)" strokeWidth="3"/>
                      <circle cx="80" cy="82" r="32" fill="none" stroke="#fef3c7" strokeWidth="0.5" opacity="0.8"/>
                    </>
                  ) : (
                    <>
                      {/* גימור gradient רק כשאין תמונה */}
                      <path d="M 35 35 L 125 35 L 122 100 Q 122 130 80 138 Q 38 130 38 100 Z" fill="url(#megaShine)"/>
                      <text x="80" y="88" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="22" fontWeight="800" fill="#451a03">★</text>
                    </>
                  )}
                  
                  {/* בסיס הגביע */}
                  <rect x="65" y="138" width="30" height="12" fill="url(#megaGold)"/>
                  <rect x="65" y="138" width="30" height="3" fill="#fef3c7" opacity="0.7"/>
                  
                  <path d="M 45 150 L 115 150 L 110 165 L 50 165 Z" fill="url(#megaGold)"/>
                  <rect x="40" y="165" width="80" height="14" rx="3" fill="url(#megaGold)"/>
                  <rect x="35" y="179" width="90" height="10" rx="2" fill="url(#baseGrad)"/>
                  
                  {/* הילות בוהק - רק כשאין תמונה (כדי לא להפריע לתמונה) */}
                  {!(yearChampion.finished && yearChampionYears.length === 1 && PLAYER_AVATARS[yearChampion.name]) && (
                    <>
                      <ellipse cx="60" cy="65" rx="12" ry="30" fill="url(#megaShine)" opacity="0.7"/>
                      <ellipse cx="100" cy="80" rx="6" ry="20" fill="url(#megaShine)" opacity="0.5"/>
                    </>
                  )}
                </svg>
              </div>
              
              {/* שם וסטטיסטיקות - רק לשנים שהסתיימו, או למצב מולטי-שנה */}
              {yearChampion.finished ? (
                <>
                  <div className="text-4xl font-extrabold mt-3" style={{
                    fontFamily: 'Cinzel, serif',
                    background: 'linear-gradient(180deg, #fef3c7 0%, #fbbf24 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    letterSpacing: '0.05em',
                  }}>
                    {yearChampion.name}
                  </div>
                  <div className="text-base text-amber-300 font-bold tabular-nums mt-1">
                    {yearChampion.profit > 0 ? '+' : ''}{yearChampion.profit}₪
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1 tracking-widest">
                    {yearChampion.sessions} MEETINGS
                  </div>
                </>
              ) : (
                <div className="mt-3 mb-1">
                  <div className="text-2xl font-extrabold" style={{
                    fontFamily: 'Cinzel, serif',
                    background: 'linear-gradient(180deg, #fef3c7 0%, #fbbf24 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    letterSpacing: '0.05em',
                  }}>
                    טרם נקבע
                  </div>
                  <div className="text-[11px] text-stone-500 mt-2 tracking-widest">
                    THE THRONE AWAITS
                  </div>
                </div>
              )}
              
              <div className="text-[10px] text-amber-500 font-bold tracking-[0.4em] mt-3">★ ★ ★</div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-700 bg-stone-900/50 p-6 text-center text-stone-500">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-40" />
            אין נתונים לשנים שנבחרו
          </div>
        )}
      </div>
      
      {/* 🏆 קרוסלת רבעונים */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2 gap-2">
          <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
            🏆 גביעים רבעוניים
          </h3>
          <select
            value={quartersYear}
            onChange={e => setQuartersYear(Number(e.target.value))}
            className="rounded-md bg-stone-900 border border-blue-700/40 px-2 py-1 text-xs text-blue-200 font-bold tabular-nums focus:outline-none focus:border-blue-500">
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {quarterlyMVPs.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            {quarterlyMVPs.map(q => (
              <div key={q.quarter} className="rounded-xl p-3 text-center w-44 shrink-0" style={{
                scrollSnapAlign: 'center',
                background: 'radial-gradient(ellipse at top, rgba(59,130,246,0.15) 0%, transparent 70%), linear-gradient(180deg, rgba(28,25,23,0.85) 0%, rgba(0,0,0,0.95) 100%)',
                border: '1px solid rgba(59,130,246,0.3)',
              }}>
                <div className="text-[10px] text-blue-400 font-bold tracking-widest mb-1">Q{q.quarter} - רבעון {q.quarter}</div>
                <div className="inline-block my-1" style={{ filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.6)) drop-shadow(0 0 24px rgba(59,130,246,0.3))' }}>
                  <svg width="60" height="75" viewBox="0 0 60 75">
                    <defs>
                      <linearGradient id={`blueQ${q.quarter}_${quartersYear}`} x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#dbeafe"/>
                        <stop offset="30%" stopColor="#60a5fa"/>
                        <stop offset="70%" stopColor="#2563eb"/>
                        <stop offset="100%" stopColor="#1e3a8a"/>
                      </linearGradient>
                    </defs>
                    <ellipse cx="10" cy="30" rx="5" ry="12" fill="none" stroke={`url(#blueQ${q.quarter}_${quartersYear})`} strokeWidth="3" strokeLinecap="round"/>
                    <ellipse cx="50" cy="30" rx="5" ry="12" fill="none" stroke={`url(#blueQ${q.quarter}_${quartersYear})`} strokeWidth="3" strokeLinecap="round"/>
                    <path d="M 14 13 L 46 13 L 44 38 Q 44 48 30 50 Q 16 48 16 38 Z" fill={`url(#blueQ${q.quarter}_${quartersYear})`}/>
                    <ellipse cx="30" cy="13" rx="17" ry="3" fill={`url(#blueQ${q.quarter}_${quartersYear})`}/>
                    <ellipse cx="22" cy="22" rx="3" ry="10" fill="#dbeafe" opacity="0.6"/>
                    <rect x="25" y="50" width="10" height="5" fill={`url(#blueQ${q.quarter}_${quartersYear})`}/>
                    <path d="M 18 55 L 42 55 L 40 62 L 20 62 Z" fill={`url(#blueQ${q.quarter}_${quartersYear})`}/>
                    <rect x="15" y="62" width="30" height="5" rx="1" fill={`url(#blueQ${q.quarter}_${quartersYear})`}/>
                    <text x="30" y="35" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="11" fontWeight="800" fill="#1e3a8a">Q{q.quarter}</text>
                  </svg>
                </div>
                {/* תמונה ענקית */}
                {PLAYER_AVATARS[q.name] && (
                  <div className="flex justify-center my-2">
                    <PlayerAvatar name={q.name} size={130} />
                  </div>
                )}
                <div className="text-base font-extrabold text-blue-100 mt-1 truncate">
                  {q.name}
                </div>
                <div className="text-[11px] text-blue-300 tabular-nums font-bold">{q.profit > 0 ? '+' : ''}{q.profit}₪</div>
                <div className="text-[9px] text-stone-500">{q.sessions} מפגשים</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-stone-700 bg-stone-900/30 p-4 text-center text-stone-500 text-xs">
            אין רבעונים שהסתיימו ב-{quartersYear}
          </div>
        )}
      </div>
      
      {/* ⭐ קרוסלת חודשים */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2 gap-2">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            ⭐ MVP חודשי
          </h3>
          <select
            value={monthsYear}
            onChange={e => setMonthsYear(Number(e.target.value))}
            className="rounded-md bg-stone-900 border border-amber-700/40 px-2 py-1 text-xs text-amber-200 font-bold tabular-nums focus:outline-none focus:border-amber-500">
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {monthlyMVPs.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            {monthlyMVPs.map(m => {
              const ribbonColor = RIBBON_COLORS[m.monthIdx];
              return (
                <div key={m.monthIdx} className="rounded-xl p-3 text-center w-40 shrink-0" style={{
                  scrollSnapAlign: 'center',
                  background: 'radial-gradient(ellipse at top, rgba(251,146,60,0.15) 0%, transparent 70%), linear-gradient(180deg, rgba(28,25,23,0.85) 0%, rgba(0,0,0,0.95) 100%)',
                  border: '1px solid rgba(251,146,60,0.3)',
                }}>
                  <div className="text-[10px] text-amber-400 font-bold mb-1">{m.month}</div>
                  <div className="inline-block my-1" style={{ filter: 'drop-shadow(0 0 10px rgba(251,146,60,0.5))' }}>
                    <svg width="44" height="55" viewBox="0 0 50 60">
                      <defs>
                        <radialGradient id={`medalGold${m.monthIdx}_${monthsYear}`}>
                          <stop offset="0%" stopColor="#fef3c7"/>
                          <stop offset="60%" stopColor="#d97706"/>
                          <stop offset="100%" stopColor="#451a03"/>
                        </radialGradient>
                      </defs>
                      <path d="M 18 5 L 22 22 L 28 22 L 32 5 Z" fill={ribbonColor}/>
                      <path d="M 18 5 L 22 22 L 25 22 L 18 5 Z" fill={ribbonColor} opacity="0.7"/>
                      <circle cx="25" cy="38" r="16" fill={`url(#medalGold${m.monthIdx}_${monthsYear})`} stroke="#451a03" strokeWidth="1.5"/>
                      <circle cx="25" cy="38" r="11" fill="none" stroke="#92400e" strokeWidth="1"/>
                      <circle cx="25" cy="38" r="6" fill="#fbbf24" opacity="0.4"/>
                      <text x="25" y="43" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="13" fontWeight="800" fill="#451a03">★</text>
                    </svg>
                  </div>
                  {/* תמונה ענקית */}
                  {PLAYER_AVATARS[m.name] && (
                    <div className="flex justify-center my-2">
                      <PlayerAvatar name={m.name} size={115} />
                    </div>
                  )}
                  <div className="text-sm font-extrabold text-amber-100 mt-1 truncate">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-amber-300 tabular-nums font-bold">{m.profit > 0 ? '+' : ''}{m.profit}₪</div>
                  <div className="text-[9px] text-stone-500">{m.sessions} מפגשים</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-stone-700 bg-stone-900/30 p-4 text-center text-stone-500 text-xs">
            אין חודשים שהסתיימו ב-{monthsYear}
          </div>
        )}
      </div>
      
      {/* 🌟 חביב הקהל - קרוסלה */}
      {(popularityChampions.topQuoted || popularityChampions.topHost || popularityChampions.topAttender) && (
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-sm font-bold text-pink-300 flex items-center gap-2">
              🦢 חביב הקהל ({currentYear})
            </h3>
            <span className="text-[10px] text-pink-700 tracking-wider">← גלילה →</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            {/* ציטוטים */}
            {popularityChampions.topQuoted && (
              <div className="rounded-xl p-3 text-center w-44 shrink-0" style={{
                scrollSnapAlign: 'center',
                background: 'radial-gradient(ellipse at top, rgba(236,72,153,0.15) 0%, transparent 70%), linear-gradient(180deg, rgba(28,25,23,0.85) 0%, rgba(0,0,0,0.95) 100%)',
                border: '1px solid rgba(236,72,153,0.3)',
              }}>
                <div className="text-[10px] text-pink-400 font-bold tracking-widest mb-1">מצוטט הכי הרבה</div>
                <div className="text-3xl my-2">🪶</div>
                {PLAYER_AVATARS[popularityChampions.topQuoted.name] && (
                  <div className="flex justify-center my-2">
                    <PlayerAvatar name={popularityChampions.topQuoted.name} size={130} />
                  </div>
                )}
                <div className="text-base font-extrabold text-pink-100 truncate">
                  {popularityChampions.topQuoted.name}
                </div>
                <div className="text-[11px] text-pink-300 tabular-nums font-bold">{popularityChampions.topQuoted.count} ציטוטים</div>
              </div>
            )}
            {/* אירוחים */}
            {popularityChampions.topHost && (
              <div className="rounded-xl p-3 text-center w-44 shrink-0" style={{
                scrollSnapAlign: 'center',
                background: 'radial-gradient(ellipse at top, rgba(168,85,247,0.15) 0%, transparent 70%), linear-gradient(180deg, rgba(28,25,23,0.85) 0%, rgba(0,0,0,0.95) 100%)',
                border: '1px solid rgba(168,85,247,0.3)',
              }}>
                <div className="text-[10px] text-purple-400 font-bold tracking-widest mb-1">המארח של השנה</div>
                <div className="text-3xl my-2">🏠</div>
                {PLAYER_AVATARS[popularityChampions.topHost.name] && (
                  <div className="flex justify-center my-2">
                    <PlayerAvatar name={popularityChampions.topHost.name} size={130} />
                  </div>
                )}
                <div className="text-base font-extrabold text-purple-100 truncate">
                  {popularityChampions.topHost.name}
                </div>
                <div className="text-[11px] text-purple-300 tabular-nums font-bold">{popularityChampions.topHost.count} אירוחים</div>
              </div>
            )}
            {/* נוכחות */}
            {popularityChampions.topAttender && (
              <div className="rounded-xl p-3 text-center w-44 shrink-0" style={{
                scrollSnapAlign: 'center',
                background: 'radial-gradient(ellipse at top, rgba(20,184,166,0.15) 0%, transparent 70%), linear-gradient(180deg, rgba(28,25,23,0.85) 0%, rgba(0,0,0,0.95) 100%)',
                border: '1px solid rgba(20,184,166,0.3)',
              }}>
                <div className="text-[10px] text-teal-400 font-bold tracking-widest mb-1">המתמיד של השנה</div>
                <div className="text-3xl my-2">🎯</div>
                {PLAYER_AVATARS[popularityChampions.topAttender.name] && (
                  <div className="flex justify-center my-2">
                    <PlayerAvatar name={popularityChampions.topAttender.name} size={130} />
                  </div>
                )}
                <div className="text-base font-extrabold text-teal-100 truncate">
                  {popularityChampions.topAttender.name}
                </div>
                <div className="text-[11px] text-teal-300 tabular-nums font-bold">{popularityChampions.topAttender.count} מפגשים</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 📈 השחקן המשתפר */}
      {mostImproved && (
        <div>
          <div className="px-2 mb-2">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              📈 השחקן המשתפר ({currentYear})
            </h3>
            <p className="text-[10px] text-emerald-700 mt-0.5 leading-tight">
              מי שיפר הכי הרבה את הביצועים מתחילת {currentYear} עד היום, בהשוואה לאותה תקופה ב-{currentYear - 1}
            </p>
          </div>
          <div className="rounded-xl p-4 text-center" style={{
            background: 'radial-gradient(ellipse at top, rgba(16,185,129,0.15) 0%, transparent 70%), linear-gradient(180deg, rgba(28,25,23,0.85) 0%, rgba(0,0,0,0.95) 100%)',
            border: '1px solid rgba(16,185,129,0.3)',
          }}>
            <div className="text-3xl mb-2">🚀</div>
            {PLAYER_AVATARS[mostImproved.name] && (
              <div className="flex justify-center mb-2">
                <PlayerAvatar name={mostImproved.name} size={90} />
              </div>
            )}
            <div className="text-2xl font-extrabold text-emerald-100">{mostImproved.name}</div>
            <div className="text-base text-emerald-300 font-bold tabular-nums mt-2">
              שיפור של +{mostImproved.improvement}₪
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="rounded-lg bg-stone-900/60 p-2 border border-stone-700/50">
                <div className="text-[10px] text-stone-400 font-bold">{currentYear - 1}</div>
                <div className={`text-sm font-bold tabular-nums ${mostImproved.lastYear > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {mostImproved.lastYear > 0 ? '+' : ''}{mostImproved.lastYear}₪
                </div>
              </div>
              <div className="rounded-lg bg-stone-900/60 p-2 border border-stone-700/50">
                <div className="text-[10px] text-stone-400 font-bold">{currentYear}</div>
                <div className={`text-sm font-bold tabular-nums ${mostImproved.thisYear > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {mostImproved.thisYear > 0 ? '+' : ''}{mostImproved.thisYear}₪
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* פוטר */}
      <div className="mt-6 mb-4 text-center">
        <div className="text-[10px] text-amber-700 tracking-[0.4em]">★ ★ ★</div>
        <div className="text-[10px] text-stone-600 mt-1 italic">תהילת הזכייה לעולם תיוותר</div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
};

const PeriodicTables = ({ allSessions, players }) => {
  const [viewMode, setViewMode] = useState('month'); // month | quarter | half
  // 🛡️ מודל פרטי ערב לא מאוזן
  const [imbalanceDetails, setImbalanceDetails] = useState(null);
  
  // זיהוי כל השנים הזמינות
  const availableYears = useMemo(() => {
    const years = new Set(allSessions.map(s => s.season || new Date(s.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [allSessions]);
  
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || 2026);
  const [selectedYears, setSelectedYears] = useState([availableYears[0] || 2026]);

  const toggleYear = (y) => {
    setSelectedYears(prev =>
      prev.includes(y) ? (prev.length > 1 ? prev.filter(x => x !== y) : prev) : [...prev, y].sort((a,b) => a-b)
    );
  };

  // סינון לפי שנה/שנים
  const sessions = useMemo(() => {
    if (viewMode === 'year') {
      return allSessions.filter(s => selectedYears.includes(s.season || new Date(s.date).getFullYear()));
    }
    return allSessions.filter(s => (s.season || new Date(s.date).getFullYear()) === selectedYear);
  }, [allSessions, selectedYear, selectedYears, viewMode]);
  
  // 🛡️ מיפוי תאריך → ערב לא מאוזן (רק לתצוגה היומית)
  const imbalancesByDate = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      if (!s.date || !s.results) return;
      const sum = Object.values(s.results).reduce((acc, v) => acc + Number(v), 0);
      if (Math.abs(sum) > 0.01) {
        // יש סטייה
        const positive = Object.values(s.results).filter(v => v > 0).reduce((a, b) => a + b, 0);
        const negative = Object.values(s.results).filter(v => v < 0).reduce((a, b) => a + b, 0);
        map[s.date] = {
          date: s.date,
          sum,
          positive,
          negative,
          players: s.results,
          host: s.host,
          pot: s.pot,
        };
      }
    });
    return map;
  }, [sessions]);
  
  const { keyFn, getLabel, viewLabel } = useMemo(() => {
    if (viewMode === 'day') return { keyFn: getDayKey, getLabel: getDayLabel, viewLabel: 'יומית' };
    if (viewMode === 'month') return { keyFn: getMonthKey, getLabel: getMonthLabel, viewLabel: 'חודשית' };
    if (viewMode === 'quarter') return { keyFn: getQuarterKey, getLabel: getQuarterLabel, viewLabel: 'רבעונית' };
    if (viewMode === 'half') return { keyFn: getHalfKey, getLabel: getHalfLabel, viewLabel: 'חצי שנתית' };
    return { keyFn: getYearKey, getLabel: getYearLabel, viewLabel: 'שנתית' };
  }, [viewMode]);
  
  const { sortedKeys, byPeriod, participated } = useMemo(() => 
    aggregateByPeriod(sessions, players, keyFn), [sessions, players, keyFn]);
  
  // רק שחקנים שיש להם נתונים בתקופה כלשהי
  const activePlayers = useMemo(() => {
    const set = new Set();
    sortedKeys.forEach(k => {
      Object.keys(byPeriod[k] || {}).forEach(name => set.add(name));
    });
    // מיון לפי סה״כ רווח יורד
    return Array.from(set).sort((a, b) => {
      const sumA = sortedKeys.reduce((s, k) => s + (byPeriod[k]?.[a] || 0), 0);
      const sumB = sortedKeys.reduce((s, k) => s + (byPeriod[k]?.[b] || 0), 0);
      return sumB - sumA;
    });
  }, [sortedKeys, byPeriod]);

  // מבחין בין "השתתף ב-0" (מציג 0) לבין "לא השתתף" (מציג —)
  const formatCell = (val, didParticipate) => {
    if (!didParticipate) return '—';
    if (!val || val === 0) return '0';
    return val > 0 ? `+${val}` : `${val}`;
  };
  
  const cellColor = (val, didParticipate) => {
    if (!didParticipate) return 'text-stone-700'; // לא השתתף - כהה
    if (!val || val === 0) return 'text-stone-400'; // השתתף בתיקו
    if (val > 0) return 'bg-emerald-900/40 text-emerald-300 font-bold';
    return 'bg-rose-900/40 text-rose-300 font-bold';
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur overflow-hidden">
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/40 to-stone-900/40 px-4 md:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
          📊 טבלה {viewLabel}{viewMode !== 'year' ? ` — ${selectedYear}` : selectedYears.length === availableYears.length ? ' — כל הזמנים' : ` — ${selectedYears.join(', ')}`}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'year' ? (
            <div className="flex gap-1 flex-wrap">
              {availableYears.map(y => (
                <button key={y} onClick={() => toggleYear(y)}
                  className={`px-2 py-1 text-xs rounded-md font-bold border transition ${selectedYears.includes(y) ? 'bg-amber-700 border-amber-600 text-white' : 'border-stone-700 bg-stone-900 text-stone-400 hover:text-stone-200'}`}>
                  {y}
                </button>
              ))}
            </div>
          ) : (
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm text-white font-bold">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          <div className="flex rounded-lg border border-stone-700 bg-stone-900 p-1">
            <button onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs rounded-md font-bold transition ${viewMode === 'day' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              יומית
            </button>
            <button onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs rounded-md font-bold transition ${viewMode === 'month' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              חודשית
            </button>
            <button onClick={() => setViewMode('quarter')}
              className={`px-3 py-1.5 text-xs rounded-md font-bold transition ${viewMode === 'quarter' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              רבעונית
            </button>
            <button onClick={() => setViewMode('half')}
              className={`px-3 py-1.5 text-xs rounded-md font-bold transition ${viewMode === 'half' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              חצי שנתית
            </button>
            <button onClick={() => setViewMode('year')}
              className={`px-3 py-1.5 text-xs rounded-md font-bold transition ${viewMode === 'year' ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
              שנתית
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[calc(100vh-280px)]" dir="rtl">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="sticky top-0 right-0 z-30 bg-stone-900 border-b-2 border-l border-stone-700 px-3 py-3 text-right font-bold text-xs text-amber-200 min-w-[90px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]">
                שחקן
              </th>
              {sortedKeys.map(k => {
                // 🛡️ בדיקה: האם יש חוסר איזון בערב הזה? (רק בתצוגה יומית)
                const imbalance = viewMode === 'day' ? imbalancesByDate[k] : null;
                return (
                  <th key={k} className="sticky top-0 z-20 bg-stone-900 border-b-2 border-stone-700 px-3 py-3 text-center font-bold text-xs text-amber-200 whitespace-nowrap min-w-[80px]">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <span>{getLabel(k)}</span>
                      {imbalance && (
                        <button
                          onClick={() => setImbalanceDetails(imbalance)}
                          className="text-rose-400 hover:text-rose-300 cursor-pointer"
                          title="ערב לא מאוזן - לחץ לפרטים"
                        >
                          ⚠️
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="sticky top-0 left-0 z-30 bg-amber-950/50 border-b-2 border-r border-amber-700 px-3 py-3 text-center font-bold text-xs text-amber-200 whitespace-nowrap min-w-[80px]">
                סה״כ
              </th>
            </tr>
          </thead>
          <tbody>
            {activePlayers.map((name, i) => {
              const rowBg = i % 2 === 0 ? 'bg-stone-950' : 'bg-stone-900/50';
              const total = sortedKeys.reduce((s, k) => s + (byPeriod[k]?.[name] || 0), 0);
              const totalParticipated = sortedKeys.some(k => participated[k]?.[name]);
              return (
                <tr key={name} className="group hover:bg-amber-950/10">
                  <td className={`sticky right-0 z-10 ${rowBg} group-hover:bg-amber-950/20 border-b border-l border-stone-800 px-3 py-2.5 font-bold text-stone-100 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                    {name}
                  </td>
                  {sortedKeys.map(k => {
                    const val = byPeriod[k]?.[name];
                    const didParticipate = !!participated[k]?.[name];
                    return (
                      <td key={k} className={`border-b border-stone-900 px-3 py-2.5 tabular-nums text-center whitespace-nowrap ${cellColor(val, didParticipate)}`}>
                        {formatCell(val, didParticipate)}
                      </td>
                    );
                  })}
                  <td className={`sticky left-0 z-10 border-b border-r border-amber-800/50 px-3 py-2.5 tabular-nums text-center font-extrabold whitespace-nowrap ${
                    total > 0 ? 'bg-emerald-950/60 text-emerald-300' : total < 0 ? 'bg-rose-950/60 text-rose-300' : 'bg-stone-900/80 text-stone-400'
                  }`}>
                    {formatCell(total, totalParticipated)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="border-t border-stone-800 bg-stone-900/40 px-4 py-3 text-xs text-stone-500 flex items-center gap-4 flex-wrap">
        <span>🟢 רווח</span>
        <span>🔴 הפסד</span>
        <span>• המספרים בעמודות מראים את הרווח/הפסד בתקופה</span>
        {viewMode === 'day' && Object.keys(imbalancesByDate).length > 0 && (
          <span>• ⚠️ = ערב לא מאוזן (לחץ לפרטים)</span>
        )}
      </div>
      
      {/* 🛡️ מודל פרטי ערב לא מאוזן */}
      {imbalanceDetails && (
        <div dir="rtl" className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setImbalanceDetails(null)}>
          <div className="bg-stone-950 rounded-2xl border-2 border-rose-700 w-full max-w-md my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-gradient-to-l from-rose-950/40 to-stone-950">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h2 className="text-lg font-extrabold text-rose-200">ערב לא מאוזן</h2>
                  <div className="text-xs text-stone-400">
                    {new Date(imbalanceDetails.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <button onClick={() => setImbalanceDetails(null)} className="text-stone-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {/* פירוט המאזן */}
              <div className="rounded-lg bg-rose-950/30 border border-rose-800/50 p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">סכום רווחים:</span>
                  <span className="text-emerald-400 font-bold">+{imbalanceDetails.positive}₪</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">סכום הפסדים:</span>
                  <span className="text-rose-400 font-bold">{imbalanceDetails.negative}₪</span>
                </div>
                <div className="border-t border-rose-800/50 pt-1 flex justify-between text-sm">
                  <span className="text-stone-300 font-bold">מאזן (אמור 0):</span>
                  <span className={`font-extrabold ${imbalanceDetails.sum > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {imbalanceDetails.sum > 0 ? '+' : ''}{imbalanceDetails.sum}₪
                  </span>
                </div>
                {imbalanceDetails.pot && (
                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-stone-500">קופה:</span>
                    <span className="text-stone-400">{imbalanceDetails.pot}₪</span>
                  </div>
                )}
                {imbalanceDetails.host && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500">מארח:</span>
                    <span className="text-stone-400">{imbalanceDetails.host}</span>
                  </div>
                )}
              </div>
              
              {/* רשימת השחקנים */}
              <div>
                <div className="text-xs text-stone-400 font-bold mb-2">שחקנים בערב ({Object.keys(imbalanceDetails.players).length}):</div>
                <div className="rounded-lg border border-stone-800 overflow-hidden">
                  {Object.entries(imbalanceDetails.players)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, val], idx) => (
                      <div key={name} className={`flex justify-between items-center px-3 py-2 text-sm ${idx % 2 === 0 ? 'bg-stone-900' : 'bg-stone-900/50'}`}>
                        <span className="text-stone-200 font-bold">{name}</span>
                        <span className={`tabular-nums font-bold ${val > 0 ? 'text-emerald-400' : val < 0 ? 'text-rose-400' : 'text-stone-500'}`}>
                          {val > 0 ? '+' : ''}{val}₪
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="rounded-lg bg-amber-950/30 border border-amber-800/50 p-3 text-xs text-amber-200">
                💡 <b>כנראה שגיאת הקלדה ברישום הערב.</b> אחת מהתוצאות הוקלדה לא נכון. צלם את החלון הזה ופנה לרון לבדיקה.
              </div>
            </div>
            
            <div className="p-4 border-t border-stone-800">
              <button
                onClick={() => setImbalanceDetails(null)}
                className="w-full rounded-lg bg-stone-800 hover:bg-stone-700 px-4 py-2.5 text-stone-300 font-bold text-sm transition"
              >
                סבבה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 💸 ארכיון תשלומים - תזכורות שטופלו (כבר העברתי / קיבלתי)
// ============================================================
// מוצג בתחתית הדשבורד, מציג רק תזכורות מ-7 ימים אחרונים שמסומנות כ-archived
const PaymentArchive = ({ playerName, reminders, onUpdateReminders }) => {
  const archived = useMemo(() => {
    if (!playerName || !reminders) return [];
    return reminders
      .filter(r => 
        r.status === 'archived' && 
        (r.from === playerName || r.to === playerName)
      )
      .sort((a, b) => {
        // מיון לפי archivedAt - חדשים למעלה
        const aTime = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
        const bTime = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [playerName, reminders]);
  
  if (archived.length === 0) return null;
  
  const restoreReminder = (id) => {
    const updated = reminders.map(r => 
      r.id === id 
        ? { ...r, status: 'pending', archivedAt: undefined, archivedAction: undefined }
        : r
    );
    onUpdateReminders(updated);
  };
  
  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = d.toDateString() === today.toDateString();
    const isYesterday = d.toDateString() === yesterday.toDateString();
    
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    if (isToday) return `היום ${time}`;
    if (isYesterday) return `אתמול ${time}`;
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
  };
  
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/40 backdrop-blur p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-bold text-stone-400 flex items-center gap-2 text-sm">
          📋 ארכיון תשלומים
          <span className="text-[10px] text-stone-600 font-normal">(7 ימים אחרונים)</span>
        </div>
        <div className="text-xs text-stone-600">
          {archived.length} פעולות
        </div>
      </div>
      <div className="space-y-1.5">
        {archived.map(r => {
          const isHosting = r.type === 'hosting';
          const userIsSender = r.from === playerName;
          const action = r.archivedAction || (userIsSender ? 'sent' : 'received');
          
          return (
            <div key={r.id} className="rounded-lg border border-stone-800/50 bg-stone-900/30 px-2.5 py-2 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs flex items-center gap-1.5 flex-wrap">
                  {action === 'sent' ? (
                    <>
                      <span className="text-emerald-500">✓</span>
                      <span className="text-stone-300">העברת</span>
                      <span className="text-stone-100 font-bold">{r.amount} ₪</span>
                      <span className="text-stone-400">ל-</span>
                      <span className="text-stone-200 font-bold">{r.to}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-emerald-500">✓</span>
                      <span className="text-stone-300">קיבלת</span>
                      <span className="text-stone-100 font-bold">{r.amount} ₪</span>
                      <span className="text-stone-400">מ-</span>
                      <span className="text-stone-200 font-bold">{r.from}</span>
                    </>
                  )}
                  {isHosting && <span className="text-purple-400/60 text-[10px]">(אירוח)</span>}
                </div>
                <div className="text-[10px] text-stone-600 mt-0.5">
                  {formatTime(r.archivedAt)}
                </div>
              </div>
              <button 
                onClick={() => restoreReminder(r.id)}
                title="החזר לתזכורות פעילות"
                className="rounded bg-stone-800 hover:bg-stone-700 border border-stone-700 px-2 py-1 text-[10px] font-bold text-stone-400 hover:text-stone-200 whitespace-nowrap transition">
                ↩ החזר
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== דשבורד קומפקטי =====
const DashboardCarousel = ({ currentUser, sessions, allSessions, stats, hostingSchedule, onGoToHosting, onFullscreenToggle, selectedChartPlayers, setSelectedChartPlayers, isMobile, paymentReminders, phones, onUpdateReminders, isSuperAdmin, handledReminders, onUpdateHandled }) => {
  // 🎉 Confetti בכניסה - אם המשתמש ניצח בערב האחרון ועוד לא ראה
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiMessage, setConfettiMessage] = useState('');
  
  useEffect(() => {
    if (!currentUser || !sessions || sessions.length === 0) return;
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastSession = sortedSessions.find(s => s.results && typeof s.results[currentUser] === 'number');
    if (!lastSession) return;
    const myProfit = Number(lastSession.results[currentUser]) || 0;
    if (myProfit <= 0) return;
    const sessionKey = `${lastSession.date}_${lastSession.season || 2026}`;
    const seenKey = `confetti_seen_${currentUser}_${sessionKey}`;
    try {
      const alreadySeen = window.localStorage.getItem(seenKey);
      if (alreadySeen) return;
      const timer = setTimeout(() => {
        setConfettiMessage(`🚰 צינורות פתוחים! +${myProfit} ₪`);
        setConfettiActive(true);
        window.localStorage.setItem(seenKey, '1');
      }, 600);
      return () => clearTimeout(timer);
    } catch (e) {}
  }, [currentUser, sessions]);
  
  return (
    <div className="space-y-3">
      <PaymentReminders 
        playerName={currentUser}
        reminders={paymentReminders || []}
        phones={phones || {}}
        onUpdateReminders={onUpdateReminders || (() => {})}
        handledReminders={handledReminders || {}}
        onUpdateHandled={onUpdateHandled || (() => {})}
      />
      <EveningSummaryCard playerName={currentUser} isSuperAdmin={isSuperAdmin} />
      <PersonalInsights playerName={currentUser} sessions={sessions} stats={stats} hostingSchedule={hostingSchedule} />
      {/* 📈 הגרף המצטבר - אחרי המיקום שלך בדירוג */}
      <div className="rounded-2xl border border-stone-800 bg-stone-950/40 backdrop-blur p-2">
        <CumulativeChart sessions={sessions} stats={stats} fullscreen={false}
          onFullscreenToggle={onFullscreenToggle}
          selectedPlayers={selectedChartPlayers}
          onPlayersChange={setSelectedChartPlayers}
          isMobile={isMobile} />
      </div>
      <NextHostsCarouselCompact hostingSchedule={hostingSchedule} onSeeAll={onGoToHosting} />
      <TopThreeCarousel stats={stats} />
      <SpecialStatsCarousel stats={stats} />
      {/* 📋 ארכיון תשלומים - בתחתית הדשבורד */}
      <PaymentArchive 
        playerName={currentUser}
        reminders={paymentReminders || []}
        onUpdateReminders={onUpdateReminders || (() => {})}
      />
      <Confetti 
        active={confettiActive} 
        onComplete={() => setConfettiActive(false)}
        message={confettiMessage} />
    </div>
  );
};

// ===== קרוסלה של 3 המארחים הבאים =====
const NextHostsCarouselCompact = ({ hostingSchedule, onSeeAll }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);

  const today = getTodayIsrael();
  const upcoming = hostingSchedule
    .filter(h => h.date >= today && h.host)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-800 bg-stone-950/50 p-6 text-center">
        <div className="text-4xl mb-2">📅</div>
        <div className="text-stone-400 text-sm">אין עדיין מארחים בלוח</div>
      </div>
    );
  }

  const goToSlide = (idx) => {
    if (scrollRef.current) {
      const w = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: -idx * w, behavior: 'smooth' });
      setCurrentSlide(idx);
    }
  };

  const handleScroll = (e) => {
    const w = e.target.offsetWidth;
    const idx = Math.round(Math.abs(e.target.scrollLeft) / w);
    if (idx !== currentSlide) setCurrentSlide(idx);
  };

  return (
    <div className="rounded-2xl border-2 border-emerald-700/40 bg-gradient-to-br from-emerald-950/30 via-stone-900/40 to-stone-950/40 p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base md:text-lg font-extrabold text-amber-200 flex items-center gap-2">
          🏠 המארחים הבאים
        </h3>
        <button onClick={onSeeAll} className="text-xs text-amber-400 hover:text-amber-300 font-bold">
          הכל →
        </button>
      </div>

      <div className="relative">
        {currentSlide > 0 && (
          <button onClick={() => goToSlide(currentSlide - 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600/50 text-emerald-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {currentSlide < upcoming.length - 1 && (
          <button onClick={() => goToSlide(currentSlide + 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600/50 text-emerald-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div ref={scrollRef} onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none' }} dir="rtl">
          {upcoming.map((h, i) => {
            const date = new Date(h.date);
            const isFirst = i === 0;
            const wazeUrl = h.address ? `https://waze.com/ul?q=${encodeURIComponent(h.address)}&navigate=yes` : null;
            return (
              <div key={h.date} className="min-w-full snap-center px-1">
                <div className={`rounded-2xl border ${
                  isFirst ? 'border-amber-600/60 bg-gradient-to-br from-amber-900/30 to-stone-900/50' : 'border-emerald-700/40 bg-gradient-to-br from-emerald-900/20 to-stone-900/50'
                } p-5 flex flex-col items-center justify-center text-center`} style={{ minHeight: '140px' }}>
                  {/* אייקון לוח שנה אמיתי עם התאריך */}
                  <div className="mb-2">
                    <div className={`w-14 h-16 rounded-lg overflow-hidden border-2 shadow-lg mx-auto ${
                      isFirst ? 'border-amber-700/60' : 'border-emerald-700/60'
                    }`}>
                      <div className={`h-4 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider ${
                        isFirst ? 'bg-rose-700 text-white' : 'bg-emerald-700 text-white'
                      }`}>
                        {date.toLocaleDateString('he-IL', { month: 'short' })}
                      </div>
                      <div className="h-12 flex items-center justify-center bg-stone-100">
                        <span className="text-2xl font-extrabold text-stone-900">{date.getDate()}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isFirst ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {isFirst ? 'המפגש הקרוב' : `בעוד ${i + 1}`}
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-stone-100 leading-none mb-2">{h.host}</div>
                  <div className="text-xs md:text-sm text-stone-300">
                    {h.dayName}, {date.toLocaleDateString('he-IL', { day: '2-digit', month: 'long' })}
                  </div>
                  {h.address && (
                    <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-stone-400">📍 {h.address}</span>
                      {wazeUrl && (
                        <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-cyan-600 hover:bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white transition">
                          Waze 🚗
                        </a>
                      )}
                    </div>
                  )}
                  {h.notes && <div className="text-xs text-stone-500 mt-1 italic">{h.notes}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        {upcoming.map((_, i) => (
          <button key={i} onClick={() => goToSlide(i)}
            className={`transition-all rounded-full ${
              i === currentSlide ? 'w-6 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-stone-700 hover:bg-stone-600'
            }`} />
        ))}
      </div>
    </div>
  );
};

// ===== קרוסלה של הפודיום =====
const TopThreeCarousel = ({ stats }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);

  const top3 = stats.slice(0, 3);
  if (top3.length === 0) {
    return <div className="rounded-2xl border border-stone-800 bg-stone-950/50 p-6 text-center text-stone-400 text-sm">אין עדיין נתונים</div>;
  }

  const goToSlide = (idx) => {
    if (scrollRef.current) {
      const w = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: -idx * w, behavior: 'smooth' });
      setCurrentSlide(idx);
    }
  };

  const handleScroll = (e) => {
    const w = e.target.offsetWidth;
    const idx = Math.round(Math.abs(e.target.scrollLeft) / w);
    if (idx !== currentSlide) setCurrentSlide(idx);
  };

  const medals = ['🥇', '🥈', '🥉'];
  const gradients = [
    'from-amber-600/40 to-amber-900/30 border-amber-500/60',
    'from-stone-400/20 to-stone-700/30 border-stone-400/50',
    'from-orange-700/30 to-orange-900/30 border-orange-600/50'
  ];

  return (
    <div className="rounded-2xl border-2 border-amber-700/40 bg-gradient-to-br from-amber-950/20 via-stone-900/40 to-stone-950/40 p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base md:text-lg font-extrabold text-amber-200 flex items-center gap-2">
          🏆 פודיום העונה
        </h3>
        <div className="text-xs text-amber-300/80 font-bold bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-800/40">{currentSlide + 1}/{top3.length}</div>
      </div>

      <div className="relative">
        {currentSlide > 0 && (
          <button onClick={() => goToSlide(currentSlide - 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-amber-900/80 hover:bg-amber-800 border border-amber-600/50 text-amber-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {currentSlide < top3.length - 1 && (
          <button onClick={() => goToSlide(currentSlide + 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-amber-900/80 hover:bg-amber-800 border border-amber-600/50 text-amber-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div ref={scrollRef} onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none' }} dir="rtl">
          {top3.map((p, i) => (
            <div key={p.name} className="min-w-full snap-center px-1">
              <div className={`rounded-2xl border bg-gradient-to-br ${gradients[i]} p-5 flex flex-col items-center justify-center text-center`} style={{ minHeight: '140px' }}>
                <div className="text-4xl mb-1">{medals[i]}</div>
                <div className="text-xs text-amber-200/80 font-bold uppercase tracking-wider mb-1">מקום {i + 1}</div>
                <div className="text-3xl md:text-4xl font-extrabold text-stone-100 leading-none mb-1">{p.name}</div>
                <div className="text-2xl md:text-3xl font-extrabold text-emerald-400 tabular-nums drop-shadow-lg">
                  +{p.total} ₪
                </div>
                <div className="text-xs md:text-sm text-stone-300 mt-1">{p.sessions} מפגשים · {p.winRate.toFixed(0)}% ניצחון</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        {top3.map((_, i) => (
          <button key={i} onClick={() => goToSlide(i)}
            className={`transition-all rounded-full ${
              i === currentSlide ? 'w-6 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-stone-700 hover:bg-stone-600'
            }`} />
        ))}
      </div>
    </div>
  );
};

// ===== קרוסלה של סטטיסטיקות מיוחדות =====
const SpecialStatsCarousel = ({ stats }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);

  if (stats.length === 0) return null;

  const topWinner = stats[0];
  const bottomLoser = stats[stats.length - 1];
  const biggestWin = [...stats].sort((a, b) => b.biggestWin - a.biggestWin)[0];
  const biggestLoss = [...stats].sort((a, b) => a.biggestLoss - b.biggestLoss)[0];
  const longestStreak = [...stats].sort((a, b) => b.maxStreak - a.maxStreak)[0];
  const mostActive = [...stats].sort((a, b) => b.sessions - a.sessions)[0];

  const slides = [
    { emoji: '👑', label: 'מלך הכסף', value: topWinner.name, sub: `+${topWinner.total} ₪`, valueClass: 'text-amber-300', bgClass: 'from-amber-900/40 to-stone-900/50', borderClass: 'border-amber-700/50' },
    { emoji: '💀', label: 'הלוזר הגדול', value: bottomLoser.name, sub: `${bottomLoser.total} ₪`, valueClass: 'text-rose-400', bgClass: 'from-rose-900/30 to-stone-900/50', borderClass: 'border-rose-700/40' },
    { emoji: '🔥', label: 'שיא רווח בערב אחד', value: biggestWin.name, sub: `+${biggestWin.biggestWin} ₪`, valueClass: 'text-orange-400', bgClass: 'from-orange-900/30 to-stone-900/50', borderClass: 'border-orange-700/40' },
    { emoji: '💔', label: 'שיא הפסד בערב אחד', value: biggestLoss.name, sub: `${biggestLoss.biggestLoss} ₪`, valueClass: 'text-rose-400', bgClass: 'from-rose-900/30 to-stone-900/50', borderClass: 'border-rose-700/40' },
    { emoji: '⚡', label: 'רצף ניצחונות ארוך', value: longestStreak.name, sub: `${longestStreak.maxStreak} ערבים ברצף`, valueClass: 'text-violet-300', bgClass: 'from-violet-900/30 to-stone-900/50', borderClass: 'border-violet-700/40' },
    { emoji: '🎯', label: 'המתמיד', value: mostActive.name, sub: `${mostActive.sessions} מפגשים`, valueClass: 'text-emerald-400', bgClass: 'from-emerald-900/30 to-stone-900/50', borderClass: 'border-emerald-700/40' },
  ];

  const goToSlide = (idx) => {
    if (scrollRef.current) {
      const w = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: -idx * w, behavior: 'smooth' });
      setCurrentSlide(idx);
    }
  };

  const handleScroll = (e) => {
    const w = e.target.offsetWidth;
    const idx = Math.round(Math.abs(e.target.scrollLeft) / w);
    if (idx !== currentSlide) setCurrentSlide(idx);
  };

  return (
    <div className="rounded-2xl border-2 border-violet-700/40 bg-gradient-to-br from-violet-950/20 via-stone-900/40 to-stone-950/40 p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base md:text-lg font-extrabold text-amber-200 flex items-center gap-2">
          ⚡ סטטיסטיקות מיוחדות
        </h3>
        <div className="text-xs text-amber-300/80 font-bold bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-800/40">{currentSlide + 1}/{slides.length}</div>
      </div>

      <div className="relative">
        {currentSlide > 0 && (
          <button onClick={() => goToSlide(currentSlide - 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-violet-900/80 hover:bg-violet-800 border border-violet-600/50 text-violet-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {currentSlide < slides.length - 1 && (
          <button onClick={() => goToSlide(currentSlide + 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-violet-900/80 hover:bg-violet-800 border border-violet-600/50 text-violet-200 w-8 h-8 flex items-center justify-center shadow-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div ref={scrollRef} onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none' }} dir="rtl">
          {slides.map((slide, i) => (
            <div key={i} className="min-w-full snap-center px-1">
              <div className={`rounded-2xl border ${slide.borderClass} bg-gradient-to-br ${slide.bgClass} p-5 flex flex-col items-center justify-center text-center`} style={{ minHeight: '140px' }}>
                <div className="text-3xl mb-1">{slide.emoji}</div>
                <div className="text-xs text-amber-200/80 font-bold uppercase tracking-wider mb-1">{slide.label}</div>
                <div className={`text-3xl md:text-4xl font-extrabold ${slide.valueClass} leading-none mb-2 drop-shadow-lg`}>
                  {slide.value}
                </div>
                <div className="text-sm md:text-base text-stone-200 font-bold">{slide.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button key={i} onClick={() => goToSlide(i)}
            className={`transition-all rounded-full ${
              i === currentSlide ? 'w-6 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-stone-700 hover:bg-stone-600'
            }`} />
        ))}
      </div>
    </div>
  );
};


// ===== גלריית ידיים מנצחות =====
const GalleryTab = ({ images, likes, currentUser, isAdmin, onAdd, onDelete, onLike, onUpdateNote }) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingIndex, setViewingIndex] = useState(null);
  const [filterUploader, setFilterUploader] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // רשימת המעלים (לפילטר)
  const uploaders = useMemo(() => {
    const s = new Set(images.map(img => img.uploadedBy).filter(Boolean));
    return Array.from(s).sort();
  }, [images]);

  // סינון ומיון
  const visibleImages = useMemo(() => {
    let list = images;
    if (filterUploader !== 'all') {
      list = list.filter(img => img.uploadedBy === filterUploader);
    }
    if (sortBy === 'likes') {
      list = [...list].sort((a, b) => (likes[b.id] || 0) - (likes[a.id] || 0));
    } else {
      list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [images, likes, filterUploader, sortBy]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
            🃏 גלריית ידיים מנצחות ({visibleImages.length})
          </h3>
          <button onClick={() => setUploadOpen(true)}
            className="rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-2 text-sm font-bold text-white hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-900/40 flex items-center gap-2">
            <Camera className="h-4 w-4" />
            העלה תמונה
          </button>
        </div>
        
        <div className="text-xs text-stone-400 mb-3">
          💡 יש לך יד מנצחת שאתה גאה בה? העלה תמונה והוסף הערה!
        </div>

        {/* פילטרים */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <select value={filterUploader} onChange={e => setFilterUploader(e.target.value)}
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-white">
              <option value="all">כל המעלים</option>
              {uploaders.map(name => (
                <option key={name} value={name}>של {name}</option>
              ))}
            </select>
            <div className="flex rounded-lg border border-stone-700 bg-stone-900 p-1">
              <button onClick={() => setSortBy('newest')}
                className={`px-3 py-1 text-xs rounded-md font-bold transition ${sortBy === 'newest' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}>
                חדשים
              </button>
              <button onClick={() => setSortBy('likes')}
                className={`px-3 py-1 text-xs rounded-md font-bold transition ${sortBy === 'likes' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}>
                אהובים
              </button>
            </div>
          </div>
        )}
      </div>

      {/* רשת תמונות */}
      {visibleImages.length === 0 ? (
        <div className="rounded-2xl border border-stone-800 bg-stone-950/50 p-12 text-center">
          <div className="text-6xl mb-3 opacity-40">📸</div>
          <div className="text-stone-400 text-sm">
            {images.length === 0 
              ? 'עדיין אין תמונות. תהיה הראשון!' 
              : 'אין תמונות מהפילטר הזה'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {visibleImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setViewingIndex(idx)}
              className="relative aspect-square rounded-xl overflow-hidden border border-stone-800 bg-stone-900 hover:border-amber-600/60 transition group">
              <img src={img.dataUrl} alt={img.note || 'hand'} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              
              {/* overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100" />
              
              {/* לייקים */}
              {(likes[img.id] || 0) > 0 && (
                <div className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-xs text-rose-300 font-bold flex items-center gap-1">
                  <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
                  {likes[img.id]}
                </div>
              )}
              
              {/* הערה */}
              {img.note && (
                <div className="absolute bottom-0 right-0 left-0 p-2 text-right">
                  <div className="text-xs text-white font-bold truncate">
                    {img.note}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* מודל העלאה */}
      <GalleryUploadModal 
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        currentUser={currentUser}
        onUpload={onAdd} />

      {/* מודל תצוגה */}
      {viewingIndex !== null && visibleImages[viewingIndex] && (
        <GalleryImageModal
          image={visibleImages[viewingIndex]}
          likes={likes[visibleImages[viewingIndex].id] || 0}
          currentUser={currentUser}
          isAdmin={isAdmin}
          canGoNext={viewingIndex < visibleImages.length - 1}
          canGoPrev={viewingIndex > 0}
          onNext={() => setViewingIndex(viewingIndex + 1)}
          onPrev={() => setViewingIndex(viewingIndex - 1)}
          onClose={() => setViewingIndex(null)}
          onLike={() => onLike(visibleImages[viewingIndex].id)}
          onDelete={() => { onDelete(visibleImages[viewingIndex].id); setViewingIndex(null); }}
          onUpdateNote={(note) => onUpdateNote(visibleImages[viewingIndex].id, note)} />
      )}
    </div>
  );
};

// ===== מודל העלאת תמונה =====
const GalleryUploadModal = ({ isOpen, onClose, currentUser, onUpload }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    
    if (!selected.type.startsWith('image/')) {
      setError('חובה לבחור קובץ תמונה');
      return;
    }
    
    setError('');
    setFile(selected);
    
    // תצוגה מקדימה
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selected);
  };

  const compressImage = (file, maxWidth = 1200, quality = 0.82) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // שמירה על יחס
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setError('בחר תמונה תחילה');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      // דחיסה
      const compressed = await compressImage(file);
      
      const newImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        dataUrl: compressed,
        note: note.trim(),
        uploadedBy: currentUser,
        createdAt: new Date().toISOString()
      };
      
      await onUpload(newImage);
      
      // איפוס
      setFile(null);
      setPreview(null);
      setNote('');
      setUploading(false);
      onClose();
    } catch (e) {
      console.error('Upload error:', e);
      setError('שגיאה בהעלאה. נסה שוב.');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-md my-4 rounded-2xl border-2 border-amber-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-5 shadow-2xl"
        onClick={e => e.stopPropagation()} dir="rtl">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-extrabold text-amber-200">העלאת תמונה לגלריה</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* בחירת קובץ */}
        {!preview ? (
          <label className="block rounded-xl border-2 border-dashed border-stone-700 hover:border-amber-600/60 bg-stone-950/50 p-8 text-center cursor-pointer transition">
            <Camera className="h-12 w-12 mx-auto text-stone-500 mb-2" />
            <div className="text-sm text-stone-300 font-bold">לחץ לבחירת תמונה</div>
            <div className="text-xs text-stone-500 mt-1">מהגלריה או מצלמה</div>
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        ) : (
          <div className="relative">
            <img src={preview} alt="preview" className="w-full rounded-xl border border-stone-700" />
            <button onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-2 left-2 rounded-full bg-black/70 backdrop-blur p-1.5 text-white hover:bg-black/90">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* הערה */}
        <div className="mt-4">
          <label className="block text-xs text-stone-400 font-bold mb-1.5">הערה (אופציונלי)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder='"פור אס נגד רויאל פלאש... דמעות"'
            rows={2}
            maxLength={150}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white text-sm focus:border-amber-600 focus:outline-none resize-none" />
          <div className="text-xs text-stone-500 mt-1 text-left">{note.length}/150</div>
        </div>

        {/* מעלה - אוטומטי */}
        <div className="mt-3 text-xs text-stone-400 bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2">
          מעלה: <span className="font-bold text-amber-300">{currentUser}</span>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-700/50 bg-rose-950/30 text-rose-300 text-sm px-3 py-2 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* כפתורים */}
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} disabled={uploading}
            className="flex-1 rounded-lg border border-stone-700 bg-stone-900 py-2.5 text-sm font-bold text-stone-300 hover:bg-stone-800">
            ביטול
          </button>
          <button onClick={handleUpload} disabled={!file || uploading}
            className="flex-1 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 py-2.5 text-sm font-bold text-white hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'מעלה...' : 'העלה תמונה'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== מודל תצוגה מלאה של תמונה =====
const GalleryImageModal = ({ image, likes, currentUser, isAdmin, canGoNext, canGoPrev, onNext, onPrev, onClose, onLike, onDelete, onUpdateNote }) => {
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(image.note || '');
  const [liked, setLiked] = useState(false);

  const canEdit = currentUser === image.uploadedBy || isAdmin;
  const dateStr = new Date(image.createdAt).toLocaleDateString('he-IL', { 
    day: '2-digit', month: 'long', year: 'numeric' 
  });

  const handleSaveNote = () => {
    onUpdateNote(noteText.trim());
    setEditingNote(false);
  };

  const handleLike = () => {
    if (liked) return;
    onLike();
    setLiked(true);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()} dir="rtl">
        
        {/* סגירה */}
        <button onClick={onClose}
          className="absolute top-2 left-2 z-10 rounded-full bg-black/70 backdrop-blur p-2 text-white hover:bg-black/90 border border-stone-700">
          <X className="h-5 w-5" />
        </button>

        {/* חצים */}
        {canGoPrev && (
          <button onClick={onPrev}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/70 backdrop-blur p-2 text-white hover:bg-black/90 border border-stone-700">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {canGoNext && (
          <button onClick={onNext}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/70 backdrop-blur p-2 text-white hover:bg-black/90 border border-stone-700">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* תמונה */}
        <div className="flex-1 flex items-center justify-center min-h-0 mb-3">
          <img src={image.dataUrl} alt={image.note || 'hand'} 
            className="max-w-full max-h-full object-contain rounded-xl border border-stone-700 shadow-2xl" />
        </div>

        {/* תחתית - פרטים */}
        <div className="rounded-2xl border border-stone-700 bg-stone-950/95 backdrop-blur p-4">
          
          {/* מעלה ותאריך */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <div className="text-stone-300">
              📸 <span className="font-bold text-amber-300">{image.uploadedBy}</span>
            </div>
            <div className="text-xs text-stone-500">{dateStr}</div>
          </div>

          {/* הערה */}
          {editingNote ? (
            <div className="mb-3">
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                rows={2} maxLength={150}
                className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white text-sm focus:border-amber-600 focus:outline-none resize-none" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setNoteText(image.note || ''); setEditingNote(false); }}
                  className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300">
                  ביטול
                </button>
                <button onClick={handleSaveNote}
                  className="flex-1 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-bold text-white">
                  שמור הערה
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-3">
              {image.note ? (
                <div className="text-sm text-stone-200 italic">"{image.note}"</div>
              ) : (
                <div className="text-sm text-stone-500 italic">ללא הערה</div>
              )}
              {canEdit && (
                <button onClick={() => setEditingNote(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 mt-1">
                  ✏️ ערוך הערה
                </button>
              )}
            </div>
          )}

          {/* פעולות */}
          <div className="flex items-center gap-2">
            <button onClick={handleLike} disabled={liked}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold flex items-center justify-center gap-2 transition ${
                liked 
                  ? 'border-rose-700 bg-rose-950/40 text-rose-300 cursor-default' 
                  : 'border-stone-700 bg-stone-900 text-stone-300 hover:border-rose-700/60 hover:text-rose-300'
              }`}>
              <Heart className={`h-4 w-4 ${liked ? 'fill-rose-400 text-rose-400' : ''}`} />
              {likes} {likes === 1 ? 'לייק' : 'לייקים'}
            </button>
            {isAdmin && (
              <button onClick={onDelete}
                className="rounded-lg border border-rose-700/40 bg-rose-950/20 px-3 py-2 text-rose-300 hover:bg-rose-950/40">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// ===== מודל ניהול גיבויים =====
const BackupsModal = ({ isOpen, onClose, backupsList, onCreateBackup, onDownload, onRestore, onUploadFile, onRefresh }) => {
  const fileInputRef = useRef(null);
  const [creating, setCreating] = useState(false);
  
  if (!isOpen) return null;

  const handleCreate = async () => {
    setCreating(true);
    await onCreateBackup();
    setCreating(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadFile(file);
    e.target.value = ''; // איפוס כדי שאפשר יהיה לבחור שוב את אותו קובץ
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('he-IL', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4" dir="rtl">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-cyan-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-cyan-200 flex items-center gap-2">
            💾 גיבוי ושחזור
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* פעולות עיקריות */}
        <div className="space-y-2 mb-5">
          <button onClick={handleCreate} disabled={creating}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 text-white font-bold hover:from-emerald-500 shadow-lg shadow-emerald-900/40 disabled:opacity-50">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {creating ? 'יוצר גיבוי...' : '📥 גיבוי עכשיו (הורדה לדרייב)'}
          </button>
          
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-3 text-white font-bold hover:from-amber-500 shadow-lg shadow-amber-900/40">
            <Upload className="h-4 w-4" />
            📤 שחזור מקובץ JSON (מהדרייב)
          </button>
          <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileSelect} className="hidden" />
        </div>

        {/* מידע על גיבויים אוטומטיים */}
        <div className="rounded-lg bg-cyan-950/30 border border-cyan-700/40 p-3 text-xs text-cyan-200 mb-4">
          ℹ️ <strong>גיבוי אוטומטי:</strong> האפליקציה שומרת באופן אוטומטי snapshot של כל הנתונים <strong>אחת לשבוע</strong>. נשמרים 12 גיבויים אחרונים (3 חודשים).
        </div>

        {/* רשימת הגיבויים האוטומטיים */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-300">📋 גיבויים שמורים בענן ({backupsList.length})</h3>
          <button onClick={onRefresh} className="text-xs text-cyan-400 hover:text-cyan-300">🔄 רענן</button>
        </div>

        {backupsList.length === 0 ? (
          <div className="rounded-lg bg-stone-800/40 border border-stone-700/40 p-4 text-center text-stone-500 text-sm">
            אין גיבויים שמורים. לחץ על "גיבוי עכשיו" ליצירת הראשון.
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {backupsList.map((backup) => (
              <div key={backup.id} className="rounded-lg bg-stone-800/40 border border-stone-700/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-bold text-stone-100 flex items-center gap-2">
                      {backup.type === 'auto' ? '🔄 אוטומטי' : '📥 ידני'}
                      <span className="text-stone-400 text-xs font-normal">{formatDate(backup.timestamp)}</span>
                    </div>
                    {backup.meta && (
                      <div className="text-xs text-stone-500 mt-1">
                        {backup.meta.sessionsCount} מפגשים · {backup.meta.hostingCount} אירוחים · {backup.meta.phonesCount} טלפונים
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onDownload(backup)}
                    className="flex-1 rounded bg-cyan-700 hover:bg-cyan-600 px-3 py-1.5 text-white text-xs font-bold flex items-center justify-center gap-1">
                    <Download className="h-3 w-3" /> הורדה
                  </button>
                  <button onClick={() => onRestore(backup)}
                    className="flex-1 rounded bg-amber-700 hover:bg-amber-600 px-3 py-1.5 text-white text-xs font-bold">
                    🔄 שחזור
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// ===== מודל מנהל - ניהול פרטי תשלום של כל השחקנים =====
const AdminPhonesModal = ({ isOpen, onClose, players, phones, onSave, hiddenPlayers = [], onToggleHidden, onAddPlayer, birthdays = {}, onSaveBirthday, lastLogins = {}, onSwitchToLocks, locksCount = 0 }) => {
  // 🆕 helper - פורמט כניסה אחרונה: "אתמול (28/04)" + צבע לפי פעילות
  const formatLastLogin = (timestamp) => {
    if (!timestamp) return { text: 'טרם נכנס', color: 'text-stone-600 bg-stone-900/30 border-stone-800/40' };
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    const dateStr = `${String(then.getDate()).padStart(2, '0')}/${String(then.getMonth() + 1).padStart(2, '0')}`;
    
    let relText, color;
    if (diffMin < 5) {
      relText = 'עכשיו';
      color = 'text-emerald-300 bg-emerald-950/40 border-emerald-700/40';
    } else if (diffMin < 60) {
      relText = `לפני ${diffMin} דק'`;
      color = 'text-emerald-300 bg-emerald-950/40 border-emerald-700/40';
    } else if (diffHour < 24) {
      relText = `לפני ${diffHour} שע'`;
      color = 'text-emerald-300 bg-emerald-950/40 border-emerald-700/40';
    } else if (diffDay === 1) {
      relText = 'אתמול';
      color = 'text-emerald-300 bg-emerald-950/40 border-emerald-700/40';
    } else if (diffDay < 7) {
      relText = `לפני ${diffDay} ימים`;
      color = 'text-emerald-300 bg-emerald-950/40 border-emerald-700/40';
    } else if (diffDay < 30) {
      relText = `לפני ${diffDay} ימים`;
      color = 'text-amber-300 bg-amber-950/40 border-amber-700/40';
    } else {
      const months = Math.floor(diffDay / 30);
      relText = `לפני ${months} חוד'`;
      color = 'text-rose-300 bg-rose-950/40 border-rose-700/40';
    }
    
    return { text: `${relText} (${dateStr})`, color };
  };
  
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [phone, setPhone] = useState('');
  const [app, setApp] = useState('both');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // 🆕 הוספת שחקן חדש
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addError, setAddError] = useState('');
  // 🎂 עריכת יום הולדת
  const [editingBirthday, setEditingBirthday] = useState(null);
  const [birthdayDay, setBirthdayDay] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [bdayError, setBdayError] = useState('');

  if (!isOpen) return null;

  const startEdit = (name) => {
    const current = phones[name] || {};
    setEditingPlayer(name);
    setPhone(current.phone || '');
    setApp(current.app || 'both');
    setError('');
  };

  const cancelEdit = () => {
    setEditingPlayer(null);
    setPhone('');
    setApp('both');
    setError('');
  };

  const saveEdit = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10 || !digits.startsWith('05')) {
      setError('מספר חייב להיות 10 ספרות, מתחיל ב-05');
      return;
    }
    onSave(editingPlayer, { phone: digits, app });
    cancelEdit();
  };

  const removePhone = (name) => {
    if (!confirm(`למחוק את פרטי התשלום של ${name}?`)) return;
    onSave(name, null);
  };
  
  // 🆕 הוספת שחקן חדש
  const handleAddPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) {
      setAddError('יש להזין שם');
      return;
    }
    if (players.includes(trimmed)) {
      setAddError('שחקן עם שם זה כבר קיים');
      return;
    }
    if (onAddPlayer) {
      onAddPlayer(trimmed);
    }
    setNewPlayerName('');
    setShowAddPlayer(false);
    setAddError('');
  };

  // מיון: קודם מי שיש לו טלפון, ואז מי שאין
  const sortedPlayers = [...players].sort((a, b) => {
    const aHas = !!phones[a]?.phone;
    const bHas = !!phones[b]?.phone;
    if (aHas !== bHas) return aHas ? -1 : 1;
    return a.localeCompare(b, 'he');
  });
  const filtered = sortedPlayers.filter(p => p.includes(search));

  const withPhones = sortedPlayers.filter(p => phones[p]?.phone).length;
  const withoutPhones = sortedPlayers.length - withPhones;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4" dir="rtl">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-purple-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-purple-200 flex items-center gap-2">
            👥 ניהול משתמשים
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* 🆕 סאב-טאבים - מעבר מהיר לנעילות מכשירים */}
        {onSwitchToLocks && (
          <div className="flex gap-2 rounded-xl bg-stone-900/50 border border-stone-800 p-1 mb-4">
            <button
              className="flex-1 rounded-lg py-2 px-3 text-xs font-bold bg-gradient-to-r from-purple-700 to-purple-800 text-white shadow"
            >
              👥 משתמשים
            </button>
            <button
              onClick={onSwitchToLocks}
              className="flex-1 rounded-lg py-2 px-3 text-xs font-bold text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 transition flex items-center justify-center gap-1"
            >
              🔒 נעילות מכשירים
              {locksCount > 0 && <span className="bg-rose-950/50 rounded-full px-1.5 text-[10px]">{locksCount}</span>}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg bg-emerald-950/30 border border-emerald-700/40 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-300">{withPhones}</div>
            <div className="text-xs text-emerald-400">✓ עם טלפון</div>
          </div>
          <div className="rounded-lg bg-amber-950/30 border border-amber-700/40 p-3 text-center">
            <div className="text-2xl font-bold text-amber-300">{withoutPhones}</div>
            <div className="text-xs text-amber-400">⚠️ חסר טלפון</div>
          </div>
        </div>
        
        {/* 🆕 הוספת שחקן חדש */}
        {onAddPlayer && (
          <div className="mb-3">
            {!showAddPlayer ? (
              <button onClick={() => setShowAddPlayer(true)}
                className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold py-2 flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> הוסף שחקן חדש
              </button>
            ) : (
              <div className="rounded-lg bg-emerald-950/40 border border-emerald-700/50 p-3 space-y-2">
                <div className="text-xs text-emerald-300 font-bold">הוספת שחקן חדש</div>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={e => { setNewPlayerName(e.target.value); setAddError(''); }}
                  placeholder="שם השחקן"
                  autoFocus
                  className="w-full rounded bg-stone-800 border border-stone-700 px-3 py-2 text-stone-100 text-sm" />
                {addError && <div className="text-rose-400 text-xs">⚠️ {addError}</div>}
                <div className="flex gap-2">
                  <button onClick={() => { setShowAddPlayer(false); setNewPlayerName(''); setAddError(''); }}
                    className="flex-1 rounded bg-stone-800 px-3 py-1.5 text-stone-300 text-sm font-bold">ביטול</button>
                  <button onClick={handleAddPlayer}
                    className="flex-1 rounded bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-white text-sm font-bold">הוסף</button>
                </div>
              </div>
            )}
          </div>
        )}

        <input
          type="text"
          placeholder="🔍 חיפוש שחקן..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg bg-stone-800 border border-stone-700 px-4 py-2 text-stone-100 mb-3 focus:border-purple-600 focus:outline-none text-sm"
        />

        <div className="space-y-2">
          {filtered.map(name => {
            const data = phones[name];
            const hasPhone = !!data?.phone;
            const isEditing = editingPlayer === name;
            
            if (isEditing) {
              return (
                <div key={name} className="rounded-lg bg-purple-950/40 border border-purple-700/50 p-3 space-y-2">
                  <div className="font-bold text-purple-200">{name}</div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="0501234567"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    className="w-full rounded bg-stone-800 border border-stone-700 px-3 py-2 text-stone-100 tabular-nums text-center"
                    maxLength={10}
                  />
                  {error && <div className="text-rose-400 text-xs">⚠️ {error}</div>}
                  <div className="grid grid-cols-3 gap-1">
                    <button onClick={() => setApp('bit')} className={`rounded px-2 py-1.5 text-xs font-bold ${app === 'bit' ? 'bg-blue-600 text-white' : 'bg-stone-800 text-stone-400'}`}>💙 Bit</button>
                    <button onClick={() => setApp('paybox')} className={`rounded px-2 py-1.5 text-xs font-bold ${app === 'paybox' ? 'bg-purple-600 text-white' : 'bg-stone-800 text-stone-400'}`}>💜 PayBox</button>
                    <button onClick={() => setApp('both')} className={`rounded px-2 py-1.5 text-xs font-bold ${app === 'both' ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-400'}`}>✅ שתיהן</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={cancelEdit} className="flex-1 rounded bg-stone-800 px-3 py-1.5 text-stone-300 text-sm font-bold">ביטול</button>
                    <button onClick={saveEdit} className="flex-1 rounded bg-emerald-700 px-3 py-1.5 text-white text-sm font-bold">שמירה</button>
                  </div>
                </div>
              );
            }
            
            return (
              <div key={name} className={`rounded-lg border p-3 transition ${
                hiddenPlayers.includes(name) ? 'bg-stone-900/30 border-stone-800 opacity-50' :
                hasPhone ? 'bg-stone-800/40 border-stone-700/40' : 'bg-amber-950/20 border-amber-800/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-stone-100 flex items-center gap-2 flex-wrap">
                      {name}
                      {hiddenPlayers.includes(name) && <span className="text-xs text-stone-500">(מוסתר)</span>}
                      {birthdays[name] && editingBirthday !== name && (
                        <button onClick={() => {
                          setEditingBirthday(name);
                          const [d, m] = birthdays[name].split('/');
                          setBirthdayDay(d);
                          setBirthdayMonth(m);
                          setBdayError('');
                        }}
                        className="text-[10px] text-pink-300 bg-pink-950/30 border border-pink-800/40 rounded px-1.5 py-0.5 hover:bg-pink-950/50">
                          🎂 {birthdays[name]}
                        </button>
                      )}
                      {!birthdays[name] && editingBirthday !== name && onSaveBirthday && (
                        <button onClick={() => {
                          setEditingBirthday(name);
                          setBirthdayDay('');
                          setBirthdayMonth('');
                          setBdayError('');
                        }}
                        className="text-[10px] text-stone-500 bg-stone-800/50 border border-stone-700/40 rounded px-1.5 py-0.5 hover:bg-stone-700/50">
                          + יום הולדת
                        </button>
                      )}
                    </div>
                    {hasPhone ? (
                      <div className="text-xs text-stone-400 tabular-nums" dir="ltr">
                        {data.phone.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')}
                        {' · '}
                        {data.app === 'bit' ? '💙' : data.app === 'paybox' ? '💜' : '✅'}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-400">⚠️ חסר טלפון</div>
                    )}
                    {/* 🆕 חיווי כניסה אחרונה */}
                    {(() => {
                      const login = formatLastLogin(lastLogins[name]);
                      return (
                        <div className={`text-[10px] inline-block rounded px-1.5 py-0.5 mt-1 border ${login.color}`}>
                          🕐 {login.text}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* 🆕 כפתור הסתרה/הצגה */}
                    {onToggleHidden && (
                      <button 
                        onClick={() => onToggleHidden(name)} 
                        className="rounded bg-stone-800 px-2 py-1.5 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
                        title={hiddenPlayers.includes(name) ? 'הצג שוב במסך פתיחה' : 'הסתר ממסך פתיחה'}>
                        {hiddenPlayers.includes(name) ? '👁️' : '🚫'}
                      </button>
                    )}
                    <button onClick={() => startEdit(name)} className="rounded bg-purple-700 px-3 py-1.5 text-white text-xs font-bold hover:bg-purple-600">
                      {hasPhone ? 'ערוך' : 'הוסף'}
                    </button>
                    {hasPhone && (
                      <button onClick={() => removePhone(name)} className="rounded bg-stone-800 px-2 py-1.5 text-rose-400 hover:bg-rose-950/50">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 🎂 עריכת יום הולדת */}
                {editingBirthday === name && (
                  <div className="mt-2 pt-2 border-t border-pink-900/30 flex items-center gap-2">
                    <span className="text-xs text-pink-300 font-bold">🎂 יום הולדת:</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={birthdayDay}
                      onChange={e => { setBirthdayDay(e.target.value); setBdayError(''); }}
                      placeholder="יום"
                      className="w-14 rounded bg-stone-800 border border-stone-700 px-2 py-1 text-stone-100 text-sm text-center" />
                    <span className="text-stone-500">/</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={birthdayMonth}
                      onChange={e => { setBirthdayMonth(e.target.value); setBdayError(''); }}
                      placeholder="חודש"
                      className="w-14 rounded bg-stone-800 border border-stone-700 px-2 py-1 text-stone-100 text-sm text-center" />
                    <button onClick={() => {
                      const d = parseInt(birthdayDay);
                      const m = parseInt(birthdayMonth);
                      if (!d || !m || d < 1 || d > 31 || m < 1 || m > 12) {
                        setBdayError('תאריך לא תקין');
                        return;
                      }
                      const formatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
                      onSaveBirthday(name, formatted);
                      setEditingBirthday(null);
                    }}
                      className="rounded bg-emerald-700 px-2 py-1 text-white text-xs font-bold hover:bg-emerald-600">שמור</button>
                    <button onClick={() => setEditingBirthday(null)}
                      className="rounded bg-stone-800 px-2 py-1 text-stone-400 text-xs hover:bg-stone-700">ביטול</button>
                    {birthdays[name] && (
                      <button onClick={() => {
                        onSaveBirthday(name, null);
                        setEditingBirthday(null);
                      }}
                        className="rounded bg-rose-900/50 px-2 py-1 text-rose-300 text-xs hover:bg-rose-900">🗑️</button>
                    )}
                  </div>
                )}
                {editingBirthday === name && bdayError && (
                  <div className="text-rose-400 text-xs mt-1">⚠️ {bdayError}</div>
                )}
              </div>
            );
          })}
        </div>
        
        {filtered.length === 0 && (
          <div className="text-center text-stone-500 py-8">לא נמצאו שחקנים</div>
        )}
      </div>
    </div>
  );
};


// ===== 🎂 פופאפ יום הולדת =====
const BirthdayPopup = ({ name, daysLate = 0, onClose }) => {
  if (!name) return null;
  
  const isLate = daysLate > 0;
  
  // ברכות מגניבות אקראיות
  const blessings = isLate ? [
    `${name}, מזל טוב באיחור! 🎉\nראינו שלא נכנסת ליום הולדתך - אבל לא שכחנו אותך 🃏`,
    `${name}, מזל טוב! 🥳\nיום הולדת שעבר - אבל הברכות לא מתיישנות. שתהיה שנה מנצחת!`,
    `${name} יקר 🎂\nמזל טוב באיחור! שנה של פלאשים ופולים מחכה לך 🍀`,
  ] : [
    `${name}, יום הולדת שמח אלוף! 🎉\nהיום אתה האלוף של היום - גם כשאתה מפסיד 🃏`,
    `${name}, מזל טוב! 🥳\nשהקלפים יפלו לטובתך השנה - וגם הצ'יפים, הביתה!`,
    `${name} יקר 🎂\nשנה של פלאשים, פולים והמון רווחים מהפוקר!`,
    `🎉 יום הולדת ${name}!\nשנה של ניצחונות, צחוקים ותמיד עם A על Q בריבר 🃏`,
    `${name}! יומולדת שמח 🎊\nגם המארח של הערב הבא ישלח לך את הפינוקים על השולחן 🍀`,
    `🥳 ${name}, מזל טוב!\nשהשנה הזאת תהיה שנה של אול-אינים מנצחים בלבד!`,
  ];
  
  const blessing = blessings[Math.floor(Math.random() * blessings.length)];
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" dir="rtl"
      onClick={onClose}>
      <div 
        className="relative w-full max-w-md rounded-3xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #92400e 25%, #fbbf24 50%, #92400e 75%, #fbbf24 100%)',
          backgroundSize: '200% 200%',
          padding: '4px',
          animation: 'shimmer 4s linear infinite',
        }}
        onClick={e => e.stopPropagation()}>
        <div className="rounded-3xl py-8 px-5 relative overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.25) 0%, rgba(28,25,23,0.95) 70%)',
            border: '2px solid rgba(251,191,36,0.5)',
          }}>
          
          {/* קונפטי דקורטיבי */}
          <div className="absolute top-3 right-4 text-2xl animate-bounce" style={{animationDelay: '0s'}}>🎉</div>
          <div className="absolute top-6 left-5 text-xl animate-bounce" style={{animationDelay: '0.3s'}}>🎊</div>
          <div className="absolute top-12 right-8 text-lg animate-bounce" style={{animationDelay: '0.6s'}}>✨</div>
          <div className="absolute bottom-8 left-3 text-2xl animate-bounce" style={{animationDelay: '0.9s'}}>🎈</div>
          <div className="absolute bottom-4 right-6 text-xl animate-bounce" style={{animationDelay: '1.2s'}}>🎁</div>
          
          {/* עוגת יום הולדת SVG עם קלפים */}
          <div className="flex justify-center mb-4" style={{ filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.6))' }}>
            <svg width="180" height="160" viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="cake1" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#f9a8d4"/>
                  <stop offset="100%" stopColor="#be185d"/>
                </linearGradient>
                <linearGradient id="cake2" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#fde68a"/>
                  <stop offset="100%" stopColor="#d97706"/>
                </linearGradient>
                <linearGradient id="cake3" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa"/>
                  <stop offset="100%" stopColor="#5b21b6"/>
                </linearGradient>
                <radialGradient id="flame">
                  <stop offset="0%" stopColor="#fef3c7"/>
                  <stop offset="50%" stopColor="#fbbf24"/>
                  <stop offset="100%" stopColor="#dc2626"/>
                </radialGradient>
              </defs>
              
              {/* בסיס - שלוש שכבות */}
              {/* שכבה תחתונה - הכי גדולה */}
              <ellipse cx="100" cy="155" rx="75" ry="8" fill="#451a03" opacity="0.4"/>
              <rect x="25" y="115" width="150" height="40" rx="6" fill="url(#cake1)"/>
              <rect x="25" y="115" width="150" height="6" fill="#fce7f3"/>
              {/* קלפים על השכבה התחתונה */}
              <g transform="translate(45, 135) rotate(-15)">
                <rect width="14" height="20" rx="2" fill="white" stroke="#1c1917" strokeWidth="0.5"/>
                <text x="3" y="8" fontSize="6" fill="#dc2626" fontWeight="800">A</text>
                <text x="7" y="16" fontSize="7" fill="#dc2626">♥</text>
              </g>
              <g transform="translate(140, 135) rotate(15)">
                <rect width="14" height="20" rx="2" fill="white" stroke="#1c1917" strokeWidth="0.5"/>
                <text x="3" y="8" fontSize="6" fill="#1c1917" fontWeight="800">K</text>
                <text x="7" y="16" fontSize="7" fill="#1c1917">♠</text>
              </g>
              
              {/* שכבה אמצעית */}
              <ellipse cx="100" cy="115" rx="55" ry="5" fill="#451a03" opacity="0.3"/>
              <rect x="45" y="80" width="110" height="35" rx="4" fill="url(#cake2)"/>
              <rect x="45" y="80" width="110" height="5" fill="#fef3c7"/>
              {/* טפטופי קצפת */}
              <path d="M 50 80 Q 55 75 60 80 Q 65 75 70 80 Q 75 75 80 80 Q 85 75 90 80 Q 95 75 100 80 Q 105 75 110 80 Q 115 75 120 80 Q 125 75 130 80 Q 135 75 140 80 Q 145 75 150 80" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
              
              {/* שכבה עליונה */}
              <ellipse cx="100" cy="80" rx="40" ry="4" fill="#451a03" opacity="0.3"/>
              <rect x="65" y="50" width="70" height="30" rx="4" fill="url(#cake3)"/>
              <rect x="65" y="50" width="70" height="5" fill="#ddd6fe"/>
              {/* קלף על העליונה */}
              <g transform="translate(94, 60)">
                <rect width="12" height="17" rx="1.5" fill="white" stroke="#1c1917" strokeWidth="0.5"/>
                <text x="2" y="7" fontSize="5" fill="#dc2626" fontWeight="800">A</text>
                <text x="6" y="13" fontSize="6" fill="#dc2626">♦</text>
              </g>
              
              {/* נר במרכז */}
              <rect x="97" y="35" width="6" height="15" fill="#fbbf24"/>
              <rect x="97" y="35" width="6" height="3" fill="#fef3c7"/>
              {/* להבה */}
              <ellipse cx="100" cy="30" rx="4" ry="7" fill="url(#flame)">
                <animate attributeName="ry" values="7;8;7" dur="0.5s" repeatCount="indefinite"/>
              </ellipse>
              <ellipse cx="100" cy="32" rx="2" ry="4" fill="#fef3c7" opacity="0.8"/>
              
              {/* ניצוצות מסביב */}
              <circle cx="40" cy="50" r="1.5" fill="#fbbf24" opacity="0.8"/>
              <circle cx="160" cy="60" r="1.5" fill="#f9a8d4" opacity="0.8"/>
              <circle cx="30" cy="100" r="2" fill="#a78bfa" opacity="0.8"/>
              <circle cx="170" cy="105" r="1.5" fill="#fef3c7" opacity="0.8"/>
            </svg>
          </div>
          
          {/* כותרת */}
          <div className="text-xs text-amber-400 font-bold tracking-[0.4em] mb-1">★ HAPPY BIRTHDAY ★</div>
          <h2 className="text-3xl font-extrabold mb-3" style={{
            fontFamily: 'Cinzel, serif',
            background: 'linear-gradient(180deg, #fef3c7 0%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '0.05em',
          }}>
            {name}
          </h2>
          
          {/* ברכה */}
          <div className="text-sm leading-relaxed mb-5 whitespace-pre-line px-2" style={{ color: '#fef3c7' }}>
            {blessing}
          </div>
          
          {/* כפתור */}
          <button onClick={onClose}
            className="w-full rounded-xl py-3 px-4 font-extrabold text-base text-white shadow-lg transition hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
              border: '2px solid #fbbf24',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}>
            🎁 תודה רבה! 🥳
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== מודל הזדהות / עריכת פרטי תשלום =====
const PhoneSetupModal = ({ isOpen, onClose, playerName, currentPhone, onSave, isFirstTime = false, canCancel = false, isAdmin = false }) => {
  const [phone, setPhone] = useState('');
  const [app, setApp] = useState('both');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPhone(currentPhone?.phone || '');
      setApp(currentPhone?.app || 'both');
      setError('');
    }
  }, [isOpen, currentPhone]);

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    return digits;
  };

  const validate = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) return 'מספר חייב להיות 10 ספרות';
    if (!digits.startsWith('05')) return 'מספר חייב להתחיל ב-05';
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    onSave({ phone: phone.replace(/\D/g, ''), app });
    onClose();
  };

  if (!isOpen) return null;

  // 🔐 האם הטלפון נעול - אחרי שמולא פעם אחת, רק מנהל יכול לערוך
  const isPhoneLocked = !!currentPhone?.phone && !isFirstTime && !isAdmin;
  // האם ניתן לשנות את האפליקציה - תמיד ניתן (לא רגיש)
  const canEditApp = true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border-2 border-amber-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-6 shadow-2xl">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{isPhoneLocked ? '🔒' : '📱'}</div>
          <h2 className="text-2xl font-extrabold text-amber-200 mb-1">
            {isFirstTime ? `שלום ${playerName}! 👋` : 'פרטי תשלום שלי'}
          </h2>
          <p className="text-stone-400 text-sm">
            {isFirstTime 
              ? 'הזן את מספר הטלפון שלך לצורך העברות עתידיות בביט'
              : isPhoneLocked
              ? 'המספר שלך שמור במערכת לצורך העברות בביט'
              : 'עדכון פרטי התשלום שלך'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-stone-300 mb-2">
              📱 מספר טלפון לביט {isFirstTime && <span className="text-rose-400">*</span>}
              {isPhoneLocked && <span className="text-amber-500 text-xs mr-2">🔒 נעול</span>}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel"
              dir="ltr"
              placeholder="0501234567"
              value={phone}
              onChange={(e) => { 
                const onlyDigits = (e.target.value || '').replace(/[^0-9]/g, '').slice(0, 10);
                setPhone(onlyDigits); 
                setError('');
              }}
              disabled={isPhoneLocked}
              className={`w-full rounded-lg border px-4 py-3 text-lg tabular-nums focus:outline-none text-center transition ${
                isPhoneLocked
                  ? 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                  : 'bg-stone-800 border-stone-700 text-stone-100 focus:border-amber-600'
              }`}
              maxLength={10}
            />
            {error && <div className="text-rose-400 text-xs mt-1 text-right">⚠️ {error}</div>}
            {!isPhoneLocked && (
              <div className="text-stone-500 text-xs mt-1 text-right">10 ספרות, מתחיל ב-05</div>
            )}
            {isPhoneLocked && (
              <div className="text-amber-400/80 text-xs mt-2 text-right bg-amber-950/30 border border-amber-800/30 rounded p-2">
                ℹ️ לעדכון מספר הטלפון - פנה למנהל הקבוצה
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-300 mb-2">
              💸 אפליקציה מועדפת להעברות (אופציונלי)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setApp('bit')}
                className={`rounded-lg px-3 py-2.5 font-bold text-sm transition border ${
                  app === 'bit' ? 'bg-blue-600 text-white border-blue-500' : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
                }`}>
                💙 Bit
              </button>
              <button onClick={() => setApp('paybox')}
                className={`rounded-lg px-3 py-2.5 font-bold text-sm transition border ${
                  app === 'paybox' ? 'bg-purple-600 text-white border-purple-500' : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
                }`}>
                💜 PayBox
              </button>
              <button onClick={() => setApp('both')}
                className={`rounded-lg px-3 py-2.5 font-bold text-sm transition border ${
                  app === 'both' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
                }`}>
                ✅ שתיהן
              </button>
            </div>
            <div className="text-stone-500 text-xs mt-1 text-right">ניתן לשנות בכל זמן</div>
          </div>

          <div className="rounded-lg bg-blue-950/30 border border-blue-700/40 p-3 text-xs text-blue-200">
            💙 <strong>מטרת הטלפון:</strong> ביצוע העברות עתידיות בביט בין חברי הקבוצה אחרי ערבי פוקר. הטלפון נשמר רק במערכת של הקבוצה ולא נחשף לאף גורם חיצוני.
          </div>

          <div className="flex gap-2 pt-2">
            {canCancel && (
              <button onClick={onClose}
                className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-stone-300 hover:bg-stone-800 font-bold">
                {isPhoneLocked ? 'סגור' : 'ביטול'}
              </button>
            )}
            {/* 🆕 כפתור דילוג בכניסה ראשונה - אופציונלי */}
            {isFirstTime && (
              <button onClick={onClose}
                className="rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-stone-400 hover:bg-stone-800 text-sm">
                דלג
              </button>
            )}
            <button onClick={handleSubmit}
              disabled={isPhoneLocked && app === (currentPhone?.app || 'both')}
              className="flex-1 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-3 font-bold text-white hover:from-amber-500 shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              <Check className="h-4 w-4" />
              {isFirstTime ? 'סיימתי' : isPhoneLocked ? 'שמירה' : 'שמירה'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// ===== האפליקציה הראשית =====
export default function PokerApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // השם של המשתמש שנבחר
  const [allSessions, setAllSessions] = useState(ALL_INITIAL_SESSIONS);
  const [handledReminders, setHandledReminders] = useState({}); // טעון מ-Firestore לפי משתמש
  const [hostingSchedule, setHostingSchedule] = useState(HOSTING_SCHEDULE);
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [selectedSeason, setSelectedSeason] = useState(2026);
  const [modalOpen, setModalOpen] = useState(false);
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminName, setAdminName] = useState(null); // null = לא מחובר כמנהל
  // 👑 רמת אדמין: 'super' (סופר אדמין) או 'admin' (אדמין רגיל) או null
  const [adminRole, setAdminRole] = useState(null);
  // ⚙️ הרשאות לאדמין רגיל - {liveSession: true, photoSession: true, ...}
  const [adminPermissions, setAdminPermissions] = useState(getDefaultPermissions());
  // 🔐 hash של סיסמת סופר אדמין (נשמר ב-Firebase, ריק אם טרם הוגדר)
  const [superAdminPasswordHash, setSuperAdminPasswordHash] = useState('');
  // 🔔 מצב הרשאת התראות: 'default' | 'granted' | 'denied' | 'unsupported' | 'unknown'
  const [notificationPermission, setNotificationPermission] = useState('unknown');
  const [notificationBusy, setNotificationBusy] = useState(false);
  // 🔔 הודעת toast חולפת על שינוי הרשאות
  const [permissionsToast, setPermissionsToast] = useState(null);
  // הסתרה אוטומטית של ה-toast אחרי 8 שניות
  useEffect(() => {
    if (!permissionsToast) return;
    const t = setTimeout(() => setPermissionsToast(null), 8000);
    return () => clearTimeout(t);
  }, [permissionsToast]);
  // 🔓 מסך ניהול הרשאות (רק לסופר אדמין)
  const [permissionsManagerOpen, setPermissionsManagerOpen] = useState(false);
  // 📢 שליחת התראה מותאמת
  const [customNotificationOpen, setCustomNotificationOpen] = useState(false);
  // 💸 טעינת handled reminders מ-Firestore כשמשתמש נכנס
  useEffect(() => {
    if (!currentUser) return;
    loadHandledFromFirestore(currentUser).then(data => {
      setHandledReminders(data || {});
    });
  }, [currentUser]);

  // 📊 ניתוח שימוש (סופר אדמין) - אתחול הסשן בכניסת משתמש
  useEffect(() => {
    if (!currentUser) return;
    // Wrap ב-try/catch כדי לוודא שאם משהו נכשל זה לא ישבור את האפליקציה
    try {
      startAnalyticsSession(currentUser);
    } catch (e) {
      console.warn('Analytics init failed:', e);
    }
  }, [currentUser]);
  // 📊 ניתוח שימוש (סופר אדמין) - מסך ניתוח שימוש (סופר אדמין)
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  // 🏆 פופ-אפ ברכת MVP - מופיע פעם אחת לכל סבב
  const [mvpPopupData, setMvpPopupData] = useState(null); // { monthly, quarterly, yearly } או null
  // 🆕 רשימת המנהלים - נטענת מ-Firebase
  const [adminNamesList, setAdminNamesList] = useState(ADMIN_NAMES);
  const [manageAdminsOpen, setManageAdminsOpen] = useState(false);
  // 🆕 רשימת שחקנים מוסתרים (לא יופיעו ברשימות הפעילים)
  const [hiddenPlayers, setHiddenPlayers] = useState([]);
  // 🆕 ימי הולדת של שחקנים {שם: 'DD/MM'}
  const [birthdays, setBirthdays] = useState(DEFAULT_BIRTHDAYS);
  const [birthdayPopup, setBirthdayPopup] = useState(null); // { name, age } או null
  // 🆕 רישום למפגש הבא - מסונכרן ב-Firebase
  const [registration, setRegistration] = useState(null);
  // 📌 רישום ברזל - {players: ['יניב', 'שגיא'], refused: []}
  const [ironRegistration, setIronRegistration] = useState({ players: [], refused: [] });
  // 🔒 הפעלת/כיבוי הטאב גלובלית (אדמין)
  const [registrationEnabled, setRegistrationEnabled] = useState(false);

  // 🔐 נעילות מכשירים: {playerName: {deviceId, lockedAt, userAgent}}
  const [deviceLocks, setDeviceLocks] = useState({});
  // 🆔 מזהה המכשיר הנוכחי (קבוע)
  const [deviceId] = useState(() => getOrCreateDeviceId());
  // 🚫 הודעת חסימה - "השם תפוס במכשיר אחר"
  const [lockBlockedName, setLockBlockedName] = useState(null);
  // 🔐 שם שדורש סיסמת סופר אדמין כדי להיכנס (כשבחרו סופר אדמין במסך "מי אתה?")
  const [superAdminChallenge, setSuperAdminChallenge] = useState(null);
  // 🎭 התחזות לאדמין - שומר את האדמין האמיתי
  // 🎭 התחזות לאדמין - שומר את האדמין האמיתי
  // נשמר ב-localStorage כדי שלא ילך לאיבוד בריענון
  const [impersonating, setImpersonating] = useState(() => {
    try {
      return window.localStorage.getItem('poker_real_admin_name') || null;
    } catch {
      return null;
    }
  });
  // 📋 פאנל אדמין לניהול נעילות
  const [deviceLocksManagerOpen, setDeviceLocksManagerOpen] = useState(false);
  // 🆕 כניסה אחרונה לכל משתמש {שם: timestamp ISO}
  const [lastLogins, setLastLogins] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false); // תפריט המבורגר
  // 📊 ניתוח שימוש - תיעוד מעבר בין טאבים
  useEffect(() => {
    if (!currentUser || !tab) return;
    try {
      trackScreen(tab);
    } catch {}
  }, [tab, currentUser]);
  const [selectedChartPlayers, setSelectedChartPlayers] = useState([]);
  // 🆕 רשימה נפרדת לגרף בלשונית תובנות - כדי שלא תושפע משינויים בדשבורד
  const [insightsChartPlayers, setInsightsChartPlayers] = useState([]);
  const [chartFullscreen, setChartFullscreen] = useState(false);
  
  // 📡 שידור חי - מצב מקומי
  const [liveBroadcast, setLiveBroadcast] = useState(null);
  const [broadcastViewerOpen, setBroadcastViewerOpen] = useState(false);
  const [broadcastDismissed, setBroadcastDismissed] = useState(false); // המשתמש סגר את הצופה
  // 🍻 מסך אישור אירוח - מופיע למארח שצריך לאשר אירוח עתידי
  const [hostReminderModal, setHostReminderModal] = useState(null); // { sessionDate, sessionHost } או null
  // 🆕 סאב-טאב בתוך טאב "אירוח/רישום" - 'registration' או 'hosting'
  const [registrationSubTab, setRegistrationSubTab] = useState('registration');
  const [isMobile, setIsMobile] = useState(false);
  
  // ציטוטים
  const [deletedQuoteIds, setDeletedQuoteIds] = useState([]);
  const [quoteLikes, setQuoteLikes] = useState({}); // {quoteId: count}
  const [userQuotes, setUserQuotes] = useState([]); // ציטוטים שנוספו על-ידי משתמשים
  
  // גלריית ידיים מנצחות
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLikes, setGalleryLikes] = useState({});
  
  // 🆕 פרטי תשלום של שחקנים: { 'רון': { phone: '0501234567', app: 'bit' }, ... }
  const [phones, setPhones] = useState({});
  
  // 💸 תזכורות תשלום
  const [paymentReminders, setPaymentReminders] = useState([]);
  
  useEffect(() => {
    setPaymentReminders(loadPaymentReminders());
    const interval = setInterval(() => {
      setPaymentReminders(loadPaymentReminders());
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // 🔧 v2.33.35 - תיקון אוטומטי של תזכורות אירוח שגויות
  // הבעיה: בערבים שנשמרו לפני התיקון, hostingPayment.recipient יכול להיות שונה
  // ממארח האמיתי של הערב (בגלל הבאג בסנכרון). מתקנים את התזכורות הקיימות לפי
  // מקור האמת - הערב ההיסטורי ב-Firestore (שדה host).
  useEffect(() => {
    if (!allSessions || allSessions.length === 0) return;
    if (!paymentReminders || paymentReminders.length === 0) return;
    
    // בונים מילון מהיר: date → host (הערב ההיסטורי, מקור האמת)
    const sessionHostByDate = {};
    allSessions.forEach(s => {
      if (s.date && s.host) {
        sessionHostByDate[s.date] = s.host;
      }
    });
    
    let needsUpdate = false;
    const fixed = paymentReminders.map(r => {
      // רק תזכורות אירוח (לא settlement)
      if (r.type !== 'hosting') return r;
      // 🔧 v2.33.38: לא מתקנים תזכורות ארכיוניות (כבר העברתי) או טופלו
      if (r.status === 'archived' || r.status === 'confirmed') return r;
      const correctHost = sessionHostByDate[r.sessionDate];
      // אם הערב לא קיים בהיסטוריה - לא נוגעים
      if (!correctHost) return r;
      // אם המקבל בתזכורת לא תואם למארח בהיסטוריה - מתקנים
      if (r.to !== correctHost) {
        needsUpdate = true;
        console.log(`🔧 תיקון תזכורת אירוח: ${r.sessionDate} - מקבל שונה מ-${r.to} ל-${correctHost}`);
        return { ...r, to: correctHost, autoFixed: true };
      }
      return r;
    });
    
    if (needsUpdate) {
      savePaymentReminders(fixed);
      setPaymentReminders(fixed);
    }
  }, [allSessions, paymentReminders.length]); // רץ כשהערבים נטענים או כשמספר התזכורות משתנה
  
  // 🆕 רענון יומי - מאלץ re-render בחצות כדי שהמארח הבא יתעדכן
  // משתנה todayKey משתנה כשתאריך ישראל משתנה
  const [todayKey, setTodayKey] = useState(() => getTodayIsrael());
  useEffect(() => {
    const checkDateChange = () => {
      const newToday = getTodayIsrael();
      if (newToday !== todayKey) {
        setTodayKey(newToday);
      }
    };
    // בדיקה כל דקה - רץ בלי תלות במכשיר
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [todayKey]);
  
  // 📡 שידור חי - polling לבדוק אם יש שידור פעיל
  // רץ כל 15 שניות, ובודק את התנאים: שעות + יום אירוח
  useEffect(() => {
    let cancelled = false;
    
    const checkBroadcast = async () => {
      try {
        const broadcast = await loadLiveBroadcast();
        console.log('📺 viewer check - loaded broadcast:', broadcast);
        if (cancelled) return;
        
        if (!broadcast || !broadcast.active) {
          console.log('📺 viewer: no active broadcast');
          setLiveBroadcast(null);
          setBroadcastViewerOpen(false);
          // 🆕 איפוס dismissed - כדי שאם השידור יחזור, יוצג שוב
          setBroadcastDismissed(false);
          return;
        }
        
        // 🔧 v2.33.36: השידור פעיל כל עוד broadcast.active=true
        // ללא תלות בשעה או ביום אירוח. זה מונע סגירה אוטומטית בחצות
        // כשהמשחק עוד בעיצומו. הלייב מסתיים רק כשהאדמין לוחץ "שמור ערב"
        // (clearLiveBroadcast עושה active=false).
        // testMode עדיין קיים לצורכי בדיקה - אבל לא משפיע על התנאים יותר.
        
        setLiveBroadcast(broadcast);
        
        // אם המנהל הנוכחי הוא ששידר - לא להציג צופה אצלו (הוא רואה את LiveSessionModal)
        const isAdminBroadcasting = broadcast.adminName === currentUser;
        console.log('📺 viewer: isAdminBroadcasting=', isAdminBroadcasting, 'currentUser=', currentUser, 'adminName=', broadcast.adminName);
        
        if (!isAdminBroadcasting && !broadcastDismissed) {
          console.log('📺 viewer: OPENING viewer!');
          setBroadcastViewerOpen(true);
        }
      } catch (e) {
        console.error('📺 viewer check error:', e);
      }
    };
    
    // בדיקה ראשונה
    checkBroadcast();
    
    // polling
    const interval = setInterval(checkBroadcast, 15000);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [hostingSchedule, currentUser, broadcastDismissed]);
  
  // 🍻 בדיקה אם יש תזכורת אירוח ממתינה למשתמש הנוכחי
  // 1. בודק URL params (אם המשתמש לחץ על התראה)
  // 2. בודק ב-Firestore אם יש תזכורת לא-נענתה למשתמש
  useEffect(() => {
    if (!currentUser) return;
    
    const checkHostReminder = async () => {
      try {
        // קודם - בדיקה ב-URL (אם הגיע מהתראה)
        const params = new URLSearchParams(window.location.search);
        const reminderDate = params.get('reminder_date');
        const reminderHost = params.get('reminder_host');
        
        if (reminderDate && reminderHost === currentUser) {
          // המשתמש הנוכחי הוא המארח של התזכורת בURL
          setHostReminderModal({ sessionDate: reminderDate, sessionHost: currentUser, fromUrl: true });
          // ניקוי URL
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }
        
        // אחרת - בדיקה ב-Firestore אם יש תזכורת ממתינה
        const reminders = await fbLoadState(HOST_REMINDERS_KEY);
        if (!reminders || typeof reminders !== 'object') return;
        
        // חיפוש תזכורת שלא נענתה ושייכת למשתמש הנוכחי
        for (const key in reminders) {
          const r = reminders[key];
          if (r.sessionHost === currentUser && r.response === null) {
            // לא לפתוח אם כבר פתחנו את המודל
            if (!hostReminderModal) {
              setHostReminderModal({ 
                sessionDate: r.sessionDate, 
                sessionHost: r.sessionHost,
                reminderKey: key
              });
            }
            return;
          }
        }
      } catch (e) {
        console.error('שגיאה בבדיקת תזכורת אירוח:', e);
      }
    };
    
    checkHostReminder();
  }, [currentUser]);
  
  // 🏆 חישוב ושמירה של MVP - רץ כשהאפליקציה נטענת ויש sessions
  // בודק האם MVP של החודש/רבעון/שנה שעברו כבר חושב ונשמר ב-Firestore
  // אם לא - מחשב ושומר. ה-Cloud Function תקרא את הנתונים האלה ותשלח התראה.
  useEffect(() => {
    if (!allSessions || allSessions.length === 0) return;
    
    const calculateAndSaveMVPs = async () => {
      try {
        const existing = (await fbLoadState(MVP_RESULTS_KEY)) || {};
        let updated = false;
        
        // 🛠️ פונקציית עזר - חישוב MVP
        const computeMVPLocal = (sessions) => {
          if (sessions.length === 0) return null;
          const totals = {};
          sessions.forEach(s => {
            Object.entries(s.results || {}).forEach(([name, amount]) => {
              totals[name] = (totals[name] || 0) + Number(amount);
            });
          });
          const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
          if (sorted.length === 0) return null;
          const [winner, profit] = sorted[0];
          return { name: winner, profit, sessionsCount: sessions.length };
        };
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        const currentQuarter = Math.floor(currentMonth / 3) + 1; // 1-4
        
        // 🏆 MVP חודשי - של החודש שעבר
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthYear = lastMonthDate.getFullYear();
        const lastMonth = lastMonthDate.getMonth();
        const monthKey = `month_${lastMonthYear}_${String(lastMonth + 1).padStart(2, '0')}`;
        
        if (!existing[monthKey]) {
          // לא חושב עדיין - מחשבים
          const lastMonthSessions = allSessions.filter(s => {
            if (!s.date) return false;
            const d = new Date(s.date);
            return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
          });
          
          if (lastMonthSessions.length > 0) {
            const mvp = computeMVPLocal(lastMonthSessions);
            if (mvp) {
              const monthName = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'][lastMonth];
              existing[monthKey] = {
                type: 'monthly',
                year: lastMonthYear,
                month: lastMonth + 1,
                monthName,
                ...mvp,
                computedAt: new Date().toISOString(),
                notificationSent: false,
              };
              updated = true;
              console.log(`🏆 MVP חודשי נוסף: ${monthName} ${lastMonthYear} - ${mvp.name} (+${mvp.profit})`);
            }
          }
        }
        
        // 🏆 MVP רבעוני - של הרבעון שעבר (אם החודש הוא 1, 4, 7, 10)
        if ([0, 3, 6, 9].includes(currentMonth)) {
          // אנחנו בתחילת רבעון חדש - בודקים את הרבעון הקודם
          let lastQuarter, lastQuarterYear;
          if (currentMonth === 0) {
            lastQuarter = 4;
            lastQuarterYear = currentYear - 1;
          } else {
            lastQuarter = currentQuarter - 1;
            lastQuarterYear = currentYear;
          }
          const quarterKey = `quarter_${lastQuarterYear}_Q${lastQuarter}`;
          
          if (!existing[quarterKey]) {
            const startMonth = (lastQuarter - 1) * 3;
            const endMonth = startMonth + 2;
            const quarterSessions = allSessions.filter(s => {
              if (!s.date) return false;
              const d = new Date(s.date);
              return d.getFullYear() === lastQuarterYear && d.getMonth() >= startMonth && d.getMonth() <= endMonth;
            });
            
            if (quarterSessions.length > 0) {
              const mvp = computeMVPLocal(quarterSessions);
              if (mvp) {
                existing[quarterKey] = {
                  type: 'quarterly',
                  year: lastQuarterYear,
                  quarter: lastQuarter,
                  ...mvp,
                  computedAt: new Date().toISOString(),
                  notificationSent: false,
                };
                updated = true;
                console.log(`🏆 MVP רבעוני נוסף: Q${lastQuarter} ${lastQuarterYear} - ${mvp.name} (+${mvp.profit})`);
              }
            }
          }
        }
        
        // 🏆 MVP שנתי - אם זה ינואר
        if (currentMonth === 0) {
          const lastYear = currentYear - 1;
          const yearKey = `year_${lastYear}`;
          
          if (!existing[yearKey]) {
            const yearSessions = allSessions.filter(s => {
              if (!s.date) return false;
              const d = new Date(s.date);
              return d.getFullYear() === lastYear;
            });
            
            if (yearSessions.length > 0) {
              const mvp = computeMVPLocal(yearSessions);
              if (mvp) {
                existing[yearKey] = {
                  type: 'yearly',
                  year: lastYear,
                  ...mvp,
                  computedAt: new Date().toISOString(),
                  notificationSent: false,
                };
                updated = true;
                console.log(`🏆 MVP שנתי נוסף: ${lastYear} - ${mvp.name} (+${mvp.profit})`);
              }
            }
          }
        }
        
        if (updated) {
          await fbSaveState(existing, MVP_RESULTS_KEY);
          console.log('✅ MVP results נשמרו ב-Firestore');
        }
      } catch (e) {
        console.error('שגיאה בחישוב MVP:', e);
      }
    };
    
    calculateAndSaveMVPs();
  }, [allSessions]);
  
  // 🏆 בדיקה: האם יש MVPs ש-currentUser לא ראה עדיין? (פופ-אפ ברכה)
  // ⚠️ ממתין: אם יש קונפטי זכייה שעדיין לא נראה - דוחה את ה-MVP עד שהזכייה תיגמר
  useEffect(() => {
    if (!currentUser) return;
    
    const checkMVPPopup = async () => {
      try {
        // 🚰 בדיקה: האם יש קונפטי זכייה שעדיין לא נראה?
        // אם כן - לא מציגים MVP popup עכשיו, יקפוץ בפעם הבאה
        if (allSessions && allSessions.length > 0) {
          const sortedSessions = [...allSessions].sort((a, b) => new Date(b.date) - new Date(a.date));
          const lastSession = sortedSessions.find(s => s.results && typeof s.results[currentUser] === 'number');
          if (lastSession) {
            const myProfit = Number(lastSession.results[currentUser]) || 0;
            if (myProfit > 0) {
              const sessionKey = `${lastSession.date}_${lastSession.season || 2026}`;
              const seenKey = `confetti_seen_${currentUser}_${sessionKey}`;
              const alreadySeen = window.localStorage.getItem(seenKey);
              if (!alreadySeen) {
                console.log('🚰 קונפטי זכייה ימתין להיגמר לפני שיוצג MVP popup');
                return; // אל תציג MVP - תן לקונפטי הזכייה להיות ראשון
              }
            }
          }
        }
        
        const mvpData = await fbLoadState(MVP_RESULTS_KEY);
        if (!mvpData || typeof mvpData !== 'object') return;
        
        // localStorage key לכל משתמש - איזה MVPs כבר ראה
        const seenKey = `mvp_seen_${currentUser}`;
        const seenIds = JSON.parse(localStorage.getItem(seenKey) || '[]');
        
        // איסוף MVPs שעדיין לא ראינו
        const monthly = Object.entries(mvpData)
          .filter(([k, v]) => v.type === 'monthly' && !seenIds.includes(k))
          .sort(([, a], [, b]) => new Date(b.computedAt) - new Date(a.computedAt))[0];
        
        const quarterly = Object.entries(mvpData)
          .filter(([k, v]) => v.type === 'quarterly' && !seenIds.includes(k))
          .sort(([, a], [, b]) => new Date(b.computedAt) - new Date(a.computedAt))[0];
        
        const yearly = Object.entries(mvpData)
          .filter(([k, v]) => v.type === 'yearly' && !seenIds.includes(k))
          .sort(([, a], [, b]) => new Date(b.computedAt) - new Date(a.computedAt))[0];
        
        if (!monthly && !quarterly && !yearly) return;
        
        // יש דברים להראות
        setMvpPopupData({
          monthly: monthly ? { key: monthly[0], ...monthly[1] } : null,
          quarterly: quarterly ? { key: quarterly[0], ...quarterly[1] } : null,
          yearly: yearly ? { key: yearly[0], ...yearly[1] } : null,
        });
      } catch (e) {
        console.error('שגיאה בבדיקת MVP popup:', e);
      }
    };
    
    // מעט עיכוב כדי שהאפליקציה תספיק להיטען
    const timer = setTimeout(checkMVPPopup, 2000);
    return () => clearTimeout(timer);
  }, [currentUser, allSessions]);
  
  // 💸 סנכרון אוטומטי תזכורות - מבוסס Firestore לחלוטין
  useEffect(() => {
    if (!allSessions || allSessions.length === 0) return;
    if (!currentUser) return;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentSessions = allSessions.filter(s => {
        if (!s.results || !s.date) return false;
        if (s.isTestEvening) return false;
        return new Date(s.date) >= sevenDaysAgo;
      });
      
      if (recentSessions.length === 0) return;

      // בניית כל התזכורות האפשריות
      const allPossible = [];
      const seenIds = new Set();
      recentSessions.forEach(session => {
        const reminders = buildRemindersFromSession(session);
        reminders.forEach(r => {
          if (seenIds.has(r.id)) return; // מניעת כפולות לפי id דטרמיניסטי
          seenIds.add(r.id);
          allPossible.push(r);
        });
      });

      // סינון: הסר תזכורות שכבר טופלו (לפי Firestore)
      const filtered = allPossible.filter(r => !handledReminders[r.id]);

      // שמור ב-localStorage לתצוגה
      savePaymentReminders(filtered);
      setPaymentReminders(filtered);
    } catch (e) {
      console.warn('Failed to auto-sync reminders:', e);
    }
  }, [allSessions, currentUser, handledReminders]);
  
  const handleUpdateReminders = (newReminders) => {
    setPaymentReminders(newReminders);
    savePaymentReminders(newReminders);
  };
  
  // 🆕 מצב מסך הזדהות (טלפון) - מוצג למשתמש חדש שאין לו טלפון
  const [phoneSetupOpen, setPhoneSetupOpen] = useState(false);
  
  // 🆕 מודל עריכת פרטי תשלום (פעולה יזומה מהדשבורד)
  const [phoneEditOpen, setPhoneEditOpen] = useState(false);
  
  // 🆕 מודל מנהל - ניהול טלפונים של כל השחקנים
  const [adminPhonesOpen, setAdminPhonesOpen] = useState(false);
  // 🆕 שם השחקן שהמנהל עורך כעת
  const [adminEditingPhone, setAdminEditingPhone] = useState(null);
  
  // 🆕 גיבויים - מודל ניהול גיבויים
  const [backupsModalOpen, setBackupsModalOpen] = useState(false);
  const [registrationManagerOpen, setRegistrationManagerOpen] = useState(false); // 🆕 v2.33.39 - דיאלוג ניהול רישום
  const [backupsList, setBackupsList] = useState([]); // רשימת snapshots ב-Firebase
  
  // האם יש ערב פעיל בניהול חי
  const [hasLiveSession, setHasLiveSession] = useState(false);
  
  // בודק כל כמה שניות אם יש ערב פעיל באחסון
  useEffect(() => {
    const check = () => {
      try {
        const saved = window.localStorage.getItem('poker_live_session_v1');
        if (saved) {
          const state = JSON.parse(saved);
          setHasLiveSession(!!(state.participants && state.participants.length > 0));
        } else {
          setHasLiveSession(false);
        }
      } catch { setHasLiveSession(false); }
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [liveModalOpen]);

  // זיהוי מובייל
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // טעינת נתונים מהאחסון
  useEffect(() => {
    (async () => {
      const saved = await loadState(STORAGE_KEY);
      if (saved?.sessions) {
        // 🆕 מאחד את הסשנים מהקובץ (היסטוריה) עם הסשנים השמורים ב-Firebase
        // אם יש כפילויות לפי תאריך+עונה - הגרסה מ-Firebase מנצחת (עדכונים)
        const fileSessionsKey = (s) => `${s.date}_${s.season || 2026}`;
        // רק סשנים מ-2026 ומעלה מ-Firestore גוברים על sessions.json
        const firestoreSessions = saved.sessions.filter(s => (s.season || 2026) >= 2026);
        const savedKeys = new Set(firestoreSessions.map(fileSessionsKey));
        const historyOnly = ALL_INITIAL_SESSIONS.filter(s => !savedKeys.has(fileSessionsKey(s)));
        setAllSessions([...historyOnly, ...firestoreSessions]);
        if (saved.players) setPlayers(saved.players);
      }
      if (saved?.hostingSchedule) setHostingSchedule(saved.hostingSchedule);
      if (saved?.phones) setPhones(saved.phones);
      
      // 🆕 טעינת רשימת מנהלים
      const savedAdmins = await loadState(ADMIN_NAMES_KEY);
      if (Array.isArray(savedAdmins) && savedAdmins.length > 0) {
        setAdminNamesList(savedAdmins);
      }
      
      // 🆕 טעינת רשימת שחקנים מוסתרים
      const savedHidden = await loadState(HIDDEN_PLAYERS_KEY);
      if (Array.isArray(savedHidden)) {
        setHiddenPlayers(savedHidden);
      }
      
      // 🆕 טעינת ימי הולדת
      const savedBirthdays = await loadState(BIRTHDAYS_KEY);
      if (savedBirthdays && typeof savedBirthdays === 'object') {
        // מאחד את הדיפולט עם השמורים (השמורים מנצחים על שינויים)
        setBirthdays({ ...DEFAULT_BIRTHDAYS, ...savedBirthdays });
      }
      
      // 🆕 טעינת כניסות אחרונות
      const savedLogins = await loadState(LAST_LOGIN_KEY);
      if (savedLogins && typeof savedLogins === 'object') {
        setLastLogins(savedLogins);
      }
      
      const savedQuotes = await loadState(QUOTES_STORAGE_KEY);
      if (savedQuotes?.deletedIds) setDeletedQuoteIds(savedQuotes.deletedIds);
      if (savedQuotes?.likes) setQuoteLikes(savedQuotes.likes);
      if (savedQuotes?.userQuotes) setUserQuotes(savedQuotes.userQuotes);
      
      const savedGallery = await loadState(GALLERY_STORAGE_KEY);
      if (savedGallery?.images && savedGallery.images.length > 0) {
        // יש כבר תמונות שמורות
        setGalleryImages(savedGallery.images);
        if (savedGallery.likes) setGalleryLikes(savedGallery.likes);
      } else {
        // גלריה ריקה - ננסה לטעון תמונות-זרע מהשרת
        try {
          const response = await fetch('/seed-gallery/_metadata.json');
          if (response.ok) {
            const seedMeta = await response.json();
            const seedImages = seedMeta.map(item => ({
              id: item.id,
              dataUrl: item.url,  // URL במקום base64
              note: item.note,
              uploadedBy: item.uploadedBy,
              createdAt: item.createdAt,
              isSeed: true
            }));
            setGalleryImages(seedImages);
            // שמירה כדי שלא נטען שוב
            await saveState({ images: seedImages, likes: {} }, GALLERY_STORAGE_KEY);
          }
        } catch (e) {
          // אין תמונות-זרע - גלריה ריקה (זה בסדר)
          console.log('No seed gallery available');
        }
      }
      
      // 🆕 טעינת מצב הרישום למפגש הבא
      try {
        const savedReg = await loadState(REGISTRATION_KEY);
        if (savedReg) setRegistration(savedReg);
        const savedRegEnabled = await loadState(REGISTRATION_ENABLED_KEY);
        if (savedRegEnabled?.enabled) setRegistrationEnabled(true);

        // 📌 טעינת רישום ברזל
        const savedIron = await loadState(IRON_REGISTRATION_KEY);
        if (savedIron && typeof savedIron === 'object') {
          setIronRegistration({ 
            players: savedIron.players || [], 
            refused: savedIron.refused || [] 
          });
        }
      } catch {}
      
      // 🔐 טעינת נעילות מכשירים
      let currentLocks = {};
      try {
        const savedLocks = await loadState(DEVICE_LOCKS_KEY);
        if (savedLocks && typeof savedLocks === 'object') {
          currentLocks = savedLocks;
          setDeviceLocks(savedLocks);
        }
      } catch {}
      
      // טעינת המשתמש שנבחר בעבר
      try {
        const savedUser = window.localStorage.getItem('poker_user_name');
        if (savedUser) {
          // 🔐 בדיקת נעילת מכשיר
          const userLock = currentLocks[savedUser];
          const isSuperAdminUser = SUPER_ADMINS.includes(savedUser);
          const isMyDevice = userLock && userLock.deviceId === deviceId;
          
          // 👑 סופר אדמין: כניסה אוטומטית רק אם המכשיר הזה כבר נעול אליו
          // (אחרת יראה את מסך "מי אתה?" וידרוש סיסמה)
          if (isSuperAdminUser && !isMyDevice) {
            try { 
              window.localStorage.removeItem('poker_user_name');
              window.localStorage.removeItem('poker_admin_name');
              window.localStorage.removeItem('poker_admin_role');
            } catch {}
            setShowSplash(false);
          } else if (userLock && userLock.deviceId !== deviceId && !isSuperAdminUser) {
            // השם נעול במכשיר אחר! - לא מאפשרים כניסה
            try { 
              window.localStorage.removeItem('poker_user_name');
              window.localStorage.removeItem('poker_admin_name');
            } catch {}
            setLockBlockedName(savedUser);
            setShowSplash(false);
          } else {
            setCurrentUser(savedUser);
            setShowSplash(false); // אם כבר נכנסת בעבר, מדלגים על הספלאש
            
            // 🔐 הצמדה אוטומטית למכשיר הנוכחי (אם עדיין לא נעול)
            if (!userLock) {
              const newLock = {
                deviceId,
                lockedAt: new Date().toISOString(),
                userAgent: (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent.slice(0, 200) : '',
                autoLocked: true, // סימון - נעילה אוטומטית של משתמש קיים
              };
              const updatedLocks = { ...currentLocks, [savedUser]: newLock };
              currentLocks = updatedLocks;
              setDeviceLocks(updatedLocks);
              try { await saveState(updatedLocks, DEVICE_LOCKS_KEY); } catch {}
            }
            
            // 🆕 עדכון זמן כניסה אחרון - לטעינה אוטומטית
            const now = new Date().toISOString();
            const baseLogins = (savedLogins && typeof savedLogins === 'object') ? savedLogins : {};
            const updatedLogins = { ...baseLogins, [savedUser]: now };
            setLastLogins(updatedLogins);
            try { await saveState(updatedLogins, LAST_LOGIN_KEY); } catch {}
          }
        }
        const savedAdmin = window.localStorage.getItem('poker_admin_name');
        const savedRole = window.localStorage.getItem('poker_admin_role');
        if (savedAdmin) {
          setAdminName(savedAdmin);
          // 👑 אם יש role שמור - השתמש בו, אחרת ברירת מחדל אדמין רגיל
          // אם המשתמש הוא בסופר אדמינים והיה מחובר - שמירה על הרמה
          if (savedRole === 'super' && SUPER_ADMINS.includes(savedAdmin)) {
            setAdminRole('super');
          } else {
            setAdminRole('admin');
          }
        }
      } catch {}
      
      // 🆕 טעינת הרשאות אדמין רגיל מ-Firebase
      try {
        const savedPerms = await loadState(ADMIN_PERMISSIONS_KEY);
        if (savedPerms && typeof savedPerms === 'object') {
          // איחוד עם ברירות מחדל - אם נוסף פיצ'ר חדש אחר-כך, יקבל ברירת מחדל
          setAdminPermissions({ ...getDefaultPermissions(), ...savedPerms });
        }
      } catch {}
      
      // 🔐 טעינת hash סיסמת סופר אדמין מ-Firebase
      try {
        const savedHash = await loadState(SUPER_ADMIN_PASSWORD_KEY);
        if (savedHash && typeof savedHash === 'object' && savedHash.hash) {
          setSuperAdminPasswordHash(savedHash.hash);
        }
      } catch {}
      
      setLoading(false);
    })();
  }, []);

  const sessions = useMemo(() => allSessions.filter(s => (s.season || 2026) === selectedSeason), [allSessions, selectedSeason]);
  const stats = useMemo(() => calculateStats(sessions, players), [sessions, players]);
  
  // 🆕 בודק אם משתמש קיים שאין לו טלפון - הצגת מסך הזדהות
  // 🆕 רק פעם אחת בכניסה - אם המשתמש דילג, לא נציג שוב
  const [phoneSetupShown, setPhoneSetupShown] = useState(false);
  useEffect(() => {
    if (!loading && currentUser && !phoneSetupOpen && !phoneSetupShown) {
      const userPhone = phones[currentUser];
      if (!userPhone || !userPhone.phone) {
        setPhoneSetupOpen(true);
        setPhoneSetupShown(true);
      }
    }
  }, [loading, currentUser, phones, phoneSetupShown]);
  
  // 🎂 בדיקה אם היום יום הולדת של המשתמש המחובר (או בתוך 7 ימים אחרי)
  const [birthdayShownToday, setBirthdayShownToday] = useState(false);
  useEffect(() => {
    if (loading || !currentUser || birthdayShownToday) return;
    const userBday = birthdays[currentUser];
    if (!userBday) return;
    
    const today = new Date();
    const [bdayDay, bdayMonth] = userBday.split('/').map(Number);
    
    // יום ההולדת השנה
    let bdayThisYear = new Date(today.getFullYear(), bdayMonth - 1, bdayDay);
    bdayThisYear.setHours(0, 0, 0, 0);
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    // האם יום ההולדת היה ב-7 הימים האחרונים (כולל היום)?
    const diffDays = Math.floor((todayStart - bdayThisYear) / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= 7) {
      // בודק שלא הוצג השנה (localStorage)
      const lastShownKey = `poker_bday_shown_${currentUser}_${today.getFullYear()}`;
      const alreadyShown = window.localStorage.getItem(lastShownKey);
      if (!alreadyShown) {
        setBirthdayPopup({ name: currentUser, daysLate: diffDays });
        setBirthdayShownToday(true);
        try { window.localStorage.setItem(lastShownKey, '1'); } catch {}
      }
    }
  }, [loading, currentUser, birthdays, birthdayShownToday]);
  
  // רשימת שחקנים ממוינת לפי מספר מפגשים בכל ההיסטוריה (מהפעיל ביותר לפחות פעיל)
  const sortedPlayers = useMemo(() => {
    const counts = {};
    players.forEach(p => { counts[p] = 0; });
    // סופרים מפגשים מכל העונות, לא רק העונה הנוכחית
    allSessions.forEach(s => {
      Object.keys(s.results || {}).forEach(name => {
        if (counts[name] !== undefined) counts[name]++;
      });
    });
    // מיון: הכי הרבה מפגשים למעלה; שווה - לפי סדר אלפביתי
    return [...players].sort((a, b) => {
      if (counts[b] !== counts[a]) return counts[b] - counts[a];
      return a.localeCompare(b, 'he');
    });
  }, [players, allSessions]);
  
  // 🆕 רשימת שחקנים פעילים (ללא מוסתרים) - לבחירה במסכים פעילים
  const activePlayers = useMemo(() => {
    return players.filter(p => !hiddenPlayers.includes(p));
  }, [players, hiddenPlayers]);
  
  // 🆕 רשימת שחקנים פעילים מסודרת - למסך "מי אתה?"
  const sortedActivePlayers = useMemo(() => {
    return sortedPlayers.filter(p => !hiddenPlayers.includes(p));
  }, [sortedPlayers, hiddenPlayers]);
  
  const availableSeasons = useMemo(() => {
    const s = new Set(allSessions.map(s => s.season || 2026));
    return Array.from(s).sort((a, b) => b - a);
  }, [allSessions]);

  useEffect(() => {
    if (stats.length === 0) return;
    
    // אם currentUser זמין וקיים ב-stats - תמיד נכנס אליו
    if (currentUser && stats.find(p => p.name === currentUser)) {
      setSelectedChartPlayers([currentUser]);
    } else if (selectedChartPlayers.length === 0 && stats[0]) {
      // אין currentUser זמין - מציג את הטופ
      setSelectedChartPlayers([stats[0].name]);
    }
  }, [currentUser]); // רץ בכל החלפת משתמש
  
  // 🆕 לוגיקה דומה לגרף התובנות - state נפרד
  // מתעדכן בכל פעם שהמשתמש משתנה (לא רק באתחול)
  useEffect(() => {
    if (currentUser) {
      // תמיד להגדיר את המשתמש הנוכחי - גם אם כבר היה אחר
      setInsightsChartPlayers([currentUser]);
    } else if (insightsChartPlayers.length === 0 && stats[0]) {
      // אין משתמש מחובר - דיפולט ראשון בטבלה
      setInsightsChartPlayers([stats[0].name]);
    }
  }, [currentUser]);

  const persistSessions = async (sessions, players, hostingScheduleParam, phonesParam) => {
    setSyncing(true);
    await saveState({ 
      sessions, 
      players, 
      hostingSchedule: hostingScheduleParam || hostingSchedule,
      phones: phonesParam || phones
    }, STORAGE_KEY);
    setSyncing(false);
  };

  // 🆕 שמירת פרטי תשלום של שחקן
  const persistPhones = async (newPhones) => {
    setPhones(newPhones);
    setSyncing(true);
    await saveState({ 
      sessions: allSessions, 
      players, 
      hostingSchedule,
      phones: newPhones
    }, STORAGE_KEY);
    setSyncing(false);
  };

  // 🆕 שמירת פרטי תשלום של שחקן בודד (משתמש מעדכן את עצמו או מנהל מעדכן אחר)
  const handleSavePhone = async (playerName, phoneData) => {
    const newPhones = { ...phones };
    if (phoneData === null) {
      delete newPhones[playerName];
    } else {
      newPhones[playerName] = phoneData;
    }
    await persistPhones(newPhones);
  };

  // 🆕 ===== מערכת גיבויים =====
  
  // יוצר אובייקט גיבוי מלא של כל הנתונים
  const buildBackupSnapshot = () => {
    const snapshot = {
      version: 4,
      timestamp: new Date().toISOString(),
      app: {
        sessions: allSessions,
        players: players,
        hostingSchedule: hostingSchedule,
        phones: phones,
      },
      quotes: {
        deletedIds: deletedQuoteIds,
        likes: quoteLikes,
        userQuotes: userQuotes,
      },
      gallery: {
        images: galleryImages,
        likes: galleryLikes,
      },
      meta: {
        sessionsCount: allSessions.length,
        playersCount: players.length,
        hostingCount: hostingSchedule.length,
        phonesCount: Object.keys(phones).length,
        quotesCount: ALL_QUOTES.length - deletedQuoteIds.length + userQuotes.length,
        galleryCount: galleryImages.length,
      }
    };
    return snapshot;
  };

  // טעינת רשימת הגיבויים הקיימים
  const loadBackupsList = async () => {
    try {
      const index = await loadState(BACKUPS_INDEX_KEY);
      const list = (index?.backups || []).sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      setBackupsList(list);
      return list;
    } catch (e) {
      console.error('Failed to load backups list:', e);
      return [];
    }
  };

  // יצירת גיבוי חדש - ידני או אוטומטי
  const createBackup = async (backupType = 'manual') => {
    try {
      const snapshot = buildBackupSnapshot();
      const backupId = `${BACKUP_KEY_PREFIX}${snapshot.timestamp.replace(/[:.]/g, '-')}`;
      
      // שמירת הגיבוי עצמו
      await saveState(snapshot, backupId);
      
      // עדכון הרשימה
      const index = await loadState(BACKUPS_INDEX_KEY) || { backups: [] };
      index.backups = index.backups || [];
      index.backups.unshift({
        id: backupId,
        timestamp: snapshot.timestamp,
        type: backupType,
        meta: snapshot.meta,
      });
      
      // ניקוי גיבויים ישנים (שומר רק MAX_BACKUPS_TO_KEEP)
      if (index.backups.length > MAX_BACKUPS_TO_KEEP) {
        const toDelete = index.backups.slice(MAX_BACKUPS_TO_KEEP);
        index.backups = index.backups.slice(0, MAX_BACKUPS_TO_KEEP);
        // ננסה למחוק את הישנים (לא קריטי אם נכשל)
        for (const old of toDelete) {
          try { await saveState(null, old.id); } catch {}
        }
      }
      
      await saveState(index, BACKUPS_INDEX_KEY);
      try { 
        window.localStorage.setItem('poker_last_backup_at', snapshot.timestamp); 
      } catch {}
      
      await loadBackupsList();
      return { success: true, snapshot, backupId };
    } catch (e) {
      console.error('Backup failed:', e);
      return { success: false, error: e.message };
    }
  };

  // הורדת גיבוי כקובץ JSON להעלאה לדרייב
  const downloadBackupAsFile = (snapshot) => {
    const data = snapshot || buildBackupSnapshot();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date(data.timestamp).toISOString().split('T')[0];
    a.href = url;
    a.download = `barbur-poker-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // גיבוי + הורדה (פעולה ידנית)
  const handleManualBackup = async () => {
    const result = await createBackup('manual');
    if (result.success) {
      downloadBackupAsFile(result.snapshot);
      alert(`✓ גיבוי נוצר ויורד למחשב!\n\nכעת תוכל לגרור את הקובץ לתיקייה בגוגל דרייב.`);
    } else {
      alert(`⚠️ הגיבוי נכשל: ${result.error}`);
    }
  };

  // הורדת גיבוי קיים מהרשימה
  const handleDownloadExistingBackup = async (backupItem) => {
    try {
      const snapshot = await loadState(backupItem.id);
      if (snapshot) {
        downloadBackupAsFile(snapshot);
      } else {
        alert('הגיבוי לא נמצא');
      }
    } catch (e) {
      alert(`⚠️ ההורדה נכשלה: ${e.message}`);
    }
  };

  // שחזור מגיבוי
  const handleRestoreBackup = async (backupItem) => {
    if (!confirm(
      `⚠️ האם אתה בטוח שברצונך לשחזר את הנתונים?\n\n` +
      `תאריך הגיבוי: ${new Date(backupItem.timestamp).toLocaleString('he-IL')}\n\n` +
      `כל הנתונים הנוכחיים יוחלפו! ההמלצה היא קודם ליצור גיבוי ידני.`
    )) return;
    
    try {
      const snapshot = await loadState(backupItem.id);
      if (!snapshot) { alert('הגיבוי לא נמצא'); return; }
      
      // שחזור הנתונים
      if (snapshot.app) {
        if (snapshot.app.sessions) setAllSessions(snapshot.app.sessions);
        if (snapshot.app.players) setPlayers(snapshot.app.players);
        if (snapshot.app.hostingSchedule) setHostingSchedule(snapshot.app.hostingSchedule);
        if (snapshot.app.phones) setPhones(snapshot.app.phones);
        await saveState({
          sessions: snapshot.app.sessions,
          players: snapshot.app.players,
          hostingSchedule: snapshot.app.hostingSchedule,
          phones: snapshot.app.phones,
        }, STORAGE_KEY);
      }
      if (snapshot.quotes) {
        setDeletedQuoteIds(snapshot.quotes.deletedIds || []);
        setQuoteLikes(snapshot.quotes.likes || {});
        setUserQuotes(snapshot.quotes.userQuotes || []);
        await saveState(snapshot.quotes, QUOTES_STORAGE_KEY);
      }
      if (snapshot.gallery) {
        setGalleryImages(snapshot.gallery.images || []);
        setGalleryLikes(snapshot.gallery.likes || {});
        await saveState(snapshot.gallery, GALLERY_STORAGE_KEY);
      }
      
      alert(`✓ הנתונים שוחזרו בהצלחה מהגיבוי של ${new Date(backupItem.timestamp).toLocaleDateString('he-IL')}`);
      setBackupsModalOpen(false);
    } catch (e) {
      alert(`⚠️ השחזור נכשל: ${e.message}`);
    }
  };

  // העלאת קובץ גיבוי מהדרייב לשחזור
  const handleUploadBackupFile = async (file) => {
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text);
      
      if (!snapshot.version || !snapshot.app || !snapshot.timestamp) {
        alert('⚠️ הקובץ אינו קובץ גיבוי תקין');
        return;
      }
      
      if (!confirm(
        `⚠️ זוהה קובץ גיבוי תקין מהתאריך:\n${new Date(snapshot.timestamp).toLocaleString('he-IL')}\n\n` +
        `האם לשחזר ממנו? כל הנתונים הנוכחיים יוחלפו!`
      )) return;
      
      // שחזור (אותו לוגיקה כמו handleRestoreBackup)
      if (snapshot.app.sessions) setAllSessions(snapshot.app.sessions);
      if (snapshot.app.players) setPlayers(snapshot.app.players);
      if (snapshot.app.hostingSchedule) setHostingSchedule(snapshot.app.hostingSchedule);
      if (snapshot.app.phones) setPhones(snapshot.app.phones);
      await saveState({
        sessions: snapshot.app.sessions,
        players: snapshot.app.players,
        hostingSchedule: snapshot.app.hostingSchedule,
        phones: snapshot.app.phones,
      }, STORAGE_KEY);
      
      if (snapshot.quotes) {
        setDeletedQuoteIds(snapshot.quotes.deletedIds || []);
        setQuoteLikes(snapshot.quotes.likes || {});
        setUserQuotes(snapshot.quotes.userQuotes || []);
        await saveState(snapshot.quotes, QUOTES_STORAGE_KEY);
      }
      if (snapshot.gallery) {
        setGalleryImages(snapshot.gallery.images || []);
        setGalleryLikes(snapshot.gallery.likes || {});
        await saveState(snapshot.gallery, GALLERY_STORAGE_KEY);
      }
      
      alert(`✓ הנתונים שוחזרו בהצלחה!`);
      setBackupsModalOpen(false);
    } catch (e) {
      alert(`⚠️ הקובץ פגום או לא תקין: ${e.message}`);
    }
  };

  // 🆕 גיבוי אוטומטי - בודק אם עברו 7 ימים מהגיבוי האחרון
  useEffect(() => {
    if (loading) return;
    if (!allSessions.length) return; // עדיין לא נטען
    
    const checkAutoBackup = async () => {
      try {
        const lastBackupStr = window.localStorage.getItem('poker_last_backup_at');
        const now = new Date();
        let shouldBackup = false;
        
        if (!lastBackupStr) {
          shouldBackup = true; // אף פעם לא היה גיבוי
        } else {
          const lastBackup = new Date(lastBackupStr);
          const daysDiff = (now - lastBackup) / (1000 * 60 * 60 * 24);
          if (daysDiff >= AUTO_BACKUP_INTERVAL_DAYS) {
            shouldBackup = true;
          }
        }
        
        if (shouldBackup) {
          console.log('🔄 גיבוי אוטומטי...');
          const result = await createBackup('auto');
          if (result.success) {
            console.log('✓ גיבוי אוטומטי הושלם:', result.backupId);
          }
        }
      } catch (e) {
        console.error('Auto backup check failed:', e);
      }
    };
    
    // עיכוב קטן כדי לא להפריע לטעינה
    const timer = setTimeout(checkAutoBackup, 5000);
    return () => clearTimeout(timer);
  }, [loading, allSessions.length]);

  const handleHostingUpdate = async (newSchedule) => {
    setHostingSchedule(newSchedule);
    await persistSessions(allSessions, players, newSchedule);
  };

  const handleUserSelect = async (name) => {
    // 👑 סופר אדמין - דורש סיסמה כדי להזדהות (אלא אם המכשיר הזה כבר נעול אליו)
    const existingLock = deviceLocks[name];
    const isSuperAdminUser = SUPER_ADMINS.includes(name);
    const isMyDevice = existingLock && existingLock.deviceId === deviceId;
    
    if (isSuperAdminUser && !isMyDevice) {
      // אין נעילה למכשיר הזה - דרוש אימות סיסמה
      setSuperAdminChallenge(name);
      return;
    }
    
    // 🔐 בדיקת נעילה - האם השם הזה כבר תפוס במכשיר אחר? (לא רלוונטי לסופר אדמין)
    if (existingLock && existingLock.deviceId !== deviceId && !isSuperAdminUser) {
      setLockBlockedName(name);
      return;
    }
    
    await completeUserSelect(name);
  };
  
  // 🆕 השלמת הכניסה (אחרי כל הבדיקות)
  const completeUserSelect = async (name, options = {}) => {
    const isSuperAdminUser = SUPER_ADMINS.includes(name);
    const existingLock = deviceLocks[name];
    
    setCurrentUser(name);
    try { window.localStorage.setItem('poker_user_name', name); } catch {}
    
    // 👑 אם זה סופר אדמין - הגדרה אוטומטית כסופר אדמין
    if (isSuperAdminUser) {
      setAdminName(name);
      setAdminRole('super');
      try { 
        window.localStorage.setItem('poker_admin_name', name);
        window.localStorage.setItem('poker_admin_role', 'super');
      } catch {}
    }
    
    // 🔐 נעילה אוטומטית של המכשיר לשם הזה
    if (!existingLock) {
      const newLock = {
        deviceId,
        lockedAt: new Date().toISOString(),
        userAgent: (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent.slice(0, 200) : '',
        autoLocked: false,
      };
      const updatedLocks = { ...deviceLocks, [name]: newLock };
      setDeviceLocks(updatedLocks);
      try { await saveState(updatedLocks, DEVICE_LOCKS_KEY); } catch {}
    }
    
    // 🆕 אם אין למשתמש טלפון - הצג מסך הזדהות
    if (!phones[name] || !phones[name].phone) {
      setPhoneSetupOpen(true);
    }
    // 🆕 שמור זמן כניסה אחרון
    const now = new Date().toISOString();
    const updated = { ...lastLogins, [name]: now };
    setLastLogins(updated);
    try {
      await saveState(updated, LAST_LOGIN_KEY);
    } catch (e) {
      console.error('Failed to save last login:', e);
    }
  };

  // 🚫 החלפת משתמש - חסום למשתמשים רגילים (Device Lock)
  // 🎭 לאדמינים עם הרשאת impersonate - מאפשר "התחזות" לבדיקות (לא משחרר את הנעילה)
  const handleSwitchUser = () => {
    // אם משתמש רגיל / אדמין ללא הרשאת התחזות - חסום
    if (!can('impersonate') && currentUser) {
      alert('🔒 לא ניתן להחליף משתמש. כל מכשיר נעול למשתמש שלו.\nאם החלפת טלפון או שיש בעיה, פנה לרון.');
      return;
    }
    // אדמין עם הרשאה - פותח מסך בחירה כ"התחזות"
    if (can('impersonate') && currentUser) {
      const ok = confirm('🎭 התחזות כמשתמש אחר?\n(לבדיקות בלבד - הנעילה של המשתמש המקורי לא תשתחרר)');
      if (!ok) return;
      // 🆕 שומרים את האדמין האמיתי גם ב-localStorage כדי שלא ילך לאיבוד בריענון
      try { 
        window.localStorage.setItem('poker_real_admin_name', currentUser);
      } catch {}
      setImpersonating(currentUser);
      setCurrentUser(null);
      // לא מוחקים את poker_user_name ולא משחררים נעילה
      return;
    }
    // אם אין משתמש - פשוט פותח מסך בחירה
    setCurrentUser(null);
  };
  
  // 🎭 חזרה מהתחזות לאדמין המקורי
  const handleStopImpersonating = () => {
    if (!impersonating) return;
    const realAdmin = impersonating;
    setCurrentUser(realAdmin);
    setImpersonating(null);
    // 🆕 ניקוי ה-localStorage של ההתחזות
    try {
      window.localStorage.removeItem('poker_real_admin_name');
      // החזרת ה-poker_user_name לאדמין האמיתי (במקרה והשתנה)
      window.localStorage.setItem('poker_user_name', realAdmin);
    } catch {}
  };
  
  // 🚨 ביטול התחזות חירום - גם אם המצב נתקע
  // משחזר את המשתמש המקורי מ-localStorage או מנקה הכל
  const handleEmergencyResetImpersonation = () => {
    try {
      const realAdmin = window.localStorage.getItem('poker_real_admin_name');
      const lockedUser = window.localStorage.getItem('poker_user_name');
      // אם יש לנו רשומה של האדמין האמיתי - חזור אליו
      if (realAdmin) {
        setCurrentUser(realAdmin);
        setImpersonating(null);
        window.localStorage.removeItem('poker_real_admin_name');
        window.localStorage.setItem('poker_user_name', realAdmin);
      } else if (lockedUser) {
        // אחרת - חזור למשתמש שלפי הנעילה במכשיר
        setCurrentUser(lockedUser);
        setImpersonating(null);
      }
    } catch {}
  };
  
  // 🎭 בחירה במצב התחזות (אדמין בוחר משתמש אחר ללא נעילה)
  const handleImpersonate = async (name) => {
    setCurrentUser(name);
    // לא נוגעים ב-localStorage של poker_user_name (כדי שלא נשבור את הנעילה)
    // לא שומרים זמן כניסה
  };
  
  // 🔓 שחרור נעילת מכשיר (אדמין בלבד)
  const handleReleaseLock = async (playerName) => {
    if (!confirm(`לשחרר את הנעילה של "${playerName}"?\nהמשתמש יוכל להירשם שוב במכשיר אחר.`)) return;
    const updatedLocks = { ...deviceLocks };
    delete updatedLocks[playerName];
    setDeviceLocks(updatedLocks);
    try { await saveState(updatedLocks, DEVICE_LOCKS_KEY); } catch (e) {
      console.error('Failed to save device locks:', e);
    }
  };

  const isAdminEligible = currentUser && adminNamesList.includes(currentUser);

  const persistQuotes = async (deletedIds, likes, userQuotesList) => {
    await saveState({ 
      deletedIds, 
      likes,
      userQuotes: userQuotesList !== undefined ? userQuotesList : userQuotes
    }, QUOTES_STORAGE_KEY);
  };

  const handleAddQuote = async (newQuote) => {
    const updated = [...userQuotes, newQuote];
    setUserQuotes(updated);
    await persistQuotes(deletedQuoteIds, quoteLikes, updated);
  };

  // ===== פונקציות גלריה =====
  const persistGallery = async (images, likes) => {
    await saveState({ images, likes }, GALLERY_STORAGE_KEY);
  };

  const handleAddImage = async (newImage) => {
    const updated = [newImage, ...galleryImages]; // חדשים ראשונים
    setGalleryImages(updated);
    await persistGallery(updated, galleryLikes);
  };

  const handleDeleteImage = async (id) => {
    if (!confirm('למחוק את התמונה?')) return;
    const updated = galleryImages.filter(img => img.id !== id);
    setGalleryImages(updated);
    const newLikes = { ...galleryLikes };
    delete newLikes[id];
    setGalleryLikes(newLikes);
    await persistGallery(updated, newLikes);
  };

  const handleLikeImage = async (id) => {
    const newLikes = { ...galleryLikes, [id]: (galleryLikes[id] || 0) + 1 };
    setGalleryLikes(newLikes);
    await persistGallery(galleryImages, newLikes);
  };

  const handleUpdateImageNote = async (id, note) => {
    const updated = galleryImages.map(img => img.id === id ? { ...img, note } : img);
    setGalleryImages(updated);
    await persistGallery(updated, galleryLikes);
  };

  const handleSaveSession = async (newSession) => {
    const updated = [...allSessions.filter(s => !(s.date === newSession.date && (s.season || 2026) === (newSession.season || 2026))), newSession];
    setAllSessions(updated);
    const newNames = Object.keys(newSession.results).filter(n => !players.includes(n));
    const updatedPlayers = newNames.length > 0 ? [...players, ...newNames] : players;
    if (newNames.length > 0) setPlayers(updatedPlayers);
    await persistSessions(updated, updatedPlayers);
    // רענון תזכורות תשלום (LiveSessionModal יצר תזכורות חדשות)
    setPaymentReminders(loadPaymentReminders());
  };

  const handleDeleteSession = async (date) => {
    const updated = allSessions.filter(s => !(s.date === date && (s.season || 2026) === selectedSeason));
    setAllSessions(updated);
    await persistSessions(updated, players);
  };

  // 🆕 עדכון רישום למפגש הבא (כתיבה ל-Firebase)
  const handleUpdateRegistration = async (newReg) => {
    // 📊 תיעוד אנליטיקה - השוואה לפני/אחרי לזיהוי הרשמה/ביטול
    try {
      const wasRegistered = registration?.players?.includes(currentUser);
      const isRegistered = newReg?.players?.includes(currentUser);
      if (!wasRegistered && isRegistered) trackAction('register_evening');
      else if (wasRegistered && !isRegistered) trackAction('unregister_evening');
    } catch {}
    
    setRegistration(newReg);
    try {
      await saveState(newReg, REGISTRATION_KEY);
    } catch (e) {
      console.error('Failed to save registration:', e);
    }
  };

  // 📌 עדכון רישום ברזל
  const handleUpdateIronRegistration = async (newIron) => {
    setIronRegistration(newIron);
    try {
      await saveState(newIron, IRON_REGISTRATION_KEY);
    } catch (e) {
      console.error('Failed to save iron registration:', e);
    }
  };

  // 🔒 הפעלה/כיבוי הטאב גלובלית (אדמין בלבד)
  const handleToggleRegistrationFeature = async () => {
    const newVal = !registrationEnabled;
    setRegistrationEnabled(newVal);
    try {
      await saveState({ enabled: newVal, toggledAt: new Date().toISOString(), toggledBy: adminName }, REGISTRATION_ENABLED_KEY);
    } catch (e) {
      console.error('Failed to toggle registration feature:', e);
    }
  };

  // 🔄 איפוס ידני של הרישום - לשימוש סופר אדמין במקרי שינוי
  // (מארח השתנה, מפגש בוטל ושוחזר, וכו')
  const handleManualResetRegistration = async () => {
    // מחשבים את המפגש הבא מתוך לוח האירוחים
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = (hostingSchedule || [])
      .filter(h => h.date >= todayStr && h.host)
      .sort((a, b) => a.date.localeCompare(b.date));
    const computedNext = upcoming[0] || null;
    
    if (!computedNext) {
      alert('⚠️ אין מפגש מתוכנן כרגע - אי אפשר לאפס');
      return;
    }
    const confirmMsg = `🔄 לאפס את הרישום הנוכחי?\n\nכל הנרשמים יוסרו מהרשימה והרשימה תאוכלס מחדש עם המארח של המפגש הבא (${computedNext.host}, ${computedNext.date}).\n\nפעולה זו לא ניתנת לביטול.`;
    if (!confirm(confirmMsg)) return;
    
    try {
      const fresh = {
        sessionDate: computedNext.date,
        host: computedNext.host,
        entries: [{ name: computedNext.host, addedAt: new Date().toISOString(), isHost: true }],
        resetAt: new Date().toISOString(),
        manuallyResetBy: adminName,
      };
      await saveState(fresh, REGISTRATION_KEY);
      setRegistration(fresh);
      // אפס גם רישום ברזל
      if (ironRegistration?.players?.length || ironRegistration?.refused?.length) {
        await saveState({ players: [], refused: [] }, IRON_REGISTRATION_KEY);
        setIronRegistration({ players: [], refused: [] });
      }
      alert('✅ הרישום אופס בהצלחה');
    } catch (e) {
      console.error('Failed to manually reset registration:', e);
      alert('❌ שגיאה באיפוס הרישום');
    }
  };

  // 🔔 שליחת התראה ידנית "הרישום נפתח" - לשימוש סופר אדמין
  // (לדוגמה: ב-12:00 בצהריים, או אחרי חופש, או במקרה חירום)
  // טכנית: מבצע toggle off+on מהיר של הפיצ'ר כדי לטריגר את Cloud Function notifyRegistrationOpen
  // 📢 שליחת התראה מותאמת אישית - כותב ל-Firestore, Cloud Function תשלח
  const handleSendCustomNotification = async (recipients, title, body) => {
    try {
      const notificationKey = 'poker_custom_notification_v1';
      const payload = {
        recipients,
        title,
        body,
        sentBy: currentUser,
        timestamp: new Date().toISOString(),
        id: `custom_${Date.now()}`, // מזהה ייחודי כדי שהפונקציה תזהה שזו הודעה חדשה
      };
      await saveState(payload, notificationKey);
      alert(`✅ התראה נשלחה ל-${recipients.length} נמענים`);
    } catch (e) {
      console.error('שגיאה בשליחת התראה מותאמת:', e);
      throw e;
    }
  };
  
  const handleManualSendNotification = async () => {
    // מחשבים את המפגש הבא מתוך לוח האירוחים
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = (hostingSchedule || [])
      .filter(h => h.date >= todayStr && h.host)
      .sort((a, b) => a.date.localeCompare(b.date));
    const computedNext = upcoming[0] || null;
    
    if (!computedNext) {
      alert('⚠️ אין מפגש מתוכנן כרגע - אי אפשר לשלוח התראה');
      return;
    }
    const sessionDateFormatted = new Date(computedNext.date).toLocaleDateString('he-IL', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    const confirmMsg = `🔔 לשלוח התראה לכל מי שאישר התראות?\n\nההודעה: "הרישום למפגש ${sessionDateFormatted} אצל ${computedNext.host} נפתח! 🎰"\n\nההתראה תישלח לכל המכשירים הרשומים תוך 5-15 שניות.`;
    if (!confirm(confirmMsg)) return;
    
    try {
      // טריק: שמירת המצב הנוכחי, כיבוי הפיצ'ר, המתנה קצרה, והפעלה מחדש
      // זה יטריגר את Cloud Function notifyRegistrationOpen ששולחת התראה לכולם
      
      // שלב 1: כיבוי
      await saveState({ enabled: false, toggledAt: new Date().toISOString(), toggledBy: adminName }, REGISTRATION_ENABLED_KEY);
      
      // שלב 2: המתנה קצרה (1.5 שניות) כדי שהמערכת תזהה את השינוי
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // שלב 3: הפעלה מחדש - זה הטריגר להתראה
      await saveState({ enabled: true, toggledAt: new Date().toISOString(), toggledBy: adminName, manualTrigger: true }, REGISTRATION_ENABLED_KEY);
      setRegistrationEnabled(true);
      const manualOpenTime = new Date();
      const manualTimeData = {
        targetTimestamp: manualOpenTime.toISOString(),
        sessionDate: computedNext.date,
        sessionHost: computedNext.host,
        sentNotification: true,
        createdAt: manualOpenTime.toISOString(),
        manualTrigger: true,
      };
      await saveState(manualTimeData, RANDOM_TIME_KEY);
      randomOpenTimeRef.current = manualOpenTime;
      alert("✅ ההתראה נשלחה והרישום נפתח!\nהיא אמורה להגיע לכל המכשירים תוך 5-15 שניות.");
    } catch (e) {
      console.error('Failed to send manual notification:', e);
      alert('❌ שגיאה בשליחת ההתראה');
    }
  };
  
  // 🔄 רענון אוטומטי כל 20 שניות (סנכרון בין משתמשים בזמן אמת)
  // - הרישום למפגש (אם פעיל)
  // - הרשאות אדמין רגיל (כשהסופר אדמין משנה הרשאות, האדמינים יראו תוך 20 שניות)
  // - hash של סיסמת סופר אדמין (אם הסופר אדמין שינה סיסמה)
  // - נעילות מכשירים (אם הסופר אדמין שחרר נעילה)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // הרשאות - תמיד מסנכרן (לכל משתמש חשוב)
        const freshPerms = await loadState(ADMIN_PERMISSIONS_KEY);
        if (freshPerms && typeof freshPerms === 'object') {
          setAdminPermissions(prev => {
            const merged = { ...getDefaultPermissions(), ...freshPerms };
            // השוואה רדודה - אם זהה, לא עוטף עדכון לחינם
            const same = Object.keys(merged).every(k => merged[k] === prev[k]);
            if (same) return prev;
            
            // 🔔 אם זה אדמין רגיל (לא סופר), נציג לו הודעה על שינוי
            // (סופר אדמין רואה את השינוי שהוא עצמו עושה - לא צריך הודעה)
            if (isAdmin && adminRole === 'admin') {
              // מצא מה השתנה
              const added = [];
              const removed = [];
              for (const key of Object.keys(merged)) {
                if (merged[key] && !prev[key]) added.push(key);
                if (!merged[key] && prev[key]) removed.push(key);
              }
              if (added.length || removed.length) {
                const labels = (keys) => keys.map(k => {
                  const item = PERMISSIONS_REGISTRY.find(p => p.key === k);
                  return item ? item.label : k;
                });
                setPermissionsToast({
                  added: labels(added),
                  removed: labels(removed),
                  at: Date.now(),
                });
              }
            }
            return merged;
          });
        }
        
        // hash סיסמת סופר אדמין
        const freshHash = await loadState(SUPER_ADMIN_PASSWORD_KEY);
        if (freshHash?.hash && freshHash.hash !== superAdminPasswordHash) {
          setSuperAdminPasswordHash(freshHash.hash);
        }
        
        // נעילות מכשירים
        const freshLocks = await loadState(DEVICE_LOCKS_KEY);
        if (freshLocks && typeof freshLocks === 'object') {
          setDeviceLocks(prev => {
            // השוואה רדודה
            const sameKeys = Object.keys(prev).length === Object.keys(freshLocks).length 
              && Object.keys(prev).every(k => freshLocks[k]?.deviceId === prev[k]?.deviceId);
            return sameKeys ? prev : freshLocks;
          });
        }
        
        // רישום למפגש - רק אם הפיצ'ר פעיל
        if (registrationEnabled) {
          const fresh = await loadState(REGISTRATION_KEY);
          if (fresh) setRegistration(fresh);
          // 📌 רישום ברזל - מסונכרן יחד
          const freshIron = await loadState(IRON_REGISTRATION_KEY);
          if (freshIron && typeof freshIron === 'object') {
            setIronRegistration({ 
              players: freshIron.players || [], 
              refused: freshIron.refused || [] 
            });
          }
        }
        
        // מצב טאב הרישום (אם הסופר אדמין הפעיל/כיבה)
        const enabled = await loadState(REGISTRATION_ENABLED_KEY);
        if (enabled) setRegistrationEnabled(!!enabled.enabled);
      } catch {}
    }, 20000);
    return () => clearInterval(interval);
  }, [registrationEnabled, superAdminPasswordHash]);


  const handleReset = async () => {
    if (!confirm('לאפס את כל הנתונים לברירת המחדל? זה ימחק את כל השינויים!')) return;
    setAllSessions(ALL_INITIAL_SESSIONS); setPlayers(INITIAL_PLAYERS);
    await persistSessions(ALL_INITIAL_SESSIONS, INITIAL_PLAYERS);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ sessions: allSessions, players }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `poker-data-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.sessions) {
        setAllSessions(data.sessions);
        if (data.players) setPlayers(data.players);
        await persistSessions(data.sessions, data.players || players);
      }
    } catch (err) { alert('קובץ לא תקין'); }
  };

  // 🔔 ============ Push Notifications Handlers ============
  // טעינת מצב ההרשאה בעלייה ראשונה
  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);
  
  // הפעלת התראות (לחיצה על הכפתור הירוק)
  const handleEnableNotifications = async () => {
    if (!currentUser || notificationBusy) return;
    setNotificationBusy(true);
    
    const result = await registerForPushNotifications(currentUser, deviceId);
    
    if (result.success) {
      setNotificationPermission('granted');
      try { trackAction('push_subscribe'); } catch {}
      alert('✅ התראות מופעלות!\nתקבל הודעה כשהרישום למפגש נפתח, או כשמישהו מבטל הרשמה.');
    } else if (result.reason === 'unsupported') {
      alert('⚠️ הדפדפן שלך לא תומך בהתראות.\nאם אתה ב-iPhone, וודא שהאפליקציה מותקנת על מסך הבית.');
    } else if (result.reason === 'no_token') {
      // המשתמש כנראה לחץ "חסום"
      setNotificationPermission(getNotificationPermission());
      alert('❌ ההתראות נחסמו. תוכל להפעיל מהגדרות הדפדפן.');
    } else {
      alert('❌ שגיאה בהפעלת התראות. נסה שוב או דווח לרון.');
    }
    
    setNotificationBusy(false);
  };
  
  // כיבוי התראות (לחיצה כשהן כבר מופעלות)
  const handleDisableNotifications = async () => {
    if (!currentUser || notificationBusy) return;
    if (!confirm('לכבות התראות?')) return;
    setNotificationBusy(true);
    
    await unregisterFromPushNotifications(currentUser, deviceId);
    setNotificationPermission('default');
    alert('✓ התראות כובו במכשיר זה.');
    
    setNotificationBusy(false);
  };
  
  const handleAdminLogin = async (name, role = 'admin') => {
    setAdminName(name);
    setAdminRole(role);
    // שמירה של שם המנהל ורמתו באחסון המקומי
    try { 
      window.localStorage.setItem('poker_admin_name', name);
      window.localStorage.setItem('poker_admin_role', role);
    } catch {}
  };
  
  // 🚪 התנתקות ממנהל - חוזר להיות משתמש רגיל (לא יוצא מהאפליקציה)
  const handleAdminLogout = () => {
    if (!confirm('להתנתק ממצב מנהל?\n(תישאר מחובר כשחקן רגיל)')) return;
    setAdminName(null);
    setAdminRole(null);
    try {
      window.localStorage.removeItem('poker_admin_name');
      window.localStorage.removeItem('poker_admin_role');
    } catch {}
  };
  
  // 🔐 שמירת hash של סיסמת סופר אדמין ב-Firebase (פעם ראשונה / שינוי)
  const handleSetSuperAdminPassword = async (hash) => {
    setSuperAdminPasswordHash(hash);
    await saveState({
      hash,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser,
    }, SUPER_ADMIN_PASSWORD_KEY);
  };
  
  // 🔑 שינוי סיסמת סופר אדמין (מהאפליקציה)
  const handleChangeSuperAdminPassword = async () => {
    const oldPwd = prompt('הכנס את הסיסמה הנוכחית:');
    if (!oldPwd) return;
    const oldHash = await hashPassword(oldPwd);
    if (oldHash !== superAdminPasswordHash) {
      alert('❌ הסיסמה הנוכחית שגויה');
      return;
    }
    const newPwd = prompt('הכנס סיסמה חדשה (לפחות 6 תווים):');
    if (!newPwd) return;
    if (newPwd.length < 6) {
      alert('❌ סיסמה חייבת לכלול לפחות 6 תווים');
      return;
    }
    const confirmPwd = prompt('אמת את הסיסמה החדשה:');
    if (newPwd !== confirmPwd) {
      alert('❌ הסיסמאות לא תואמות');
      return;
    }
    const newHash = await hashPassword(newPwd);
    await handleSetSuperAdminPassword(newHash);
    alert('✅ הסיסמה עודכנה בהצלחה');
  };

  // 🆕 הוספת מנהל חדש לרשימה
  const handleAddAdmin = async (newAdminName) => {
    if (!newAdminName || adminNamesList.includes(newAdminName)) return;
    const updated = [...adminNamesList, newAdminName];
    setAdminNamesList(updated);
    await saveState(updated, ADMIN_NAMES_KEY);
  };
  
  // 🆕 הסרת מנהל מהרשימה
  const handleRemoveAdmin = async (nameToRemove) => {
    if (adminNamesList.length <= 1) {
      alert('אי אפשר להסיר את המנהל היחיד - חייב להיות לפחות מנהל אחד');
      return;
    }
    if (SUPER_ADMINS.includes(nameToRemove)) {
      alert('אי אפשר להסיר סופר אדמין דרך כאן.');
      return;
    }
    if (nameToRemove === adminName) {
      const ok = window.confirm(`אתה עומד להסיר את עצמך (${nameToRemove}) מרשימת המנהלים. אחרי זה תצטרך מנהל אחר שיוסיף אותך חזרה. להמשיך?`);
      if (!ok) return;
    }
    const updated = adminNamesList.filter(n => n !== nameToRemove);
    setAdminNamesList(updated);
    await saveState(updated, ADMIN_NAMES_KEY);
  };

  const handleLogout = () => {
    setAdminName(null);
    setAdminRole(null);
    try { 
      window.localStorage.removeItem('poker_admin_name');
      window.localStorage.removeItem('poker_admin_role');
    } catch {}
  };
  
  // 🆕 עדכון הרשאות לאדמין רגיל (סופר אדמין בלבד)
  const handleUpdatePermissions = async (newPerms) => {
    setAdminPermissions(newPerms);
    try {
      await saveState(newPerms, ADMIN_PERMISSIONS_KEY);
    } catch (e) {
      console.error('Failed to save permissions:', e);
    }
  };

  // בדיקה אם יש שם מנהל שמור מקומית (נשמר בדפדפן)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('poker_admin_name');
      if (saved) setAdminName(saved);
    } catch {}
  }, []);

  const handleQuoteLike = async (id) => {
    const newLikes = { ...quoteLikes, [id]: (quoteLikes[id] || 0) + 1 };
    setQuoteLikes(newLikes);
    await persistQuotes(deletedQuoteIds, newLikes);
  };

  const handleQuoteDelete = async (id) => {
    const newDeleted = [...deletedQuoteIds, id];
    setDeletedQuoteIds(newDeleted);
    await persistQuotes(newDeleted, quoteLikes);
  };

  // 🎭 בזמן התחזות - הסטטוס משקף את המשתמש שאליו מתחזים, לא את הסופר אדמין האמיתי
  // ככה שהמסך באמת ייראה כמו שהוא ייראה לאותו משתמש
  // המידע על הסופר אדמין האמיתי נשמר ב-impersonating - ככה שאפשר תמיד לחזור.
  const impersonatedIsAdmin = impersonating ? adminNamesList.includes(currentUser) : false;
  const impersonatedIsSuper = impersonating ? SUPER_ADMINS.includes(currentUser) : false;
  
  const isAdmin = impersonating ? impersonatedIsAdmin : !!adminName;
  // 👑 האם המשתמש הנוכחי הוא סופר אדמין?
  const isSuperAdmin = impersonating ? impersonatedIsSuper : (isAdmin && adminRole === 'super');
  
  // 🔐 פונקציה מרכזית לבדיקת הרשאה לפיצ'ר
  // can('liveSession') -> true/false
  const can = (featureKey) => {
    if (!isAdmin) return false;
    // סופר אדמין יכול הכל
    if (isSuperAdmin) return true;
    // אדמין רגיל - לפי הרשאות מוגדרות
    const feature = PERMISSIONS_REGISTRY.find(p => p.key === featureKey);
    if (!feature) return false; // פיצ'ר לא מוכר
    if (feature.superOnly) return false; // פיצ'ר ננעל לסופר אדמין בלבד
    return adminPermissions[featureKey] !== false; // ברירת מחדל: לפי adminPermissions
  };
  
  const latestDate = getLatestSessionDate(sessions);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center" style={{ fontFamily: 'Assistant, sans-serif' }}>
        <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
      </div>
    );
  }

  // מסך פתיחה
  if (showSplash) {
    return <SplashScreen onEnter={() => setShowSplash(false)} />;
  }

  // 🔐 מסך חסימה - השם תפוס במכשיר אחר
  if (lockBlockedName) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'radial-gradient(ellipse at center, #0f5132 0%, #0a3520 50%, #041810 100%)',
        fontFamily: 'Assistant, sans-serif'
      }}>
        <div className="max-w-md w-full rounded-2xl border-2 border-red-700 bg-stone-950/90 p-6 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-2xl font-extrabold text-red-300 mb-2">השם הזה תפוס</div>
          <div className="text-base text-stone-200 mb-4">
            <span className="font-bold text-amber-300">"{lockBlockedName}"</span> כבר נרשם במכשיר אחר
          </div>
          <div className="rounded-lg bg-stone-900 border border-stone-800 p-3 text-sm text-stone-300 mb-4 leading-relaxed">
            כל מכשיר נעול למשתמש אחד.<br/>
            אם זה אתה והחלפת טלפון - תפנה לרון או לגילי כדי לשחרר את הנעילה.
          </div>
          <button
            onClick={() => setLockBlockedName(null)}
            className="w-full rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold py-3 transition"
          >
            חזרה
          </button>
        </div>
      </div>
    );
  }

  // 🔐 מסך אתגר סיסמת סופר אדמין (כשבוחרים סופר אדמין במכשיר חדש)
  if (superAdminChallenge) {
    return <SuperAdminChallengeScreen 
      name={superAdminChallenge}
      passwordHash={superAdminPasswordHash}
      onSuccess={async () => {
        const name = superAdminChallenge;
        setSuperAdminChallenge(null);
        await completeUserSelect(name);
      }}
      onSetupPassword={async (newHash) => {
        await handleSetSuperAdminPassword(newHash);
        const name = superAdminChallenge;
        setSuperAdminChallenge(null);
        await completeUserSelect(name);
      }}
      onCancel={() => setSuperAdminChallenge(null)}
    />;
  }

  // מסך בחירת משתמש (אם עוד לא בחר)
  if (!currentUser) {
    return <UserSelectScreen 
      players={sortedActivePlayers} 
      onSelect={impersonating ? handleImpersonate : handleUserSelect}
      deviceLocks={deviceLocks}
      currentDeviceId={deviceId}
      impersonating={impersonating}
      onCancelImpersonate={handleStopImpersonating}
    />;
  }

  // מסך מלא לגרף
  if (chartFullscreen) {
    return (
      <div dir="rtl" className="fixed inset-0 z-50 bg-stone-950 p-4 overflow-auto" style={{ fontFamily: 'Assistant, sans-serif' }}>
        <CumulativeChart sessions={sessions} stats={stats} fullscreen={true}
          onFullscreenToggle={() => setChartFullscreen(false)}
          selectedPlayers={selectedChartPlayers}
          onPlayersChange={setSelectedChartPlayers}
          isMobile={isMobile} />
      </div>
    );
  }

  const tabs = [
    // 🆕 אירוח/רישום - טאב מאוחד שכולל את הרישום ולוח האירוחים
    ...((registrationEnabled || can('registrationToggle')) ? [{ 
      id: 'registration', 
      label: 'אירוח/רישום', 
      icon: null, 
      emoji: '🍻',
      special: true,
    }] : []),
    { id: 'dashboard', label: 'דשבורד', icon: LayoutDashboard },
    { id: 'table', label: 'טבלה', icon: Table },
    { id: 'periodic', label: 'תקופות', icon: Calendar },
    { id: 'champions', label: '🏆 MVP', icon: Trophy },
    { id: 'charts', label: 'תובנות', icon: BarChart3 },
    { id: 'gallery', label: 'גלריה', icon: ImageIcon },
    // 🔒 היסטוריה - רק למי שיש לו הרשאה למחוק מפגשים
    ...(can('deleteSession') ? [{ id: 'history', label: 'היסטוריה', icon: History }] : []),
    { id: 'quotes', label: '🪶 אמרות כנף', icon: Quote },
  ];
  
  // 🔴 האם הרישום פתוח עכשיו (לנקודה מהבהבת על הטאב)
  const registrationOpenNow = (() => {
    if (!registrationEnabled && !can('registrationToggle')) return false;
    if (!hostingSchedule || !Array.isArray(hostingSchedule)) return false;
    const today = getTodayIsrael();
    const next = hostingSchedule.filter(h => h.date >= today && h.host).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!next) return false;
    const now = new Date();
    if (now > new Date(next.date + 'T23:59:59')) return false;
    const lastSorted = [...allSessions].sort((a, b) => b.date.localeCompare(a.date));
    const lastDate = lastSorted[0]?.date;
    if (lastDate && lastDate < next.date) {
      const opensAt = new Date(lastDate + 'T00:00:00');
      opensAt.setDate(opensAt.getDate() + 1);
      opensAt.setHours(12, 0, 0, 0);
      return now >= opensAt;
    }
    return true;
  })();

  return (
    <div dir="rtl" className="min-h-screen relative overflow-x-hidden" 
      style={{ 
        fontFamily: 'Assistant, sans-serif',
        background: 'radial-gradient(ellipse at center, #0f5132 0%, #0a3520 50%, #041810 100%)'
      }}>
      {/* רקע דקורטיבי */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, #fbbf24 1px, transparent 1px), radial-gradient(circle at 75% 75%, #fbbf24 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      <div className="fixed top-0 right-0 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* 🎭 באנר התחזות - מופיע ברגע שיש התחזות פעילה. כפתור יציאה תמיד נגיש. */}
      {impersonating && (
        <div className="sticky top-0 z-40 bg-gradient-to-l from-purple-900 to-purple-700 border-b-2 border-purple-500 shadow-lg shadow-purple-900/50">
          <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-white text-sm min-w-0">
              <span className="text-xl shrink-0">🎭</span>
              <span className="truncate">
                <span className="font-bold">{impersonating}</span>
                <span className="opacity-80"> מתחזה כ-</span>
                <span className="font-bold text-amber-200">{currentUser || '?'}</span>
              </span>
            </div>
            <button onClick={handleStopImpersonating}
              className="shrink-0 rounded-lg bg-white/20 hover:bg-white/30 active:bg-white/40 border border-white/30 px-3 py-1.5 text-white font-bold text-sm transition flex items-center gap-1.5">
              <X className="h-4 w-4" />
              <span>ביטול</span>
            </button>
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {/* לוגו BarburAI */}
              <img src={BARBUR_LOGO}
                alt="BarburAI"
                className="h-14 w-14 md:h-16 md:w-16 object-contain drop-shadow-lg"
                onError={(e) => { e.target.style.display = 'none'; }} />
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent tracking-tight">
                  פוקר ברבורי תל מונד
                </h1>
                {latestDate && (
                  <div className="text-xs text-stone-500 mt-0.5">
                    מעודכן: <span className="text-amber-300 font-bold">{new Date(latestDate).toLocaleDateString('he-IL', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* כפתור המבורגר - פותח תפריט */}
              <button onClick={() => { setMenuOpen(true); try { trackAction('open_admin_menu'); } catch {} }}
                className="rounded-lg bg-stone-900/70 border border-stone-700 p-2 text-stone-300 hover:bg-stone-800 hover:text-amber-300 transition"
                title="תפריט">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* תגית המשתמש הנוכחי */}
              <button onClick={handleSwitchUser}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
                  impersonating 
                    ? 'bg-purple-900/40 border-purple-700 text-purple-100 hover:bg-purple-900/60' 
                    : 'bg-stone-900/70 border-stone-700 text-stone-200 hover:bg-stone-800'
                }`}
                title={can('impersonate') ? (impersonating ? 'מתחזה - לחץ לחזור' : 'התחזה למשתמש אחר') : 'מכשיר נעול - לא ניתן להחליף'}>
                <div className={`w-2 h-2 rounded-full ${impersonating ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                <span>
                  {impersonating ? '🎭 ' : 'שלום, '}
                  <span className="font-bold text-amber-300">{currentUser}</span>
                </span>
              </button>

              <select value={selectedSeason} onChange={e => setSelectedSeason(Number(e.target.value))}
                className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-white font-bold">
                {availableSeasons.map(y => <option key={y} value={y}>עונת {y}</option>)}
              </select>

              {syncing && <span className="text-xs text-amber-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />שומר...</span>}

              {isAdmin ? (
                <>
                  {/* תגית מנהל / סופר אדמין */}
                  <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
                    isSuperAdmin 
                      ? 'bg-amber-950/40 border-amber-700/60' 
                      : 'bg-emerald-950/30 border-emerald-800/50'
                  }`}>
                    <Lock className={`h-3 w-3 ${isSuperAdmin ? 'text-amber-400' : 'text-emerald-400'}`} />
                    <span className={`text-xs font-bold ${isSuperAdmin ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {isSuperAdmin ? '👑 סופר אדמין' : 'מנהל'}
                    </span>
                  </div>
                </>
              ) : isAdminEligible ? (
                <button onClick={() => setLoginOpen(true)}
                  className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-300 hover:bg-amber-950/50 flex items-center gap-2">
                  <Lock className="h-4 w-4" /> כניסת מנהל
                </button>
              ) : null}
            </div>
          </div>

          {/* ניווט ראשי */}
          <div className="mt-5">
            <nav className="relative rounded-2xl border-2 border-amber-500/70 p-1.5 flex gap-1 overflow-x-auto shadow-2xl"
              style={{
                background: 'linear-gradient(180deg, rgba(12, 10, 8, 0.85) 0%, rgba(20, 15, 10, 0.9) 100%)',
                boxShadow: 'inset 0 1px 3px rgba(251, 191, 36, 0.1), 0 10px 40px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}>
              {tabs.map(t => {
                const Icon = t.icon;
                const active = tab === t.id;
                const isSpecial = t.special;
                const showLiveDot = t.id === 'registration' && registrationOpenNow;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`relative flex-1 min-w-fit px-3 md:px-5 py-2.5 text-xs md:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
                      active 
                        ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/50' 
                        : isSpecial
                          ? 'bg-rose-950/40 border border-rose-900/60 text-rose-200 hover:bg-rose-950/70 hover:text-rose-100'
                          : 'text-stone-400 hover:text-amber-200 hover:bg-stone-900/50'
                    }`}>
                    {Icon ? <Icon className="h-4 w-4" /> : <span className="text-base leading-none">{t.emoji}</span>}
                    {t.label}
                    {showLiveDot && (
                      <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Content */}
        {tab === 'dashboard' && (
          <>
            {/* 🎂 כרטיסי יום הולדת לחוגגים היום (כל מי שזה לא הוא ולא מוסתר) */}
            {(() => {
              const today = new Date();
              const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
              const dismissKey = `poker_dismissed_birthdays_${today.getFullYear()}_${todayStr.replace('/', '_')}`;
              
              // קריאת רשימת ימי הולדת שכבר נסגרו היום
              let dismissedToday = [];
              try {
                const raw = window.localStorage.getItem(dismissKey);
                if (raw) dismissedToday = JSON.parse(raw) || [];
              } catch {}
              
              // מציאת כל החוגגים היום - מסנן: לא המשתמש הנוכחי, לא מוסתרים, לא נסגרו
              const birthdayPeople = Object.entries(birthdays).filter(
                ([n, d]) => d === todayStr && n !== currentUser && !hiddenPlayers.includes(n) && !dismissedToday.includes(n)
              );
              
              if (birthdayPeople.length === 0) return null;
              
              const greetingTemplates = [
                (name) => `${name}, יום הולדת שמח אח! 🎉🎂 שתהיה לך שנה מלאה בניצחונות, צ'יפים, ופלאשים בריבר 🃏`,
                (name) => `מזל טוב ${name}! 🥳 שכל הקלפים יעבדו לטובתך השנה - הן בפוקר והן בחיים! 🍀`,
                (name) => `${name} יקר 🎁 יום הולדת שמח! מאחל לך שנה של אול-אינים מנצחים, שתחזור הביתה תמיד עם ערמה 🎊`,
                (name) => `יומולדת שמח ${name}! 🎈 שהשנה הזאת תהיה הכי טובה - אתה האלוף שלנו 🏆`,
              ];
              
              const sendToGroup = async (bdayName) => {
                const greeting = greetingTemplates[Math.floor(Math.random() * greetingTemplates.length)](bdayName);
                
                if (navigator.share) {
                  try {
                    await navigator.share({ text: greeting });
                    return;
                  } catch (e) {}
                }
                
                try {
                  await navigator.clipboard.writeText(greeting);
                  alert('✅ הברכה הועתקה!\n\nעכשיו תוכל לפתוח את קבוצת הוואטסאפ ולהדביק (לחיצה ארוכה → הדבק).');
                } catch (e) {
                  const text = encodeURIComponent(greeting);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }
              };
              
              const dismissBirthday = (name) => {
                try {
                  const updated = [...dismissedToday, name];
                  window.localStorage.setItem(dismissKey, JSON.stringify(updated));
                } catch {}
                // טריגר רענון - שינוי דמה במצב
                setBirthdays({...birthdays});
              };
              
              return birthdayPeople.map(([bdayName]) => (
                <div key={bdayName} className="mb-3 rounded-2xl p-4 relative overflow-hidden" style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(146,64,14,0.3) 50%, rgba(190,24,93,0.2) 100%)',
                  border: '2px solid rgba(251,191,36,0.5)',
                  boxShadow: '0 0 20px rgba(251,191,36,0.2)',
                }}>
                  {/* כפתור X לסגירה */}
                  <button onClick={() => dismissBirthday(bdayName)}
                    className="absolute top-2 left-2 z-10 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-white w-7 h-7 flex items-center justify-center transition"
                    title="הסתר עד מחר">
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute top-2 right-3 text-xl animate-bounce" style={{animationDelay: '0s'}}>🎉</div>
                  <div className="absolute top-3 left-12 text-lg animate-bounce" style={{animationDelay: '0.5s'}}>🎊</div>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">🎂</div>
                    <div className="flex-1">
                      <div className="text-xs text-amber-300 font-bold tracking-widest mb-0.5">היום יום הולדת!</div>
                      <div className="text-lg font-extrabold text-amber-100">
                        ל-{bdayName} יש יום הולדת היום 🥳
                      </div>
                      <div className="text-xs text-stone-300 mt-0.5">אל תשכח לברך אותו!</div>
                    </div>
                  </div>
                  <button onClick={() => sendToGroup(bdayName)}
                    className="w-full mt-3 rounded-lg py-2.5 font-bold text-white text-sm transition hover:scale-[1.02] flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
                      boxShadow: '0 2px 8px rgba(37,211,102,0.4)',
                    }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.711.307 1.265.49 1.697.628.713.226 1.362.194 1.875.118.572-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                    </svg>
                    שלח ברכה לקבוצה
                  </button>
                </div>
              ));
            })()}
            
            <DashboardCarousel 
              currentUser={currentUser} 
              sessions={sessions} 
              allSessions={allSessions}
              stats={stats} 
              hostingSchedule={hostingSchedule}
              onGoToHosting={() => setTab('hosting')}
              onFullscreenToggle={() => setChartFullscreen(true)}
              selectedChartPlayers={selectedChartPlayers}
              setSelectedChartPlayers={setSelectedChartPlayers}
              isMobile={isMobile}
              paymentReminders={paymentReminders}
              phones={phones}
              onUpdateReminders={handleUpdateReminders}
              isSuperAdmin={isSuperAdmin}
              handledReminders={handledReminders}
              onUpdateHandled={async (newHandled) => {
                setHandledReminders(newHandled);
                await saveHandledToFirestore(currentUser, newHandled);
              }}
            />
          </>
        )}

        {tab === 'table' && <MainLeaderboard stats={stats} sessions={sessions} hiddenPlayers={hiddenPlayers} allSessions={allSessions} isSuperAdmin={isSuperAdmin} />}

        {tab === 'periodic' && <PeriodicTables allSessions={allSessions} players={players} />}
        {tab === 'champions' && <ChampionsTab allSessions={allSessions} hostingSchedule={hostingSchedule} userQuotes={userQuotes} quoteLikes={quoteLikes} allQuotes={ALL_QUOTES} deletedQuoteIds={deletedQuoteIds} />}

        {tab === 'charts' && (
          <div className="space-y-3">
            {/* 🦢 תובנות אישיות - בראש הלשונית */}
            <PersonalInsightsBox 
              sessions={sessions} 
              allSessions={allSessions}
              stats={stats} 
              currentUser={currentUser} />
            <CumulativeChart sessions={sessions} allSessions={allSessions} stats={stats} fullscreen={false}
              onFullscreenToggle={() => setChartFullscreen(true)}
              selectedPlayers={insightsChartPlayers}
              onPlayersChange={setInsightsChartPlayers}
              isMobile={isMobile} />
            <PersonalCharts 
              sessions={sessions} 
              allSessions={allSessions}
              stats={stats} 
              currentUser={currentUser}
              isMobile={isMobile}
              hiddenPlayers={hiddenPlayers} />
          </div>
        )}

        {tab === 'registration' && (
          <div className="space-y-4">
            {/* 🆕 סאב-טאבים: אירוח / לוח אירוחים */}
            <div className="flex gap-2 rounded-xl bg-stone-900/50 border border-stone-800 p-1.5">
              <button
                onClick={() => setRegistrationSubTab('registration')}
                className={`flex-1 rounded-lg py-2.5 px-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                  registrationSubTab === 'registration'
                    ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-lg'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                🍻 אירוח קרוב
              </button>
              <button
                onClick={() => setRegistrationSubTab('hosting')}
                className={`flex-1 rounded-lg py-2.5 px-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                  registrationSubTab === 'hosting'
                    ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-lg'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                📅 אירוחים הבאים
              </button>
            </div>
            
            {/* תוכן הסאב-טאב הנבחר */}
            {registrationSubTab === 'hosting' ? (
              <HostingWrapper allSessions={allSessions} hostingSchedule={hostingSchedule}
                players={activePlayers} sortedPlayers={sortedActivePlayers} isAdmin={isAdmin}
                onUpdate={handleHostingUpdate} adminName={adminName}
                registration={registration} onRegistrationUpdate={handleUpdateRegistration} />
            ) : (
              <>
            {/* 🔧 v2.33.39 - הכרטיס של ניהול רישום הועבר להמבורגר תחת "📋 ניהול רישום" */}
            
            <RegistrationTab
              hostingSchedule={hostingSchedule}
              sessions={allSessions}
              currentUser={currentUser}
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
              registration={registration}
              onUpdate={handleUpdateRegistration}
              players={activePlayers}
              ironRegistration={ironRegistration}
              onIronUpdate={handleUpdateIronRegistration}
            />
              </>
            )}
          </div>
        )}

        {tab === 'history' && can('deleteSession') && <SessionHistory sessions={sessions} onDelete={handleDeleteSession} isAdmin={isAdmin} />}

        {tab === 'gallery' && (
          <GalleryTab 
            images={galleryImages}
            likes={galleryLikes}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onAdd={handleAddImage}
            onDelete={handleDeleteImage}
            onLike={handleLikeImage}
            onUpdateNote={handleUpdateImageNote} />
        )}

        {tab === 'quotes' && (
          <QuotesSection 
            deletedIds={deletedQuoteIds} 
            likes={quoteLikes}
            userQuotes={userQuotes}
            currentUser={currentUser}
            players={sortedPlayers}
            onDelete={handleQuoteDelete} 
            onLike={handleQuoteLike} 
            onAddQuote={handleAddQuote}
            isAdmin={isAdmin} />
        )}

        <footer className="mt-10 pb-6 text-center text-xs text-stone-600 tracking-[0.15em] uppercase">
          {sessions.length} מפגשים • {stats.length} שחקנים • עונת {selectedSeason} • 
          <span className="text-amber-600/60"> BARBUR AI</span>
          <div className="mt-2 text-[11px] text-stone-100 tracking-normal normal-case font-mono">
            {isSuperAdmin ? `${APP_VERSION} • ${APP_BUILD_TIME} • ${APP_NOTES}` : APP_VERSION}
          </div>
        </footer>
      </div>

      {/* תפריט צד - המבורגר */}
      {menuOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="absolute top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-stone-950 border-l border-stone-800 shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()} dir="rtl">
            {/* כותרת תפריט */}
            <div className="sticky top-0 bg-stone-950/95 backdrop-blur border-b border-stone-800 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-3xl">♠</div>
                <div>
                  <div className="text-xs text-amber-500/80 tracking-[0.15em] font-bold">BARBUR AI</div>
                  <div className="text-base font-extrabold text-amber-200">תפריט</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* המשתמש הנוכחי */}
            <div className="px-5 py-4 border-b border-stone-800">
              <div className="text-xs text-stone-500 mb-1">מחובר כ:</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${impersonating ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                  <span className="font-bold text-amber-300 text-lg">
                    {impersonating ? '🎭 ' : ''}{currentUser}
                  </span>
                  {isAdmin && !impersonating && (
                    isSuperAdmin ? (
                      <span className="rounded-md bg-amber-950/50 border border-amber-700/50 px-2 py-0.5 text-xs text-amber-300 font-bold flex items-center gap-1">
                        👑 סופר אדמין
                      </span>
                    ) : (
                      <span className="rounded-md bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 text-xs text-emerald-300 font-bold">
                        מנהל
                      </span>
                    )
                  )}
                  {impersonating && (
                    <span className="rounded-md bg-purple-950/50 border border-purple-800/50 px-2 py-0.5 text-xs text-purple-300 font-bold">
                      התחזות
                    </span>
                  )}
                </div>
                {/* 🎭 רק לאדמינים שיש להם הרשאת התחזות - כפתור התחזות */}
                {can('impersonate') && !impersonating && (
                  <button onClick={() => { setMenuOpen(false); handleSwitchUser(); }}
                    className="text-xs text-stone-400 hover:text-amber-300 underline">
                    התחזה
                  </button>
                )}
                {impersonating && (
                  <button onClick={() => { setMenuOpen(false); handleStopImpersonating(); }}
                    className="text-xs text-purple-300 hover:text-purple-200 underline font-bold">
                    חזרה ל-{impersonating}
                  </button>
                )}
              </div>
              {/* 🆕 כפתור פרטי תשלום */}
              <button onClick={() => { setMenuOpen(false); setPhoneEditOpen(true); }}
                className="mt-3 w-full flex items-center justify-between rounded-lg bg-stone-800/60 border border-stone-700/50 px-3 py-2 text-stone-300 hover:bg-stone-800 transition text-sm">
                <span className="flex items-center gap-2">
                  <span>📱</span>
                  <span>פרטי תשלום שלי</span>
                </span>
                {phones[currentUser]?.phone ? (
                  <span className="text-xs text-emerald-400 tabular-nums" dir="ltr">
                    ✓ {phones[currentUser].phone.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')}
                  </span>
                ) : (
                  <span className="text-xs text-amber-400">⚠️ חסר</span>
                )}
              </button>
              {/* 🆕 כפתור ניקוי תזכורות תשלום במכשיר זה */}
              <button onClick={async () => {
                if (!confirm('לסמן את כל תזכורות התשלום כ"טופלו"?\n\n⚠️ זה יסיר אותן מהרשימה ולא יחזיר אותן. מועיל אם נוצרו תזכורות מערבי ניסיון או שטיפלת בהן ידנית.')) return;
                try {
                  // 🔑 סימון כל התזכורות הנוכחיות כ"טופלו" כדי שלא יחזרו
                  const current = loadPaymentReminders();
                  current.forEach(r => {
                    markSignatureHandled(reminderSignature(r));
                  });
                  // עכשיו מחיקה של התזכורות הנוכחיות
                  // שמור ל-Firestore לפני המחיקה
                  const toDelete = [...paymentReminders];
                  if (toDelete.length > 0) {
                    const now = Date.now();
                    const newHandled = { ...handledReminders };
                    toDelete.forEach(r => { newHandled[r.id] = now; });
                    setHandledReminders(newHandled);
                    await saveHandledToFirestore(currentUser, newHandled);
                  }
                  window.localStorage.removeItem(PAYMENTS_STORAGE_KEY);
                  setPaymentReminders([]);
                  setMenuOpen(false);
                  alert('✓ כל התזכורות נוקו מהמכשיר הזה');
                } catch (e) {
                  alert('שגיאה בניקוי התזכורות');
                }
              }}
                className="mt-2 w-full flex items-center justify-between rounded-lg bg-stone-800/60 border border-stone-700/50 px-3 py-2 text-stone-300 hover:bg-stone-800 transition text-sm">
                <span className="flex items-center gap-2">
                  <span>🗑️</span>
                  <span>נקה תזכורות תשלום</span>
                </span>
                <span className="text-xs text-stone-500">{paymentReminders.length}</span>
              </button>
            </div>

            {/* פעולות מנהל */}
            {isAdmin && (
              <div className="px-5 py-4 border-b border-stone-800 space-y-2">
                <div className="text-xs text-stone-500 tracking-wider font-bold uppercase flex items-center justify-between">
                  <span>פעולות {isSuperAdmin ? 'סופר אדמין 👑' : 'מנהל'}</span>
                  {isSuperAdmin && <span className="text-amber-400 text-[10px]">גישה מלאה</span>}
                </div>
                {can('liveSession') && (
                  <button onClick={() => { setMenuOpen(false); setLiveModalOpen(true); }}
                    className="relative w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-emerald-700/80 to-emerald-800/80 border border-emerald-700/50 px-4 py-3 text-white font-bold hover:from-emerald-600 hover:to-emerald-700 transition text-sm">
                    <span className="text-xl">🎰</span>
                    <span>עדכון ערב בלייב</span>
                    {hasLiveSession && (
                      <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </button>
                )}
                {/* 📸 עדכון ערב בתמונה - מוסתר כרגע (false) */}
                {false && can('photoSession') && (
                  <button onClick={() => { setMenuOpen(false); setModalOpen(true); }}
                    className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-blue-700/80 to-blue-800/80 border border-blue-700/50 px-4 py-3 text-white font-bold hover:from-blue-600 hover:to-blue-700 transition text-sm">
                    <span className="text-xl">📸</span>
                    <span>עדכון ערב בתמונה</span>
                  </button>
                )}
                {/* 🆕 כפתור מאוחד: ניהול משתמשים + נעילות */}
                {(can('managePlayers') || can('deviceLocks')) && (
                  <button onClick={() => { 
                    setMenuOpen(false); 
                    if (can('managePlayers')) {
                      setAdminPhonesOpen(true);
                    } else {
                      setDeviceLocksManagerOpen(true);
                    }
                  }}
                    className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-purple-700/80 to-purple-800/80 border border-purple-700/50 px-4 py-3 text-white font-bold hover:from-purple-600 hover:to-purple-700 transition text-sm">
                    <span className="text-xl">👥</span>
                    <span>ניהול משתמשים</span>
                    {Object.keys(deviceLocks).length > 0 && (
                      <span className="mr-auto text-xs bg-rose-950/50 rounded-full px-2 py-0.5">🔒 {Object.keys(deviceLocks).length}</span>
                    )}
                  </button>
                )}
                {/* 🆕 כפתור גיבוי ושחזור */}
                {can('backupRestore') && (
                  <button onClick={() => { setMenuOpen(false); loadBackupsList(); setBackupsModalOpen(true); }}
                    className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-cyan-700/80 to-cyan-800/80 border border-cyan-700/50 px-4 py-3 text-white font-bold hover:from-cyan-600 hover:to-cyan-700 transition text-sm">
                    <span className="text-xl">💾</span>
                    <span>גיבוי ושחזור</span>
                  </button>
                )}
                {/* 🆕 v2.33.39 - כפתור ניהול רישום (הועבר מהמסך הראשי) */}
                {can('registrationToggle') && (
                  <button onClick={() => { setMenuOpen(false); setRegistrationManagerOpen(true); }}
                    className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-rose-700/80 to-rose-800/80 border border-rose-700/50 px-4 py-3 text-white font-bold hover:from-rose-600 hover:to-rose-700 transition text-sm">
                    <span className="text-xl">📋</span>
                    <span>ניהול רישום</span>
                    <span className={`mr-auto text-xs rounded-full px-2 py-0.5 ${registrationEnabled ? 'bg-emerald-950/50 text-emerald-300' : 'bg-stone-800 text-stone-400'}`}>
                      {registrationEnabled ? '✓ פעיל' : '✗ כבוי'}
                    </span>
                  </button>
                )}
                {/* 🆕 כפתור מאוחד: ניהול מנהלים + הרשאות (סופר אדמין בלבד) */}
                {(can('manageAdmins') || can('managePermissions')) && (
                  <button onClick={() => { 
                    setMenuOpen(false); 
                    if (can('manageAdmins')) {
                      setManageAdminsOpen(true);
                    } else {
                      setPermissionsManagerOpen(true);
                    }
                  }}
                    className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-amber-700/80 to-amber-800/80 border border-amber-700/50 px-4 py-3 text-white font-bold hover:from-amber-600 hover:to-amber-700 transition text-sm">
                    <span className="text-xl">👑</span>
                    <span>ניהול אדמינים</span>
                    <span className="mr-auto text-xs bg-amber-950/50 rounded-full px-2 py-0.5">{adminNamesList.length}</span>
                  </button>
                )}
                {/* 📢 כפתור חדש: שליחת התראה מותאמת (סופר אדמין בלבד) */}
                {isSuperAdmin && (
                  <button onClick={() => { setMenuOpen(false); setCustomNotificationOpen(true); }}
                    className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-blue-700/80 to-indigo-800/80 border border-blue-700/50 px-4 py-3 text-white font-bold hover:from-blue-600 hover:to-indigo-700 transition text-sm">
                    <span className="text-xl">📢</span>
                    <span>שלח התראה</span>
                  </button>
                )}
                {/* 📊 כפתור חדש: ניתוח שימוש (סופר אדמין בלבד) */}
                {isSuperAdmin && (
                  <button onClick={() => { setMenuOpen(false); setAnalyticsModalOpen(true); try { trackAction('open_admin_menu'); } catch {} }}
                    className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-fuchsia-700/80 to-purple-800/80 border border-fuchsia-700/50 px-4 py-3 text-white font-bold hover:from-fuchsia-600 hover:to-purple-700 transition text-sm">
                    <span className="text-xl">📊</span>
                    <span>ניתוח שימוש</span>
                  </button>
                )}
                {/* 🔑 שינוי סיסמת סופר אדמין - רק לסופר אדמין */}
                {isSuperAdmin && (
                  <button onClick={() => { setMenuOpen(false); handleChangeSuperAdminPassword(); }}
                    className="w-full flex items-center gap-3 rounded-lg bg-stone-800 border border-stone-700 px-4 py-2.5 text-stone-200 font-bold hover:bg-stone-700 transition text-sm">
                    <span className="text-base">🔑</span>
                    <span>שנה סיסמת סופר אדמין</span>
                  </button>
                )}
                {/* 🚪 התנתקות ממנהל - חזרה להיות משתמש רגיל */}
                <button onClick={() => { setMenuOpen(false); handleAdminLogout(); }}
                  className="w-full flex items-center gap-3 rounded-lg bg-rose-950/40 border border-rose-800/60 px-4 py-2.5 text-rose-300 font-bold hover:bg-rose-950/70 transition text-sm mt-2">
                  <LogOut className="h-4 w-4" />
                  <span>התנתק כמנהל</span>
                  <span className="mr-auto text-[10px] text-rose-400/70">חזרה למצב שחקן</span>
                </button>
              </div>
            )}

            {/* כפתור כניסת מנהל (לאלו שעוד לא מנהלים אבל יכולים להיות) */}
            {!isAdmin && isAdminEligible && (
              <div className="px-5 py-4 border-b border-stone-800">
                <button onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                  className="w-full flex items-center gap-3 rounded-lg border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-amber-300 hover:bg-amber-950/50 transition text-sm font-bold">
                  <Lock className="h-4 w-4" />
                  <span>כניסת מנהל</span>
                </button>
              </div>
            )}

            {/* 🔔 כפתור הפעלת/כיבוי התראות - לכל משתמש */}
            {currentUser && notificationPermission !== 'unsupported' && (
              <div className="px-5 py-3 border-b border-stone-800">
                {notificationPermission === 'granted' ? (
                  <button onClick={() => { setMenuOpen(false); handleDisableNotifications(); }}
                    disabled={notificationBusy}
                    className="w-full flex items-center gap-3 rounded-lg border border-emerald-700/50 bg-emerald-950/30 px-4 py-2.5 text-emerald-300 hover:bg-emerald-950/50 transition text-sm font-bold disabled:opacity-50">
                    <span className="text-base">✅</span>
                    <span>התראות מופעלות</span>
                    <span className="mr-auto text-[10px] text-emerald-400/70">לחץ לכיבוי</span>
                  </button>
                ) : notificationPermission === 'denied' ? (
                  <div className="w-full flex items-center gap-3 rounded-lg border border-stone-700 bg-stone-900/50 px-4 py-2.5 text-stone-400 text-sm">
                    <span className="text-base">🔕</span>
                    <span>התראות חסומות בדפדפן</span>
                  </div>
                ) : (
                  <button onClick={() => { setMenuOpen(false); handleEnableNotifications(); }}
                    disabled={notificationBusy}
                    className="w-full flex items-center gap-3 rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-4 py-2.5 text-emerald-300 hover:bg-emerald-950/70 transition text-sm font-bold disabled:opacity-50">
                    <span className="text-base">🔔</span>
                    <span>{notificationBusy ? 'מפעיל...' : 'הפעל התראות'}</span>
                    <span className="mr-auto text-[10px] text-emerald-400/70">לקבלת עדכונים</span>
                  </button>
                )}
              </div>
            )}

            {/* טאבים */}
            <div className="px-5 py-4 space-y-1">
              <div className="text-xs text-stone-500 tracking-wider font-bold uppercase mb-2">ניווט</div>
              {tabs.map(t => {
                const Icon = t.icon;
                const active = tab === t.id;
                const isSpecial = t.special;
                const showLiveDot = t.id === 'registration' && registrationOpenNow;
                return (
                  <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }}
                    className={`relative w-full flex items-center gap-3 rounded-lg px-4 py-3 text-right font-bold transition ${
                      active 
                        ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/30' 
                        : isSpecial
                          ? 'bg-rose-950/40 border border-rose-900/60 text-rose-200 hover:bg-rose-950/70'
                          : 'text-stone-300 hover:bg-stone-900 hover:text-amber-200'
                    }`}>
                    {Icon ? <Icon className="h-5 w-5" /> : <span className="text-lg leading-none">{t.emoji}</span>}
                    <span>{t.label}</span>
                    {showLiveDot && (
                      <span className="relative flex h-2.5 w-2.5 mr-auto">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* עונה */}
            <div className="px-5 py-4 border-t border-stone-800">
              <div className="text-xs text-stone-500 tracking-wider font-bold uppercase mb-2">עונה</div>
              <select value={selectedSeason} onChange={e => setSelectedSeason(Number(e.target.value))}
                className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2.5 text-white font-bold">
                {availableSeasons.map(y => <option key={y} value={y}>עונת {y}</option>)}
              </select>
            </div>

            <div className="px-5 py-6 text-center text-xs text-stone-600 tracking-widest">
              BARBUR AI · 2026
            </div>
          </div>
        </div>
      )}

      <AddSessionModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        onSave={handleSaveSession} players={sortedPlayers} currentSeason={selectedSeason} adminName={currentUser} />
      
      <LiveSessionModal isOpen={liveModalOpen} onClose={() => setLiveModalOpen(false)}
        onSave={handleSaveSession} players={sortedActivePlayers} currentSeason={selectedSeason} adminName={currentUser} registration={registration} />
      
      {/* 🔒 מודל ניהול נעילות מכשירים (אדמין בלבד) */}
      <DeviceLocksManager
        isOpen={deviceLocksManagerOpen}
        onClose={() => setDeviceLocksManagerOpen(false)}
        deviceLocks={deviceLocks}
        currentDeviceId={deviceId}
        onRelease={handleReleaseLock}
        players={players}
        onSwitchToUsers={can('managePlayers') ? () => {
          setDeviceLocksManagerOpen(false);
          setAdminPhonesOpen(true);
        } : null}
      />
      
      {/* ⚙️ מודל ניהול הרשאות (סופר אדמין בלבד) */}
      <PermissionsManager
        isOpen={permissionsManagerOpen}
        onClose={() => setPermissionsManagerOpen(false)}
        permissions={adminPermissions}
        onUpdate={handleUpdatePermissions}
        adminNamesList={adminNamesList}
        onSwitchToAdmins={can('manageAdmins') ? () => {
          setPermissionsManagerOpen(false);
          setManageAdminsOpen(true);
        } : null}
      />
      
      {/* 📢 מודל שליחת התראה מותאמת (סופר אדמין בלבד) */}
      <CustomNotificationModal
        isOpen={customNotificationOpen}
        onClose={() => setCustomNotificationOpen(false)}
        players={players}
        registration={registration}
        adminNamesList={adminNamesList}
        onSend={handleSendCustomNotification}
      />
      
      {/* 📊 מודל ניתוח שימוש (סופר אדמין בלבד) */}
      <AnalyticsModal
        isOpen={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        isSuperAdmin={isSuperAdmin}
        activePlayers={players}
      />
      
      {/* 🏆 פופ-אפ ברכת MVP (מופיע פעם אחת לכל סבב) */}
      {mvpPopupData && (
        <MVPCelebrationPopup
          data={mvpPopupData}
          currentUser={currentUser}
          onClose={() => {
            // שמירה ב-localStorage שראינו את ה-MVPs האלה
            try {
              const seenKey = `mvp_seen_${currentUser}`;
              const seenIds = JSON.parse(localStorage.getItem(seenKey) || '[]');
              if (mvpPopupData.monthly) seenIds.push(mvpPopupData.monthly.key);
              if (mvpPopupData.quarterly) seenIds.push(mvpPopupData.quarterly.key);
              if (mvpPopupData.yearly) seenIds.push(mvpPopupData.yearly.key);
              localStorage.setItem(seenKey, JSON.stringify([...new Set(seenIds)]));
            } catch (e) {}
            setMvpPopupData(null);
          }}
        />
      )}
      
      {/* 📡 צופה בשידור חי - מופיע אוטומטית כשיש ערב חי בשעות מתאימות */}
      {broadcastViewerOpen && liveBroadcast && (
        <LiveBroadcastViewer 
          broadcast={liveBroadcast}
          currentUser={currentUser}
          onClose={() => {
            setBroadcastViewerOpen(false);
            setBroadcastDismissed(true);
          }}
        />
      )}
      
      {/* 🎰 כפתור צף לפתיחה מחדש של מסך הערב החי - מופיע כשיש שידור פעיל אבל הסגור */}
      {liveBroadcast && !broadcastViewerOpen && liveBroadcast.adminName !== currentUser && (
        <button
          onClick={() => {
            setBroadcastViewerOpen(true);
            setBroadcastDismissed(false);
          }}
          className="fixed bottom-4 left-4 z-50 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-2xl shadow-amber-900/50 px-5 py-3 font-bold text-sm flex items-center gap-2 border-2 border-amber-400/50 animate-pulse"
          title="פתח את מסך הערב החי"
        >
          🎰 מסך ערב חי
        </button>
      )}
      
      {/* 🍻 מסך אישור אירוח - מופיע למארח שצריך לאשר אירוח עתידי */}
      {hostReminderModal && (
        <HostReminderModal
          sessionDate={hostReminderModal.sessionDate}
          sessionHost={hostReminderModal.sessionHost}
          onConfirm={async () => {
            try {
              const reminders = (await fbLoadState(HOST_REMINDERS_KEY)) || {};
              const key = hostReminderModal.reminderKey || `${hostReminderModal.sessionDate}_${hostReminderModal.sessionHost}`;
              reminders[key] = {
                ...(reminders[key] || {}),
                sessionDate: hostReminderModal.sessionDate,
                sessionHost: hostReminderModal.sessionHost,
                response: 'confirmed',
                respondedAt: new Date().toISOString(),
              };
              await fbSaveState(reminders, HOST_REMINDERS_KEY);
              setHostReminderModal(null);
              alert('✅ תודה! האירוח נרשם.');
            } catch (e) {
              console.error('שגיאה באישור אירוח:', e);
              alert('❌ שגיאה - נסה שוב');
            }
          }}
          onDecline={async () => {
            try {
              const reminders = (await fbLoadState(HOST_REMINDERS_KEY)) || {};
              const key = hostReminderModal.reminderKey || `${hostReminderModal.sessionDate}_${hostReminderModal.sessionHost}`;
              reminders[key] = {
                ...(reminders[key] || {}),
                sessionDate: hostReminderModal.sessionDate,
                sessionHost: hostReminderModal.sessionHost,
                response: 'declined',
                respondedAt: new Date().toISOString(),
              };
              await fbSaveState(reminders, HOST_REMINDERS_KEY);
              setHostReminderModal(null);
              alert('❌ ההודעה נשלחה לאדמינים. הם יחזרו אליך.');
            } catch (e) {
              console.error('שגיאה בדחיית אירוח:', e);
              alert('❌ שגיאה - נסה שוב');
            }
          }}
          onLater={() => setHostReminderModal(null)}
        />
      )}
      
      <AdminLoginModal 
        isOpen={loginOpen} 
        onClose={() => setLoginOpen(false)} 
        onLogin={handleAdminLogin} 
        currentUser={currentUser}
        superAdminPasswordHash={superAdminPasswordHash}
        onSetSuperAdminPassword={handleSetSuperAdminPassword}
      />
      
      {/* 🆕 ניהול רשימת מנהלים */}
      <ManageAdminsModal 
        isOpen={manageAdminsOpen}
        onClose={() => setManageAdminsOpen(false)}
        adminNames={adminNamesList}
        currentAdminName={adminName}
        allPlayers={players}
        onAdd={handleAddAdmin}
        onRemove={handleRemoveAdmin}
        onSwitchToPermissions={can('managePermissions') ? () => {
          setManageAdminsOpen(false);
          setPermissionsManagerOpen(true);
        } : null}
      />

      {/* 🆕 מודל הזדהות (כניסה ראשונה - חובה למלא טלפון) */}
      <PhoneSetupModal 
        isOpen={phoneSetupOpen}
        onClose={() => setPhoneSetupOpen(false)}
        playerName={currentUser}
        currentPhone={phones[currentUser]}
        onSave={(data) => handleSavePhone(currentUser, data)}
        isFirstTime={true}
        canCancel={false} />

      {/* 🆕 מודל עריכת פרטי תשלום (פעולה יזומה - אפשר לבטל) */}
      <PhoneSetupModal 
        isOpen={phoneEditOpen}
        onClose={() => setPhoneEditOpen(false)}
        playerName={currentUser}
        currentPhone={phones[currentUser]}
        onSave={(data) => handleSavePhone(currentUser, data)}
        isFirstTime={false}
        canCancel={true}
        isAdmin={isAdmin} />

      {/* 🆕 מודל מנהל - ניהול משתמשים (טלפונים + הסתרה + הוספה) */}
      <AdminPhonesModal
        isOpen={adminPhonesOpen}
        onClose={() => setAdminPhonesOpen(false)}
        players={players}
        phones={phones}
        onSave={handleSavePhone}
        hiddenPlayers={hiddenPlayers}
        lastLogins={lastLogins}
        onSwitchToLocks={can('deviceLocks') ? () => {
          setAdminPhonesOpen(false);
          setDeviceLocksManagerOpen(true);
        } : null}
        locksCount={Object.keys(deviceLocks).length}
        onToggleHidden={async (name) => {
          const newHidden = hiddenPlayers.includes(name)
            ? hiddenPlayers.filter(n => n !== name)
            : [...hiddenPlayers, name];
          setHiddenPlayers(newHidden);
          try {
            await saveState(newHidden, HIDDEN_PLAYERS_KEY);
          } catch (e) {
            console.error('Failed to save hidden players:', e);
          }
        }}
        onAddPlayer={async (name) => {
          const newPlayers = [...players, name];
          setPlayers(newPlayers);
          await persistSessions(allSessions, newPlayers, hostingSchedule);
        }}
        birthdays={birthdays}
        onSaveBirthday={async (name, dateOrNull) => {
          const updated = { ...birthdays };
          if (dateOrNull) {
            updated[name] = dateOrNull;
          } else {
            delete updated[name];
          }
          setBirthdays(updated);
          try {
            await saveState(updated, BIRTHDAYS_KEY);
          } catch (e) {
            console.error('Failed to save birthday:', e);
          }
        }} />

      {/* 🆕 מודל ניהול גיבויים */}
      <BackupsModal
        isOpen={backupsModalOpen}
        onClose={() => setBackupsModalOpen(false)}
        backupsList={backupsList}
        onCreateBackup={handleManualBackup}
        onDownload={handleDownloadExistingBackup}
        onRestore={handleRestoreBackup}
        onUploadFile={handleUploadBackupFile}
        onRefresh={loadBackupsList} />
      
      {/* 🆕 v2.33.39 - דיאלוג ניהול רישום (הועבר מהמסך הראשי) */}
      {registrationManagerOpen && can('registrationToggle') && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setRegistrationManagerOpen(false)}>
          <div className="relative w-full max-w-md rounded-2xl border-2 border-rose-700/60 bg-gradient-to-br from-stone-900 to-stone-950 p-5 shadow-2xl"
               onClick={e => e.stopPropagation()} dir="rtl">
            {/* כפתור סגירה */}
            <button onClick={() => setRegistrationManagerOpen(false)}
              className="absolute top-3 left-3 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white w-8 h-8 flex items-center justify-center transition">
              <X className="h-4 w-4" />
            </button>
            
            {/* כותרת */}
            <div className="flex items-center gap-2 mb-4 pl-8">
              <span className="text-2xl">📋</span>
              <div>
                <div className="text-lg font-extrabold text-rose-200">ניהול רישום</div>
                <div className="text-xs text-stone-400">פעולות אדמין על מערכת הרישום</div>
              </div>
            </div>
            
            {/* סטטוס + כפתור הפעל/כבה */}
            <div className={`rounded-xl p-3 border-2 mb-3 ${
              registrationEnabled 
                ? 'bg-emerald-950/30 border-emerald-700' 
                : 'bg-stone-900 border-amber-800/60'
            }`}>
              <div className="text-sm text-stone-200 mb-2">
                סטטוס: {registrationEnabled ? 
                  <span className="text-emerald-300 font-bold">✓ פעיל אצל כולם</span> : 
                  <span className="text-stone-400 font-bold">✗ מוסתר משאר המשתמשים</span>
                }
              </div>
              <button
                onClick={() => { handleToggleRegistrationFeature(); }}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                  registrationEnabled
                    ? 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                }`}
              >
                {registrationEnabled ? '🚫 כבה גלובלית' : '✅ הפעל לכולם'}
              </button>
            </div>
            
            {/* כפתורי פעולה - לסופר אדמין בלבד */}
            {isSuperAdmin && (
              <div className="space-y-2">
                <div className="text-xs text-amber-400 font-bold tracking-wider mb-1">⚙️ פעולות סופר אדמין</div>
                <button
                  onClick={() => { handleManualResetRegistration(); }}
                  className="w-full rounded-lg px-3 py-2.5 text-sm font-bold bg-amber-900/40 hover:bg-amber-900/60 border border-amber-800 text-amber-200 transition flex items-center justify-center gap-2"
                  title="מאפס את הרשימה ומאכלס את המארח של המפגש הבא"
                >
                  <span>🔄</span>
                  <span>אפס רישום</span>
                </button>
                <button
                  onClick={() => { handleManualSendNotification(); }}
                  className="w-full rounded-lg px-3 py-2.5 text-sm font-bold bg-blue-900/40 hover:bg-blue-900/60 border border-blue-800 text-blue-200 transition flex items-center justify-center gap-2"
                  title="שולח התראה לכל מי שאישר התראות שהרישום נפתח"
                >
                  <span>🔔</span>
                  <span>שלח התראה לכולם</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 🎂 פופאפ יום הולדת */}
      {birthdayPopup && (
        <BirthdayPopup 
          name={birthdayPopup.name}
          daysLate={birthdayPopup.daysLate || 0}
          onClose={() => setBirthdayPopup(null)} />
      )}

      {/* 🔔 הודעה על שינוי הרשאות (לאדמינים רגילים בלבד) */}
      {permissionsToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[calc(100%-2rem)] animate-fadeInUp">
          <div className="rounded-2xl border-2 border-amber-600 bg-stone-950/95 backdrop-blur-md shadow-2xl shadow-amber-900/40 p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0">🔔</div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-amber-300 text-sm mb-1">ההרשאות שלך עודכנו</div>
                {permissionsToast.added.length > 0 && (
                  <div className="text-xs text-emerald-300 mb-1">
                    <span className="font-bold">✅ נוסף:</span> {permissionsToast.added.join(' • ')}
                  </div>
                )}
                {permissionsToast.removed.length > 0 && (
                  <div className="text-xs text-rose-300">
                    <span className="font-bold">❌ הוסר:</span> {permissionsToast.removed.join(' • ')}
                  </div>
                )}
                <div className="text-[10px] text-stone-500 mt-1">השינוי כבר תקף - בדוק את התפריט</div>
              </div>
              <button onClick={() => setPermissionsToast(null)}
                className="text-stone-500 hover:text-white shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Assistant:wght@300;400;500;600;700;800&family=Cinzel:wght@600;800&display=swap');
        * { font-family: 'Heebo', 'Assistant', sans-serif !important; }
        .font-cinzel, [style*="Cinzel"], svg text { font-family: 'Cinzel', serif !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(120,113,108,0.1); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.4); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.6); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(167,139,250,0.4) rgba(120,113,108,0.1); }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: translateY(-50%) translateX(0); }
          50% { opacity: 0.85; transform: translateY(-50%) translateX(-3px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 1rem); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.3s ease-out; }
        .animate-pulse-subtle { animation: pulse-subtle 1.8s ease-in-out infinite; }
        @keyframes swan-arc {
          0% { opacity: 0; transform: translate(0, 0); }
          5% { opacity: 1; }
          35% { opacity: 1; transform: translate(var(--peak-x, 0), var(--peak-y, 0)); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--fall-x, 0), var(--fall-y, 0)); }
        }
        @keyframes swan-bob {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-4px) rotate(3deg); }
        }
        @keyframes confetti-message {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          25% { transform: translate(-50%, -50%) scale(1); }
          75% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
        }
        .animate-confetti-message { animation: confetti-message 5s ease-out forwards; }
        @keyframes flame-flicker {
          0%, 100% { transform: scale(1) rotate(-1deg); filter: brightness(1) drop-shadow(0 0 3px rgba(251, 146, 60, 0.6)); }
          25% { transform: scale(1.08) rotate(1.5deg); filter: brightness(1.15) drop-shadow(0 0 5px rgba(251, 146, 60, 0.8)); }
          50% { transform: scale(0.95) rotate(-0.5deg); filter: brightness(0.95) drop-shadow(0 0 2px rgba(251, 146, 60, 0.5)); }
          75% { transform: scale(1.05) rotate(1deg); filter: brightness(1.1) drop-shadow(0 0 4px rgba(251, 146, 60, 0.7)); }
        }
        .streak-flame svg {
          animation: flame-flicker 1.4s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .streak-flame.streak-mega svg { animation-duration: 0.9s; }
        .streak-flame.streak-high svg { animation-duration: 1.1s; }
      `}</style>
    </div>
  );
}
