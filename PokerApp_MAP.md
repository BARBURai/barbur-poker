# 🃏 PokerApp.jsx — MAP משודרג עם תלויות
> קובץ: `src/PokerApp.jsx` | גרסה: v2.33.56 | שורות: 15,866

---

## 🗺️ State גלובלי — PokerApp (שורה ~12800+)

| State | סוג | תיאור | זורם ל |
|-------|-----|--------|--------|
| `allSessions` | array | כל הסשנים היסטוריה+Firestore | MainLeaderboard, PeriodicTables, DashboardCarousel, RegistrationTab |
| `players` | array | שמות שחקנים | AdminPhonesModal, AddSessionModal, LiveSessionModal |
| `phones` | object | מספרי טלפון | AdminPhonesModal, DashboardCarousel, PaymentReminders |
| `hiddenPlayers` | array | שחקנים מוסתרים | AdminPhonesModal, MainLeaderboard |
| `hostingSchedule` | array | לוח אירוח | HostingTab, RegistrationTab, DashboardCarousel |
| `registration` | object | נרשמים לערב הבא | RegistrationTab, LiveSessionModal, DashboardCarousel |
| `paymentReminders` | array | תזכורות תשלום | DashboardCarousel → PaymentReminders |
| `handledReminders` | object | תזכורות שטופלו (Firestore) | DashboardCarousel → PaymentReminders |
| `dynamicAvatars` | object | אווטרים מ-Firestore | AdminPhonesModal |
| `currentUser` | string | שם המשתמש הנוכחי | כמעט כולן |
| `isAdmin` / `isSuperAdmin` | bool | הרשאות | כמעט כולן |
| `lastLogins` | object | כניסות אחרונות | AdminPhonesModal |
| `birthdays` | object | ימי הולדת | AdminPhonesModal, BirthdayPopup |

---

## 🔗 Props Flow — מי מעביר מה למי

### PokerApp → DashboardCarousel (שורה ~15000)
```
currentUser, sessions, allSessions, stats, hostingSchedule,
paymentReminders, phones, onUpdateReminders,
handledReminders, onUpdateHandled,
isSuperAdmin, isMobile
```

### DashboardCarousel → PaymentReminders (שורה ~11204)
```
playerName=currentUser, reminders=paymentReminders,
phones, onUpdateReminders,
handledReminders, onUpdateHandled  ← חשוב! זה ה-Firestore handled
```

### PokerApp → RegistrationTab (שורה ~14900)
```
hostingSchedule, sessions, currentUser,
isAdmin, isSuperAdmin,
registration, onRegistrationUpdate,
ironRegistration, onIronUpdate
```
⚠️ randomOpenTimeRef חי בתוך RegistrationTab עצמה (לא prop)

### PokerApp → AdminPhonesModal (שורה ~15646)
```
players, phones, onSave,
hiddenPlayers, onToggleHidden,
onAddPlayer, birthdays, onSaveBirthday,
lastLogins, dynamicAvatars, onSaveAvatar
```

### PokerApp → LiveSessionModal (שורה ~15700)
```
players, currentSeason, adminName, registration
```

---

## 🔥 Firestore Keys — מי קורא/כותב

| Key | קורא | כותב | שורה |
|-----|------|-------|------|
| `poker_group_state_v4` | PokerApp (טעינה ראשית) | PokerApp (persistSessions) | ~13558 |
| `poker_next_session_registration_v1` | PokerApp | RegistrationTab, LiveSessionModal | ~13558 |
| `poker_registration_feature_enabled_v1` | PokerApp | RegistrationTab (כפתור ידני) | ~13558 |
| `poker_daily_random_time_v1` | RegistrationTab (useEffect פנימי) | RegistrationTab (כפתור ידני) | ~4463 |
| `poker_avatars_v1` | PokerApp | AdminPhonesModal (onSaveAvatar) | ~12821 |
| `poker_handled_v2_{user}` | PokerApp (useEffect currentUser) | PaymentReminders (onUpdateHandled) | ~12829 |
| `poker_live_broadcast_v1` | LiveBroadcastViewer | LiveSessionModal | ~285 |
| `poker_push_tokens_v1` | push functions | PhoneSetupModal | ~207 |

---

