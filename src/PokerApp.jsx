import React, { useState, useEffect, useMemo, useRef } from 'react';
import SESSIONS_DATA from './data/sessions.json';
import HOSTING_DATA from './data/hosting.json';
import QUOTES_DATA from './data/quotes.json';
import BARBUR_LOGO from './assets/barbur-logo.webp';
import SWAN_IMG from './assets/swan.png';
import { loadState as fbLoadState, saveState as fbSaveState } from './firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, Upload, Users, TrendingUp, Calendar, Plus, X, Check, AlertCircle, Loader2, Download, RefreshCw, Crown, Skull, Flame, Target, HelpCircle, Maximize2, Filter, LayoutDashboard, Table, BarChart3, History, ChevronDown, ChevronLeft, ChevronRight, Lock, LogOut, Quote, Heart, Search, Trash2, MessageSquare, Sparkles, Image as ImageIcon, Camera } from 'lucide-react';


// ===== הרשאות מנהל =====
const ADMIN_PASSWORD = 'barbur2026'; // סיסמה זמנית - להחליף בסיסמה האמיתית
const ADMIN_NAMES = ['רון', 'גילי'];

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
// ===== 975 ציטוטים מהוואטסאפ =====
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
      if (amount > 0) { s.wins++; s.currentStreak = Math.max(0, s.currentStreak) + 1; }
      else if (amount < 0) { s.losses++; s.currentStreak = Math.min(0, s.currentStreak) - 1; }
      else { s.ties++; }
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
    } else {
      s.avg = 0; s.stdDev = 0; s.winRate = 0; s.lossRate = 0; s.tieRate = 0;
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
const CumulativeChart = ({ sessions, stats, fullscreen, onFullscreenToggle, selectedPlayers, onPlayersChange, isMobile }) => {
  const data = useMemo(() => calculateCumulative(sessions, selectedPlayers), [sessions, selectedPlayers]);
  const colors = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#2dd4bf', '#f87171', '#c084fc', '#facc15', '#4ade80', '#38bdf8', '#fb7185', '#818cf8', '#f59e0b'];
  
  // במובייל - פחות שחקנים כברירת מחדל אם יותר מדי
  const chartHeight = fullscreen ? 'calc(100vh - 180px)' : (isMobile ? 280 : 400);

  return (
    <div className={`rounded-2xl border border-stone-800 bg-stone-950/50 p-4 md:p-6 backdrop-blur ${fullscreen ? 'h-full' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            רווח מצטבר לאורך זמן
          </h3>
          <InfoTooltip text="הציר האופקי: תאריכי המפגשים. הציר האנכי: הרווח המצטבר של השחקן. קו עולה = צובר רווחים. קו יורד = צובר הפסדים." />
        </div>
        <div className="flex items-center gap-2">
          <PlayerPicker allPlayers={stats} selected={selectedPlayers} onChange={onPlayersChange} />
          <button onClick={onFullscreenToggle}
            className="rounded-lg border border-stone-700 bg-stone-900 p-2 text-stone-300 hover:bg-stone-800 transition" title={fullscreen ? 'חזור' : 'מסך מלא'}>
            {fullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
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
              <Line key={name} type="monotone" dataKey={name} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
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

// 🔥 חישוב רצף ניצחונות עבור שחקן
// מחזיר את מספר הערבים ברציפות שהשחקן ניצח (רק ערבים שהוא השתתף בהם)
// ערבים שדילג עליהם לא שוברים את הרצף
const calculateStreak = (playerName, sessions) => {
  if (!playerName || !sessions || sessions.length === 0) return 0;
  const playerSessions = sessions
    .filter(s => s.results && typeof s.results[playerName] === 'number')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (playerSessions.length === 0) return 0;
  let streak = 0;
  for (const s of playerSessions) {
    if (Number(s.results[playerName]) > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

// 🔥 קומפוננטת להבה - SVG מצויר עם אנימציה
// streak: מספר הניצחונות ברצף - קובע גודל וצבע הלהבה
const FlameIcon = ({ streak }) => {
  if (streak < 2) return null;
  let size, intensity;
  if (streak >= 7) { size = 22; intensity = 'mega'; }
  else if (streak >= 5) { size = 19; intensity = 'high'; }
  else if (streak >= 3) { size = 16; intensity = 'medium'; }
  else { size = 14; intensity = 'low'; }
  
  const colors = {
    low:    { outer: '#fbbf24', mid: '#f59e0b', inner: '#fde047' },
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
      {streak >= 3 && (
        <span className={`text-[10px] font-extrabold tabular-nums ${
          intensity === 'mega' ? 'text-red-400' :
          intensity === 'high' ? 'text-orange-400' :
          'text-amber-400'
        }`}>
          {streak}
        </span>
      )}
    </span>
  );
};

// ===== טבלה ראשית =====
const MainLeaderboard = ({ stats, sessions }) => {
  const latestDate = getLatestSessionDate(sessions);
  const columns = [
    { key: 'total', label: 'רווח' },
    { key: 'sessions', label: 'מפגשים' },
    { key: 'avg', label: 'ממוצע לערב' },
    { key: 'wins', label: 'ניצחונות' },
    { key: 'losses', label: 'הפסדים' },
    { key: 'ties', label: 'תיקו' },
    { key: 'winRate', label: '% ניצחון' },
    { key: 'maxStreak', label: 'רצף מנצח' },
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
    return v;
  };
  const color = (v, key) => {
    if (key === 'total' || key === 'avg') return v > 0 ? 'text-emerald-400 font-extrabold' : v < 0 ? 'text-rose-400 font-extrabold' : 'text-stone-400';
    if (key === 'wins' || key === 'biggestWin' || key === 'winRate') return 'text-emerald-400';
    if (key === 'losses' || key === 'biggestLoss') return 'text-rose-400';
    if (key === 'maxStreak') return 'text-amber-400';
    if (key === 'stdDev') return 'text-stone-500';
    return 'text-stone-300';
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 backdrop-blur">
      <div className="border-b border-stone-800 bg-gradient-to-r from-amber-950/40 to-stone-900/40 px-4 md:px-6 py-4 flex items-center justify-between flex-wrap gap-2 rounded-t-2xl">
        <h3 className="text-lg md:text-xl font-bold text-amber-200 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          טבלת דירוג ראשית
        </h3>
        {latestDate && (
          <div className="text-xs text-stone-400">
            מעודכן עד: <span className="text-amber-300 font-bold">{new Date(latestDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
        )}
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
            {stats.map((p, i) => {
              const rowBg = i % 2 === 0 ? 'bg-stone-950' : 'bg-stone-900/50';
              const streak = calculateStreak(p.name, sessions); // 🔥 חישוב רצף נוכחי
              return (
                <tr key={p.name} className="group hover:bg-amber-950/10">
                  <td className={`sticky right-0 z-20 ${rowBg} group-hover:bg-amber-950/20 border-b border-l border-stone-800 px-3 py-3 font-bold text-stone-500 tabular-nums whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                    {i + 1}{i < 3 && <span className="mr-1">{['🥇','🥈','🥉'][i]}</span>}
                  </td>
                  <td className={`sticky z-20 ${rowBg} group-hover:bg-amber-950/20 border-b border-l border-stone-800 px-3 py-3 font-bold text-stone-100 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`} style={{ right: '55px' }}>
                    {p.name}
                    <FlameIcon streak={streak} />
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

  // ציטוטים מסוננים
  const visibleQuotes = useMemo(() => {
    let list = combinedQuotes.filter(q => !deletedIds.includes(q.id));
    
    // סינון לפי מצוטט
    if (filterQuoted !== 'all') {
      list = list.filter(q => q.quoted === filterQuoted);
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
  }, [combinedQuotes, deletedIds, likes, filterQuoted, searchQuery, sortBy]);

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
          {(filterQuoted !== 'all' || searchQuery || sortBy !== 'newest') && (
            <button onClick={() => { setFilterQuoted('all'); setSearchQuery(''); setSortBy('newest'); }}
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

        <div className="text-xs text-stone-400 mb-4 bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2">
          💡 שמעת משהו מצחיק בשולחן? הקלט אותו לדורות הבאים!
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
            placeholder='"זרקתי דאבל אייס... זה היה חייב להיות שלי"'
            rows={3}
            maxLength={300}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2.5 text-white text-sm focus:border-amber-600 focus:outline-none resize-none" />
          <div className="text-xs text-stone-500 mt-1 text-left">{text.length}/300</div>
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
  const today = new Date().toISOString().split('T')[0];
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
  const today = new Date().toISOString().split('T')[0];
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
  const today = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    let list = [...hostingSchedule];
    if (filter === 'upcoming') list = list.filter(h => h.date >= today);
    else if (filter === 'past') list = list.filter(h => h.date < today);
    return list.sort((a, b) => filter === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }, [hostingSchedule, filter, today]);

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
          🏠 לוח אירוחים ({hostingSchedule.length})
        </h3>
        <div className="flex items-center gap-2">
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
            <select value={newHost.host} onChange={e => setNewHost({...newHost, host: e.target.value})}
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
                  <select value={editHost} onChange={e => setEditHost(e.target.value)}
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
  // יוצרים שתי רשימות - חייבים ומקבלים
  const creditors = []; // מקבלים (רווח חיובי)
  const debtors = [];   // חייבים (הפסד שלילי)
  
  Object.entries(results).forEach(([name, amount]) => {
    if (amount > 0) creditors.push({ name, amount });
    else if (amount < 0) debtors.push({ name, amount: -amount }); // הופכים לחיובי
  });
  
  // מיון - מהגדול לקטן (חמדנות)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  
  const transfers = [];
  
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const transfer = Math.min(creditor.amount, debtor.amount);
    
    transfers.push({
      from: debtor.name,
      to: creditor.name,
      amount: transfer
    });
    
    creditor.amount -= transfer;
    debtor.amount -= transfer;
    
    // הסרה של הצד שהתאפס
    if (creditor.amount < 0.01) creditors.shift();
    if (debtor.amount < 0.01) debtors.shift();
  }
  
  return transfers;
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
      // שומר ערכים שכבר הוזנו אם חוזרים
      initial[p.name] = finalChips[p.name] !== undefined ? finalChips[p.name] : '';
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
    
    onSave({
      date: sessionDate, season: currentSeason, pot: totalPot, results,
      host: host || undefined, addedBy: adminName, addedAt: new Date().toISOString(), liveTracked: true
    });
    setSavedEvening(true);
    reset();
    setHasLoadedSaved(false);
    onClose();
  };

  // שמירה ממסך החלוקה - שומר בלי לסגור את המודל
  const handleSaveFromSettlement = () => {
    if (!isBalanced) return alert(`הסכומים לא מאוזנים! יש פער של ${balance > 0 ? '+' : ''}${balance} ₪`);
    if (savedEvening) return; // כבר נשמר
    
    const results = {};
    participants.forEach(p => {
      const chips = Number(finalChips[p.name]) || 0;
      const buyIn = p.buyIns * 20;
      results[p.name] = chips - buyIn;
    });
    
    onSave({
      date: sessionDate, season: currentSeason, pot: totalPot, results,
      host: host || undefined, addedBy: adminName, addedAt: new Date().toISOString(), liveTracked: true
    });
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
                  {participants.map(p => (
                    <div key={p.name} className="rounded-xl border border-stone-800 bg-stone-900/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-bold text-stone-100">{p.name}</div>
                          <div className="text-xs text-stone-500">{p.buyIns} {p.buyIns === 1 ? 'קניה' : 'קניות'} • {p.buyIns * 20} ₪</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => removeBuyIn(p.name)} disabled={p.buyIns <= 1}
                            className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-300 hover:text-rose-300 font-bold disabled:opacity-30">−</button>
                          <div className="w-12 text-center text-xl font-extrabold text-amber-300 tabular-nums">{p.buyIns * 20}</div>
                          <button onClick={() => addBuyIn(p.name)}
                            className="w-9 h-9 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 font-bold">+</button>
                          <button onClick={() => removePlayer(p.name)}
                            className="ml-1 rounded-lg p-2 text-stone-600 hover:text-rose-400 hover:bg-stone-800">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                  return (
                    <div key={p.name} className="rounded-xl border border-stone-800 bg-stone-900/50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-bold text-stone-100">{p.name}</div>
                          <div className="text-xs text-stone-500">השקעה: {p.buyIns * 20} ₪</div>
                        </div>
                        <input type="number" value={finalChips[p.name]} onChange={e => setFinalChips({...finalChips, [p.name]: e.target.value})}
                          placeholder="צ׳יפים בסיום"
                          className="w-28 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-white text-center text-sm tabular-nums" />
                        <div className={`w-20 text-left text-base font-extrabold tabular-nums ${profit > 0 ? 'text-emerald-400' : profit < 0 ? 'text-rose-400' : 'text-stone-500'}`}>
                          {profit > 0 ? '+' : ''}{profit}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
  const byPeriod = {}; // {periodKey: {playerName: sum}}
  const allKeys = new Set();
  
  sessions.forEach(s => {
    const key = keyFn(s.date);
    allKeys.add(key);
    if (!byPeriod[key]) byPeriod[key] = {};
    Object.entries(s.results || {}).forEach(([name, amount]) => {
      byPeriod[key][name] = (byPeriod[key][name] || 0) + amount;
    });
  });
  
  const sortedKeys = Array.from(allKeys).sort();
  return { sortedKeys, byPeriod };
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
    if (viewMode === 'month') return { keyFn: getMonthKey, getLabel: getMonthLabel, viewLabel: 'חודשית' };
    if (viewMode === 'quarter') return { keyFn: getQuarterKey, getLabel: getQuarterLabel, viewLabel: 'רבעונית' };
    return { keyFn: getHalfKey, getLabel: getHalfLabel, viewLabel: 'חצי שנתית' };
  }, [viewMode]);
  
  const { sortedKeys, byPeriod } = useMemo(() => 
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

  const formatCell = (val) => {
    if (!val || val === 0) return '0';
    return val > 0 ? `+${val}` : `${val}`;
  };
  
  const cellColor = (val) => {
    if (!val || val === 0) return 'text-stone-500';
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
              return (
                <tr key={name} className="group hover:bg-amber-950/10">
                  <td className={`sticky right-0 z-10 ${rowBg} group-hover:bg-amber-950/20 border-b border-l border-stone-800 px-3 py-2.5 font-bold text-stone-100 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                    {name}
                  </td>
                  {sortedKeys.map(k => {
                    const val = byPeriod[k]?.[name];
                    return (
                      <td key={k} className={`border-b border-stone-900 px-3 py-2.5 tabular-nums text-center whitespace-nowrap ${cellColor(val)}`}>
                        {formatCell(val)}
                      </td>
                    );
                  })}
                  <td className={`sticky left-0 z-10 border-b border-r border-amber-800/50 px-3 py-2.5 tabular-nums text-center font-extrabold whitespace-nowrap ${
                    total > 0 ? 'bg-emerald-950/60 text-emerald-300' : total < 0 ? 'bg-rose-950/60 text-rose-300' : 'bg-stone-900/80 text-stone-400'
                  }`}>
                    {formatCell(total)}
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


// 🎉 קומפוננטת Confetti - אפקט חגיגה עם 4 צינורות מים שיורים ברבורים
// מופעלת בדשבורד כשמזהים שהמשתמש זכה בערב האחרון
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
          size: 44 + Math.random() * 16, // ברבורים גדולים: 44-60px (היו 28-40)
        });
      }
    });
    return all;
  }, [active, SOURCES]);
  
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 7000);
    return () => clearTimeout(timer);
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

// ===== דשבורד קומפקטי =====
const DashboardCarousel = ({ currentUser, sessions, stats, hostingSchedule, onGoToHosting, onFullscreenToggle, selectedChartPlayers, setSelectedChartPlayers, isMobile }) => {
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
    } catch (e) {
      // localStorage לא זמין - דלג
    }
  }, [currentUser, sessions]);
  
  return (
    <div className="space-y-3">
      <PersonalInsights playerName={currentUser} sessions={sessions} stats={stats} hostingSchedule={hostingSchedule} />
      <NextHostsCarouselCompact hostingSchedule={hostingSchedule} onSeeAll={onGoToHosting} />
      <TopThreeCarousel stats={stats} />
      <SpecialStatsCarousel stats={stats} />
      <div className="rounded-2xl border border-stone-800 bg-stone-950/40 backdrop-blur p-2">
        <CumulativeChart sessions={sessions} stats={stats} fullscreen={false}
          onFullscreenToggle={onFullscreenToggle}
          selectedPlayers={selectedChartPlayers}
          onPlayersChange={setSelectedChartPlayers}
          isMobile={isMobile} />
      </div>
      {/* 🎉 אנימציית Confetti - לאחר ערב מנצח */}
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

  const today = new Date().toISOString().split('T')[0];
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
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false); // תפריט המבורגר
  const [selectedChartPlayers, setSelectedChartPlayers] = useState([]);
  const [chartFullscreen, setChartFullscreen] = useState(false);
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
    if (stats.length > 0 && selectedChartPlayers.length === 0) {
      setSelectedChartPlayers(stats.slice(0, 5).map(p => p.name));
    }
  }, [stats.length]);

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
        quotesCount: 975 - deletedQuoteIds.length + userQuotes.length,
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

  const isAdminEligible = currentUser && ADMIN_NAMES.includes(currentUser);

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
    { id: 'charts', label: 'גרפים', icon: BarChart3 },
    { id: 'hosting', label: 'אירוחים', icon: Calendar },
    { id: 'gallery', label: 'גלריה', icon: ImageIcon },
    { id: 'history', label: 'היסטוריה', icon: History },
    { id: 'quotes', label: 'ציטוטים', icon: Quote },
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
            stats={stats} 
            hostingSchedule={hostingSchedule}
            onGoToHosting={() => setTab('hosting')}
            onFullscreenToggle={() => setChartFullscreen(true)}
            selectedChartPlayers={selectedChartPlayers}
            setSelectedChartPlayers={setSelectedChartPlayers}
            isMobile={isMobile}
          />
        )}

        {tab === 'table' && <MainLeaderboard stats={stats} sessions={sessions} />}

        {tab === 'periodic' && <PeriodicTables allSessions={allSessions} players={players} />}

        {tab === 'charts' && (
          <CumulativeChart sessions={sessions} stats={stats} fullscreen={false}
            onFullscreenToggle={() => setChartFullscreen(true)}
            selectedPlayers={selectedChartPlayers}
            onPlayersChange={setSelectedChartPlayers}
            isMobile={isMobile} />
        )}

        {tab === 'hosting' && (
          <HostingWrapper allSessions={allSessions} hostingSchedule={hostingSchedule}
            players={players} sortedPlayers={sortedPlayers} isAdmin={isAdmin}
            onUpdate={handleHostingUpdate} adminName={adminName} />
        )}

        {tab === 'history' && <SessionHistory sessions={sessions} onDelete={handleDeleteSession} isAdmin={isAdmin} />}

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
      
      <AdminLoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onLogin={handleAdminLogin} currentUser={currentUser} />

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
        /* 🦢 אנימציית ברבור - תעופה בקשת */
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
        /* 🔥 אנימציית להבת Hot Streak - הבהוב ותנועה קלה */
        @keyframes flame-flicker {
          0%, 100% { 
            transform: scale(1) rotate(-1deg);
            filter: brightness(1) drop-shadow(0 0 3px rgba(251, 146, 60, 0.6));
          }
          25% { 
            transform: scale(1.08) rotate(1.5deg);
            filter: brightness(1.15) drop-shadow(0 0 5px rgba(251, 146, 60, 0.8));
          }
          50% { 
            transform: scale(0.95) rotate(-0.5deg);
            filter: brightness(0.95) drop-shadow(0 0 2px rgba(251, 146, 60, 0.5));
          }
          75% { 
            transform: scale(1.05) rotate(1deg);
            filter: brightness(1.1) drop-shadow(0 0 4px rgba(251, 146, 60, 0.7));
          }
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
