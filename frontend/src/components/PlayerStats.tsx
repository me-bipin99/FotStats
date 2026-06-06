import React, { useState } from 'react';
import { mockPlayers } from '../data/mockData';
import { Player } from '../types';
import { User, Award, Shield, Zap, TrendingUp, Search, Calendar, Heart, Share2, Star, Check } from 'lucide-react';

// Helper to identify female players in our Nepali and SAFF dataset
const isFemalePlayer = (player: Player) => {
  const femaleIds = ['samba', 'preeti', 'angela', 'gita', 'amisha'];
  const nameLower = player.name.toLowerCase();
  return (
    femaleIds.includes(player.id) ||
    nameLower.includes('sabitra') ||
    nameLower.includes('preeti') ||
    nameLower.includes('angela') ||
    nameLower.includes('gita rana') ||
    nameLower.includes('amisha')
  );
};

// Custom, highly-authentic athlete silhouette avatar matching both gender designs supplied by the user
const DummyPlayerAvatar = ({ className = "w-13 h-13", gender = "male" }: { className?: string; gender?: 'male' | 'female' }) => {
  if (gender === 'female') {
    return (
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
      >
        {/* Ponytail background hanging left */}
        <path d="M 23 48 C 17 55, 18 70, 24 75 C 30 80, 36 78, 36 68 C 36 58, 29 48, 23 48 Z" fill="#FF9F68" />
        
        {/* Neck skin */}
        <path d="M 44 58 C 44 67, 46 72, 50 72 C 54 72, 56 67, 56 58 Z" fill="#F4DFC8" />
        
        {/* Torso & Yellow Jersey */}
        <path d="M 14 92 C 18 73, 34 65, 50 65 C 66 65, 82 73, 86 92 Z" fill="#FFD966" />
        
        {/* V-collar insert in dark slate gray */}
        <path d="M 45 65 L 50 79 L 55 65 Z" fill="#4B4B54" />
        
        {/* Left and Right shoulder caps in dark grey/slate */}
        <path d="M 14 92 C 16 82, 21 76, 26 73 C 24 78, 22 85, 22 92 Z" fill="#4B4B54" />
        <path d="M 86 92 C 84 82, 79 76, 74 73 C 76 78, 78 85, 78 92 Z" fill="#4B4B54" />
        
        {/* Logo/Identity bar shape on right chest from female illustration tag */}
        <rect x="58" y="76" width="13" height="5.5" rx="2.5" fill="#4B4B54" />

        {/* Cute face skin */}
        <path d="M 28 38 C 28 48, 30 58, 50 58 C 70 58, 72 48, 72 38 C 72 28, 50 27, 50 27 C 50 27, 28 28, 28 38 Z" fill="#F4DFC8" />

        {/* Left & Right Ears */}
        <circle cx="27" cy="38" r="3.2" fill="#F4DFC8" />
        <circle cx="73" cy="38" r="3.2" fill="#F4DFC8" />

        {/* Beautiful peach-orange bangs hair swept cleanly */}
        <path d="M 27 34 
                 C 25 18, 33 11, 50 11 
                 C 67 11, 73 18, 73 34 
                 C 68 28, 62 25, 54 25 
                 C 46 25, 41 29, 35 28 
                 C 31 27, 29 30, 27 34 Z" fill="#FF9F68" />
        
        {/* Eyebrows matching peachy colors slightly darker */}
        <path d="M 37 29 Q 41 27 44 29" stroke="#E07A4A" strokeWidth="2" strokeLinecap="round" />
        <path d="M 56 29 Q 59 27 63 29" stroke="#E07A4A" strokeWidth="2" strokeLinecap="round" />

        {/* Eyes (dark slate) */}
        <circle cx="41" cy="34" r="2.8" fill="#4B4B54" />
        <circle cx="59" cy="34" r="2.8" fill="#4B4B54" />

        {/* Soft blushing cheeks */}
        <circle cx="34" cy="38" r="3" fill="#FF9F68" opacity="0.4" />
        <circle cx="66" cy="38" r="3" fill="#FF9F68" opacity="0.4" />

        {/* Cute happy curved smile mouth */}
        <path d="M 45 42 Q 50 46 55 42" stroke="#4B4B54" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  // DEFAULT / MALE DESIGN
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Skin neck */}
      <path d="M 43 56 C 43 65, 45 72, 50 72 C 55 72, 57 65, 57 56 Z" fill="#F4DFC8" />
      
      {/* Shoulders & Torso */}
      <path d="M 14 92 C 18 73, 34 61, 50 61 C 66 61, 82 73, 86 92 Z" fill="#3D85C6" />
      
      {/* Shoulder panels in light blue */}
      <path d="M 14 92 C 17 78, 28 68, 41 64 C 30 67, 20 78, 17 92 Z" fill="#9FC5F8" />
      <path d="M 86 92 C 83 78, 72 68, 59 64 C 70 67, 80 78, 83 92 Z" fill="#9FC5F8" />
      
      {/* Light Blue Collar matching structural lines */}
      <path d="M 41 61 C 44 68, 56 68, 59 61" fill="none" stroke="#9FC5F8" strokeWidth="3.2" strokeLinecap="round" />
      
      {/* Left-chest circular logo badge */}
      <circle cx="65" cy="78" r="4.5" fill="#9FC5F8" />
      
      {/* Rounded skin head */}
      <path d="M 30 36 C 30 46, 32 58, 50 58 C 68 58, 70 46, 70 36 C 70 26, 50 25, 50 25 C 50 25, 30 26, 30 36 Z" fill="#F4DFC8" />
      
      {/* Smooth symmetry ears */}
      <path d="M 28 35 C 28 38, 30 40, 30 35" stroke="#F4DFC8" strokeWidth="2" strokeLinecap="round" />
      <path d="M 72 35 C 72 38, 70 40, 70 35" stroke="#F4DFC8" strokeWidth="2" strokeLinecap="round" />

      {/* Smooth matching swept brown hair precisely conforming to the original attachment shape */}
      <path d="M 29 33 
               C 28 21, 35 12, 50 11 
               C 65 10, 71 21, 71 30 
               C 70 24, 66 18, 58 18 
               C 52 18, 48 24, 40 23 
               C 34 22, 32 27, 29 33 Z" fill="#C5A484" />
      
      {/* Dark eyebrows */}
      <path d="M 38 29 Q 41 27.5 44 29" stroke="#9A7B5F" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 56 29 Q 59 27.5 62 29" stroke="#9A7B5F" strokeWidth="1.8" strokeLinecap="round" />

      {/* Eyes (dark slate) */}
      <circle cx="41" cy="34" r="2.5" fill="#2d3748" />
      <circle cx="59" cy="34" r="2.5" fill="#2d3748" />

      {/* Cute smile */}
      <path d="M 45 42 Q 50 45 55 42" stroke="#2d3748" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
};

export default function PlayerStats() {
  const allPlayers = Object.values(mockPlayers);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(allPlayers[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MEN' | 'WOMEN'>('ALL');

  const selectedPlayer = allPlayers.find(p => p.id === selectedPlayerId) || allPlayers[0];

  // Helper to determine gender category
  const getPlayerCategory = (p: Player) => {
    const womensList = ['samba', 'preeti', 'angela', 'gita', 'amisha'];
    return womensList.includes(p.id) ? 'WOMEN' : 'MEN';
  };

  const filteredPlayers = allPlayers.filter(p => {
    // Category match
    if (genderFilter !== 'ALL' && getPlayerCategory(p) !== genderFilter) return false;
    
    // Search match
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q) || p.positionDetail.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* SIDEBAR: Player List & Selector */}
      <div className="bg-[#151619] border border-[#202124] rounded-xl p-4 flex flex-col h-[650px]">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-200 tracking-wider uppercase mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Nepalese Stars Directory</span>
          </h4>
          
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search star... (e.g. Kiran, Samba)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-250 outline-none placeholder:text-slate-600 transition"
            />
          </div>

          {/* Gender Filter Tabs */}
          <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-bold">
            {(['ALL', 'MEN', 'WOMEN'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setGenderFilter(cat)}
                className={`flex-1 py-1 text-center rounded transition ${
                  genderFilter === cat
                    ? 'bg-emerald-500 text-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat === 'MEN' ? "Men's Star" : "Women's Star"}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 scrollbar-thin scrollbar-thumb-slate-850">
          {filteredPlayers.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              <p className="text-xs">No stars match your query</p>
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const isSelected = player.id === selectedPlayerId;
              const isWomen = getPlayerCategory(player) === 'WOMEN';

              return (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(player.id)}
                  className={`w-full text-left p-3 flex items-center justify-between transition-all duration-150 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-r-2 border-emerald-400'
                      : 'hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Visual Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-end justify-center shrink-0 overflow-hidden relative ${
                      isWomen 
                        ? 'bg-gradient-to-b from-pink-900/60 to-pink-950 border border-pink-500/15' 
                        : 'bg-gradient-to-b from-emerald-900/60 to-emerald-950 border border-emerald-500/15'
                    }`}>
                      <DummyPlayerAvatar className="w-[95%] h-[95%] absolute bottom-0 object-contain" gender={isWomen ? 'female' : 'male'} />
                    </div>
                    
                    <div className="truncate">
                      <p className={`text-xs font-semibold ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {player.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {player.positionDetail} &bull; {player.club}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] font-bold text-slate-400">
                    OVR {player.rating}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* DETAIL WORKSPACE: Profile Page & Attributes breakdown */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Profile Card & Bio Header */}
        <div className="bg-[#151619] border border-[#202124] rounded-xl p-5 md:p-6 overflow-hidden relative shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl border-2 flex items-end justify-center shadow-lg overflow-hidden relative ${
                isFemalePlayer(selectedPlayer)
                  ? 'bg-gradient-to-tr from-pink-950 to-pink-900/60 border-pink-500/30'
                  : 'bg-gradient-to-tr from-[#0b241a] to-[#04120c] border-emerald-500/20'
              }`}>
                <DummyPlayerAvatar className="w-[88%] h-[88%] absolute bottom-0 object-contain drop-shadow" gender={isFemalePlayer(selectedPlayer) ? 'female' : 'male'} />
              </div>
              
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-sans font-bold text-lg text-white leading-tight">
                    {selectedPlayer.name}
                  </h3>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase">
                    No. {selectedPlayer.number}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-400">{selectedPlayer.positionDetail}</span>
                  <span className="text-slate-600">&bull;</span>
                  <span>{selectedPlayer.club}</span>
                </p>
              </div>
            </div>

            {/* Quick Rating Circle */}
            <div className="bg-[#0C1E14] border border-emerald-900/60 px-4 py-2.5 rounded-xl text-center self-start sm:self-auto shadow-md">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-0.5">Rating</span>
              <span className="text-xl font-mono font-black text-emerald-400 block leading-none">
                {selectedPlayer.rating}
              </span>
            </div>
          </div>

          {/* Biometrics List Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-5">
            <div className="bg-slate-900/35 border border-slate-850/50 p-3 rounded-lg text-center">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Age</span>
              <span className="text-sm font-mono font-bold text-slate-100">{selectedPlayer.age} Years</span>
            </div>
            
            <div className="bg-slate-900/35 border border-slate-850/50 p-3 rounded-lg text-center">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Height</span>
              <span className="text-sm font-mono font-bold text-slate-100">{selectedPlayer.height}</span>
            </div>

            <div className="bg-slate-900/35 border border-slate-850/50 p-3 rounded-lg text-center">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Foot</span>
              <span className="text-sm font-bold text-slate-100">{selectedPlayer.preferredFoot}</span>
            </div>

            <div className="bg-slate-900/35 border border-slate-850/50 p-3 rounded-lg text-center">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Est. Value</span>
              <span className="text-sm font-mono font-bold text-amber-500">{selectedPlayer.marketValue}</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics & Numerical attributes block */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
          
          {/* Attributes breakdown bar charts column */}
          <div className="sm:col-span-3 bg-[#151619] border border-[#202124] rounded-xl p-5 md:p-6 shadow-xl space-y-4">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Attributes Profile Matrix</span>
            </h4>
            
            <div className="space-y-3.5">
              {Object.entries(selectedPlayer.attributes).map(([attr, val]) => {
                // capitalize attribute
                const label = attr.toUpperCase();
                return (
                  <div key={attr} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-400">{label}</span>
                      <span className="font-mono font-bold text-slate-100">{val} / 100</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850/40">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical stats, caps, card and accolades tally */}
          <div className="sm:col-span-2 bg-[#151619] border border-[#202124] rounded-xl p-5 md:p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Career Dashboard</span>
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                  <span className="text-xs text-slate-500">Matches (Caps)</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{selectedPlayer.matchesPlayed} games</span>
                </div>
                
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                  <span className="text-xs text-slate-500">Goals Scored</span>
                  <span className="text-xs font-mono font-extrabold text-emerald-400">{selectedPlayer.goals} Goals</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                  <span className="text-xs text-slate-500">Assists Delivered</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{selectedPlayer.assists} Assists</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                  <span className="text-xs text-slate-500">Discipline</span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {selectedPlayer.yellowCards} 🟨 / {selectedPlayer.redCards} 🟥
                  </span>
                </div>
              </div>
            </div>

            {/* Accolade teaser sentence customized by player position */}
            <div className="pt-4 mt-4 border-t border-slate-800/60">
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                <p className="text-[10.5px] italic text-slate-400 hover:text-slate-350 transition leading-relaxed">
                  {selectedPlayer.position === 'FW' && (
                    <span>Known for signature counter-attack speeds and explosive box transitions, {selectedPlayer.name} serves as a pivotal spearhead for both {selectedPlayer.club} and the Gorkhali squad.</span>
                  )}
                  {selectedPlayer.position === 'MF' && (
                    <span>Exhibiting sharp tactical passing and field control options, {selectedPlayer.name} acts as a vital transition axis on high-press scenarios.</span>
                  )}
                  {selectedPlayer.position === 'DF' && (
                    <span>With premium physical endurance and clean clearances, {selectedPlayer.name} represents a rock-steady protective shield at the back.</span>
                  )}
                  {selectedPlayer.position === 'GK' && (
                    <span>A captaincy leader showing stellar reflexes, holding an elite stats level in organizing tight low-block defenses.</span>
                  )}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