## 📦 קומפוננטות — מפה מלאה

| שורות | קומפוננטה | Props עיקריים | Firestore | הערות |
|--------|-----------|---------------|-----------|-------|
| 586 | `PlayerAvatar` | name, size | avatars_v1 (דרך getDynamicAvatar) | |
| 924 | `SplashScreen` | onEnter | — | |
| 1026 | `ManageAdminsModal` | adminNames, allPlayers, onAdd, onRemove | — | |
| 1144 | `AdminLoginModal` | onLogin, currentUser, superAdminPasswordHash | — | |
| 1842 | `AnalyticsModal` | isOpen, isSuperAdmin, activePlayers | analytics_sessions_* | גרפים: progress bars + recharts |
| 2644 | `MainLeaderboard` | stats, sessions, hiddenPlayers, allSessions | — | ניצחונות/הפסדים/תיקו |
| 2787 | `AddSessionModal` | players, currentSeason, adminName | — | |
| 2341 | `TableIntegrityIndicator` | sessions | — | |
| 3655 | `PersonalInsights` | currentUser, allSessions, sessions | — | |
| 4442 | `RegistrationTab` | hostingSchedule, sessions, currentUser, isAdmin, registration | registration_v1, enabled_v1, **daily_random_time_v1** | randomOpenTimeRef פנימי! |
| 5231 | `HostingTab` | hostingSchedule, isAdmin, players, registration | — | |
| 5871 | `PersonalInsightsBox` | currentUser, sessions, allSessions | — | |
| 6677 | `PersonalCharts` | currentUser, sessions | — | |
| 7852 | `EveningSummaryCard` | session, players | — | |
| 8045 | `PaymentReminders` | playerName, reminders, phones, onUpdateReminders, **handledReminders, onUpdateHandled** | handled_v2_{user} | id דטרמיניסטי! |
| 8247 | `CustomNotificationModal` | — | push_tokens_v1 | |
| 8456 | `MVPCelebrationPopup` | — | — | |
| 8675 | `LiveBroadcastViewer` | — | live_broadcast_v1 | |
| 8837 | `LiveSessionModal` | players, currentSeason, adminName, registration | group_state_v4 | ערב חי |
| 9777 | `SettlementModal` | — | — | |
| 10090 | `ChampionsTab` | allSessions, players | — | |
| 10801 | `PeriodicTables` | allSessions, players | — | יומי/חודשי/רבעוני/חצי/שנתי, multi-year |
| 11102 | `PaymentArchive` | — | — | |
| 11204 | `DashboardCarousel` | currentUser, sessions, allSessions, stats, hostingSchedule, paymentReminders, phones, onUpdateReminders, **handledReminders, onUpdateHandled** | — | עטיפה לדשבורד |
| 11568 | `GalleryTab` | — | — | |
| 11998 | `BackupsModal` | — | group_state_v4 | |
| 12107 | `AdminPhonesModal` | players, phones, hiddenPlayers, birthdays, lastLogins, **dynamicAvatars, onSaveAvatar** | avatars_v1 | ניהול משתמשים + אווטרים |
| 12475 | `BirthdayPopup` | — | — | |
| 12631 | `PhoneSetupModal` | playerName, currentPhone, onSave | push_tokens_v1 | |

---

## ⚠️ נקודות קריטיות

1. **sessions.json vs Firestore**: sessions מ-2026 מגיעים רק מ-Firestore. שנים קודמות מ-sessions.json. הלוגיקה בשורה ~13328.

2. **תזכורות תשלום — זרימה מלאה**:
   - `PokerApp` טוען `handledReminders` מ-Firestore לפי currentUser
   - מעביר ל-`DashboardCarousel` → `PaymentReminders`
   - `PaymentReminders` שומר בחזרה ל-Firestore דרך `onUpdateHandled`
   - id דטרמיניסטי: `host_DATE_FROM_TO` / `settle_DATE_FROM_TO`

3. **randomOpenTimeRef** — חי **בתוך** `RegistrationTab` בשורה ~4463. לא prop! לא state גלובלי!

4. **getDynamicAvatar** — שורה 588: Firestore גובר על avatars.json

5. **ANALYTICS_DISABLED** — שורה 426: `false` = פעיל

