import React, { useState } from 'react';
import { Match } from '../types';
import { Shield, Sparkles, Flame, Calendar, Trophy, Search, Users, ShieldAlert } from 'lucide-react';

// Custom Men's Shoot Icon
const MensShootIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* ears */}
    <circle cx="18" cy="28" r="4.5" fill="#fbd38d" />
    <circle cx="46" cy="28" r="4.5" fill="#fbd38d" />
    {/* head */}
    <circle cx="32" cy="28" r="14" fill="#fbd38d" />
    
    {/* Cute spiky black hair */}
    <path d="M16 23 C14 16, 20 8, 25 11 C28 8, 32 6, 36 10 C40 7, 46 11, 48 16 C50 20, 48 24, 46 26 C43 21, 21 21, 16 23 Z" fill="#1d2026" />
    <path d="M18 20 L22 14 L26 19 L32 12 L38 19 L42 13 L46 21" stroke="#1d2026" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

    {/* Face eyes, rosy cheeks & cute smile */}
    <circle cx="26" cy="28" r="2" fill="#2d3748" />
    <circle cx="38" cy="28" r="2" fill="#2d3748" />
    <circle cx="22" cy="31" r="2.5" fill="#e53e3e" opacity="0.45" />
    <circle cx="42" cy="31" r="2.5" fill="#e53e3e" opacity="0.45" />
    <path d="M29 32.5 Q32 35 35 32.5" stroke="#2d3748" strokeWidth="1.8" strokeLinecap="round" fill="none" />

    {/* Yellow Jersey with Blue Collar */}
    <path d="M20 42 C18 48, 16 58, 16 62 L48 62 C48 58, 46 48, 44 42 Z" fill="#facc15" />
    <path d="M24 42 C24 45, 40 45, 40 42 C40 42, 36 49, 32 49 C28 49, 24 42, 24 42 Z" fill="#2563eb" />

    {/* Classic Soccer Ball next to head/neck */}
    <g transform="translate(42, 38)">
      <circle cx="9" cy="9" r="8" fill="#ffffff" stroke="#1d2026" strokeWidth="1.5" />
      <polygon points="9,5 5,7 6,11 12,11 13,7" fill="#1d2026" />
      <path d="M9 5 L9 1" stroke="#1d2026" strokeWidth="1" />
      <path d="M5 7 L1 6" stroke="#1d2026" strokeWidth="1" />
      <path d="M13 7 L17 6" stroke="#1d2026" strokeWidth="1" />
      <path d="M6 11 L3 14" stroke="#1d2026" strokeWidth="1" />
      <path d="M12 11 L15 14" stroke="#1d2026" strokeWidth="1" />
    </g>
  </svg>
);

// Custom Women's Football Player Icon with ponytail
const WomensFootballPlayerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* High Ponytail back */}
    <path d="M42 22 C52 14, 58 18, 56 32 C54 40, 48 42, 44 32 Z" fill="#1d2026" />
    {/* Pony tail band */}
    <path d="M41 20 C43 18, 45 15, 44 12" stroke="#ec4899" strokeWidth="3.5" strokeLinecap="round" />

    {/* Ears & Skin Head */}
    <circle cx="19" cy="29" r="4.2" fill="#fbd38d" />
    <circle cx="45" cy="29" r="4.2" fill="#fbd38d" />
    <circle cx="32" cy="28" r="13.5" fill="#fbd38d" />

    {/* Sleek girl's hair frame */}
    <path d="M19 23 C21 16, 26 12, 32 12 C38 12, 43 16, 45 23 C43 20, 39 19, 32 19 C25 19, 21 20, 19 23 Z" fill="#1d2026" />

    {/* Eyes, cheeks, and a smiling mouth */}
    <circle cx="26" cy="27" r="1.8" fill="#2d3748" />
    <circle cx="38" cy="27" r="1.8" fill="#2d3748" />
    <circle cx="22" cy="30" r="2.2" fill="#f43f5e" opacity="0.45" />
    <circle cx="42" cy="30" r="2.2" fill="#f43f5e" opacity="0.45" />
    <path d="M28.5 32 Q32 34.5 35.5 32" stroke="#2d3748" strokeWidth="1.8" strokeLinecap="round" fill="none" />

    {/* Teal Jersey with Pink Accent */}
    <path d="M20 42 C18 48, 16 58, 16 62 L48 62 C48 58, 46 48, 44 42 Z" fill="#14b8a6" />
    <path d="M24 42 C24 45, 40 45, 40 42 C40 42, 36 47, 32 47 C28 47, 24 42, 24 42 Z" fill="#ec4899" />

    {/* Soccer ball on bottom side */}
    <g transform="translate(42, 38)">
      <circle cx="9" cy="9" r="8" fill="#ffffff" stroke="#1d2026" strokeWidth="1.5" />
      <polygon points="9,5 5,7 6,11 12,11 13,7" fill="#1d2026" />
      <path d="M9 5 L9 1" stroke="#1d2026" strokeWidth="1" />
      <path d="M5 7 L1 6" stroke="#1d2026" strokeWidth="1" />
      <path d="M13 7 L17 6" stroke="#1d2026" strokeWidth="1" />
      <path d="M6 11 L3 14" stroke="#1d2026" strokeWidth="1" />
      <path d="M12 11 L15 14" stroke="#1d2026" strokeWidth="1" />
    </g>
  </svg>
);

