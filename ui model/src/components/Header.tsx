import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  Home, 
  ArrowLeftRight, 
  TrendingUp, 
  Layers,
  User, 
  LogOut, 
  Check,
  Award,
  Trophy,
  Sparkles,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  activeTab: 'home' | 'compare' | 'stats' | 'lineups';
  onChangeTab: (tab: 'home' | 'compare' | 'stats' | 'lineups') => void;
}

const getInitials = (name: string) => {
  if (!name) return 'GK';
  const clean = name.replace(/[^a-zA-Z]/g, '');
  return clean.substring(0, 2).toUpperCase();
};

export default function Header({ activeTab, onChangeTab }: HeaderProps) {
  const [systime, setSystime] = useState<string>('08:45:00 UTC');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Auth and credential states
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  // Sign-in Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Sign-up/Creation Fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Unified Reputation & Weighted Prediction States loaded from LocalStorage
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('FOTNEP_LOGGED_IN') || null;
  });

  const [usersList, setUsersList] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('FOTNEP_USERS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const defaultSeed = [
      { username: 'Gorkhali_Expert', email: 'user1@fotneo.com', password: 'password123', reputation: 32, correct: 12, wrong: 4, isExpert: true },
      { username: 'Nepali_Madridista', email: 'user2@fotneo.com', password: 'password123', reputation: 25, correct: 10, wrong: 5, isExpert: true },
      { username: 'Cheli_Power', email: 'user3@fotneo.com', password: 'password123', reputation: 18, correct: 8, wrong: 6, isExpert: true },
      { username: 'Football_Guy_97', email: 'user4@fotneo.com', password: 'password123', reputation: 9, correct: 5, wrong: 6, isExpert: false },
      { username: 'Striker_Bahadur', email: 'user5@fotneo.com', password: 'password123', reputation: 15, correct: 7, wrong: 3, isExpert: false },
      { username: 'Lalitpur_Star', email: 'user6@fotneo.com', password: 'password123', reputation: 22, correct: 9, wrong: 4, isExpert: true },
      { username: 'Biratnagar_Boss', email: 'user7@fotneo.com', password: 'password123', reputation: 11, correct: 5, wrong: 4, isExpert: false },
      { username: 'Thamel_Turf_King', email: 'user8@fotneo.com', password: 'password123', reputation: 27, correct: 11, wrong: 5, isExpert: true },
      { username: 'Pokhara_Pioneer', email: 'user9@fotneo.com', password: 'password123', reputation: 6, correct: 4, wrong: 6, isExpert: false },
      { username: 'Gorkha_Gladiator', email: 'user10@fotneo.com', password: 'password123', reputation: 14, correct: 6, wrong: 4, isExpert: false },
    ];
    localStorage.setItem('FOTNEP_USERS', JSON.stringify(defaultSeed));
    return defaultSeed;
  });

  // Keep state hydrated in sync across siblings in real-time
  useEffect(() => {
    const handleAuthChange = () => {
      setLoggedInUser(localStorage.getItem('FOTNEP_LOGGED_IN') || null);
      const savedUsers = localStorage.getItem('FOTNEP_USERS');
      if (savedUsers) {
        try { setUsersList(JSON.parse(savedUsers)); } catch (e) {}
      }
    };
    window.addEventListener('fotnep-auth-change', handleAuthChange);
    return () => window.removeEventListener('fotnep-auth-change', handleAuthChange);
  }, []);

  // When dropdown is opened, refresh from local storage to prevent any lag desync
  useEffect(() => {
    if (dropdownOpen) {
      setLoggedInUser(localStorage.getItem('FOTNEP_LOGGED_IN') || null);
      const savedUsers = localStorage.getItem('FOTNEP_USERS');
      if (savedUsers) {
        try { setUsersList(JSON.parse(savedUsers)); } catch (e) {}
      }
    }
  }, [dropdownOpen]);

  // System time ticker clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setSystime(now.toISOString().substring(11, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLoginEvent = (uname: string) => {
    setLoggedInUser(uname);
    localStorage.setItem('FOTNEP_LOGGED_IN', uname);
    window.dispatchEvent(new Event('fotnep-auth-change'));
    setAuthError('');
    setAuthSuccess(true);
    setTimeout(() => {
      setAuthSuccess(false);
    }, 1000);
  };

  const handleFormLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const emailLower = loginEmail.trim().toLowerCase();
    const cleanedPass = loginPassword.trim();

    if (!emailLower || !cleanedPass) {
      setAuthError('Please fill in both email and password.');
      return;
    }

    const matched = usersList.find(u => u.email?.toLowerCase() === emailLower);
    if (!matched) {
      setAuthError('Email not found. Try preloaded accounts (e.g., user1@fotneo.com).');
      return;
    }

    if (matched.password && matched.password !== cleanedPass) {
      setAuthError('Incorrect secret password. (Try password123)');
      return;
    }

    handleLoginEvent(matched.username);
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleFormSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanUsername = signupUsername.trim().replace(/[^a-zA-Z0-9_]/g, '');
    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanPass = signupPassword.trim();

    if (!cleanUsername || !cleanEmail || !cleanPass) {
      setAuthError('All signup inputs are strictly required.');
      return;
    }

    if (cleanUsername.length < 3) {
      setAuthError('Username must contain at least 3 letters.');
      return;
    }

    const usernameExists = usersList.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (usernameExists) {
      setAuthError('This Gorkhali username is already taken!');
      return;
    }

    const emailExists = usersList.some(u => u.email?.toLowerCase() === cleanEmail);
    if (emailExists) {
      setAuthError('This email is already in use.');
      return;
    }

    const newUser = {
      username: cleanUsername,
      email: cleanEmail,
      password: cleanPass,
      reputation: 0,
      correct: 0,
      wrong: 0,
      isExpert: false
    };

    const updatedList = [...usersList, newUser];
    setUsersList(updatedList);
    localStorage.setItem('FOTNEP_USERS', JSON.stringify(updatedList));

    // Display signup success alert and redirect to login
    setSignupSuccess(true);
    setLoginEmail(cleanEmail);
    setAuthMode('signin');

    setSignupUsername('');
    setSignupEmail('');
    setSignupPassword('');

    setTimeout(() => {
      setSignupSuccess(false);
    }, 6000);
  };

  const handleLogoutEvent = () => {
    setLoggedInUser(null);
    localStorage.removeItem('FOTNEP_LOGGED_IN');
    window.dispatchEvent(new Event('fotnep-auth-change'));
  };

  const currentUserObj = usersList.find(u => u.username === loggedInUser);
  const userRep = currentUserObj ? currentUserObj.reputation : 0;
  const userWeight = currentUserObj 
    ? Math.max(1, Math.round(1 + currentUserObj.reputation / 5)) 
    : 1;

  const navItems = [
    { id: 'home', label: 'Homepage', icon: Home },
    { id: 'compare', label: 'Compare Player', icon: ArrowLeftRight },
    { id: 'stats', label: 'Player Stats', icon: TrendingUp },
    { id: 'lineups', label: 'Lineup Builder', icon: Layers },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-[#151619]/95 backdrop-blur-md border-b border-[#202124] px-4 py-3 md:px-6">
      <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Brand & Identity */}
        <div className="flex items-center justify-between shrink-0">
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none hover:opacity-90 active:scale-95 transition-all duration-150"
            onClick={() => onChangeTab('home')}
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-lg shadow-slate-950/40 border border-slate-800 overflow-hidden">
              <svg viewBox="0 0 24 24" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="#ffffff" />
                <circle cx="12" cy="12" r="11" fill="none" stroke="#000000" strokeWidth="1.2" />
                <polygon points="12,9.2 14.6,11.1 13.6,14.1 10.4,14.1 9.4,11.1" fill="#000000" />
                <line x1="12" y1="9.2" x2="12" y2="4.5" stroke="#000000" strokeWidth="1.2" />
                <line x1="14.6" y1="11.1" x2="19.1" y2="9.6" stroke="#000000" strokeWidth="1.2" />
                <line x1="13.6" y1="14.1" x2="16.2" y2="18.2" stroke="#000000" strokeWidth="1.2" />
                <line x1="10.4" y1="14.1" x2="7.8" y2="18.2" stroke="#000000" strokeWidth="1.2" />
                <line x1="9.4" y1="11.1" x2="4.9" y2="9.6" stroke="#000000" strokeWidth="1.2" />
                <path d="M10,4.5 C10.6,4.1 11.3,4 12,4 C12.7,4 13.4,4.1 14,4.5 L13,7.2 L11,7.2 Z" fill="#000000" />
                <path d="M18.5,7.6 C19.1,8.2 19.6,8.9 19.9,9.6 L17,11 L15.7,9.1 Z" fill="#000000" />
                <path d="M17.5,16.4 C16.8,17.1 16,17.6 15.1,18 L14.5,15 L16.4,13.5 Z" fill="#000000" />
                <path d="M6.5,16.4 C7.2,17.1 8,17.6 8.9,18 L9.5,15 L7.6,13.5 Z" fill="#000000" />
                <path d="M5.5,7.6 C4.9,8.2 4.4,8.9 4.1,9.6 L7,11 L8.3,9.1 Z" fill="#000000" />
              </svg>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-extrabold text-xl tracking-tight text-white">
                  Fot<span className="text-emerald-500 font-normal">nep</span>
                </span>
              </div>
              <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                Football Nepal Hub
              </p>
            </div>
          </div>
          
          {/* Mobile Watch/Clock */}
          <div className="md:hidden flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1 text-slate-400 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>{systime}</span>
          </div>
        </div>

        {/* MIDDLE SECTION - NAVIGATION BAR WITH TOOLTIPS */}
        <nav className="flex items-center justify-center gap-2.5 bg-slate-950/80 border border-slate-850 px-3 py-1.5 rounded-xl self-center md:self-auto shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="group relative flex flex-col items-center">
                <button
                  onClick={() => onChangeTab(item.id)}
                  className={`p-2.5 rounded-lg border transition-all duration-150 cursor-pointer relative ${
                    isActive
                      ? 'bg-emerald-500 border-emerald-400 text-black shadow-md shadow-emerald-950/20'
                      : 'bg-slate-900/30 border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-100'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {isActive && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-black rounded-full" />
                  )}
                </button>

                {/* Animated Dynamic Tooltip popup on Hover */}
                <div className="absolute top-full mt-2.5 scale-0 group-hover:scale-100 transition-all origin-top rounded bg-slate-950/95 border border-slate-800 px-2 py-1 shadow-2xl z-50 pointer-events-none whitespace-nowrap">
                  <span className="text-[10px] font-bold text-white tracking-wide uppercase">
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Info / Profile Info */}
        <div className="hidden md:flex items-center gap-4 shrink-0 justify-end">
          <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-850 px-3 py-1.5 rounded-md">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono text-xs text-slate-300">{systime}</span>
          </div>

          <div className="flex items-center gap-2.5 relative">
            {/* TEXT TRIGGERS AUTH OR DROPDOWN */}
            <div 
              id="header-profile-text-trigger"
              className="text-right cursor-pointer select-none"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <p className="text-xs font-semibold text-slate-200 hover:text-[#5850ec] transition-colors leading-tight">
                {loggedInUser ? `@${loggedInUser}` : 'Sign In'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono tracking-tight mt-0.5">
                {loggedInUser ? 'Gorkhali Contributor' : 'Join Nepal Hub'}
              </p>
            </div>

            {/* AVATAR TRIGGER BUBBLE (Targeted by CSS Selector) */}
            <div 
              id="header-profile-avatar-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`h-8 w-8 rounded-full border flex items-center justify-center font-bold text-[11px] cursor-pointer transition-all duration-200 select-none ${
                loggedInUser 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50' 
                  : 'bg-emerald-500/15 border-emerald-500/30 text-[#e2e8f0] hover:bg-emerald-500/25 hover:border-emerald-500/50'
              }`}
            >
              {loggedInUser ? getInitials(loggedInUser) : <User className="w-4 h-4 text-emerald-450" />}
            </div>

            {/* Dropdown Outside click-to-close overlay */}
            {dropdownOpen && (
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setDropdownOpen(false)} />
            )}

            {/* HIGH FIDELITY DROPDOWN MENU */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  id="header-profile-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-3.5 bg-[#12141c] border border-slate-850 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-5 z-50 text-left w-76"
                >
                  {loggedInUser ? (
                    <div className="space-y-3.5">
                      {/* Account detail Header */}
                      <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-black text-emerald-400 text-xs">
                            {getInitials(loggedInUser)}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-200">@{loggedInUser}</p>
                            <p className="text-[10px] text-slate-500 font-mono">Accuracy: {currentUserObj?.correct ?? 0}-{currentUserObj?.wrong ?? 0}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] block text-slate-500 uppercase font-black tracking-wider leading-none">Power</span>
                          <span className="text-xs font-extrabold text-emerald-400 font-mono">x{userWeight}</span>
                        </div>
                      </div>

                      {/* Point count indicator */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#0c0d10] border border-slate-850 p-2 rounded-lg text-center">
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Reputation</p>
                          <p className="text-sm font-black text-white font-mono mt-0.5">{userRep >= 0 ? `+${userRep}` : userRep}</p>
                        </div>
                        <div className="bg-[#0c0d10] border border-slate-850 p-2 rounded-lg text-center">
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Predict Win</p>
                          <p className="text-sm font-black text-emerald-450 font-mono mt-0.5">
                            {currentUserObj && (currentUserObj.correct + currentUserObj.wrong) > 0 
                              ? `${Math.round((currentUserObj.correct / (currentUserObj.correct + currentUserObj.wrong)) * 100)}%` 
                              : '0%'}
                          </p>
                        </div>
                      </div>

                      {/* Predictive Gorkhali Leaderboard list */}
                      <div className="space-y-2 pt-1">
                        <p className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                          Leaderboard Standings
                        </p>
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {[...usersList]
                            .sort((a, b) => b.reputation - a.reputation)
                            .map((user, idx) => {
                              const isCurrent = user.username === loggedInUser;
                              return (
                                <div 
                                  key={user.username}
                                  className={`flex items-center justify-between p-1.5 rounded-lg border text-[10.5px] ${
                                    isCurrent ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#0d0e10]/65 border-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
                                      idx === 0 
                                        ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' 
                                        : idx === 1 
                                          ? 'bg-slate-300/15 text-slate-200 border border-slate-300/20' 
                                          : 'bg-slate-950 text-slate-500'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <span className={`truncate ${isCurrent ? 'text-emerald-400 font-extrabold' : 'text-slate-300'}`}>@{user.username}</span>
                                  </div>
                                  <span className="font-mono text-[10.5px] font-black text-slate-200">{user.reputation >= 0 ? `+${user.reputation}` : user.reputation}</span>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Logout Trigger Button */}
                      <button
                        onClick={handleLogoutEvent}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 rounded-lg text-xs font-bold text-rose-400 hover:text-white transition-all duration-150 cursor-pointer select-none uppercase tracking-wider"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="text-center space-y-1 pb-1">
                        <div className="mx-auto flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 shadow-inner mb-1.5">
                          <Trophy className="w-4 h-4 text-emerald-450" />
                        </div>
                        <h3 className="text-xs font-black text-slate-100 tracking-tight">User Profile</h3>
                        <p className="text-[10px] text-slate-500">Access precision predictive weighted index.</p>
                      </div>

                      {/* Tab toggler inside dropdown Auth */}
                      <div className="flex bg-[#0A0B0E] p-0.5 rounded-lg border border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => { setAuthMode('signin'); setAuthError(''); setSignupSuccess(false); setAuthSuccess(false); }}
                          className={`flex-1 text-center py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${
                            authMode === 'signin' ? 'bg-emerald-500 text-black shadow font-black' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthMode('signup'); setAuthError(''); setSignupSuccess(false); setAuthSuccess(false); }}
                          className={`flex-1 text-center py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${
                            authMode === 'signup' ? 'bg-emerald-500 text-black shadow font-black' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Sign Up
                        </button>
                      </div>

                      {authError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1.5 rounded-lg text-[10px] font-medium leading-relaxed">
                          ⚠️ {authError}
                        </div>
                      )}

                      {signupSuccess && (
                        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-2 rounded-lg text-[10px] font-medium leading-relaxed text-center shadow-md">
                          🎉 <strong>Registered!</strong> Account created successfully. Please enter your password to sign in.
                        </div>
                      )}

                      {authSuccess && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-center animate-pulse">
                          🎉 Authenticated successfully!
                        </div>
                      )}

                      {/* Action forms */}
                      {authMode === 'signin' ? (
                        <form onSubmit={handleFormLoginSubmit} className="space-y-2.5">
                          <div>
                            <label className="block text-[8.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Email address</label>
                            <input
                              type="email"
                              required
                              placeholder="e.g. user1@fotneo.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="w-full bg-[#0A0B0E] border border-slate-850 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 placeholder:text-slate-650"
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Password</label>
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="w-full bg-[#0A0B0E] border border-slate-850 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 placeholder:text-slate-650"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-1.5 px-3 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                          >
                            Sign In
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleFormSignupSubmit} className="space-y-2.5">
                          <div>
                            <label className="block text-[8.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Username (No spaces)</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. football_expert_99"
                              value={signupUsername}
                              onChange={(e) => setSignupUsername(e.target.value)}
                              className="w-full bg-[#0A0B0E] border border-slate-850 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 placeholder:text-slate-650"
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Email Address</label>
                            <input
                              type="email"
                              required
                              placeholder="e.g. fan@fotneo.com"
                              value={signupEmail}
                              onChange={(e) => setSignupEmail(e.target.value)}
                              className="w-full bg-[#0A0B0E] border border-slate-850 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 placeholder:text-slate-650"
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Secure Password</label>
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="w-full bg-[#0A0B0E] border border-slate-850 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 placeholder:text-slate-650"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-1.5 px-3 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                          >
                            Sign Up
                          </button>
                        </form>
                      )}

                      {/* Preloaded demo hint has been removed as requested. User will sign in or register manually. */}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </header>
  );
}

