import { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { getPlayers } from '../services/api';
import { User, Award, Zap, Search } from 'lucide-react';
import { getCountryDisplay } from '../utils/nationality';

const DummyPlayerAvatar = ({ className = "w-13 h-13", gender = "male" }: { className?: string; gender?: 'male' | 'female' }) => {
  if (gender === 'female') {
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M 23 48 C 17 55, 18 70, 24 75 C 30 80, 36 78, 36 68 C 36 58, 29 48, 23 48 Z" fill="#FF9F68" />
        <path d="M 44 58 C 44 67, 46 72, 50 72 C 54 72, 56 67, 56 58 Z" fill="#F4DFC8" />
        <path d="M 14 92 C 18 73, 34 65, 50 65 C 66 65, 82 73, 86 92 Z" fill="#FFD966" />
        <path d="M 45 65 L 50 79 L 55 65 Z" fill="#4B4B54" />
        <path d="M 14 92 C 16 82, 21 76, 26 73 C 24 78, 22 85, 22 92 Z" fill="#4B4B54" />
        <path d="M 86 92 C 84 82, 79 76, 74 73 C 76 78, 78 85, 78 92 Z" fill="#4B4B54" />
        <rect x="58" y="76" width="13" height="5.5" rx="2.5" fill="#4B4B54" />
        <path d="M 28 38 C 28 48, 30 58, 50 58 C 70 58, 72 48, 72 38 C 72 28, 50 27, 50 27 C 50 27, 28 28, 28 38 Z" fill="#F4DFC8" />
        <circle cx="27" cy="38" r="3.2" fill="#F4DFC8" />
        <circle cx="73" cy="38" r="3.2" fill="#F4DFC8" />
        <path d="M 27 34 C 25 18, 33 11, 50 11 C 67 11, 73 18, 73 34 C 68 28, 62 25, 54 25 C 46 25, 41 29, 35 28 C 31 27, 29 30, 27 34 Z" fill="#FF9F68" />
        <path d="M 37 29 Q 41 27 44 29" stroke="#E07A4A" strokeWidth="2" strokeLinecap="round" />
        <path d="M 56 29 Q 59 27 63 29" stroke="#E07A4A" strokeWidth="2" strokeLinecap="round" />
        <circle cx="41" cy="34" r="2.8" fill="#4B4B54" />
        <circle cx="59" cy="34" r="2.8" fill="#4B4B54" />
        <circle cx="34" cy="38" r="3" fill="#FF9F68" opacity="0.4" />
        <circle cx="66" cy="38" r="3" fill="#FF9F68" opacity="0.4" />
        <path d="M 45 42 Q 50 46 55 42" stroke="#4B4B54" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M 43 56 C 43 65, 45 72, 50 72 C 55 72, 57 65, 57 56 Z" fill="#F4DFC8" />
      <path d="M 14 92 C 18 73, 34 61, 50 61 C 66 61, 82 73, 86 92 Z" fill="#3D85C6" />
      <path d="M 14 92 C 17 78, 28 68, 41 64 C 30 67, 20 78, 17 92 Z" fill="#9FC5F8" />
      <path d="M 86 92 C 83 78, 72 68, 59 64 C 70 67, 80 78, 83 92 Z" fill="#9FC5F8" />
      <path d="M 41 61 C 44 68, 56 68, 59 61" fill="none" stroke="#9FC5F8" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="65" cy="78" r="4.5" fill="#9FC5F8" />
      <path d="M 30 36 C 30 46, 32 58, 50 58 C 68 58, 70 46, 70 36 C 70 26, 50 25, 50 25 C 50 25, 30 26, 30 36 Z" fill="#F4DFC8" />
      <path d="M 28 35 C 28 38, 30 40, 30 35" stroke="#F4DFC8" strokeWidth="2" strokeLinecap="round" />
      <path d="M 72 35 C 72 38, 70 40, 70 35" stroke="#F4DFC8" strokeWidth="2" strokeLinecap="round" />
      <path d="M 29 33 C 28 21, 35 12, 50 11 C 65 10, 71 21, 71 30 C 70 24, 66 18, 58 18 C 52 18, 48 24, 40 23 C 34 22, 32 27, 29 33 Z" fill="#C5A484" />
      <path d="M 38 29 Q 41 27.5 44 29" stroke="#9A7B5F" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 56 29 Q 59 27.5 62 29" stroke="#9A7B5F" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="41" cy="34" r="2.5" fill="#2d3748" />
      <circle cx="59" cy="34" r="2.5" fill="#2d3748" />
      <path d="M 45 42 Q 50 45 55 42" stroke="#2d3748" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
};

export default function PlayerStats() {
  const [players, setPlayers] = useState<(Player & { gender?: 'M' | 'F' })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MEN' | 'WOMEN'>('ALL');
  const [displayPlayer, setDisplayPlayer] = useState<(Player & { gender?: 'M' | 'F' }) | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPlayers = (search: string, gender: 'ALL' | 'MEN' | 'WOMEN') => {
    setLoading(true);
    const gParam = gender === 'MEN' ? 'M' : gender === 'WOMEN' ? 'F' : undefined;
    const sourceParam: 'nepali' | undefined = gender !== 'ALL' ? 'nepali' : undefined;
    getPlayers({ search: search || undefined, gender: gParam, source: sourceParam, limit: 100 })
      .then(({ players: fetched }) => {
        setPlayers(fetched);
        if (!selectedPlayerId && fetched.length > 0) setSelectedPlayerId(fetched[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlayers('', 'ALL');
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchPlayers(searchQuery, genderFilter), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery, genderFilter]);

  const currentPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];

  useEffect(() => {
    if (currentPlayer) setDisplayPlayer(currentPlayer);
  }, [currentPlayer]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* Sidebar */}
      <div className="bg-[#151619] border border-[#202124] rounded-xl p-4 flex flex-col h-[650px]">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-200 tracking-wider uppercase mb-3 flex items-center gap-2">
            
            <span>Football Stars Directory</span>
          </h4>

          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search star... (e.g. Kiran, Bista)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-300 outline-none placeholder:text-slate-600 transition"
            />
          </div>

          <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-bold">
            {(['ALL', 'MEN', 'WOMEN'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setGenderFilter(cat)}
                className={`flex-1 py-1 text-center rounded transition ${
                  genderFilter === cat ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat === 'MEN' ? "Nep Men's" : "Nep W"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 scrollbar-thin scrollbar-thumb-slate-850">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs animate-pulse">Loading players…</div>
          ) : players.length === 0 ? (
            <div className="p-8 text-center text-slate-600"><p className="text-xs">No stars match your query</p></div>
          ) : (
            players.map((player) => {
              const isSelected = player.id === selectedPlayerId;
              const isWomen = (player as any).gender === 'F';
              return (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(player.id)}
                  className={`w-full text-left p-3 flex items-center justify-between transition-all duration-150 ${
                    isSelected ? 'bg-brand-500/10 border-r-2 border-brand-400' : 'hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-end justify-center shrink-0 overflow-hidden relative ${
                      isWomen
                        ? 'bg-gradient-to-b from-pink-900/60 to-pink-950 border border-pink-500/15'
                        : 'bg-gradient-to-b from-brand-900/60 to-brand-950 border border-brand-500/15'
                    }`}>
                      <DummyPlayerAvatar className="w-[95%] h-[95%] absolute bottom-0 object-contain" gender={isWomen ? 'female' : 'male'} />
                    </div>
                    <div className="truncate">
                      <p className={`text-xs font-semibold ${isSelected ? 'text-brand-400' : 'text-slate-200'}`}>{player.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {player.position} &bull; {getCountryDisplay(player.nationality).flag} {getCountryDisplay(player.nationality).code}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-400">OVR {player.rating}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail workspace */}
      {!displayPlayer ? (
        <div className="md:col-span-2 bg-[#151619] border border-[#202124] rounded-xl flex items-center justify-center min-h-75">
          <p className="text-sm text-slate-500">No player available for that name</p>
        </div>
      ) : (
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#151619] border border-[#202124] rounded-xl p-5 md:p-6 overflow-hidden relative shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" /> {/* unslop-ignore: decorative blur orb, meant to be circular */}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl border-2 flex items-end justify-center shadow-lg overflow-hidden relative ${
                  (displayPlayer as any).gender === 'F'
                    ? 'bg-gradient-to-tr from-pink-950 to-pink-900/60 border-pink-500/30'
                    : 'bg-gradient-to-tr from-[#0a1830] to-[#0a0e16] border-brand-500/20'
                }`}>
                  <DummyPlayerAvatar className="w-[88%] h-[88%] absolute bottom-0 object-contain drop-shadow" gender={(displayPlayer as any).gender === 'F' ? 'female' : 'male'} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-sans font-bold text-lg text-white leading-tight">{displayPlayer.name}</h3>
                    <span className="bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase">
                      {displayPlayer.position}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <span className="font-semibold text-brand-400">{displayPlayer.positionDetail}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span>{displayPlayer.club}</span>
                  </p>
                </div>
              </div>
              <div className="bg-[#0a1424] border border-brand-900/60 px-4 py-2.5 rounded-xl text-center self-start sm:self-auto shadow-md">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-0.5">Rating</span>
                <span className="text-xl font-mono font-black text-brand-400 block leading-none">{displayPlayer.rating}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-5 divide-x divide-slate-800/60 sm:divide-x">
              <div className="p-3 text-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Age</span>
                <span className="text-sm font-mono font-bold text-slate-100">{displayPlayer.age || '—'} {displayPlayer.age ? 'Years' : ''}</span>
              </div>
              <div className="p-3 text-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Nationality</span>
                {(() => {
                  const { flag, code } = getCountryDisplay(displayPlayer.nationality);
                  return (
                    <span className="text-sm font-bold text-slate-100 flex items-center justify-center gap-1.5">
                      <span>{flag}</span><span className="font-mono">{code}</span>
                    </span>
                  );
                })()}
              </div>
              <div className="p-3 text-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Foot</span>
                <span className="text-sm font-bold text-slate-100">{displayPlayer.preferredFoot}</span>
              </div>
              <div className="p-3 text-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Height</span>
                <span className="text-sm font-mono font-bold text-slate-100">{displayPlayer.height}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
            <div className="sm:col-span-3 bg-[#151619] border border-[#202124] rounded-xl p-5 md:p-6 shadow-xl space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                
                <span>Attributes Profile Matrix</span>
              </h4>
              <div className="space-y-3.5">
                {Object.entries(displayPlayer.attributes).map(([attr, val]) => (
                  <div key={attr} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-400">{attr.toUpperCase()}</span>
                      <span className="font-mono font-bold text-slate-100">{val} / 100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850/40">
                      <div className="h-full bg-amber-600 rounded-full transition-all duration-300" style={{ width: `${val}%` }} /> {/* unslop-ignore: progress-bar fill, conventional fully-rounded caps */}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 bg-[#151619] border border-[#202124] rounded-xl p-5 md:p-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  
                  <span>Career Dashboard</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                    <span className="text-xs text-slate-500">Matches (Caps)</span>
                    <span className="text-xs font-mono font-bold text-slate-200">{displayPlayer.matchesPlayed} games</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                    <span className="text-xs text-slate-500">Goals Scored</span>
                    <span className="text-xs font-mono font-extrabold text-brand-400">{displayPlayer.goals} Goals</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                    <span className="text-xs text-slate-500">Assists Delivered</span>
                    <span className="text-xs font-mono font-bold text-slate-200">{displayPlayer.assists} Assists</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                    <span className="text-xs text-slate-500">Discipline</span>
                    <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                      <span className="w-2 h-2.5 bg-amber-500 rounded-sm shadow-sm" /> {displayPlayer.yellowCards}
                      <span className="w-2 h-2.5 bg-rose-600 rounded-sm shadow-sm ml-1.5" /> {displayPlayer.redCards}
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-800/60">
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                  <p className="text-[10.5px] italic text-slate-400 leading-relaxed">
                    {displayPlayer.position === 'FW' && `Known for explosive attacking play, ${displayPlayer.name} serves as a pivotal spearhead for ${displayPlayer.club} and the Gorkhali squad.`}
                    {displayPlayer.position === 'MF' && `Exhibiting sharp tactical passing and field control, ${displayPlayer.name} acts as a vital transition axis on high-press scenarios.`}
                    {displayPlayer.position === 'DF' && `With premium physical endurance and clean clearances, ${displayPlayer.name} represents a rock-steady protective shield at the back.`}
                    {displayPlayer.position === 'GK' && `A captaincy leader showing stellar reflexes and organizing elite low-block defenses for ${displayPlayer.club}.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