// Custom Domestic Soccer Player Icon
const DomesticSoccerPlayerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Brown spiky hair & head */}
    <circle cx="28" cy="15" r="5" fill="#fbd38d" />
    <path d="M24 13 C22 10, 27 6, 30 8 C32 6, 35 10, 33 13 Z" fill="#92400e" />

    {/* Arms in action pose */}
    <path d="M23 24 L12 21 C10 20.5, 9 22.5, 11 23 L20 28" stroke="#fbd38d" strokeWidth="3" strokeLinecap="round" />
    <path d="M31 24 L42 21 C44 20.5, 45 22.5, 43 23 L34 28" stroke="#fbd38d" strokeWidth="3" strokeLinecap="round" />

    {/* Torso in vertical stripes (Purple & Red) */}
    <path d="M22 23 L34 23 L32 38 L24 38 Z" fill="#7e22ce" />
    <path d="M25 23 L27 23 L26 38 L24 38 Z" fill="#ef4444" />
    <path d="M29 23 L31 23 L30 38 L28 38 Z" fill="#ef4444" />

    {/* Shorts */}
    <path d="M24 38 L32 38 L34 45 L30 45 L28 42 L26 45 L22 45 Z" fill="#a16207" />

    {/* Legs */}
    <path d="M24 45 L20 54 L14 55" stroke="#fbd38d" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 55 L16 57" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />

    <path d="M30 45 L38 51 L44 51" stroke="#fbd38d" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M44 51 L47 50" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />

    {/* Soccer ball on the ground in front */}
    <g transform="translate(45, 40)">
      <circle cx="8" cy="8" r="7" fill="#ffffff" stroke="#1d2026" strokeWidth="1.2" />
      <polygon points="8,4 5,6 6,9 10,9 11,6" fill="#1d2026" />
      <path d="M8 4 L8 1" stroke="#1d2026" strokeWidth="0.8" />
      <path d="M5 6 L2 5" stroke="#1d2026" strokeWidth="0.8" />
      <path d="M11 6 L14 5" stroke="#1d2026" strokeWidth="0.8" />
      <path d="M6 9 L3 11" stroke="#1d2026" strokeWidth="0.8" />
      <path d="M10 9 L13 11" stroke="#1d2026" strokeWidth="0.8" />
    </g>
  </svg>
);

interface MatchFeedProps {
  matches: Match[];
  selectedMatchId: string;
  onSelectMatch: (matchId: string) => void;
  selectedCategory: 'MEN' | 'WOMEN' | 'DOMESTIC' | 'ALL';
  onSelectCategory: (category: 'MEN' | 'WOMEN' | 'DOMESTIC' | 'ALL') => void;
}

type FilterStatus = 'ALL' | 'LIVE' | 'FINISHED' | 'UPCOMING';

