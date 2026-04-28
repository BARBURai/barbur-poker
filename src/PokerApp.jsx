import React, { useState, useEffect, useMemo, useRef } from 'react';
import SESSIONS_DATA from './data/sessions.json';
import HOSTING_DATA from './data/hosting.json';
import QUOTES_DATA from './data/quotes.json';
import BARBUR_LOGO from './assets/barbur-logo.webp';
import SWAN_IMG from './assets/swan.png';
import { loadState as fbLoadState, saveState as fbSaveState } from './firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Upload, Users, TrendingUp, Calendar, Plus, X, Check, AlertCircle, Loader2, Download, RefreshCw, Crown, Skull, Flame, Target, HelpCircle, Maximize2, Filter, LayoutDashboard, Table, BarChart3, History, ChevronDown, ChevronLeft, ChevronRight, Lock, LogOut, Quote, Heart, Search, Trash2, MessageSquare, Sparkles, Image as ImageIcon, Camera } from 'lucide-react';

// 🔖 גרסה - מוצגת בתחתית האפליקציה
const APP_VERSION = 'v2.23.2';
const APP_BUILD_TIME = '28/04/2026 12:04';
const APP_NOTES = 'סינון אירוחים לפי שם מארח';


// ===== הרשאות מנהל =====
const ADMIN_PASSWORD = 'barbur2026'; // סיסמה זמנית - להחליף בסיסמה האמיתית
const ADMIN_NAMES = ['רון', 'גילי']; // ברירת מחדל - ניתן לערוך מהאפליקציה
const ADMIN_NAMES_KEY = 'poker_admin_names_v1'; // 🆕 רשימת מנהלים שמורה ב-Firebase

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
  'מיקי', 'יובל בלוך', 'אמנון', 'אשר/ערן'
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

