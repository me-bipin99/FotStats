import React, { useState, useEffect } from 'react';
import {
  User,
  LogOut,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../services/api';

interface HeaderProps {
  activeTab: 'home' | 'compare' | 'stats' | 'lineups';
  onChangeTab: (tab: 'home' | 'compare' | 'stats' | 'lineups') => void;
}

const getInitials = (name: string) => {
  if (!name) return 'GK';
  const clean = name.replace(/[^a-zA-Z]/g, '');
  return clean.substring(0, 2).toUpperCase();
};

interface LeaderboardEntry {
  _id: string;
  name: string;
  reputation: number;
  predictionsCorrect: number;
  predictionsTotal: number;
}

export default function Header({ activeTab, onChangeTab }: HeaderProps) {
  const auth = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (dropdownOpen && auth.isLoggedIn) {
      getLeaderboard(10)
        .then((data) => setLeaderboard(data.leaderboard))
        .catch(() => {});
    }
  }, [dropdownOpen, auth.isLoggedIn]);

  const handleFormLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      await auth.login(loginEmail.trim(), loginPassword.trim());
      setLoginEmail('');
      setLoginPassword('');
      setAuthSuccess(true);
      setTimeout(() => setAuthSuccess(false), 1500);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanName = signupUsername.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (cleanName.length < 3) {
      setAuthError('Username must contain at least 3 letters.');
      return;
    }
    setIsSubmitting(true);
    try {
      await auth.register(signupEmail.trim(), signupPassword.trim(), cleanName);
      setSignupUsername('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupSuccess(true);
      setAuthMode('signin');
      setTimeout(() => setSignupSuccess(false), 6000);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    setDropdownOpen(false);
  };

  const currentUser = auth.user;
  const userRep = currentUser?.reputation ?? 0;
  const userWeight = currentUser ? Math.max(1, Math.round(1 + currentUser.reputation / 5)) : 1;

  const correct = leaderboard.find((u) => u._id === currentUser?.id)?.predictionsCorrect ?? 0;
  const total = leaderboard.find((u) => u._id === currentUser?.id)?.predictionsTotal ?? 0;
  const wrong = total - correct;

  const navItems = [
    { id: 'home', label: 'Matches' },
    { id: 'compare', label: 'Compare' },
    { id: 'stats', label: 'Stats' },
    { id: 'lineups', label: 'Lineups' },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-[#151619]/95 backdrop-blur-md border-b border-[#202124] px-4 py-3 md:px-6">
      <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center justify-between shrink-0">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none hover:opacity-90 active:scale-95 transition-all duration-150"
            onClick={() => onChangeTab('home')}
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#558833] shadow-lg shadow-slate-950/40 border border-[#3e6624] overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full object-cover" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="100" height="100" fill="#71a840" />
                <path d="M 0 100 L 100 100 L 100 0 Z" fill="#5c8a32" />
                <rect x="8" y="8" width="84" height="84" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.95" />
                <line x1="8" y1="50" x2="92" y2="50" stroke="#ffffff" strokeWidth="2.5" opacity="0.95" />
                <circle cx="50" cy="50" r="15" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.95" />
                <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
                <rect x="25" y="8" width="50" height="18" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.95" />
                <rect x="36" y="8" width="28" height="6" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.95" />
                <path d="M 38 26 A 15 15 0 0 0 62 26" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.95" />
                <rect x="25" y="74" width="50" height="18" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.95" />
                <rect x="36" y="86" width="28" height="6" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.95" />
                <path d="M 38 74 A 15 15 0 0 1 62 74" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.95" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-extrabold text-xl tracking-tight text-white">
                  Fot<span className="text-brand-500 font-normal">nep</span>
                </span>
              </div>
              <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                Football Analytical App
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center justify-center gap-1 self-center md:self-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 md:px-4 rounded-lg transition-all duration-150 cursor-pointer select-none text-center min-w-[64px] sm:min-w-[72px] md:min-w-[80px] ${
                  isActive ? 'text-brand-400' : 'text-slate-300 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span className={`text-[9.5px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-brand-400 font-black' : 'text-slate-500'}`}>
                  {item.label}
                </span>
                {isActive && <span className="w-4 h-0.5 bg-brand-500 rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* User / Auth */}
        <div className="hidden md:flex items-center gap-4 shrink-0 justify-end">
          <div className="flex items-center gap-2.5 relative">
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`h-8 w-8 rounded-full border flex items-center justify-center font-bold text-[11px] cursor-pointer transition-all duration-200 select-none ${
                auth.isLoggedIn
                  ? 'bg-brand-500/10 border-brand-500/30 text-brand-400 hover:bg-brand-500/20 hover:border-brand-500/50'
                  : 'bg-brand-500/15 border-brand-500/30 text-[#e2e8f0] hover:bg-brand-500/25 hover:border-brand-500/50'
              }`}
            >
              {auth.isLoggedIn ? getInitials(currentUser!.name) : <User className="w-4 h-4 text-brand-400" />}
            </div>

            {dropdownOpen && (
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setDropdownOpen(false)} />
            )}

            <MotionConfig reducedMotion="user">
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-3.5 bg-[#12141c] border border-slate-850 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-5 z-50 text-left w-76"
                >
                  {auth.isLoggedIn ? (
                    <div className="space-y-3.5">
                      <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-black text-brand-400 text-xs">
                            {getInitials(currentUser!.name)}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-200">@{currentUser!.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">Accuracy: {correct}-{wrong}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] block text-slate-500 uppercase font-black tracking-wider leading-none">Power</span>
                          <span className="text-xs font-extrabold text-brand-400 font-mono">x{userWeight}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#0c0d10] border border-slate-850 p-2 rounded-lg text-center">
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Reputation</p>
                          <p className="text-sm font-black text-white font-mono mt-0.5">{userRep >= 0 ? `+${userRep}` : userRep}</p>
                        </div>
                        <div className="bg-[#0c0d10] border border-slate-850 p-2 rounded-lg text-center">
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Predict Win</p>
                          <p className="text-sm font-black text-brand-500 font-mono mt-0.5">
                            {total > 0 ? `${Math.round((correct / total) * 100)}%` : '0%'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-brand-400" />
                          Leaderboard Standings
                        </p>
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {leaderboard.length === 0 ? (
                            <p className="text-[10px] text-slate-500 text-center py-2">Loading…</p>
                          ) : (
                            leaderboard.map((user, idx) => {
                              const isCurrent = user._id === currentUser?.id;
                              return (
                                <div
                                  key={user._id}
                                  className={`flex items-center justify-between p-1.5 rounded-lg border text-[10.5px] ${
                                    isCurrent ? 'bg-brand-500/10 border-brand-500/30' : 'bg-[#0d0e10]/65 border-slate-900'
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
                                    <span className={`truncate ${isCurrent ? 'text-brand-400 font-extrabold' : 'text-slate-300'}`}>
                                      @{user.name}
                                    </span>
                                  </div>
                                  <span className="font-mono text-[10.5px] font-black text-slate-200">
                                    {user.reputation >= 0 ? `+${user.reputation}` : user.reputation}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 rounded-lg text-xs font-bold text-rose-400 hover:text-white transition-all duration-150 cursor-pointer select-none uppercase tracking-wider"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="text-center space-y-1 pb-1">
                        <div className="mx-auto flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/25 shadow-inner mb-1.5">
                          <Trophy className="w-4 h-4 text-brand-400" />
                        </div>
                        <h3 className="text-xs font-black text-slate-100 tracking-tight">User Profile</h3>
                        <p className="text-[10px] text-slate-500">Access precision predictive weighted index.</p>
                      </div>

                      <div className="flex bg-[#0A0B0E] p-0.5 rounded-lg border border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => { setAuthMode('signin'); setAuthError(''); setSignupSuccess(false); setAuthSuccess(false); }}
                          className={`flex-1 text-center py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${
                            authMode === 'signin' ? 'bg-brand-500 text-white shadow font-black' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthMode('signup'); setAuthError(''); setSignupSuccess(false); setAuthSuccess(false); }}
                          className={`flex-1 text-center py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${
                            authMode === 'signup' ? 'bg-brand-500 text-white shadow font-black' : 'text-slate-400 hover:text-white'
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
                        <div className="bg-brand-500/15 border border-brand-500/30 text-brand-400 px-2.5 py-2 rounded-lg text-[10px] font-medium leading-relaxed text-center shadow-md">
                          <strong>Registered!</strong> Account created. Please sign in.
                        </div>
                      )}

                      {authSuccess && (
                        <div className="bg-brand-500/10 border border-brand-500/20 text-brand-400 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-center animate-pulse">
                          Authenticated successfully!
                        </div>
                      )}

                      {authMode === 'signin' ? (
                        <form onSubmit={handleFormLoginSubmit} className="space-y-2.5">
                          <div>
                            <label className="block text-[8.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Email address</label>
                            <input
                              type="email"
                              required
                              placeholder="admin@fotnep.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="w-full bg-[#0A0B0E] border border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 placeholder:text-slate-500"
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
                              className="w-full bg-[#0A0B0E] border border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 placeholder:text-slate-500"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-1.5 px-3 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                          >
                            {isSubmitting ? 'Signing in…' : 'Sign In'}
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
                              className="w-full bg-[#0A0B0E] border border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 placeholder:text-slate-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Email Address</label>
                            <input
                              type="email"
                              required
                              placeholder="fan@fotnep.com"
                              value={signupEmail}
                              onChange={(e) => setSignupEmail(e.target.value)}
                              className="w-full bg-[#0A0B0E] border border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 placeholder:text-slate-500"
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
                              className="w-full bg-[#0A0B0E] border border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 placeholder:text-slate-500"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white py-1.5 px-3 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                          >
                            {isSubmitting ? 'Creating account…' : 'Sign Up'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            </MotionConfig>
          </div>
        </div>

      </div>
    </header>
  );
}