export default function MatchFeed({ 
  matches, 
  selectedMatchId, 
  onSelectMatch,
  selectedCategory,
  onSelectCategory
}: MatchFeedProps) {
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dual filter: by Category first, then status, then search
  const filteredMatches = matches.filter(match => {
    // Category filter
    if (selectedCategory !== 'ALL' && match.category !== selectedCategory) return false;

    // Status filter
    if (filter !== 'ALL' && match.status !== filter) return false;

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchHome = match.homeTeam.name.toLowerCase().includes(q) || match.homeTeam.shorthand.toLowerCase().includes(q);
      const matchAway = match.awayTeam.name.toLowerCase().includes(q) || match.awayTeam.shorthand.toLowerCase().includes(q);
      const matchComp = match.competition.toLowerCase().includes(q);
      return matchHome || matchAway || matchComp;
    }

    return true;
  });

  return (
    <div className="bg-[#151619] border border-slate-800/60 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      
      {/* Categories Row */}
      <div className="p-4 bg-slate-950 border-b border-slate-850">
        <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 text-center">
          Filter by Category
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'MEN', label: "Men's", icon: MensShootIcon, activeColor: 'text-rose-400', inactiveColor: 'text-slate-400 hover:text-rose-300' },
            { id: 'WOMEN', label: "Women's", icon: WomensFootballPlayerIcon, activeColor: 'text-amber-400', inactiveColor: 'text-slate-400 hover:text-amber-300' },
            { id: 'DOMESTIC', label: "Domestic", icon: DomesticSoccerPlayerIcon, activeColor: 'text-emerald-400', inactiveColor: 'text-slate-400 hover:text-emerald-350' }
          ] as const).map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(selectedCategory === cat.id ? 'ALL' : cat.id)}
                className={`py-2 px-1 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center select-none rounded-xl hover:bg-slate-900/40 ${
                  isSelected 
                    ? `${cat.activeColor} scale-105 font-black`
                    : `${cat.inactiveColor}`
                }`}
              >
                <IconComponent className={`w-11 h-11 mb-1.5 transition-transform duration-200 ${isSelected ? 'scale-110 drop-shadow-[0_0_8px_currentColor]' : 'opacity-80 hover:opacity-100'}`} />
                <span className="text-[10.5px] font-bold tracking-wide uppercase">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {selectedCategory !== 'ALL' && (
          <button 
            onClick={() => onSelectCategory('ALL')}
            className="w-full text-center text-[10px] text-slate-500 hover:text-emerald-400 mt-2.5 transition font-semibold"
          >
            Clear Selected Filter
          </button>
        )}
      </div>

      {/* Header and Controls */}
      <div className="p-4 border-b border-[#202124] bg-[#151619]">
        <h3 className="text-sm font-sans font-semibold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-500" />
          <span>Match Fixtures</span>
        </h3>

        {/* Search */}
        <div className="relative mb-3.5">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search teams or league..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d0e10] border border-slate-800/80 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 transition"
          />
        </div>

        {/* Tabs */}
        <div className="flex p-0.5 bg-[#0d0e10] rounded-lg border border-slate-800/60 text-[11px] font-medium leading-none">
          {(['ALL', 'LIVE', 'FINISHED', 'UPCOMING'] as FilterStatus[]).map((status) => {
            const count = status === 'ALL' 
              ? matches.filter(m => selectedCategory === 'ALL' || m.category === selectedCategory).length 
              : matches.filter(m => m.status === status && (selectedCategory === 'ALL' || m.category === selectedCategory)).length;

            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 py-1.5 text-center rounded-md font-semibold transition-all cursor-pointer ${
                  filter === status
                    ? 'bg-emerald-500 text-black shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="capitalize">{status.toLowerCase()}</span>
                {count > 0 && (
                  <span className={`ml-1 px-1 rounded text-[9px] ${
                    filter === status 
                      ? 'bg-black/15 text-black font-extrabold' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matches List Grid */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 max-h-[450px] md:max-h-[600px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {filteredMatches.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            <p className="text-xs">No matching fixtures found</p>
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isSelected = match.id === selectedMatchId;
            const isLive = match.status === 'LIVE';

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatch(match.id)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative ${
                  isSelected 
                    ? 'bg-[#1c1d22] border-emerald-500 shadow-lg shadow-emerald-500/5' 
                    : 'bg-[#0f1013] border-slate-900 hover:border-slate-800 hover:bg-[#131418]'
                }`}
              >
                {/* Competition info */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                  <span className="font-semibold tracking-wide truncate max-w-[150px]">{match.competition}</span>
                  {isLive ? (
                    <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded animate-pulse">
                      <Flame className="w-2.5 h-2.5" />
                      <span>{match.minute}'</span>
                    </span>
                  ) : match.status === 'FINISHED' ? (
                    <span className="bg-slate-800 text-slate-400 font-semibold px-1.5 py-0.5 rounded text-[9px]">FT</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">{match.date}</span>
                  )}
                </div>

                {/* Match Scoreline / Match details */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  {/* Home Team */}
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold shadow shrink-0"
                      style={{ backgroundColor: match.homeTeam.color }}
                    >
                      {match.homeTeam.shorthand[0]}
                    </div>
                    <span className={`text-[12px] font-sans font-medium truncate ${
                      isSelected ? 'text-white font-bold' : 'text-slate-300'
                    }`}>
                      {match.homeTeam.shorthand}
                    </span>
                  </div>

                  {/* Score or Kickoff Time */}
                  <div className="px-2 py-1 text-center bg-[#0d0e10] border border-[#202124] rounded font-mono text-[11px] text-white min-w-[45px]">
                    {match.status === 'UPCOMING' ? (
                      <span className="text-[9px] text-slate-400 font-sans tracking-tight">{match.time}</span>
                    ) : (
                      <span className="font-bold flex justify-center gap-1">
                        <span className={match.homeScore! > match.awayScore! ? 'text-emerald-400' : 'text-slate-300'}>
                          {match.homeScore}
                        </span>
                        <span className="text-slate-600">-</span>
                        <span className={match.awayScore! > match.homeScore! ? 'text-emerald-400' : 'text-slate-300'}>
                          {match.awayScore}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-2 justify-end text-right">
                    <span className={`text-[12px] font-sans font-medium truncate ${
                      isSelected ? 'text-white font-bold' : 'text-slate-300'
                    }`}>
                      {match.awayTeam.shorthand}
                    </span>
                    <div 
                      className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold shadow shrink-0"
                      style={{ backgroundColor: match.awayTeam.color }}
                    >
                      {match.awayTeam.shorthand[0]}
                    </div>
                  </div>
                </div>

                {/* Stadium and Quick predictions count */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-850/60">
                  <span className="truncate max-w-[170px]">{match.venue}</span>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold bg-slate-900 border border-slate-800/50 px-1.5 py-0.5 rounded">
                    <span>Votes:</span>
                    <span className="font-mono text-emerald-400">
                      {(match.predictionVotes.home + match.predictionVotes.draw + match.predictionVotes.away).toLocaleString()}
                    </span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
