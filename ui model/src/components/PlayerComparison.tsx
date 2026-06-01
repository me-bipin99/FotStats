import React, { useState } from 'react';
import { Player } from '../types';
import { mockPlayers, fillerPlayers } from '../data/mockData';
import { Plus, X, Search } from 'lucide-react';

interface PlayerComparisonProps {
  selectedPlayers: Player[];
  onSelectPlayer: (player: Player, slot: 'A' | 'B') => void;
  onClearSlot: (slot: 'A' | 'B') => void;
}

// Minimal Football Jersey Component
const SoccerJersey = ({ number, color = '#242936', accentColor = '#3a3f50' }: { number: number; color?: string; accentColor?: string }) => {
  return (
    <svg className="w-11 h-11 drop-shadow-xl select-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M30 15 L42 15 L45 22 L55 22 L58 15 L70 15 L82 28 L72 35 L72 85 L28 85 L28 35 L18 28 Z"
        fill={color}
        stroke={accentColor}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M18 28 L28 35" stroke={accentColor} strokeWidth="2.5" />
      <path d="M82 28 L72 35" stroke={accentColor} strokeWidth="2.5" />
      <text
        x="50"
        y="56"
        fill="#FFFFFF"
        fontSize="24"
        fontWeight="900"
        fontFamily="sans-serif"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {number}
      </text>
    </svg>
  );
};

// Custom, highly-authentic athlete silhouette avatar matching reference image
const DummyPlayerAvatar = ({ className = "w-13 h-13" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Torso/Shoulders with clean curved line and black fill */}
      <path 
        d="M 18 96 C 26 82, 38 72, 44 72 L 56 72 C 62 72, 74 82, 82 96 Z" 
        fill="#08090d" 
        stroke="#ffffff" 
        strokeWidth="2.2" 
      />
      
      {/* Double stripes on each shoulder matching reference athlete illustration */}
      <path d="M 23 93 L 39 76" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 29 94 L 43 79" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      
      <path d="M 77 93 L 61 76" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 71 94 L 57 79" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

      {/* Hexagon detailed shape on the left chest (user's perspective left) */}
      <polygon points="34,84 36.5,82 39,84 39,87 36.5,89 34,87" fill="#ffffff" />

      {/* Small circle shape on the right chest (user's perspective right) */}
      <circle cx="64" cy="85.5" r="2.8" fill="#ffffff" />

      {/* High crew collar with light inner highlight style */}
      <path 
        d="M 43 71.5 L 50 81.5 L 57 71.5" 
        stroke="#ffffff" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M 45 71.5 L 50 78.5 L 55 71.5" 
        stroke="#818cf8" 
        strokeWidth="1.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Neck */}
      <path 
        d="M 44.5 54 C 44.5 61, 45.5 68, 45.5 68 L 54.5 68 C 54.5 68, 55.5 61, 55.5 54" 
        fill="#ffffff" 
        stroke="#08090d" 
        strokeWidth="2" 
      />

      {/* Left and Right Ears */}
      <path d="M 38 48 C 35 48, 35 56, 38 56" fill="#ffffff" stroke="#08090d" strokeWidth="2" />
      <path d="M 62 48 C 65 48, 65 56, 62 56" fill="#ffffff" stroke="#08090d" strokeWidth="2" />

      {/* Face/Head base outline */}
      <path 
        d="M 38 48 C 38 60.5, 50 67.5, 50 67.5 C 50 67.5, 62 60.5, 62 48" 
        fill="#ffffff" 
        stroke="#08090d" 
        strokeWidth="2.2" 
        strokeLinejoin="round" 
      />

      {/* Hair outline conforming to clean jagged spiky style spikes */}
      <path 
        d="M 36.5 51 
           C 34.5 35, 42.5 21, 50 21
           C 57.5 21, 65.5 35, 63.5 51
           C 62.5 45, 58 39, 54.5 40
           C 51.5 44, 49.5 34, 45.5 35
           C 41 39, 39.5 43, 36.5 51 Z" 
        fill="#08090d" 
        stroke="#08090d" 
        strokeWidth="1" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

// Custom shape FIFA/FUT card widget matching the exact chevron-peak silhouette
const FUTCard = ({ player, borderGlowColor = '#5850ec' }: { player: Player; borderGlowColor?: string }) => {
  const ovr = Math.round(player.rating * 10);
  return (
    <div className="relative w-[154px] h-[210px] select-none scale-100 hover:scale-[1.02] transition duration-200 shrink-0">
      {/* Glow Backdrop */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none blur-md rounded-2xl"
        style={{
          clipPath: 'polygon(50% 0%, 100% 12%, 100% 78%, 50% 100%, 0% 78%, 0% 12%)',
          backgroundColor: borderGlowColor,
        }}
      />
      {/* Outer Border with Custom ClipPath */}
      <div 
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0%, 100% 12%, 100% 78%, 50% 100%, 0% 78%, 0% 12%)',
          backgroundColor: borderGlowColor,
        }}
      />
      {/* Inner Body Fill */}
      <div 
        className="absolute inset-[1.5px] bg-[#101114] flex flex-col items-center justify-between p-3 overflow-hidden"
        style={{
          clipPath: 'polygon(50% 0%, 100% 12%, 100% 78%, 50% 100%, 0% 78%, 0% 12%)',
        }}
      >
        {/* Hex backing grid / dark texture */}
        <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-slate-900/60 to-transparent pointer-events-none opacity-80" />
        
        {/* Badge header - OVR and Position */}
        <div className="w-full flex justify-between items-start z-10 pt-1 px-1">
          <div className="flex flex-col items-start leading-none font-mono">
            <span className="text-lg font-extrabold tracking-tighter text-white">{ovr}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">{player.position}</span>
          </div>
          <span className="text-sm">🇳🇵</span>
        </div>

        {/* Player silhouette portrait representing the athlete */}
        <div className="relative w-18 h-18 rounded-full border border-slate-900 bg-slate-950/80 flex items-center justify-center overflow-hidden shadow-inner z-10 mt-1">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 to-slate-950/80" />
          <DummyPlayerAvatar className="w-16 h-16 absolute bottom-0 translate-y-0.5" />
          <span className="text-[7.5px] text-slate-300 font-bold uppercase tracking-wider absolute bottom-1 font-mono z-20 bg-slate-950/90 px-1 py-0.5 rounded-sm leading-none border border-slate-900">NEP</span>
        </div>

        {/* Badge footer details */}
        <div className="w-full text-center z-10 bg-slate-950/90 border-t border-slate-900 pb-1.5 pt-1.5 rounded-b mt-1">
          <h4 className="text-xs font-black text-white leading-none truncate max-w-full px-0.5 uppercase">
            {player.name.split(' ').pop()}
          </h4>
          <span className="text-[8.5px] font-mono text-slate-400 block uppercase tracking-wider mt-1">
            {player.club.split(' ').shift()}
          </span>
        </div>
      </div>
    </div>
  );
};

