import React, { useState } from 'react';
import { mockPlayers } from '../data/mockData';
import { Player } from '../types';
import { Sparkles, RefreshCw, Layers, Plus, X, Search, ShieldAlert, BadgeCheck, Save, Clipboard, ChevronDown } from 'lucide-react';

interface PositionSlot {
  id: number;
  label: string;
  role: 'GK' | 'DF' | 'MF' | 'FW';
  x: number; // coordinates relative to pitch container
  y: number;
}

const FORMATIONS: Record<string, PositionSlot[]> = {
  '4-3-3': [
    { id: 1, label: 'GK', role: 'GK', x: 8, y: 50 },
    { id: 2, label: 'LB', role: 'DF', x: 26, y: 15 },
    { id: 3, label: 'LCB', role: 'DF', x: 22, y: 36 },
    { id: 4, label: 'RCB', role: 'DF', x: 22, y: 64 },
    { id: 5, label: 'RB', role: 'DF', x: 26, y: 85 },
    { id: 6, label: 'LCM', role: 'MF', x: 48, y: 28 },
    { id: 7, label: 'CM', role: 'MF', x: 44, y: 50 },
    { id: 8, label: 'RCM', role: 'MF', x: 48, y: 72 },
    { id: 9, label: 'LW', role: 'FW', x: 74, y: 18 },
    { id: 10, label: 'ST', role: 'FW', x: 82, y: 50 },
    { id: 11, label: 'RW', role: 'FW', x: 74, y: 82 },
  ],
  '4-4-2': [
    { id: 1, label: 'GK', role: 'GK', x: 8, y: 50 },
    { id: 2, label: 'LB', role: 'DF', x: 26, y: 15 },
    { id: 3, label: 'LCB', role: 'DF', x: 22, y: 36 },
    { id: 4, role: 'DF', y: 64, x: 22, label: 'RCB' },
    { id: 5, label: 'RB', role: 'DF', x: 26, y: 85 },
    { id: 6, label: 'LM', role: 'MF', x: 48, y: 15 },
    { id: 7, label: 'LCM', role: 'MF', x: 46, y: 38 },
    { id: 8, label: 'RCM', role: 'MF', x: 46, y: 62 },
    { id: 9, label: 'RM', role: 'MF', x: 48, y: 85 },
    { id: 10, label: 'LST', role: 'FW', x: 80, y: 35 },
    { id: 11, label: 'RST', role: 'FW', x: 80, y: 65 },
  ],
  '3-5-2': [
    { id: 1, label: 'GK', role: 'GK', x: 8, y: 50 },
    { id: 2, label: 'LCB', role: 'DF', x: 22, y: 24 },
    { id: 3, label: 'CB', role: 'DF', x: 20, y: 50 },
    { id: 4, label: 'RCB', role: 'DF', x: 22, y: 76 },
    { id: 5, label: 'LWB', role: 'MF', x: 46, y: 14 },
    { id: 6, label: 'LCM', role: 'MF', x: 48, y: 34 },
    { id: 7, label: 'DM', role: 'MF', x: 42, y: 50 },
    { id: 8, label: 'RCM', role: 'MF', x: 48, y: 66 },
    { id: 9, label: 'RWB', role: 'MF', x: 46, y: 86 },
    { id: 10, label: 'LST', role: 'FW', x: 80, y: 35 },
    { id: 11, label: 'RST', role: 'FW', x: 80, y: 65 },
  ],
  '4-2-3-1': [
    { id: 1, label: 'GK', role: 'GK', x: 8, y: 50 },
    { id: 2, label: 'LB', role: 'DF', x: 26, y: 15 },
    { id: 3, label: 'LCB', role: 'DF', x: 22, y: 36 },
    { id: 4, label: 'RCB', role: 'DF', x: 22, y: 64 },
    { id: 5, label: 'RB', role: 'DF', x: 26, y: 85 },
    { id: 6, label: 'LDM', role: 'MF', x: 44, y: 33 },
    { id: 7, label: 'RDM', role: 'MF', x: 44, y: 67 },
    { id: 8, label: 'LM', role: 'MF', x: 62, y: 18 },
    { id: 9, label: 'CAM', role: 'MF', x: 60, y: 50 },
    { id: 10, label: 'RM', role: 'MF', x: 62, y: 82 },
    { id: 11, label: 'ST', role: 'FW', x: 82, y: 50 },
  ],
  '3-4-3': [
    { id: 1, label: 'GK', role: 'GK', x: 8, y: 50 },
    { id: 2, label: 'LCB', role: 'DF', x: 22, y: 25 },
    { id: 3, label: 'CB', role: 'DF', x: 20, y: 50 },
    { id: 4, label: 'RCB', role: 'DF', x: 22, y: 75 },
    { id: 5, label: 'LM', role: 'MF', x: 46, y: 15 },
    { id: 6, label: 'LCM', role: 'MF', x: 48, y: 36 },
    { id: 7, label: 'RCM', role: 'MF', x: 48, y: 64 },
    { id: 8, label: 'RM', role: 'MF', x: 46, y: 85 },
    { id: 9, label: 'LW', role: 'FW', x: 74, y: 20 },
    { id: 10, label: 'ST', role: 'FW', x: 82, y: 50 },
    { id: 11, label: 'RW', role: 'FW', x: 74, y: 80 },
  ],
  '4-5-1': [
    { id: 1, label: 'GK', role: 'GK', x: 8, y: 50 },
    { id: 2, label: 'LB', role: 'DF', x: 26, y: 15 },
    { id: 3, label: 'LCB', role: 'DF', x: 22, y: 36 },
    { id: 4, label: 'RCB', role: 'DF', x: 22, y: 64 },
    { id: 5, label: 'RB', role: 'DF', x: 26, y: 85 },
    { id: 6, label: 'LM', role: 'MF', x: 50, y: 15 },
    { id: 7, label: 'LCM', role: 'MF', x: 46, y: 33 },
    { id: 8, label: 'CM', role: 'MF', x: 42, y: 50 },
    { id: 9, label: 'RCM', role: 'MF', x: 46, y: 67 },
    { id: 10, label: 'RM', role: 'MF', x: 50, y: 85 },
    { id: 11, label: 'ST', role: 'FW', x: 82, y: 50 },
  ],
};