6. **הכפתור הידני לרישום** — שורה ~14390: כותב גם ל-`REGISTRATION_ENABLED_KEY` וגם ל-`RANDOM_TIME_KEY`

---

## 🪟 מודאלים — שכבות Z-Index וסדר עדיפויות

**כלל קריטי:** מודאל עם z גבוה יותר תמיד מוצג מעל. אם מודאל נחסם — בדוק z-index.

| z-index | קומפוננטה | שורה | scroll | הערות |
|---------|-----------|------|--------|-------|
| z-50 | AdminLoginModal | 1144 | overflow-y-auto | |
| z-50 | AddSessionModal | 2787 | overflow-y-auto | |
| z-50 | PermissionsManager | 4147 | overflow-y-auto | |
| z-50 | DeviceLocksManager | 4296 | overflow-y-auto | |
| z-50 | BackupsModal | 11998 | overflow-y-auto | |
| z-50 | PhoneSetupModal | 12631 | overflow-y-auto | |
| z-50 | תפריט המבורגר | 15151 | — | overlay בלבד |
| z-60 | ManageAdminsModal | 1026 | — | מעל z-50 |
| z-70 | GalleryImageModal | 11899 | — | |
| z-100 | **AnalyticsModal** | 1842 | **flex+overflow-inside** | ⚠️ scroll על div פנימי בלבד! |
| z-100 | TableIntegrityIndicator | 2341 | overflow-y-auto | |
| z-100 | CustomNotificationModal | 8247 | overflow-y-auto | |
| z-100 | LiveBroadcastViewer | 8675 | overflow-auto | |
| z-100 | AdminPhonesModal | 12107 | overflow-y-auto | |
| z-100 | BirthdayPopup | 12497 | — | |
| z-200 | MVPCelebrationPopup | 8456 | — | מעל הכל |
| z-200 | HostReminderModal | 8607 | — | מעל הכל |
| z-200 | Confetti | 7779 | — | pointer-events-none |
| z-9999 | Toast/Snackbar | 15784 | — | תמיד למעלה |

---

## 🔄 Pattern scroll נכון למודאלים עם כותרת קבועה

**❌ שגוי — גורם לכותרת לחפוף תוכן:**
```jsx
<div className="fixed inset-0 overflow-y-auto">
  <div>
    <div className="sticky top-0">כותרת</div>
    <div>תוכן — נחתך מלמעלה!</div>
  </div>
</div>
```

**✅ נכון — AnalyticsModal (אחרי תיקון v2.33.57):**
```jsx
<div className="fixed inset-0 flex items-center justify-center">
  <div className="flex flex-col" style={{ maxHeight: '90vh' }}>
    <div className="flex-shrink-0">כותרת קבועה</div>
    <div className="overflow-y-auto flex-1">תוכן גולל</div>
  </div>
</div>
```

---

## 🔗 השפעות בין מודאלים

| מצב | מה קורה |
|-----|---------|
| MVPCelebrationPopup פתוח (z-200) | מכסה הכל חוץ מ-Confetti וToast |
| HostReminderModal (z-200) | מכסה כל z-100 — זה בכוונה |
| תפריט המבורגר (z-50) | נחסם על ידי כל מודאל z-60+ |
| BirthdayPopup (z-100) | יכול להופיע מעל מרבית המודאלים |

---

## 📐 4 שאלות לפני כל שינוי במודאל

1. **מה ה-z-index?** האם מתאים לשכבה הנכונה?
2. **איפה ה-overflow?** חיצוני או פנימי?
3. **יש כותרת קבועה?** אם כן — scroll חייב להיות על container פנימי בלבד
4. **יש maxHeight?** בלי זה — המודאל יחרוג מהמסך ב-mobile

---

## 💻 קבצים על המחשב — מדריך מלא

### מבנה הפרויקט
```
C:\barbur-poker\
├── functions\
│   ├── index.js              ← 10 Cloud Functions — הקובץ החשוב ביותר במחשב!
│   ├── package.json
│   └── node_modules\
├── public\
│   └── firebase-messaging-sw.js  ← Service Worker להתראות Push
├── src\
│   └── PokerApp.jsx          ← לא חובה במחשב, רק בGitHub
├── PokerApp_MAP.md           ← מפת הקוד הזו
└── package.json
```