// Symmetrical double-ended progress comparative bar
const DualComparativeBar = ({ 
  valA, 
  valB, 
  max = 100, 
  colorA = '#5850ec', // Beautiful custom indigo/blue
  colorB = '#e2e8f0'  // Gorgeous soft white/grey
}: { 
  valA: number; 
  valB: number; 
  max?: number; 
  colorA?: string; 
  colorB?: string; 
}) => {
  const pctA = Math.min(100, (valA / max) * 100);
  const pctB = Math.min(100, (valB / max) * 100);
  
  return (
    <div className="space-y-1 w-full">
      <div className="relative w-full h-[7px] bg-[#171a22] rounded-full flex items-center justify-between overflow-hidden">
        {/* Player A Progress (Filling left direction from divider) */}
        <div className="w-1/2 h-full flex justify-end pr-[0.8px]">
          <div className="h-full rounded-l" style={{ width: `${pctA}%`, backgroundColor: colorA }} />
        </div>
        {/* Center line separator */}
        <div className="w-[0.8px] h-full bg-[#0a0b0e] shrink-0" />
        {/* Player B Progress (Filling right direction from divider) */}
        <div className="w-1/2 h-full flex justify-start pl-[0.8px]">
          <div className="h-full rounded-r" style={{ width: `${pctB}%`, backgroundColor: colorB }} />
        </div>
      </div>
    </div>
  );
};