// ===== חישובי סטטיסטיקה =====
const calculateStats = (sessions, players) => {
  const stats = {};
  players.forEach(p => {
    stats[p] = { name: p, total: 0, sessions: 0, wins: 0, losses: 0, ties: 0,
      maxStreak: 0, currentStreak: 0, biggestWin: 0, biggestLoss: 0, values: [], hosted: 0 };
  });
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  sortedSessions.forEach(session => {
    if (session.host && stats[session.host]) stats[session.host].hosted++;
    Object.entries(session.results || {}).forEach(([name, amount]) => {
      if (!stats[name]) return;
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

const calculateCumulative = (sessions, selectedPlayers) => {
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const running = {};
  selectedPlayers.forEach(p => running[p] = 0);
  return sortedSessions.map(session => {
    const point = { date: session.date, label: new Date(session.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) };
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
const ManageAdminsModal = ({ isOpen, onClose, adminNames, currentAdminName, allPlayers, onAdd, onRemove }) => {
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
            🔐 ניהול מנהלים
          </h3>
          <button onClick={onClose}
            className="rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 w-8 h-8 flex items-center justify-center text-stone-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        
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
                <select 
                  value={selectedNew}
                  onChange={e => setSelectedNew(e.target.value)}
                  className="flex-1 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-white">
                  <option value="">בחר שחקן...</option>
                  {eligiblePlayers.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
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

const AdminLoginModal = ({ isOpen, onClose, onLogin, currentUser }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (password !== ADMIN_PASSWORD) { setError('סיסמה שגויה'); return; }
    onLogin(currentUser);
    setPassword(''); setError('');
    onClose();
  };

  if (!isOpen) return null;

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
          </div>
          <div>
            <label className="block text-xs text-stone-400 mb-1">סיסמת מנהל</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white focus:border-amber-600 focus:outline-none" />
          </div>
          {error && <div className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</div>}
          <button onClick={handleSubmit}
            className="w-full rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-3 font-bold text-white hover:from-amber-500 hover:to-amber-600 transition">
            הפוך למנהל
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
      if (prev.includes(year)) {
        return prev.length === 1 ? prev : prev.filter(y => y !== year);
      }
      return [...prev, year].sort((a, b) => b - a);
    });
  };
  const selectAllYears = () => setSelectedYears([...allYears]);
  const colors = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#2dd4bf', '#f87171', '#c084fc', '#facc15', '#4ade80', '#38bdf8', '#fb7185', '#818cf8', '#f59e0b'];
  
  // 🦢 Dot מותאם - מציג ברבור רק בנקודה האחרונה של כל קו
  // כל ברבור עם רקע צבעוני שתואם לצבע הקו - כדי להבדיל בין שחקנים
  const SwanDot = (props) => {
    const { cx, cy, payload, dataKey, stroke, value } = props;
    if (cx === undefined || cy === undefined || cx === null || cy === null) return null;
    if (value === undefined || value === null) return null;
    if (!payload || !payload._isLast) return null;
    
    const size = 44; // גדול יותר
    const halfSize = size / 2;
    const ringRadius = halfSize + 2;
    const swanSize = size - 8;
    const swanOffset = (size - swanSize) / 2;
    
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
        {/* ברבור */}
        <image 
          href={SWAN_IMG}
          x={swanOffset}
          y={swanOffset}
          width={swanSize}
          height={swanSize}
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
          <button onClick={onFullscreenToggle}
            className="rounded-lg border border-stone-700 bg-stone-900 p-2 text-stone-300 hover:bg-stone-800 transition" title={fullscreen ? 'חזור' : 'מסך מלא'}>
            {fullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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
                  : selectedYears.includes(y)
                  ? 'bg-amber-700/50 border-amber-700/50 text-white'
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
              }`}>
              {y}
            </button>
          ))}
        </div>
      )}
      
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: isMobile ? 40 : 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
            <XAxis dataKey="label" stroke="#78716c" style={{ fontSize: isMobile ? '10px' : '11px' }} 
              angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 50 : 30} />
            <YAxis stroke="#78716c" style={{ fontSize: isMobile ? '10px' : '11px' }} width={40} />
            <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', fontFamily: 'Assistant', fontSize: '12px' }} labelStyle={{ color: '#fbbf24' }} />
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
    </div>
  );
};

// ===== טבלה ראשית =====
const MainLeaderboard = ({ stats, sessions }) => {
  const latestDate = getLatestSessionDate(sessions);
  // 🎯 מסנן שחקנים פעילים - לפי אחוז מסך המפגשים בעונה
  // 'all' = כולם, 10/15/20 = מינימום אחוז השתתפות
  const [activityFilter, setActivityFilter] = useState('all');
  
  // חישוב הסינון
  const totalSessions = sessions.length;
  const filteredStats = useMemo(() => {
    if (activityFilter === 'all') return stats;
    const minPct = parseInt(activityFilter); // 10, 15, 20
    const minSessions = Math.max(1, Math.ceil(totalSessions * minPct / 100));
    return stats.filter(p => p.sessions >= minSessions);
  }, [stats, activityFilter, totalSessions]);
  
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
      <div className="relative overflow-auto rounded-b-2xl" dir="rtl" style={{ maxHeight: '70vh', WebkitOverflowScrolling: 'touch' }}>
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
                  <select value={host} onChange={e => setHost(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white">
                    <option value="">בחר...</option>
                    {players.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
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
                  <select value={host} onChange={e => setHost(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white">
                    <option value="">בחר...</option>
                    {players.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
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
                      <select value={r.name} onChange={e => updateResult(idx, 'name', e.target.value)}
                        className="flex-1 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-white text-sm">
                        {players.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
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
          <select value={quoted} onChange={e => { setQuoted(e.target.value); setError(''); }}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2.5 text-white text-sm focus:border-amber-600 focus:outline-none">
            <option value="">בחר שחקן...</option>
            {players.filter(p => p !== currentUser).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
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
// ===== מסך בחירת שם משתמש =====
const UserSelectScreen = ({ players, onSelect }) => {
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
          <div className="text-6xl mb-3">♠</div>
          <h2 className="text-3xl font-extrabold text-amber-200 mb-2">מי אתה?</h2>
          <p className="text-stone-400 text-sm">בחר את שמך מהרשימה</p>
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
            {filteredPlayers.map(name => (
              <button key={name} onClick={() => onSelect(name)}
                className="w-full text-right rounded-lg px-4 py-3 hover:bg-amber-950/30 transition flex items-center justify-between group">
                <span className="text-stone-100 font-bold text-base">{name}</span>
                <span className="text-stone-600 group-hover:text-amber-400 text-sm">→</span>
              </button>
            ))}
            {filteredPlayers.length === 0 && (
              <div className="text-center py-8 text-stone-500 text-sm">אין שחקנים שמתאימים לחיפוש</div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-stone-500">
          הבחירה תיזכר בדפדפן הזה. תוכל להחליף בכל זמן מהראש של האפליקציה.
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
const HostingTab = ({ hostingSchedule, isAdmin, onUpdate, players, addedBy, defaultFilter = 'upcoming' }) => {
  const [editingDate, setEditingDate] = useState(null);
  const [editHost, setEditHost] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newHost, setNewHost] = useState({ date: '', dayName: 'שני', host: '', notes: '', address: '' });
  const [filter, setFilter] = useState(defaultFilter); // upcoming | past | all
  const [filterHost, setFilterHost] = useState('all'); // 🆕 פילטר לפי שם המארח
  const today = getTodayIsrael();
  
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
            <select value={newHost.host} onChange={e => {
              const selectedHost = e.target.value;
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
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white text-sm">
              <option value="">בחר מארח...</option>
              {players.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
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
                  <select value={editHost} onChange={e => {
                    const newHost = e.target.value;
                    setEditHost(newHost);
                    // 🆕 אם בחרו מארח חדש - מצא את הכתובת האחרונה שלו אוטומטית
                    if (newHost && newHost !== editHost) {
                      const lastEntry = [...hostingSchedule]
                        .filter(x => x.host === newHost && x.address)
                        .sort((a, b) => b.date.localeCompare(a.date))[0];
                      if (lastEntry && lastEntry.address) {
                        setEditAddress(lastEntry.address);
                      } else {
                        setEditAddress(''); // אין כתובת קודמת - ניקוי
                      }
                    } else if (!newHost) {
                      setEditAddress(''); // אין מארח - ניקוי כתובת
                    }
                  }}
                    className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-white text-sm">
                    <option value="">ללא מארח</option>
                    {players.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
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
                      <div className="text-base font-bold text-stone-100">{h.host || <span className="text-stone-500 italic">לא נקבע</span>}</div>
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
                    <button onClick={() => startEdit(h)} className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 flex-shrink-0">
                      ערוך
                    </button>
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
const HostingWrapper = ({ allSessions, hostingSchedule, players, sortedPlayers, isAdmin, onUpdate, adminName }) => {
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
          onUpdate={onUpdate} players={sortedPlayers} addedBy={adminName} defaultFilter="upcoming" />
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

const PersonalCharts = ({ sessions, allSessions, stats, currentUser, isMobile }) => {
  const players = useMemo(() => 
    stats.filter(s => s.sessions > 0).map(s => s.name)
  , [stats]);
  
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
    filteredSessions.forEach(s => {
      if (!s.results || s.results[selectedPlayer] === undefined) return;
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const yearShort = String(d.getFullYear()).slice(-2);
      const label = selectedYears.length > 1 
        ? `${HEBREW_MONTHS_SHORT[d.getMonth()]} '${yearShort}` 
        : HEBREW_MONTHS_SHORT[d.getMonth()];
      if (!byMonth[key]) byMonth[key] = { key, label, profit: 0, count: 0 };
      byMonth[key].profit += Number(s.results[selectedPlayer]) || 0;
      byMonth[key].count++;
    });
    return Object.values(byMonth).sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredSessions, selectedPlayer, selectedYears]);
  
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
    
    // לכל עונה - חישוב מצטבר מתחיל מאפס
    Object.entries(sessionsBySeason).forEach(([seasonKey, seasonSessions]) => {
      const cumulativeBySeason = {};
      
      seasonSessions.forEach(session => {
        // עדכון רווח מצטבר לכל שחקן שהשתתף **בעונה זו**
        Object.entries(session.results).forEach(([name, amount]) => {
          cumulativeBySeason[name] = (cumulativeBySeason[name] || 0) + Number(amount);
        });
        
        // השחקן שלנו השתתף בערב הזה?
        if (session.results[selectedPlayer] === undefined) return;
        
        // אם נבחרו שנים - הצג רק ערבים מהשנים האלה
        const y = session.season || (session.date ? new Date(session.date).getFullYear() : null);
        if (selectedYears.length > 0 && !selectedYears.includes(y)) return;
        
        // דירוג מבין כל מי שהשתתף **בעונה זו** עד הערב הנוכחי
        const sortedPlayers = Object.entries(cumulativeBySeason)
          .sort((a, b) => b[1] - a[1])
          .map(([name]) => name);
        const rank = sortedPlayers.indexOf(selectedPlayer) + 1;
        
        const d = new Date(session.date);
        const yearShort = String(d.getFullYear()).slice(-2);
        const label = selectedYears.length > 1 
          ? `${d.getDate()}/${d.getMonth() + 1}/${yearShort}` 
          : `${d.getDate()}/${d.getMonth() + 1}`;
        rankings.push({
          date: session.date,
          label,
          rank,
          profit: cumulativeBySeason[selectedPlayer],
        });
      });
    });
    
    return rankings;
  }, [allSessions, selectedPlayer, selectedYears]);
  
  // 3️⃣ נתונים לגרף התפלגות תוצאות (לפי שנים נבחרות)
  const distributionData = useMemo(() => {
    if (!selectedPlayer) return [];
    let wins = 0, losses = 0, ties = 0;
    filteredSessions.forEach(s => {
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
  }, [filteredSessions, selectedPlayer]);
  
  const distributionStats = useMemo(() => {
    const total = distributionData.reduce((s, d) => s + d.value, 0);
    const wins = distributionData.find(d => d.name === 'ניצחונות')?.value || 0;
    return { total, wins, winRate: total > 0 ? (wins / total) * 100 : 0 };
  }, [distributionData]);
  
  // 4️⃣ 🆕 גרף ביצועים שנתיים - רווח לכל שנה
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
  
  // 5️⃣ 🆕 גרף דירוג שנתי - הדירוג הסופי של השחקן בכל שנה
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
        {/* 🆕 בורר שנים */}
        {allYears.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
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
                    : selectedYears.includes(y)
                    ? 'bg-amber-700/50 border-amber-700/50 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
                }`}>
                {y}
              </button>
            ))}
          </div>
        )}
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
                  formatter={(v, name) => name === 'rank' ? [`מקום #${v}`, 'דירוג'] : [v, name]}
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
const PAYMENTS_HANDLED_KEY = 'poker_payment_handled_v1'; // 🆕 רשימת signatures שטופלו (כבר העברתי / קיבלתי)
const PAYMENT_EXPIRY_DAYS = 7;

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
// מבנה: { 'sig1': timestamp, 'sig2': timestamp }
// שומרים timestamp כדי לאפשר ניקוי אוטומטי אחרי 7 ימים
const loadHandledSignatures = () => {
  try {
    const data = window.localStorage.getItem(PAYMENTS_HANDLED_KEY);
    if (!data) return {};
    const handled = JSON.parse(data);
    if (typeof handled !== 'object' || handled === null) return {};
    // ניקוי signatures ישנות (אחרי 7 ימים)
    const now = Date.now();
    const expiryMs = PAYMENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const cleaned = {};
    Object.entries(handled).forEach(([sig, ts]) => {
      if (typeof ts === 'number' && (now - ts) < expiryMs) {
        cleaned[sig] = ts;
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
const markSignatureHandled = (sig) => {
  const handled = loadHandledSignatures();
  handled[sig] = Date.now();
  saveHandledSignatures(handled);
};

const reminderSignature = (r) => 
  `${r.sessionDate}|${r.from}|${r.to}|${r.amount}|${r.type}`;

const buildRemindersFromSession = (session) => {
  const reminders = [];
  const now = new Date().toISOString();
  
  if (!session || !session.results) return reminders;
  
  const transfers = calculateSettlements(session.results);
  transfers.forEach(t => {
    reminders.push({
      id: `settle_${session.date}_${t.from}_${t.to}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
      reminders.push({
        id: `host_${session.date}_${name}_${hostRecipient}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
const Confetti = ({ active, onComplete, message }) => {
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
          size: 44 + Math.random() * 16,
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
      <div className="absolute" style={{ bottom: '8%', left: '6%', transform: 'rotate(-25deg)', transformOrigin: 'bottom center' }}>
        {renderPipe('large', 'L')}
      </div>
      <div className="absolute" style={{ bottom: '8%', left: '30%', transform: 'rotate(-12deg)', transformOrigin: 'bottom center' }}>
        {renderPipe('medium', 'LC')}
      </div>
      <div className="absolute" style={{ bottom: '8%', right: '30%', transform: 'rotate(12deg)', transformOrigin: 'bottom center' }}>
        {renderPipe('medium', 'RC')}
      </div>
      <div className="absolute" style={{ bottom: '8%', right: '6%', transform: 'rotate(25deg)', transformOrigin: 'bottom center' }}>
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
              src={SWAN_IMG}
              alt="ברבור"
              width={s.size}
              height={s.size}
              style={{ 
                transform: s.flipped ? 'scaleX(-1)' : 'none', 
                display: 'block',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// 💸 קומפוננטת תזכורות תשלום בדשבורד
// ============================================================
const PaymentReminders = ({ playerName, reminders, phones, onUpdateReminders }) => {
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
    // 🆕 מסמן signature כטופל מיד - לפני שינוי state
    if ((newStatus === 'confirmed' || newStatus === 'archived') && target) {
      markSignatureHandled(reminderSignature(target));
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
    // 🆕 מסמן signature כטופל מיד - לפני שינוי state
    if (target) {
      markSignatureHandled(reminderSignature(target));
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
// מציג רשימת משתתפים + buy-ins של ערב חי שמתנהל כעת
const LiveBroadcastViewer = ({ broadcast, onClose, currentUser }) => {
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
            <img src={SWAN_IMG} alt="ברבור" width={56} height={56} className="opacity-90" />
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
            <h3 className="text-base font-bold text-amber-200 mb-3 flex items-center gap-2">
              👥 משתתפים ({participants.length})
            </h3>
            <div className="space-y-2">
              {participants.map((p, i) => {
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

const LiveSessionModal = ({ isOpen, onClose, onSave, players, currentSeason, adminName }) => {
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [host, setHost] = useState('');
  const [participants, setParticipants] = useState([]); // [{name, buyIns: 1}]
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [pendingAdditions, setPendingAdditions] = useState([]); // שחקנים שנבחרו בבחירה מרובה לפני אישור
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

  // 💸 סנכרון אוטומטי - אם נבחר מארח, hostingRecipient נטען איתו
  useEffect(() => {
    if (host && !hostingRecipient) {
      setHostingRecipient(host);
    }
  }, [host, hostingRecipient]);

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
    setParticipants(participants.map(p => p.name === name ? { ...p, buyIns: p.buyIns + 1 } : p));
  };

  const removeBuyIn = (name) => {
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
          const existingSigs = new Set(existing.map(reminderSignature));
          const toAdd = newReminders.filter(r => !existingSigs.has(reminderSignature(r)));
          savePaymentReminders([...existing, ...toAdd]);
        }
      } catch (e) {}
    }
    
    // 📡 ניקוי שידור חי - הערב נגמר
    clearLiveBroadcast().catch(() => {});
    
    setSavedEvening(true);
    reset();
    setHasLoadedSaved(false);
    onClose();
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
          const existingSigs = new Set(existing.map(reminderSignature));
          const toAdd = newReminders.filter(r => !existingSigs.has(reminderSignature(r)));
          savePaymentReminders([...existing, ...toAdd]);
        }
      } catch (e) {}
    }
    
    // 📡 ניקוי שידור חי - הערב נגמר
    clearLiveBroadcast().catch(() => {});
    
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
                  <select value={host} onChange={e => setHost(e.target.value)}
                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-white">
                    <option value="">בחר...</option>
                    {players.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
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
                  <button onClick={() => setShowAddPlayer(true)} disabled={availablePlayers.length === 0}
                    className="rounded-lg bg-amber-700 hover:bg-amber-600 px-3 py-1.5 text-xs text-white font-bold flex items-center gap-1 disabled:opacity-50">
                    <Plus className="h-3.5 w-3.5" /> הוסף שחקנים
                  </button>
                </div>
                
                {showAddPlayer && (
                  <div className="rounded-xl border border-amber-800 bg-stone-900 p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-stone-400">בחר שחקנים (מספר אנשים בו זמנית):</div>
                      <div className="text-xs text-amber-400 font-bold">{pendingAdditions.length} נבחרו</div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 max-h-60 overflow-y-auto">
                      {availablePlayers.map(p => {
                        const isSelected = pendingAdditions.includes(p);
                        return (
                          <button key={p} onClick={() => togglePending(p)}
                            className={`rounded-md px-2 py-2 text-sm transition flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-amber-700 text-white font-bold ring-2 ring-amber-400'
                                : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                            }`}>
                            {isSelected && <Check className="h-3 w-3" />}
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={cancelAddPlayers} className="flex-1 rounded-lg border border-stone-700 bg-stone-800 py-2 text-xs text-stone-300">ביטול</button>
                      <button onClick={confirmAddPlayers} disabled={pendingAdditions.length === 0}
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
                  {participants.map(p => {
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
                  <select 
                    value={hostingRecipient} 
                    onChange={e => setHostingRecipient(e.target.value)}
                    className="w-full rounded-lg border border-purple-700/50 bg-stone-900 px-3 py-2 text-white text-sm">
                    <option value="">❌ ללא תשלום אירוח</option>
                    {participants.map(p => (
                      <option key={p.name} value={p.name}>
                        {p.name === host ? `🏠 ${p.name} (מארח)` : `🍿 ${p.name}`}
                      </option>
                    ))}
                  </select>
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
                  <button onClick={handleFinalSave} disabled={!isBalanced}
                    className="flex-1 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 font-bold text-white hover:from-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" /> שמור ערב
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

const getMonthKey = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getQuarterKey = (dateStr) => {
  const d = new Date(dateStr);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
};

const getHalfKey = (dateStr) => {
  const d = new Date(dateStr);
  const h = d.getMonth() < 6 ? 1 : 2;
  return `${d.getFullYear()}-H${h}`;
};

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
    const key = keyFn(s.date);
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

const PeriodicTables = ({ allSessions, players }) => {
  const [viewMode, setViewMode] = useState('month'); // month | quarter | half
  
  // זיהוי כל השנים הזמינות
  const availableYears = useMemo(() => {
    const years = new Set(allSessions.map(s => s.season || new Date(s.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [allSessions]);
  
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || 2026);
  
  // סינון לפי שנה
  const sessions = useMemo(() => 
    allSessions.filter(s => (s.season || new Date(s.date).getFullYear()) === selectedYear),
    [allSessions, selectedYear]
  );
  
  const { keyFn, getLabel, viewLabel } = useMemo(() => {
    if (viewMode === 'day') return { keyFn: getDayKey, getLabel: getDayLabel, viewLabel: 'יומית' };
    if (viewMode === 'month') return { keyFn: getMonthKey, getLabel: getMonthLabel, viewLabel: 'חודשית' };
    if (viewMode === 'quarter') return { keyFn: getQuarterKey, getLabel: getQuarterLabel, viewLabel: 'רבעונית' };
    return { keyFn: getHalfKey, getLabel: getHalfLabel, viewLabel: 'חצי שנתית' };
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
          📊 טבלה {viewLabel} — {selectedYear}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-sm text-white font-bold">
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
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
              {sortedKeys.map(k => (
                <th key={k} className="sticky top-0 z-20 bg-stone-900 border-b-2 border-stone-700 px-3 py-3 text-center font-bold text-xs text-amber-200 whitespace-nowrap min-w-[80px]">
                  {getLabel(k)}
                </th>
              ))}
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
      </div>
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
const DashboardCarousel = ({ currentUser, sessions, allSessions, stats, hostingSchedule, onGoToHosting, onFullscreenToggle, selectedChartPlayers, setSelectedChartPlayers, isMobile, paymentReminders, phones, onUpdateReminders }) => {
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
      />
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
const AdminPhonesModal = ({ isOpen, onClose, players, phones, onSave }) => {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [phone, setPhone] = useState('');
  const [app, setApp] = useState('both');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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
            📱 ניהול פרטי תשלום
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
            <X className="h-5 w-5" />
          </button>
        </div>

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
              <div key={name} className={`flex items-center justify-between rounded-lg border p-3 transition ${
                hasPhone ? 'bg-stone-800/40 border-stone-700/40' : 'bg-amber-950/20 border-amber-800/30'
              }`}>
                <div className="flex-1">
                  <div className="font-bold text-stone-100">{name}</div>
                  {hasPhone ? (
                    <div className="text-xs text-stone-400 tabular-nums" dir="ltr">
                      {data.phone.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')}
                      {' · '}
                      {data.app === 'bit' ? '💙' : data.app === 'paybox' ? '💜' : '✅'}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400">⚠️ חסר טלפון</div>
                  )}
                </div>
                <div className="flex items-center gap-1">
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
  const [hostingSchedule, setHostingSchedule] = useState(HOSTING_SCHEDULE);
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [selectedSeason, setSelectedSeason] = useState(2026);
  const [modalOpen, setModalOpen] = useState(false);
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminName, setAdminName] = useState(null); // null = לא מחובר כמנהל
  // 🆕 רשימת המנהלים - נטענת מ-Firebase
  const [adminNamesList, setAdminNamesList] = useState(ADMIN_NAMES);
  const [manageAdminsOpen, setManageAdminsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false); // תפריט המבורגר
  const [selectedChartPlayers, setSelectedChartPlayers] = useState([]);
  // 🆕 רשימה נפרדת לגרף בלשונית תובנות - כדי שלא תושפע משינויים בדשבורד
  const [insightsChartPlayers, setInsightsChartPlayers] = useState([]);
  const [chartFullscreen, setChartFullscreen] = useState(false);
  
  // 📡 שידור חי - מצב מקומי
  const [liveBroadcast, setLiveBroadcast] = useState(null);
  const [broadcastViewerOpen, setBroadcastViewerOpen] = useState(false);
  const [broadcastDismissed, setBroadcastDismissed] = useState(false); // המשתמש סגר את הצופה
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
        
        // בדיקת תנאים: שעה + יום אירוח (במצב בדיקה - מדלגים על תנאים)
        const testMode = !!broadcast.testMode;
        const isInTimeWindow = testMode || isLiveBroadcastTime();
        const isHostingToday = testMode || isHostingDay(hostingSchedule, broadcast.sessionDate);
        
        console.log('📺 viewer conditions: testMode=', testMode, 'isInTimeWindow=', isInTimeWindow, 'isHostingToday=', isHostingToday);
        
        if (!isInTimeWindow || !isHostingToday) {
          console.log('📺 viewer: conditions not met');
          // השידור לא רלוונטי כעת
          setLiveBroadcast(null);
          setBroadcastViewerOpen(false);
          return;
        }
        
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
  
  // 💸 סנכרון אוטומטי - כל מכשיר יוצר תזכורות לעצמו על ערבים מ-7 ימים אחרונים
  // רץ כשהערבים מתעדכנים (טעינה ראשונה / סנכרון מ-Firebase)
  // ⚠️ מדלג על תזכורות שמסומנות כטופלות (כבר העברתי / קיבלתי)
  useEffect(() => {
    if (!allSessions || allSessions.length === 0) return;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentSessions = allSessions.filter(s => {
        if (!s.results || !s.date) return false;
        if (s.isTestEvening) return false; // 🧪 ערבי ניסיון - לא יוצרים תזכורות
        return new Date(s.date) >= sevenDaysAgo;
      });
      
      if (recentSessions.length === 0) return;
      
      const existing = loadPaymentReminders();
      const existingSigs = new Set(existing.map(reminderSignature));
      // 🆕 רשימת signatures שכבר טופלו (אסור ליצור מחדש)
      const handledSigs = loadHandledSignatures();
      
      const allNewReminders = [];
      recentSessions.forEach(session => {
        const reminders = buildRemindersFromSession(session);
        reminders.forEach(r => {
          const sig = reminderSignature(r);
          // דלג אם כבר קיים או שטופל ידנית
          if (existingSigs.has(sig)) return;
          if (handledSigs[sig]) return; // 🆕 כבר טופל - לא ליצור מחדש
          allNewReminders.push(r);
          existingSigs.add(sig);
        });
      });
      
      if (allNewReminders.length > 0) {
        const updated = [...existing, ...allNewReminders];
        savePaymentReminders(updated);
        setPaymentReminders(updated);
      }
    } catch (e) {
      console.warn('Failed to auto-sync reminders:', e);
    }
  }, [allSessions]);
  
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
        setAllSessions(saved.sessions);
        if (saved.players) setPlayers(saved.players);
      }
      if (saved?.hostingSchedule) setHostingSchedule(saved.hostingSchedule);
      if (saved?.phones) setPhones(saved.phones);
      
      // 🆕 טעינת רשימת מנהלים
      const savedAdmins = await loadState(ADMIN_NAMES_KEY);
      if (Array.isArray(savedAdmins) && savedAdmins.length > 0) {
        setAdminNamesList(savedAdmins);
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
      
      // טעינת המשתמש שנבחר בעבר
      try {
        const savedUser = window.localStorage.getItem('poker_user_name');
        if (savedUser) {
          setCurrentUser(savedUser);
          setShowSplash(false); // אם כבר נכנסת בעבר, מדלגים על הספלאש
        }
        const savedAdmin = window.localStorage.getItem('poker_admin_name');
        if (savedAdmin) setAdminName(savedAdmin);
      } catch {}
      
      setLoading(false);
    })();
  }, []);

  const sessions = useMemo(() => allSessions.filter(s => (s.season || 2026) === selectedSeason), [allSessions, selectedSeason]);
  const stats = useMemo(() => calculateStats(sessions, players), [sessions, players]);
  
  // 🆕 בודק אם משתמש קיים שאין לו טלפון - הצגת מסך הזדהות
  useEffect(() => {
    if (!loading && currentUser && !phoneSetupOpen) {
      const userPhone = phones[currentUser];
      if (!userPhone || !userPhone.phone) {
        setPhoneSetupOpen(true);
      }
    }
  }, [loading, currentUser, phones]);
  
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
  
  const availableSeasons = useMemo(() => {
    const s = new Set(allSessions.map(s => s.season || 2026));
    return Array.from(s).sort((a, b) => b - a);
  }, [allSessions]);

  useEffect(() => {
    if (stats.length === 0) return;
    
    // אם currentUser זמין וקיים ב-stats - וודא שהוא בבחירה
    if (currentUser && stats.find(p => p.name === currentUser)) {
      // אם אף אחד לא נבחר עדיין, או שהבחירה היא רק שחקן אחד שאינו המשתמש המחובר
      // (כלומר ברירת המחדל שלנו לפני שcurrentUser נטען) - תחליף לcurrentUser
      if (selectedChartPlayers.length === 0) {
        setSelectedChartPlayers([currentUser]);
      } else if (selectedChartPlayers.length === 1 && selectedChartPlayers[0] !== currentUser) {
        // אם הוטל בחירה אוטומטית של שחקן אחר (למשל סטטס[0]=רם), נחליף לcurrentUser
        // נבדוק אם זה ככל הנראה ברירת מחדל אוטומטית - הבחירה היא הטופ
        const isAutoChosenTop = selectedChartPlayers[0] === stats[0]?.name;
        if (isAutoChosenTop) {
          setSelectedChartPlayers([currentUser]);
        }
      }
    } else if (selectedChartPlayers.length === 0 && stats[0]) {
      // אין currentUser זמין - מציג את הטופ
      setSelectedChartPlayers([stats[0].name]);
    }
  }, [stats.length, currentUser]);
  
  // 🆕 לוגיקה דומה לגרף התובנות - state נפרד
  useEffect(() => {
    if (insightsChartPlayers.length > 0) return; // כבר אותחל
    if (currentUser) {
      setInsightsChartPlayers([currentUser]);
    } else if (stats[0]) {
      setInsightsChartPlayers([stats[0].name]);
    }
  }, [currentUser, stats.length]);

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

  const handleUserSelect = (name) => {
    setCurrentUser(name);
    try { window.localStorage.setItem('poker_user_name', name); } catch {}
    // 🆕 אם אין למשתמש טלפון - הצג מסך הזדהות
    if (!phones[name] || !phones[name].phone) {
      setPhoneSetupOpen(true);
    }
  };

  const handleSwitchUser = () => {
    if (!confirm('להחליף משתמש?')) return;
    setCurrentUser(null);
    setAdminName(null);
    try {
      window.localStorage.removeItem('poker_user_name');
      window.localStorage.removeItem('poker_admin_name');
    } catch {}
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

  const handleAdminLogin = async (name) => {
    setAdminName(name);
    // שמירה של שם המנהל באחסון המקומי של הדפדפן (לא במרכזי) כדי שיישאר מחובר
    try { window.localStorage.setItem('poker_admin_name', name); } catch {}
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
    try { window.localStorage.removeItem('poker_admin_name'); } catch {}
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

  const isAdmin = !!adminName;
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

  // מסך בחירת משתמש (אם עוד לא בחר)
  if (!currentUser) {
    return <UserSelectScreen players={sortedPlayers} onSelect={handleUserSelect} />;
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
    { id: 'dashboard', label: 'דשבורד', icon: LayoutDashboard },
    { id: 'table', label: 'טבלה', icon: Table },
    { id: 'periodic', label: 'תקופות', icon: Calendar },
    { id: 'charts', label: 'תובנות', icon: BarChart3 },
    { id: 'hosting', label: 'אירוחים', icon: Calendar },
    { id: 'gallery', label: 'גלריה', icon: ImageIcon },
    // 🔒 היסטוריה - רק למנהלים
    ...(isAdmin ? [{ id: 'history', label: 'היסטוריה', icon: History }] : []),
    { id: 'quotes', label: 'אמרות כנף', icon: Quote },
  ];

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
              <button onClick={() => setMenuOpen(true)}
                className="rounded-lg bg-stone-900/70 border border-stone-700 p-2 text-stone-300 hover:bg-stone-800 hover:text-amber-300 transition"
                title="תפריט">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* תגית המשתמש הנוכחי */}
              <button onClick={handleSwitchUser}
                className="flex items-center gap-2 rounded-lg bg-stone-900/70 border border-stone-700 px-3 py-1.5 text-sm text-stone-200 hover:bg-stone-800 transition">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>שלום, <span className="font-bold text-amber-300">{currentUser}</span></span>
              </button>

              <select value={selectedSeason} onChange={e => setSelectedSeason(Number(e.target.value))}
                className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-white font-bold">
                {availableSeasons.map(y => <option key={y} value={y}>עונת {y}</option>)}
              </select>

              {syncing && <span className="text-xs text-amber-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />שומר...</span>}

              {isAdmin ? (
                <>
                  {/* תגית מנהל */}
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-950/30 border border-emerald-800/50 px-3 py-1.5">
                    <Lock className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs text-emerald-300 font-bold">מנהל</span>
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
            <nav className="relative rounded-2xl border-2 border-amber-900/40 p-1.5 flex gap-1 overflow-x-auto shadow-2xl"
              style={{
                background: 'linear-gradient(180deg, rgba(12, 10, 8, 0.85) 0%, rgba(20, 15, 10, 0.9) 100%)',
                boxShadow: 'inset 0 1px 3px rgba(251, 191, 36, 0.1), 0 10px 40px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}>
              {tabs.map(t => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex-1 min-w-fit px-3 md:px-5 py-2.5 text-xs md:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
                      active ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/50' : 'text-stone-400 hover:text-amber-200 hover:bg-stone-900/50'
                    }`}>
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Content */}
        {tab === 'dashboard' && (
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
          />
        )}

        {tab === 'table' && <MainLeaderboard stats={stats} sessions={sessions} />}

        {tab === 'periodic' && <PeriodicTables allSessions={allSessions} players={players} />}

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
              isMobile={isMobile} />
          </div>
        )}

        {tab === 'hosting' && (
          <HostingWrapper allSessions={allSessions} hostingSchedule={hostingSchedule}
            players={players} sortedPlayers={sortedPlayers} isAdmin={isAdmin}
            onUpdate={handleHostingUpdate} adminName={adminName} />
        )}

        {tab === 'history' && isAdmin && <SessionHistory sessions={sessions} onDelete={handleDeleteSession} isAdmin={isAdmin} />}

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
            {APP_VERSION} • {APP_BUILD_TIME} • {APP_NOTES}
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
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-amber-300 text-lg">{currentUser}</span>
                  {isAdmin && (
                    <span className="rounded-md bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 text-xs text-emerald-300 font-bold">
                      מנהל
                    </span>
                  )}
                </div>
                <button onClick={() => { setMenuOpen(false); handleSwitchUser(); }}
                  className="text-xs text-stone-400 hover:text-amber-300 underline">
                  החלף
                </button>
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
              <button onClick={() => {
                if (!confirm('לנקות את כל תזכורות התשלום והארכיון מהמכשיר הזה?\n\n⚠️ זה לא ישפיע על מכשירים אחרים. הפעולה מועילה אם נוצרו תזכורות מערבי ניסיון.')) return;
                try {
                  window.localStorage.removeItem(PAYMENTS_STORAGE_KEY);
                  window.localStorage.removeItem(PAYMENTS_HANDLED_KEY);
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
                <div className="text-xs text-stone-500 tracking-wider font-bold uppercase">עדכון ערב</div>
                <button onClick={() => { setMenuOpen(false); setLiveModalOpen(true); }}
                  className="relative w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-emerald-700/80 to-emerald-800/80 border border-emerald-700/50 px-4 py-3 text-white font-bold hover:from-emerald-600 hover:to-emerald-700 transition text-sm">
                  <span className="text-xl">🎰</span>
                  <span>עדכון ערב בלייב</span>
                  {hasLiveSession && (
                    <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
                <button onClick={() => { setMenuOpen(false); setModalOpen(true); }}
                  className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-blue-700/80 to-blue-800/80 border border-blue-700/50 px-4 py-3 text-white font-bold hover:from-blue-600 hover:to-blue-700 transition text-sm">
                  <span className="text-xl">📸</span>
                  <span>עדכון ערב בתמונה</span>
                </button>
                {/* 🆕 כפתור ניהול טלפונים */}
                <button onClick={() => { setMenuOpen(false); setAdminPhonesOpen(true); }}
                  className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-purple-700/80 to-purple-800/80 border border-purple-700/50 px-4 py-3 text-white font-bold hover:from-purple-600 hover:to-purple-700 transition text-sm">
                  <span className="text-xl">📱</span>
                  <span>ניהול פרטי תשלום</span>
                </button>
                {/* 🆕 כפתור גיבוי ושחזור */}
                <button onClick={() => { setMenuOpen(false); loadBackupsList(); setBackupsModalOpen(true); }}
                  className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-cyan-700/80 to-cyan-800/80 border border-cyan-700/50 px-4 py-3 text-white font-bold hover:from-cyan-600 hover:to-cyan-700 transition text-sm">
                  <span className="text-xl">💾</span>
                  <span>גיבוי ושחזור</span>
                </button>
                {/* 🆕 כפתור ניהול מנהלים */}
                <button onClick={() => { setMenuOpen(false); setManageAdminsOpen(true); }}
                  className="w-full flex items-center gap-3 rounded-lg bg-gradient-to-br from-amber-700/80 to-amber-800/80 border border-amber-700/50 px-4 py-3 text-white font-bold hover:from-amber-600 hover:to-amber-700 transition text-sm">
                  <span className="text-xl">🔐</span>
                  <span>ניהול מנהלים</span>
                  <span className="mr-auto text-xs bg-amber-950/50 rounded-full px-2 py-0.5">{adminNamesList.length}</span>
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

            {/* טאבים */}
            <div className="px-5 py-4 space-y-1">
              <div className="text-xs text-stone-500 tracking-wider font-bold uppercase mb-2">ניווט</div>
              {tabs.map(t => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-right font-bold transition ${
                      active 
                        ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/30' 
                        : 'text-stone-300 hover:bg-stone-900 hover:text-amber-200'
                    }`}>
                    <Icon className="h-5 w-5" />
                    <span>{t.label}</span>
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
        onSave={handleSaveSession} players={sortedPlayers} currentSeason={selectedSeason} adminName={currentUser} />
      
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
      
      <AdminLoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onLogin={handleAdminLogin} currentUser={currentUser} />
      
      {/* 🆕 ניהול רשימת מנהלים */}
      <ManageAdminsModal 
        isOpen={manageAdminsOpen}
        onClose={() => setManageAdminsOpen(false)}
        adminNames={adminNamesList}
        currentAdminName={adminName}
        allPlayers={players}
        onAdd={handleAddAdmin}
        onRemove={handleRemoveAdmin}
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

      {/* 🆕 מודל מנהל - ניהול טלפונים של כל השחקנים */}
      <AdminPhonesModal
        isOpen={adminPhonesOpen}
        onClose={() => setAdminPhonesOpen(false)}
        players={players}
        phones={phones}
        onSave={handleSavePhone} />

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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Assistant:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Heebo', 'Assistant', sans-serif !important; }
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
