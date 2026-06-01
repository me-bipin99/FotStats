import React, { useState } from 'react';
import { mockPlayers } from '../data/mockData';
import { Player } from '../types';
import { User, Award, Shield, Zap, TrendingUp, Search, Calendar, Heart, Share2, Star, Check } from 'lucide-react';

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
                      ? 'bg-emerald-500/10 border-r-2 border-emerald-450'
                      : 'hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Visual Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isWomen 
                        ? 'bg-pink-950 text-pink-400 border border-pink-500/15' 
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-500/15'
                    }`}>
                      {player.name[0]}
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-emerald-500/20 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {selectedPlayer.name.split(' ').map(n=>n[0]).join('')}
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
                  <span className="text-xs font-mono font-extrabold text-emerald-450">{selectedPlayer.goals} Goals</span>
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