// Generates high-fidelity visual tactical heat spots based on on-field stats and position
const getHeatSpots = (player: Player) => {
  const p = player.position; // 'GK' | 'DF' | 'MF' | 'FW'
  const detail = (player.positionDetail || '').toUpperCase();
  const attributes = player.attributes || { pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50 };
  
  // Base attributes we can scale to affect heatmap density dynamically
  const shotScale = (attributes.shooting || 50) / 99;
  const paceScale = (attributes.pace || 50) / 99;
  const defScale = (attributes.defending || 50) / 99;
  const passScale = (attributes.passing || 50) / 99;

  if (p === 'GK') {
    return [
      { x: 14, y: 30, r: 14 + defScale * 6, color: '#10b981', o: 0.35 },
      { x: 10, y: 30, r: 9 + defScale * 4, color: '#fbbf24', o: 0.6 },
      { x: 7, y: 30, r: 5 + defScale * 3, color: '#ef4444', o: 0.8 },
    ];
  }

  if (p === 'FW') {
    const isWinger = detail.includes('WING') || detail.includes('LEFT') || detail.includes('RIGHT');
    if (isWinger) {
      const isLeft = detail.includes('LEFT') || player.preferredFoot === 'Left';
      const yVal = isLeft ? 14 : 46;
      return [
        { x: 55, y: yVal, r: 16 + paceScale * 8, color: '#10b981', o: 0.3 },
        { x: 74, y: yVal, r: 12 + paceScale * 6, color: '#fbbf24', o: 0.55 },
        { x: 84, y: yVal + (isLeft ? 4 : -4), r: 8 + shotScale * 6, color: '#ef4444', o: 0.8 },
        { x: 80, y: 30, r: 10 + shotScale * 8, color: '#fbbf24', o: 0.4 },
      ];
    } else {
      return [
        { x: 70, y: 30, r: 18 + paceScale * 6, color: '#10b981', o: 0.35 },
        { x: 82, y: 30, r: 12 + shotScale * 10, color: '#fbbf24', o: 0.65 },
        { x: 85, y: 30, r: 6 + shotScale * 8, color: '#ef4444', o: 0.85 },
        { x: 75, y: 18, r: 11, color: '#10b981', o: 0.25 },
        { x: 75, y: 42, r: 11, color: '#10b981', o: 0.25 },
      ];
    }
  }

  if (p === 'DF') {
    const isFullback = detail.includes('BACK') && (detail.includes('LEFT') || detail.includes('RIGHT') || detail.includes('WING'));
    if (isFullback) {
      const isLeft = detail.includes('LEFT');
      const yVal = isLeft ? 14 : 46;
      return [
        { x: 25, y: yVal, r: 16 + defScale * 6, color: '#10b981', o: 0.4 },
        { x: 42, y: yVal, r: 12 + paceScale * 8, color: '#fbbf24', o: 0.5 },
        { x: 60, y: yVal, r: 8 + paceScale * 4, color: '#10b981', o: 0.25 },
        { x: 18, y: yVal, r: 10, color: '#fbbf24', o: 0.6 },
      ];
    } else {
      return [
        { x: 22, y: 30, r: 16 + defScale * 10, color: '#10b981', o: 0.45 },
        { x: 18, y: 30, r: 12 + defScale * 6, color: '#fbbf24', o: 0.7 },
        { x: 16, y: 30, r: 6 + defScale * 4, color: '#ef4444', o: 0.8 },
        { x: 24, y: 18, r: 11, color: '#10b981', o: 0.3 },
        { x: 24, y: 42, r: 11, color: '#10b981', o: 0.3 },
      ];
    }
  }

  // Midfielder (MF)
  const isWingerMF = detail.includes('WIDE') || (detail.includes('MIDFIELDER') && (detail.includes('LEFT') || detail.includes('RIGHT')));
  if (isWingerMF) {
    const isLeft = detail.includes('LEFT');
    const yVal = isLeft ? 15 : 45;
    return [
      { x: 50, y: yVal, r: 20 + paceScale * 6, color: '#10b981', o: 0.4 },
      { x: 65, y: yVal, r: 14 + passScale * 6, color: '#fbbf24', o: 0.55 },
      { x: 35, y: yVal, r: 12 + defScale * 4, color: '#10b981', o: 0.35 },
    ];
  } else {
    const isAttacking = detail.includes('ATTACKING') || detail.includes('AM');
    const isDefending = detail.includes('DEFENSIVE') || detail.includes('DM');
    const xCenter = isAttacking ? 58 : isDefending ? 38 : 48;
    return [
      { x: xCenter, y: 30, r: 22 + passScale * 8, color: '#10b981', o: 0.45 },
      { x: xCenter, y: 30, r: 14 + passScale * 6, color: '#fbbf24', o: 0.7 },
      { x: xCenter, y: 30, r: 8 + shotScale * 5, color: '#ef4444', o: 0.8 },
      { x: xCenter - 12, y: 22, r: 12, color: '#10b981', o: 0.3 },
      { x: xCenter + 12, y: 38, r: 12, color: '#10b981', o: 0.3 },
    ];
  }
};