---

### ⚡ טבלת החלטה מהירה

| הבעיה/הצורך | היכן לתקן | איך |
|-------------|-----------|-----|
| באג בUI/לוגיקה | PokerApp.jsx | גרור ל-GitHub → Vercel בונה |
| נתון שגוי 2025 ומטה | sessions.json | גרור ל-GitHub |
| נתון שגוי 2026 | Firestore ישירות | קונסול דפדפן |
| רישום לא נפתח בשעה הנכונה | index.js | `firebase deploy --only functions` |
| תמונת פרופיל | ממשק אפליקציה | Firestore (ללא deploy) |
| התראות Push לא עובדות | firebase-messaging-sw.js | גרור ל-GitHub |

---

### 🔴 קובץ 1: `index.js` — Cloud Functions

**מיקום:** `C:\barbur-poker\functions\index.js`

**10 הפונקציות (אזור: europe-west1):**

| # | פונקציה | מה עושה | מתי רצה |
|---|---------|---------|---------|
| 1 | `notifyRegistrationOpen` | התראה שרישום נפתח | Firestore trigger |
| 2 | `notifyEntryRemoved` | התראה שנמחק שחקן | Firestore trigger |
| 3 | `dailyRandomScheduler` | בוחר שעה 10:00-12:00 | 09:55 יום אחרי מפגש |
| 4 | `minuteRegistrationCheck` | בודק אם הגיע הזמן | כל דקה 10:00-12:00 |
| 5 | `dailyResetRegistration` | מאפס רישום | 06:00 יום אחרי מפגש |
| 6 | `dailyHostReminder` | תזכורת למארח | כל יום 09:00 |
| 7 | `notifyHostDeclined` | מארח דחה | Firestore trigger |
| 8 | `checkPendingReminders` | תזכורות לא נענו | כל יום 19:00 |
| 9 | `sendCustomNotification` | התראה מותאמת | Firestore trigger |
| 10 | `monthlyMVPNotification` | MVP חודשי | 1 לחודש 09:00 |

**שלבי עדכון:**
```
1. הורד index.js מהצ'אט
2. החלף ב-C:\barbur-poker\functions\index.js
3. פתח cmd ב-C:\barbur-poker\
4. הרץ: firebase deploy --only functions
5. חכה ~3 דקות ל-"Deploy complete!"
```

**⚠️ אם כתוב "Skipped"** — הקובץ לא הוחלף על המחשב. Firebase מזהה שינויים לפי תוכן.

**תקלות נפוצות:**
```
"firebase: command not found"  → npm install -g firebase-tools
"Permission denied"            → firebase login
deploy נכשל                   → cd functions && npm install && cd .. && firebase deploy --only functions
שגיאת syntax                  → node --check index.js
```

---

### 🟡 קובץ 2: `firebase-messaging-sw.js` — Service Worker

**מיקום:** `C:\barbur-poker\public\firebase-messaging-sw.js`

**מה עושה:** קבלת התראות Push כשהאפליקציה **לא פתוחה**.

**VAPID Key:** `BPYwf-_fn2Glo1FnwoU2sN_UgoOqFL2HuNAaQ2sdrcu-TbrBAUebqdY-t1eBbRvyHvEiyz_1QXFh9Gw-eFPz_4A`

**מתי לעדכן:** רק אם משנים VAPID Key או Firebase config. בדרך כלל לא נוגעים.

**עדכון:** גרור ל-GitHub → `public/firebase-messaging-sw.js` → Vercel בונה.

---

### 🟢 קובץ 3: `PokerApp.jsx` — לא חובה במחשב!

**מיקום:** GitHub בלבד — `github.com/BARBURai/barbur-poker/src/PokerApp.jsx`

**עדכון:** Claude נותן קובץ → גרור ל-GitHub → Vercel בונה (~2 דקות).

---

### 🔵 מתי אין צורך בפעולה במחשב

| פעולה | דרך |
|--------|-----|
| עדכון תוצאות ערב 2026 | Firestore דרך קונסול דפדפן |
| פתיחת/סגירת רישום | כפתור ידני בממשק האדמין |
| העלאת תמונת פרופיל | ממשק ניהול משתמשים |
| גיבוי ושחזור | ממשק גיבויים באפליקציה |
| שינוי טלפון/הרשאות | ממשק ניהול באפליקציה |

