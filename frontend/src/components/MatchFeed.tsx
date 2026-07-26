import React, { useState } from 'react';
import { Match } from '../types';
import { Flame, Search } from 'lucide-react';

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
        <h4 className="text-[10px] font-extrabold text-white-500 uppercase tracking-widest mb-3 text-center">
          Filter by Category
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'MEN', label: "Men's", activeColor: 'text-rose-400', inactiveColor: 'text-slate-400 hover:text-rose-300' },
            { id: 'WOMEN', label: "Women's", activeColor: 'text-amber-400', inactiveColor: 'text-slate-400 hover:text-amber-300' },
            { id: 'DOMESTIC', label: "Domestic", activeColor: 'text-brand-400', inactiveColor: 'text-slate-400 hover:text-brand-400' }
          ] as const).map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(selectedCategory === cat.id ? 'ALL' : cat.id)}
                className={`py-2.5 px-1 text-center transition-all duration-200 cursor-pointer flex items-center justify-center select-none rounded-xl hover:bg-slate-900/40 ${
                  isSelected
                    ? `${cat.activeColor} font-black`
                    : `${cat.inactiveColor}`
                }`}
              >
                <span className="text-[10.5px] font-bold tracking-wide uppercase">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {selectedCategory !== 'ALL' && (
          <button 
            onClick={() => onSelectCategory('ALL')}
            className="w-full text-center text-[10px] text-slate-500 hover:text-brand-400 mt-2.5 transition font-semibold"
          >
            Clear Selected Filter
          </button>
        )}
      </div>

      {/* Header and Controls */}
      <div className="p-4 border-b border-[#202124] bg-[#151619]">
        <h3 className="text-sm font-sans font-semibold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-2">
          
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
            className="w-full bg-[#0d0e10] border border-slate-800/80 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 transition"
          />
        </div>

        {/* Tabs */}
        <div className="flex p-0.5 bg-[#0d0e10] rounded-lg border border-slate-800/60 text-[11px] font-medium leading-none">
          {(['ALL', 'FINISHED', 'UPCOMING'] as FilterStatus[]).map((status) => {
            const count = status === 'ALL' 
              ? matches.filter(m => selectedCategory === 'ALL' || m.category === selectedCategory).length 
              : matches.filter(m => m.status === status && (selectedCategory === 'ALL' || m.category === selectedCategory)).length;

            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 py-1.5 text-center rounded-md font-semibold transition-all cursor-pointer ${
                  filter === status
                    ? 'bg-brand-500 text-white shadow-md font-extrabold'
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
                    ? 'bg-[#1c1d22] border-brand-500 shadow-lg shadow-brand-500/5'
                    : 'bg-[#0f1013] border-slate-900 hover:border-slate-800 hover:bg-[#131418]'
                }`}
              >
                {/* Competition info */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                  <span className="font-semibold tracking-wide truncate max-w-[150px]">{match.competition}</span>
                  {isLive ? (
                    <span className="flex items-center gap-1 bg-brand-500/10 text-brand-400 font-bold px-1.5 py-0.5 rounded animate-pulse">
                      <Flame className="w-2.5 h-2.5" />
                      <span>{match.minute}'</span>
                    </span>
                  ) : match.status === 'FINISHED' ? (
                    <span className="bg-slate-800 text-slate-400 font-semibold px-1.5 py-0.5 rounded text-[9px]">FT</span>
                  ) : (
                    <span className="text-brand-400 font-semibold">{match.date}</span>
                  )}
                </div>

                {/* Match Scoreline / Match details */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  {/* Home Team */}
                  <div className="flex items-center gap-2">
                    {match.homeTeam.logo ? (
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <img
                          src={match.homeTeam.logo}
                          alt={match.homeTeam.shorthand}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { const el = e.currentTarget.parentElement; if (el) { el.style.display = 'none'; (el.nextElementSibling as HTMLElement)?.style.setProperty('display','flex'); } }}
                        />
                      </div>
                    ) : null}
                    <div
                      className="w-5 h-5 rounded items-center justify-center text-white text-[9px] font-bold shadow shrink-0"
                      style={{ backgroundColor: match.homeTeam.color, display: match.homeTeam.logo ? 'none' : 'flex' }}
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
                  <div className="px-2 py-1 text-center font-mono text-[11px] text-white min-w-[45px]">
                    {match.status === 'UPCOMING' ? (
                      <span className="text-[9px] text-white-400 font-sans tracking-tight">{match.time}</span>
                    ) : (
                      <span className="font-bold flex justify-center gap-1">
                        <span className={match.homeScore! > match.awayScore! ? 'text-brand-400' : 'text-slate-300'}>
                          {match.homeScore}
                        </span>
                        <span className="text-slate-600">-</span>
                        <span className={match.awayScore! > match.homeScore! ? 'text-brand-400' : 'text-slate-300'}>
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
                    {match.awayTeam.logo ? (
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <img
                          src={match.awayTeam.logo}
                          alt={match.awayTeam.shorthand}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { const el = e.currentTarget.parentElement; if (el) { el.style.display = 'none'; (el.nextElementSibling as HTMLElement)?.style.setProperty('display','flex'); } }}
                        />
                      </div>
                    ) : null}
                    <div
                      className="w-5 h-5 rounded items-center justify-center text-white text-[9px] font-bold shadow shrink-0"
                      style={{ backgroundColor: match.awayTeam.color, display: match.awayTeam.logo ? 'none' : 'flex' }}
                    >
                      {match.awayTeam.shorthand[0]}
                    </div>
                  </div>
                </div>

                {/* Stadium */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-850/60">
                  <span className="truncate max-w-[170px]">{match.venue}</span>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