export default function LineupBuilder() {
  const [activeFormation, setActiveFormation] = useState<string>('4-3-3');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [assignedPlayers, setAssignedPlayers] = useState<Record<number, Player>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const activeSlots = FORMATIONS[activeFormation];
  const allPlayers = Object.values(mockPlayers);

  const handleSelectSlot = (slotId: number) => {
    setSelectedSlotId(slotId);
  };

  const handleAssignPlayer = (player: Player) => {
    if (selectedSlotId === null) return;
    
    // check if player is already assigned to a different slot and remove it to prevent duplicates
    const duplicateSlotEntry = Object.entries(assignedPlayers).find(([_, p]) => (p as Player).id === player.id);
    const updated = { ...assignedPlayers };
    if (duplicateSlotEntry) {
      delete updated[Number(duplicateSlotEntry[0])];
    }

    updated[selectedSlotId] = player;
    setAssignedPlayers(updated);
    setSelectedSlotId(null);
    setSearchQuery('');
  };

  const handleClearSlot = (slotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...assignedPlayers };
    delete updated[slotId];
    setAssignedPlayers(updated);
  };

  const handleResetLineup = () => {
    setAssignedPlayers({});
    setSelectedSlotId(null);
  };

  // Pre-fill default popular ones so it's not totally blank initially
  const handleLoadDefaults = () => {
    const defaults: Record<number, Player> = {};
    const guys = [
      mockPlayers.kiran, // id: 1 (GK)
      mockPlayers.sanisch, // id: 2 (LB)
      mockPlayers.ananta, // id: 3 (LCB)
      mockPlayers.devendra, // id: 4 (RCB)
      mockPlayers.rohit, // id: 5 (RB)
      mockPlayers.arik, // id: 6 (LCM)
      mockPlayers.laken, // id: 7 (CM)
      mockPlayers.preeti, // id: 8 (RCM)
      mockPlayers.samba, // id: 9 (LW)
      mockPlayers.anjan, // id: 10 (ST)
      mockPlayers.ayush, // id: 11 (RW)
    ];

    guys.forEach((g, idx) => {
      if (g) {
        defaults[idx + 1] = g;
      }
    });

    setAssignedPlayers(defaults);
    triggerAlert('Gorkhali Stars XI draft applied!');
  };

  const triggerAlert = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Stats calculation
  const assignedList = Object.values(assignedPlayers) as Player[];
  const averageRating = assignedList.length > 0 
    ? (assignedList.reduce((sum, p) => sum + p.rating, 0) / assignedList.length).toFixed(1)
    : '0.0';

  const squadValue = assignedList.length > 0
    ? `€${(assignedList.reduce((sum, p) => {
        const val = parseFloat(p.marketValue.replace(/€|k/g, '')) || 0;
        return sum + val;
      }, 0) / 10).toFixed(1)}M`
    : '€0.0M';

  const synergyRating = assignedList.length > 0 
    ? Math.min(100, Math.round((assignedList.length / 11) * 35 + (parseFloat(averageRating) || 0) * 8.1))
    : 0;

  // Filter available players to assign
  const activeSlotRole = selectedSlotId !== null ? activeSlots.find(s => s.id === selectedSlotId)?.role : null;
  const filteredPlayers = allPlayers.filter(p => {
    // Only match position role of slot if needed, or allow selecting anybody
    if (activeSlotRole && p.position !== activeSlotRole) {
      // e.g. let users pick defenders for DF, midfielders for MF, but search filter is most useful
    }
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q) || p.position.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">

      {showNotification && (
        <div className="bg-emerald-950/40 border border-emerald-500/35 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-400 animate-slide-in">
          <BadgeCheck className="w-4 h-4 shrink-0" />
          <span>{showNotification}</span>
        </div>
      )}

      {/* Main Pitch view & selector split - Larger Pitch Column allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] xl:grid-cols-[1.65fr_1fr] gap-6 items-stretch">
        
        {/* Pitch Canvas container */}
        <div className="bg-[#151619] border border-[#202124] rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
          
          {/* Controls Bar */}
          <div className="w-full flex justify-between items-center bg-slate-950 border border-slate-850 p-3 rounded-xl mb-6 z-10 gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Formation:</span>
              <div className="relative">
                <select
                  value={activeFormation}
                  onChange={(e) => { setActiveFormation(e.target.value); setAssignedPlayers({}); }}
                  className="bg-[#0c0d12] border border-slate-800 hover:border-emerald-500/50 text-slate-100 font-extrabold text-xs px-3.5 py-1.5 pr-9 rounded-xl appearance-none outline-none cursor-pointer transition duration-200"
                >
                  {Object.keys(FORMATIONS).map((form) => (
                    <option key={form} value={form} className="bg-slate-950 text-slate-200 font-bold">
                      {form}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Actions defaults reset */}
            <div className="flex gap-2 text-xs">
              <button 
                onClick={handleLoadDefaults}
                className="bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-slate-800/80 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Gorkhali XI</span>
              </button>

              <button 
                onClick={handleResetLineup}
                className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-850 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Draft</span>
              </button>
            </div>
          </div>

          {/* VIRTUAL PITCH - Enlarged dimensions */}
          <div className="relative w-full max-w-[880px] aspect-[100/62] bg-[#0c1c11] border-4 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-radial-gradient">
            {/* Texture Pitch Lines */}
            <div className="absolute inset-x-0 inset-y-0 opacity-15 pointer-events-none border-x border-dashed border-white/40" />
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 -translate-x-1/2 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-28 h-28 border-2 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            {/* Goal Posts & Boxes */}
            <div className="absolute top-1/4 left-0 w-[12%] h-[50%] border-r border-y border-white/15 pointer-events-none" />
            <div className="absolute top-[40%] left-0 w-[4%] h-[20%] border-r border-y border-white/15 pointer-events-none" />
            <div className="absolute top-[48%] -left-1 w-[4px] h-[4%] bg-slate-400/50 rounded pointer-events-none" />

            <div className="absolute top-1/4 right-0 w-[12%] h-[50%] border-l border-y border-white/15 pointer-events-none" />
            <div className="absolute top-[40%] right-0 w-[4%] h-[20%] border-l border-y border-white/15 pointer-events-none" />
            <div className="absolute top-[48%] -right-1 w-[4px] h-[4%] bg-slate-400/50 rounded pointer-events-none" />

            {/* Map Position Coordinates */}
            {activeSlots.map((slot) => {
              const assignedPlayer = assignedPlayers[slot.id];
              const isSelected = selectedSlotId === slot.id;

              return (
                <div
                  key={slot.id}
                  onClick={() => handleSelectSlot(slot.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition z-20 flex flex-col items-center"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  {assignedPlayer ? (
                    <div className="flex flex-col items-center">
                      {/* Football Star Bubble */}
                      <div className={`relative w-11 h-11 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center font-bold text-center text-xs md:text-sm shadow-xl transition overflow-hidden group-hover:scale-105 ${
                        isSelected 
                          ? 'bg-emerald-500 text-black border-white'
                          : assignedPlayer.id === 'samba' || assignedPlayer.id === 'preeti'
                          ? 'bg-gradient-to-br from-pink-650 to-pink-500 text-white border-pink-400'
                          : 'bg-gradient-to-br from-emerald-650 to-emerald-450 text-white border-emerald-400'
                      }`}>
                        
                        {/* Jersey Number overlay */}
                        <span className="font-extrabold drop-shadow">
                          {assignedPlayer.number}
                        </span>

                        {/* rating pill */}
                        <span className="absolute -bottom-1 tracking-tighter text-[8px] font-mono font-black bg-black border border-slate-800 text-amber-400 px-1 rounded-full scale-90">
                          {assignedPlayer.rating}
                        </span>

                        {/* Top right remove handle on hover */}
                        <button 
                          onClick={(e) => handleClearSlot(slot.id, e)}
                          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 hover:scale-110 bg-black/80 rounded-full p-1 text-red-400 border border-red-500/20 transition duration-150"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Small Text tag */}
                      <span className="bg-slate-950/85 border border-slate-850 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-100 mt-1 shadow-md max-w-[85px] truncate font-sans text-center block">
                        {assignedPlayer.name.split(' ').pop()}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      {/* Empty Plus Slot bubble */}
                      <div className={`w-10 h-10 rounded-full border border-dashed flex items-center justify-center transition ${
                        isSelected 
                          ? 'bg-emerald-500/20 border-emerald-450 scale-105 text-emerald-400 ring-2 ring-emerald-500/25'
                          : 'bg-slate-950/60 border-slate-650 hover:bg-slate-900 text-slate-400 hover:border-emerald-500/40'
                      }`}>
                        <Plus className="w-4 h-4 animate-pulse" />
                      </div>
                      
                      <span className="bg-slate-950/70 border border-slate-900 px-1 py-0.5 rounded text-[8.5px] font-mono tracking-wider font-extrabold text-slate-400 mt-1">
                        {slot.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR DRAFT SELECTOR PANEL */}
        <div className="bg-[#151619] border border-[#202124] rounded-2xl p-5 flex flex-col h-auto min-h-[550px] justify-between shadow-2xl relative">
          
          {selectedSlotId !== null ? (
            <div className="flex flex-col h-full justify-between">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">DRAFTING POSITION</span>
                    <h4 className="text-xs font-bold text-white">
                      Select player for: <span className="text-emerald-450">{activeSlots.find(s=>s.id === selectedSlotId)?.label}</span>
                    </h4>
                  </div>
                  <button 
                    onClick={() => setSelectedSlotId(null)}
                    className="p-1 hover:bg-slate-900 border border-slate-850 hover:text-white rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search filter input */}
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Type player name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto max-h-[350px] divide-y divide-slate-800/45 scrollbar-thin scrollbar-thumb-slate-850">
                  {filteredPlayers.length === 0 ? (
                    <div className="p-8 text-center text-slate-600">
                      <p className="text-xs">No star match</p>
                    </div>
                  ) : (
                    filteredPlayers.map((p) => {
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleAssignPlayer(p)}
                          className="w-full text-left p-2.5 hover:bg-slate-900/40 rounded transition flex items-center justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-100">{p.name}</p>
                            <p className="text-[9.5px] text-slate-500 truncate">{p.position} &bull; {p.club}</p>
                          </div>
                          <div className="font-mono text-xs font-bold text-emerald-450 uppercase shrink-0">
                            OVR {p.rating}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between gap-6 py-2">
              <div className="flex flex-col justify-center items-center text-center px-4 self-center my-auto">
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl mb-4 text-emerald-400">
                  <Clipboard className="w-8 h-8 text-emerald-400 mx-auto" />
                </div>
                <h5 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider font-sans">Tactics Dashboard Active</h5>
                <p className="text-xs text-slate-400 mt-2 max-w-[240px] leading-relaxed select-none">
                  Click on any post or plus node on the pitch to select and assign Gorkhali roster players.
                </p>
                
                <button 
                  onClick={handleLoadDefaults}
                  className="mt-5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold font-sans text-xs px-4.5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-150"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Fill Default Stars XI</span>
                </button>
              </div>

              {/* Gorkhali Synergy & Cohesion metrics placed below Tactics Dashboard Active */}
              <div className="border-t border-slate-800/80 pt-5 space-y-4">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase block text-center">Team Cohesion Analytics</span>
                
                {/* Team Synergy rating */}
                <div className="bg-slate-950/85 border border-slate-900 rounded-xl p-4 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-505/10 blur-xl rounded-full" />
                  <div className="flex justify-between items-center z-10 relative">
                    <span className="text-xs font-bold text-slate-350">Team Synergy Index</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">{synergyRating}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2.5 overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                      style={{ width: `${synergyRating}%` }}
                    />
                  </div>
                  <p className="text-[9.5px] text-slate-500 mt-1.5 leading-tight">
                    Upgraded dynamically by placing stars in key positions to activate tactical link compatibility.
                  </p>
                </div>

                {/* Assigned players and Value synergy counters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/85 border border-slate-900 p-3.5 rounded-xl text-center shadow-inner">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-wider leading-none">Roster Depth</span>
                    <span className="text-base font-extrabold text-slate-200 font-mono">{assignedList.length} / 11</span>
                    <span className="text-[9px] text-slate-500 block font-sans mt-1">Placed Guys</span>
                  </div>

                  <div className="bg-slate-950/85 border border-slate-900 p-3.5 rounded-xl text-center shadow-inner">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-wider leading-none">Market Worth</span>
                    <span className="text-base font-extrabold text-amber-500 font-mono">{squadValue}</span>
                    <span className="text-[9px] text-slate-500 block font-sans mt-1">Total Valuation</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