---

### 🔗 חיבור בין הקבצים

```
sessions.json ──→ PokerApp.jsx (נטען בbuild, גלובלי)
avatars.json ───→ PokerApp.jsx (נטען בbuild, גלובלי)
                         │
                  Firestore (runtime — גובר!)
                  ├── poker_group_state_v4     (גובר על sessions.json ב-2026)
                  ├── poker_avatars_v1         (גובר על avatars.json)
                  ├── poker_daily_random_time_v1
                  ├── poker_next_session_registration_v1
                  └── עוד 18 מפתחות...

index.js ───────→ Cloud Functions (שרת Google, europe-west1)
                  ├── dailyRandomScheduler → כותב ל-poker_daily_random_time_v1
                  ├── minuteRegistrationCheck → קורא מ-poker_daily_random_time_v1
                  └── notifyRegistrationOpen → trigger מ-Firestore
```

---

### 📊 כל מפתחות Firestore

| מפתח | מטרה | מי משתמש |
|------|------|----------|
| `poker_group_state_v4` | מצב ראשי — sessions, players | PokerApp |
| `poker_next_session_registration_v1` | נרשמים לערב הבא | PokerApp + Functions |
| `poker_registration_feature_enabled_v1` | האם רישום פתוח | PokerApp + Functions |
| `poker_iron_registration_v1` | רישום ברזל | PokerApp |
| `poker_push_tokens_v1` | טוקני מכשירים | PokerApp + Functions |
| `poker_daily_random_time_v1` | שעה אקראית 10-12 | Functions כותב, PokerApp קורא |
| `poker_host_reminders_v1` | תזכורות מארחים | PokerApp + Functions |
| `poker_avatars_v1` | אווטרים דינמיים | PokerApp |
| `poker_handled_v2_{user}` | תזכורות תשלום שטופלו | PokerApp (לפי משתמש) |
| `poker_admin_names_v1` | רשימת אדמינים | PokerApp |
| `poker_mvp_results_v1` | תוצאות MVP | PokerApp + Functions |
| `poker_custom_notification_v1` | התראות מותאמות | PokerApp + Functions |
| `poker_hidden_players_v1` | שחקנים מוסתרים | PokerApp |
| `poker_super_admin_password_v1` | סיסמת סופר אדמין | PokerApp |
| `poker_quotes_state_v1` | ציטוטים | PokerApp |
| `poker_gallery_state_v1` | גלריה | PokerApp |
| `poker_payment_reminders_v1` | תזכורות תשלום | PokerApp |
| `poker_birthdays_v1` | ימי הולדת | PokerApp |
| `poker_phones_v1` | טלפונים | PokerApp |
| `poker_live_broadcast_v1` | ערב חי משותף | PokerApp |
| `poker_admin_permissions_v1` | הרשאות אדמינים | PokerApp |
| `poker_backup_*` | גיבויים אוטומטיים | PokerApp |

---

### 🔐 פרטי גישה

| שירות | כתובת/פרטים |
|--------|------------|
| Firebase Project | `barbur-poker` |
| חשבון | `mosheasaraf55@gmail.com` |
| תוכנית | Blaze (תשלום לפי שימוש) |
| Firebase Console | https://console.firebase.google.com/project/barbur-poker |
| GitHub | github.com/BARBURai/barbur-poker |
| Vercel | https://barbur-poker.vercel.app |

**⚠️ אחרי סיום פרויקט:** לבטל הרשאות Firebase CLI: https://myaccount.google.com/permissions

---

### 🚨 פרוטוקול תקלה חמורה

```
1. Firebase Console → Functions → Logs → מה השגיאה?
2. הרץ deploy שוב: firebase deploy --only functions
3. אם לא עוזר → גיבוי: סופר אדמין → גיבוי ושחזור (12 גיבויים זמינים)
4. פנה לClaude עם פירוט השגיאה + הלוגים
```

---

### 🛠️ כלים נדרשים במחשב

```bash
node --version      # חייב 18.x ומעלה
firebase --version  # חייב להיות מותקן
firebase login      # פעם אחת עם mosheasaraf55@gmail.com
```