export default function PlayerComparison({ selectedPlayers, onSelectPlayer, onClearSlot }: PlayerComparisonProps) {
  const [slotAPickerOpen, setSlotAPickerOpen] = useState(false);
  const [slotBPickerOpen, setSlotBPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allAvailablePlayers = [
    ...Object.values(mockPlayers),
    ...Object.values(fillerPlayers),
  ];

  const playerA = selectedPlayers[0] || null;
  const playerB = selectedPlayers[1] || null;

  const filteredPlayers = allAvailablePlayers.filter(p => {
    if (playerA && playerA.id === p.id) return false;
    if (playerB && playerB.id === p.id) return false;
    
    if (searchQuery.trim() !== '') {
      return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             p.positionDetail.toLowerCase().includes(searchQuery.toLowerCase()) ||
             p.club.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Radar Settings
  const center = 100;
  const maxRadius = 66;
  const attributesList: { key: keyof Player['attributes']; label: string }[] = [
    { key: 'pace', label: 'PAC' },
    { key: 'dribbling', label: 'DRI' },
    { key: 'defending', label: 'DEF' },
    { key: 'physical', label: 'PHY' },
    { key: 'passing', label: 'PAS' },
    { key: 'shooting', label: 'SHO' },
  ];

  const getRadarPoints = (player: Player | null) => {
    if (!player) return '';
    return attributesList.map((attr, i) => {
      const value = player.attributes[attr.key] || 50;
      const angle = (i * 2 * Math.PI) / attributesList.length - Math.PI / 2;
      const radius = (value / 100) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const getDerivedStats = (player: Player | null) => {
    if (!player) return { attWorkRate: 50, defWorkRate: 50, skillMoves: 50, creativity: 50 };
    const pace = player.attributes.pace || 50;
    const shooting = player.attributes.shooting || 50;
    const passing = player.attributes.passing || 50;
    const dribbling = player.attributes.dribbling || 50;
    const defending = player.attributes.defending || 50;
    const physical = player.attributes.physical || 50;

    return {
      attWorkRate: Math.round(pace * 0.4 + shooting * 0.6),
      defWorkRate: Math.round(defending * 0.75 + physical * 0.25),
      skillMoves: Math.round(dribbling * 0.85 + pace * 0.15),
      creativity: Math.round(passing * 0.70 + dribbling * 0.30),
    };
  };

  const derivedA = getDerivedStats(playerA);
  const derivedB = getDerivedStats(playerB);

  // Layout helper for biometrics text
  const renderBioGrid = (player: Player | null, isSlotA: boolean) => {
    if (!player) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-550 text-sm py-10">
          Pending Candidate Selection
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col justify-between h-full space-y-5 py-0.5">
        {/* Row 1: Club and shirt */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950 border border-slate-900 shadow shadow-slate-950 shrink-0">
              <span className={`font-mono font-black text-[11px] ${isSlotA ? 'text-[#5850ec]' : 'text-slate-300'}`}>
                👤
              </span>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Athlete Name</span>
              <span className="text-sm font-extrabold text-slate-100 mt-0.5 block truncate max-w-[150px]">{player.name}</span>
            </div>
          </div>
          {/* Symmetrical jersey block content */}
          <div className="shrink-0">
            <SoccerJersey number={player.number} color={isSlotA ? '#131422' : '#222329'} accentColor={isSlotA ? '#5850ec' : '#d1d5db'} />
          </div>
        </div>

        {/* Row 2: Nationality, Age, Preferred Foot */}
        <div className="grid grid-cols-3 gap-4 border-t border-slate-900/70 pt-4">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Nationality</span>
            <span className="font-extrabold text-slate-200 mt-1.5 flex items-center gap-1.5 text-xs">
              <span>🇳🇵</span> <span className="font-mono text-[11.5px]">NPL</span>
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Age</span>
            <span className="font-bold text-slate-200 mt-1.5 font-mono text-xs">{player.age} yrs</span>
          </div>
          <div>
            <span className="text-slate-550 block text-[10px] uppercase font-mono tracking-wider">Pref. Foot</span>
            <span className="font-bold text-slate-200 mt-1.5 font-mono text-xs uppercase truncate">{player.preferredFoot}</span>
          </div>
        </div>

        {/* Row 3: Weight, Height, Market Value */}
        <div className="grid grid-cols-3 gap-4 border-t border-slate-900/70 pt-4">
          <div>
            <span className="text-slate-550 block text-[10px] uppercase font-mono tracking-wider">Weight</span>
            <span className="font-bold text-slate-200 mt-1.5 font-mono text-xs">{player.weight || '75kg'}</span>
          </div>
          <div>
            <span className="text-slate-550 block text-[10px] uppercase font-mono tracking-wider">Height</span>
            <span className="font-bold text-slate-200 mt-1.5 font-mono text-xs">{player.height || '178cm'}</span>
          </div>
          <div>
            <span className="text-slate-550 block text-[10px] uppercase font-mono tracking-wider">Market Value</span>
            <span className="font-extrabold text-amber-500 mt-1.5 font-mono text-xs block">{player.marketValue}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: SIDE-BY-SIDE H2H PROFILES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 bg-[#151619] p-5 md:p-6 border border-[#202124] rounded-2xl shadow-xl">
        
        {/* CANDIDATE A BLOCK */}
        <div className="relative">
          {playerA ? (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Outer card + change trigger info */}
              <div className="flex flex-col items-center shrink-0">
                <FUTCard player={playerA} borderGlowColor="#5850ec" />
                <button
                  onClick={() => { setSlotAPickerOpen(!slotAPickerOpen); setSlotBPickerOpen(false); }}
                  className="mt-3 px-4.5 py-1.5 bg-[#171a22] border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition shadow cursor-pointer uppercase select-none"
                >
                  Change
                </button>
              </div>

              {renderBioGrid(playerA, true)}
            </div>
          ) : (
            <div className="h-[210px] border-2 border-dashed border-slate-900 hover:border-indigo-500/20 bg-slate-950/20 rounded-2xl flex flex-col items-center justify-center text-center p-6 transition">
              <button
                onClick={() => { setSlotAPickerOpen((prev) => !prev); setSlotBPickerOpen(false); }}
                className="flex flex-col items-center cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-xs font-bold text-slate-300">Compare Player A</span>
                <span className="text-[10px] text-slate-550 font-mono mt-1">Click to select Gorkhali roster</span>
              </button>
            </div>
          )}

          {/* Selector Dropdown A */}
          {slotAPickerOpen && (
            <div className="absolute top-[102%] left-0 right-0 bg-[#0d0f15]/95 border border-slate-850 p-3 rounded-xl shadow-2xl z-30 max-h-[260px] overflow-y-auto scrollbar-thin">
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute top-2.5 left-2.5" />
                <input
                  type="text"
                  placeholder="Query athlete name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-[#5850ec] rounded-lg pl-8 pr-2.5 py-1.8 text-xs text-white outline-none"
                  autoFocus
                />
              </div>
              <div className="space-y-0.5">
                {filteredPlayers.length === 0 ? (
                  <p className="text-[10px] text-center text-slate-650 py-4">Roster candidate empty</p>
                ) : (
                  filteredPlayers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => { onSelectPlayer(p, 'A'); setSlotAPickerOpen(false); setSearchQuery(''); }}
                      className="p-2 hover:bg-[#5850ec]/15 rounded-lg text-xs text-slate-100 font-semibold cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-550 text-[9px] font-mono bg-slate-950 border border-slate-900 px-1.5 py-0.5 rounded">{p.position}</span>
                        <span>{p.name} <span className="text-slate-500 font-normal">({p.club.split(' ').shift()})</span></span>
                      </div>
                      <span className="text-[#5850ec] font-mono font-bold text-[11px]">{Math.round(p.rating * 10)} OVR</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* CANDIDATE B BLOCK */}
        <div className="relative">
          {playerB ? (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Outer card + change trigger info */}
              <div className="flex flex-col items-center shrink-0">
                <FUTCard player={playerB} borderGlowColor="#e2e8f0" />
                <button
                  onClick={() => { setSlotBPickerOpen(!slotBPickerOpen); setSlotAPickerOpen(false); }}
                  className="mt-3 px-4.5 py-1.5 bg-[#171a22] border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition shadow cursor-pointer uppercase select-none"
                >
                  Change
                </button>
              </div>

              {renderBioGrid(playerB, false)}
            </div>
          ) : (
            <div className="h-[210px] border-2 border-dashed border-slate-900 hover:border-slate-500/20 bg-slate-950/20 rounded-2xl flex flex-col items-center justify-center text-center p-6 transition">
              <button
                onClick={() => { setSlotBPickerOpen((prev) => !prev); setSlotAPickerOpen(false); }}
                className="flex flex-col items-center cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-slate-500/10 flex items-center justify-center border border-slate-800 mb-2">
                  <Plus className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-300">Compare Player B</span>
                <span className="text-[10px] text-slate-550 font-mono mt-1">Click to select Gorkhali roster</span>
              </button>
            </div>
          )}

          {/* Selector Dropdown B */}
          {slotBPickerOpen && (
            <div className="absolute top-[102%] left-0 right-0 bg-[#0d0f15]/95 border border-slate-850 p-3 rounded-xl shadow-2xl z-30 max-h-[260px] overflow-y-auto scrollbar-thin">
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute top-2.5 left-2.5" />
                <input
                  type="text"
                  placeholder="Query athlete name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-[#5850ec] rounded-lg pl-8 pr-2.5 py-1.8 text-xs text-white outline-none"
                  autoFocus
                />
              </div>
              <div className="space-y-0.5">
                {filteredPlayers.length === 0 ? (
                  <p className="text-[10px] text-center text-slate-650 py-4">Roster candidate empty</p>
                ) : (
                  filteredPlayers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => { onSelectPlayer(p, 'B'); setSlotBPickerOpen(false); setSearchQuery(''); }}
                      className="p-2 hover:bg-[#5850ec]/15 rounded-lg text-xs text-slate-100 font-semibold cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-550 text-[9px] font-mono bg-slate-950 border border-slate-900 px-1.5 py-0.5 rounded">{p.position}</span>
                        <span>{p.name} <span className="text-slate-500 font-normal">({p.club.split(' ').shift()})</span></span>
                      </div>
                      <span className="text-slate-300 font-mono font-bold text-[11px]">{Math.round(p.rating * 10)} OVR</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* SECTION 3: CORE STATS COMPARATIVE LAYOUT (Match performance + Core Attributes + Intelligence + Radar Chart Overlay) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_390px] gap-8 items-start">
        
        {/* THE 3 DATA CATEGORIES SCROLLABLE VERTICAL STACK */}
        <div className="flex flex-col gap-6 max-h-[640px] overflow-y-auto pr-3.5 scrollbar-thin">
          
          {/* COLUMN 1: Match Performance Stats */}
          <div className="bg-[#151619] p-5 md:p-6 border border-[#202124] rounded-xl space-y-5">
            <h4 className="text-sm font-extrabold text-slate-300 border-b border-slate-905 pb-3 uppercase tracking-wider">
              Match Performance Stats
            </h4>
            <div className="space-y-4.5">
              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.goals : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Goals</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.goals : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.goals ?? 0} valB={playerB?.goals ?? 0} max={25} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.assists : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Assists</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.assists : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.assists ?? 0} valB={playerB?.assists ?? 0} max={15} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">
                    {playerA !== null ? Math.round(playerA.attributes.shooting * 1.2) : '-'}
                  </span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Shots on Target</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">
                    {playerB !== null ? Math.round(playerB.attributes.shooting * 1.2) : '-'}
                  </span>
                </div>
                <DualComparativeBar valA={playerA ? Math.round(playerA.attributes.shooting * 1.2) : 0} valB={playerB ? Math.round(playerB.attributes.shooting * 1.2) : 0} max={110} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">
                    {playerA !== null ? Math.round(playerA.attributes.defending * 0.15) : '-'}
                  </span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Blocks</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">
                    {playerB !== null ? Math.round(playerB.attributes.defending * 0.15) : '-'}
                  </span>
                </div>
                <DualComparativeBar valA={playerA ? Math.round(playerA.attributes.defending * 0.15) : 0} valB={playerB ? Math.round(playerB.attributes.defending * 0.15) : 0} max={15} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.matchesPlayed : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Games Played</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.matchesPlayed : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.matchesPlayed ?? 0} valB={playerB?.matchesPlayed ?? 0} max={110} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">
                    {playerA !== null ? Math.round(playerA.attributes.passing * 0.4) : '-'}
                  </span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Big Chances Created</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">
                    {playerB !== null ? Math.round(playerB.attributes.passing * 0.4) : '-'}
                  </span>
                </div>
                <DualComparativeBar valA={playerA ? Math.round(playerA.attributes.passing * 0.4) : 0} valB={playerB ? Math.round(playerB.attributes.passing * 0.4) : 0} max={50} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">
                    {playerA !== null ? `${50 + Math.round(playerA.attributes.shooting * 0.4)}%` : '-'}
                  </span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Shot Accuracy</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">
                    {playerB !== null ? `${50 + Math.round(playerB.attributes.shooting * 0.4)}%` : '-'}
                  </span>
                </div>
                <DualComparativeBar valA={playerA ? 50 + Math.round(playerA.attributes.shooting * 0.4) : 0} valB={playerB ? 50 + Math.round(playerB.attributes.shooting * 0.4) : 0} max={100} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">
                    {playerA !== null ? `${60 + Math.round(playerA.attributes.passing * 0.35)}%` : '-'}
                  </span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Pass Accuracy</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">
                    {playerB !== null ? `${60 + Math.round(playerB.attributes.passing * 0.35)}%` : '-'}
                  </span>
                </div>
                <DualComparativeBar valA={playerA ? 60 + Math.round(playerA.attributes.passing * 0.35) : 0} valB={playerB ? 60 + Math.round(playerB.attributes.passing * 0.35) : 0} max={100} />
              </div>
            </div>
          </div>

          {/* COLUMN 2: Core Attributes */}
          <div className="bg-[#151619] p-5 md:p-6 border border-[#202124] rounded-xl space-y-5">
            <h4 className="text-sm font-extrabold text-slate-300 border-b border-slate-905 pb-3 uppercase tracking-wider">
              Core Attributes
            </h4>
            <div className="space-y-4.5">
              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.pace : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Pace</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.attributes.pace : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.attributes.pace ?? 50} valB={playerB?.attributes.pace ?? 50} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.shooting : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Shooting</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.attributes.shooting : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.attributes.shooting ?? 50} valB={playerB?.attributes.shooting ?? 50} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.passing : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Passing</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.attributes.passing : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.attributes.passing ?? 50} valB={playerB?.attributes.passing ?? 50} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.dribbling : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Dribbling</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.attributes.dribbling : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.attributes.dribbling ?? 50} valB={playerB?.attributes.dribbling ?? 50} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.physical : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Physical</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.attributes.physical : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.attributes.physical ?? 50} valB={playerB?.attributes.physical ?? 50} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.defending : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Defending</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.attributes.defending : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.attributes.defending ?? 50} valB={playerB?.attributes.defending ?? 50} />
              </div>
            </div>
          </div>

          {/* COLUMN 3: Game Intelligence & Work Rate */}
          <div className="bg-[#151619] p-5 md:p-6 border border-[#202124] rounded-xl space-y-5">
            <h4 className="text-sm font-extrabold text-slate-300 border-b border-slate-905 pb-3 uppercase tracking-wider">
              Game Intelligence & Work Rate
            </h4>
            <div className="space-y-4.5">
              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? derivedA.attWorkRate : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Attacking Work Rate</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? derivedB.attWorkRate : '-'}</span>
                </div>
                <DualComparativeBar valA={derivedA.attWorkRate} valB={derivedB.attWorkRate} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{derivedA.defWorkRate}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Defensive Work Rate</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{derivedB.defWorkRate}</span>
                </div>
                <DualComparativeBar valA={derivedA.defWorkRate} valB={derivedB.defWorkRate} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{derivedA.skillMoves}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Skill Moves</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{derivedB.skillMoves}</span>
                </div>
                <DualComparativeBar valA={derivedA.skillMoves} valB={derivedB.skillMoves} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#5850ec] font-mono text-xs md:text-sm w-12 text-left">{derivedA.creativity}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Creativity</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{derivedB.creativity}</span>
                </div>
                <DualComparativeBar valA={derivedA.creativity} valB={derivedB.creativity} />
              </div>
            </div>
          </div>

          {/* COLUMN 4: Career Positioning Heatmap Comparison */}
          <div className="bg-[#151619] p-5 md:p-6 border border-[#202124] rounded-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-900/50 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider">
                  Career Positioning Heatmaps
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Position density indicating on-field activity patterns. Heat-density scales based on attributes (defending, shooting, pace, etc.).
                </p>
              </div>
              <div className="mt-2.5 sm:mt-0 flex items-center gap-1.5 bg-[#090a0f] border border-slate-850 px-3 py-1 rounded-full text-[10px] text-slate-400 font-mono font-bold leading-none shrink-0 self-start sm:self-center">
                <span>Play Direction</span>
                <span className="text-emerald-400 font-extrabold">&rarr;</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              {/* Heatmap Player A */}
              <div className="space-y-3 bg-[#101114]/50 p-4 border border-[#202124] rounded-xl">
                <div className="flex justify-between items-center bg-[#0d0e10]/80 px-3 py-2 rounded-lg border border-[#202124]">
                  <span className="text-xs font-black text-slate-100 truncate">
                    {playerA ? playerA.name : 'Slot A Candidate'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#5850ec] uppercase px-2 py-0.5 bg-[#5850ec]/10 border border-[#5850ec]/25 rounded">
                    {playerA ? playerA.position : '—'}
                  </span>
                </div>

                {playerA ? (
                  <div className="relative aspect-[100/60] w-full rounded-xl overflow-hidden border border-slate-850/80 bg-gradient-to-br from-[#0c2211] to-[#040c06] shadow-inner">
                    {/* Dark field turf gradient effect */}
                    <div className="absolute inset-x-0 inset-y-0 opacity-40 mix-blend-color-dodge select-none pointer-events-none" />

                    {/* Standard pitch boundaries visual */}
                    <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full select-none opacity-30">
                      <rect x="2" y="2" width="96" height="56" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <line x1="50" y1="2" x2="50" y2="58" stroke="#ffffff" strokeWidth="0.8" />
                      <circle cx="50" cy="30" r="10" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <circle cx="50" cy="30" r="0.8" fill="#ffffff" />
                      <rect x="2" y="14" width="16" height="32" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <rect x="2" y="21.5" width="5.5" height="17" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <circle cx="13" cy="30" r="0.8" fill="#ffffff" />
                      <path d="M 18 24 A 10 10 0 0 1 18 36" fill="none" stroke="#ffffff" strokeWidth="0.8" />

                      <rect x="82" y="14" width="16" height="32" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <rect x="92.5" y="21.5" width="5.5" height="17" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <circle cx="87" cy="30" r="0.8" fill="#ffffff" />
                      <path d="M 82 24 A 10 10 0 0 0 82 36" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                    </svg>

                    {/* Highly authentic glow filters representing heat energy density */}
                    <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
                      <defs>
                        <filter id="heatmap-blur-a" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="4.5" />
                        </filter>
                      </defs>
                      <g filter="url(#heatmap-blur-a)">
                        {getHeatSpots(playerA).map((spot, idx) => (
                          <circle
                            key={idx}
                            cx={spot.x}
                            cy={spot.y}
                            r={spot.r}
                            fill={spot.color}
                            opacity={spot.o}
                          />
                        ))}
                      </g>
                    </svg>
                  </div>
                ) : (
                  <div className="aspect-[100/60] w-full bg-[#0d0e10]/80 border border-slate-800 border-dashed rounded-xl flex flex-col justify-center items-center text-center p-4">
                    <Plus className="w-5 h-5 text-slate-700 mb-1.5" />
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Awaiting Player A Select</p>
                  </div>
                )}
              </div>

              {/* Heatmap Player B */}
              <div className="space-y-3 bg-[#101114]/50 p-4 border border-[#202124] rounded-xl">
                <div className="flex justify-between items-center bg-[#0d0e10]/80 px-3 py-2 rounded-lg border border-[#202124]">
                  <span className="text-xs font-black text-slate-100 truncate">
                    {playerB ? playerB.name : 'Slot B Candidate'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase px-2 py-0.5 bg-slate-800/50 border border-slate-750 rounded">
                    {playerB ? playerB.position : '—'}
                  </span>
                </div>

                {playerB ? (
                  <div className="relative aspect-[100/60] w-full rounded-xl overflow-hidden border border-slate-850/80 bg-gradient-to-br from-[#0c2211] to-[#040c06] shadow-inner">
                    {/* Dark field turf gradient effect */}
                    <div className="absolute inset-x-0 inset-y-0 opacity-40 mix-blend-color-dodge select-none pointer-events-none" />

                    {/* Standard pitch boundaries visual */}
                    <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full select-none opacity-30">
                      <rect x="2" y="2" width="96" height="56" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <line x1="50" y1="2" x2="50" y2="58" stroke="#ffffff" strokeWidth="0.8" />
                      <circle cx="50" cy="30" r="10" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <circle cx="50" cy="30" r="0.8" fill="#ffffff" />
                      <rect x="2" y="14" width="16" height="32" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <rect x="2" y="21.5" width="5.5" height="17" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <circle cx="13" cy="30" r="0.8" fill="#ffffff" />
                      <path d="M 18 24 A 10 10 0 0 1 18 36" fill="none" stroke="#ffffff" strokeWidth="0.8" />

                      <rect x="82" y="14" width="16" height="32" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <rect x="92.5" y="21.5" width="5.5" height="17" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                      <circle cx="87" cy="30" r="0.8" fill="#ffffff" />
                      <path d="M 82 24 A 10 10 0 0 0 82 36" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                    </svg>

                    {/* Highly authentic glow filters representing heat energy density */}
                    <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
                      <defs>
                        <filter id="heatmap-blur-b" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="4.5" />
                        </filter>
                      </defs>
                      <g filter="url(#heatmap-blur-b)">
                        {getHeatSpots(playerB).map((spot, idx) => (
                          <circle
                            key={idx}
                            cx={spot.x}
                            cy={spot.y}
                            r={spot.r}
                            fill={spot.color}
                            opacity={spot.o}
                          />
                        ))}
                      </g>
                    </svg>
                  </div>
                ) : (
                  <div className="aspect-[100/60] w-full bg-[#0d0e10]/80 border border-slate-800 border-dashed rounded-xl flex flex-col justify-center items-center text-center p-4">
                    <Plus className="w-5 h-5 text-slate-700 mb-1.5" />
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Awaiting Player B Select</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ATTRIBUTES MAP RADAR GRAPH COLUMN */}
        <div className="bg-[#151619] p-5 border border-[#202124] rounded-xl flex flex-col justify-between items-center space-y-6 lg:sticky lg:top-6 w-full shrink-0">
          <div className="w-full text-left space-y-1">
            <h4 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest">
              Players Attributes Map
            </h4>
            <p className="text-xs text-slate-450 leading-relaxed">
              Shows the player's strengths across core attributes.
            </p>
          </div>

          <div className="relative w-full aspect-square max-w-[290px] mx-auto flex items-center justify-center p-2">
            {/* Minimal High-Contrast Radar Poly Chart */}
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
              <defs>
                <filter id="mesh-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Nested multi-layered dark polygon mesh */}
              {[0.25, 0.5, 0.75, 1.0].map((level, lvlIdx) => {
                const r = level * maxRadius;
                const points = attributesList.map((_, i) => {
                  const angle = (i * 2 * Math.PI) / attributesList.length - Math.PI / 2;
                  const x = center + r * Math.cos(angle);
                  const y = center + r * Math.sin(angle);
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <polygon
                    key={lvlIdx}
                    points={points}
                    fill="none"
                    stroke="#1c1f26"
                    strokeWidth="1.2"
                  />
                );
              })}

              {/* Core axis splitter lines */}
              {attributesList.map((_, i) => {
                const angle = (i * 2 * Math.PI) / attributesList.length - Math.PI / 2;
                const x = center + maxRadius * Math.cos(angle);
                const y = center + maxRadius * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="#1c1f26"
                    strokeWidth="1.2"
                  />
                );
              })}

              {/* Polygon map - Candidate A overlay */}
              {playerA && (
                <polygon
                  points={getRadarPoints(playerA)}
                  fill="rgba(88, 80, 236, 0.22)"
                  stroke="#5850ec"
                  strokeWidth="2.5"
                  className="transition-all duration-300"
                />
              )}

              {/* Polygon map - Candidate B overlay */}
              {playerB && (
                <polygon
                  points={getRadarPoints(playerB)}
                  fill="rgba(209, 213, 219, 0.15)"
                  stroke="#d1d5db"
                  strokeWidth="2.5"
                  className="transition-all duration-300"
                />
              )}

              {/* Metric Label markers */}
              {attributesList.map((attr, i) => {
                const angle = (i * 2 * Math.PI) / attributesList.length - Math.PI / 2;
                const x = center + (maxRadius + 15) * Math.cos(angle);
                const y = center + (maxRadius + 8) * Math.sin(angle);
                const textAnchor = Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle';

                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor={textAnchor}
                    fill="#94a3b8"
                    fontSize="11px"
                    fontWeight="700"
                    fontFamily="'Open Sans', sans-serif"
                    alignmentBaseline="middle"
                  >
                    {attr.label}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Clean pills bottom legend */}
          <div className="flex flex-wrap gap-2.5 pt-2 text-[11px] items-center justify-center font-bold">
            {playerA && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[#131422] border border-[#5850ec]/30 rounded-full text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5850ec]" />
                <span>{playerA.name.split(' ').pop()}</span>
              </span>
            )}
            {playerB && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[#1d1f24] border border-slate-700/50 rounded-full text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span>{playerB.name.split(' ').pop()}</span>
              </span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
