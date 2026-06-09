import { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { getPlayers, comparePlayers as apiComparePlayers, type CompareResult } from '../services/api';
import { Plus, Search, X } from 'lucide-react';
import { getCountryDisplay } from '../utils/nationality';

interface PlayerComparisonProps {
  selectedPlayers: Player[];
  onSelectPlayer: (player: Player, slot: 'A' | 'B') => void;
  onClearSlot: (slot: 'A' | 'B') => void;
}

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

const CLUB_PREFIX_RE = /^(FC|AC|AS|SS|SK|RB|VfL|VfB|SV|FSV|TSG|SC|CF|CD|UD|SD|F\.C\.|A\.C\.|A\.S\.)\s+/i;
function shortClubName(club: string): string {
  if (!club || club === '—') return '';
  return club.replace(CLUB_PREFIX_RE, '').split(/\s+/)[0] || club;
}

// Custom shape FIFA/FUT card widget matching the exact modular styling
const FUTCard = ({ player, side }: { player: Player; side?: 'green' | 'white' }) => {
  const shortName = player.name.split(' ').pop() || player.name;
  const isFemale = isFemalePlayer(player);
  const isGreen = side === 'green';

  // Backing color theme - green for the active left slot, white/slate for the right slot
  const cardBgClass = isGreen
    ? "bg-gradient-to-b from-[#092e21] to-[#0a1210] border border-[#10b981]/60 shadow-[0_4px_25px_rgba(16,185,129,0.22)]"
    : "bg-gradient-to-b from-[#2d2d30] to-[#0d0d0f] border border-[#e2e8f0]/40 shadow-[0_4px_25px_rgba(255,255,255,0.12)]";

  // Avatar backdrop gradient styling
  const avatarBoxBg = isGreen
    ? "bg-gradient-to-b from-[#047857]/45 via-[#064e3b]/25 to-[#022c22]/60"
    : "bg-gradient-to-b from-[#64748b]/40 via-[#334155]/20 to-[#1e293b]/55";

  // Rating and position layout metadata
  const ratingTextClass = isGreen ? "text-emerald-400" : "text-white";

  const positionMap = {
    'GK': 'GK',
    'DF': 'DEF',
    'MF': 'MID',
    'FW': 'FWD'
  };
  const displayPos = positionMap[player.position] || player.position;

  const displayClubName = shortClubName(player.club) || '—';

  return (
    <div className={`relative w-[158px] h-[220px] rounded-[24px] p-2.5 flex flex-col justify-between select-none hover:scale-[1.03] transition duration-200 shrink-0 ${cardBgClass}`}>
      {/* Top Square Box with custom athlete avatar */}
      <div 
        className={`w-full aspect-[4/3.3] rounded-[18px] relative overflow-hidden flex items-end justify-center ${avatarBoxBg}`}
      >
        {/* Subtle radial shine overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />
        
        {/* Rating badge inset on top-left of the container */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-[2px] px-1.5 py-0.5 rounded-full border border-white/10 flex items-center gap-0.5 text-[8.5px] font-mono font-black placeholder-white leading-none">
          <span className={ratingTextClass}>⭐ {Math.round(player.rating * 10)}</span>
        </div>

        {/* Dynamic avatar based on provided image illustration */}
        <DummyPlayerAvatar 
          className="w-[82%] h-[82%] absolute bottom-0 left-1/2 -translate-x-1/2 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] animate-fade-in" 
          gender={isFemale ? 'female' : 'male'} 
        />
      </div>

      {/* Center section: Athlete surname */}
      <div className="text-center pt-2 px-1">
        <h4 className={`text-xs font-black uppercase tracking-wide leading-none truncate ${ratingTextClass}`}>
          {shortName}
        </h4>
      </div>

      {/* Footer detailing: Identity values */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-1.5 pb-1 select-none">
        <div className="flex items-center gap-1 min-w-0 max-w-[65%]">
          <span className="text-[10px] filter saturate-50 shrink-0" role="img" aria-label="club element">
            {player.position === 'FW' ? '' : player.position === 'GK' ? '' : ''}
          </span>
          <span className="truncate opacity-85 text-slate-350">{displayClubName}</span>
        </div>

        <span className={`font-mono text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
          isGreen 
            ? "text-emerald-450 bg-emerald-950/60 border border-emerald-900/30" 
            : "text-slate-300 bg-slate-900/60 border border-slate-800/40"
        }`}>
          {displayPos}
        </span>
      </div>
    </div>
  );
};

// Symmetrical double-ended progress comparative bar
const DualComparativeBar = ({ 
  valA, 
  valB, 
  max = 100, 
  colorA = '#10b981', // Brand Emerald Green
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
  const [allAvailablePlayers, setAllAvailablePlayers] = useState<Player[]>([]);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playerA = selectedPlayers[0] || null;
  const playerB = selectedPlayers[1] || null;

  // Load players for pickers (debounced search)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      getPlayers({ search: searchQuery || undefined, limit: 50 })
        .then(({ players }) => setAllAvailablePlayers(players))
        .catch(() => {});
    }, 250);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  // Call Algorithm 2 when both players selected
  useEffect(() => {
    if (!playerA || !playerB) { setCompareResult(null); return; }
    apiComparePlayers(playerA.id, playerB.id)
      .then(setCompareResult)
      .catch(() => setCompareResult(null));
  }, [playerA?.id, playerB?.id]);

  const filteredPlayers = allAvailablePlayers.filter((p: Player) => {
    if (playerA && playerA.id === p.id) return false;
    if (playerB && playerB.id === p.id) return false;
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
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm py-10">
          Pending Candidate Selection
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col justify-between h-full space-y-5 py-0.5">
        {/* Row 1: Name and deselect */}
        <div className="flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Athlete Name</span>
            <span className="text-sm font-extrabold text-slate-100 mt-0.5 block truncate max-w-37.5">{player.name}</span>
          </div>
          <button
            onClick={() => onClearSlot(isSlotA ? 'A' : 'B')}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition shrink-0"
            title="Deselect player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Row 2: Nationality, Age, Preferred Foot */}
        <div className="grid grid-cols-3 gap-4 border-t border-slate-900/70 pt-4">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Nationality</span>
            {(() => {
              const { flag, code } = getCountryDisplay(player.nationality);
              return (
                <span className="font-extrabold text-slate-200 mt-1.5 flex items-center gap-1.5 text-xs">
                  <span>{flag}</span>
                  <span className="font-mono text-[11.5px]">{code}</span>
                </span>
              );
            })()}
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Age</span>
            <span className="font-bold text-slate-200 mt-1.5 font-mono text-xs">{player.age} yrs</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Pref. Foot</span>
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
        <div className="relative min-h-[270px]">
          {playerA ? (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Outer card + change trigger info */}
              <div className="flex flex-col items-center shrink-0">
                <FUTCard player={playerA} />
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
            <div className="h-full min-h-[270px] border-2 border-dashed border-slate-900 hover:border-emerald-500/20 bg-slate-950/20 rounded-2xl flex flex-col items-center justify-center text-center p-6 transition">
              <button
                onClick={() => { setSlotAPickerOpen((prev) => !prev); setSlotBPickerOpen(false); }}
                className="flex flex-col items-center cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs font-bold text-slate-300">Compare Player A</span>
                <span className="text-[10px] text-slate-500 font-mono mt-1">Click to select player</span>
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
                  className="w-full bg-slate-950 border border-slate-900 focus:border-emerald-500 rounded-lg pl-8 pr-2.5 py-1.8 text-xs text-white outline-none"
                  autoFocus
                />
              </div>
              <div className="space-y-0.5">
                {filteredPlayers.length === 0 ? (
                  <p className="text-[10px] text-center text-slate-600 py-4">Roster candidate empty</p>
                ) : (
                  filteredPlayers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => { onSelectPlayer(p, 'A'); setSlotAPickerOpen(false); setSearchQuery(''); }}
                      className="p-2 hover:bg-emerald-500/15 rounded-lg text-xs text-slate-100 font-semibold cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[9px] font-mono bg-slate-950 border border-slate-900 px-1.5 py-0.5 rounded">{p.position}</span>
                        <span>{p.name}{shortClubName(p.club) ? <span className="text-slate-500 font-normal"> ({shortClubName(p.club)})</span> : null}</span>
                      </div>
                      <span className="text-emerald-400 font-mono font-bold text-[11px]">{Math.round(p.rating * 10)} OVR</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* CANDIDATE B BLOCK */}
        <div className="relative min-h-[270px]">
          {playerB ? (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Outer card + change trigger info */}
              <div className="flex flex-col items-center shrink-0">
                <FUTCard player={playerB} />
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
            <div className="h-full min-h-[270px] border-2 border-dashed border-slate-900 hover:border-slate-500/20 bg-slate-950/20 rounded-2xl flex flex-col items-center justify-center text-center p-6 transition">
              <button
                onClick={() => { setSlotBPickerOpen((prev) => !prev); setSlotAPickerOpen(false); }}
                className="flex flex-col items-center cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-slate-500/10 flex items-center justify-center border border-slate-800 mb-2">
                  <Plus className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-300">Compare Player B</span>
                <span className="text-[10px] text-slate-500 font-mono mt-1">Click to select player</span>
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
                  className="w-full bg-slate-950 border border-slate-900 focus:border-emerald-500 rounded-lg pl-8 pr-2.5 py-1.8 text-xs text-white outline-none"
                  autoFocus
                />
              </div>
              <div className="space-y-0.5">
                {filteredPlayers.length === 0 ? (
                  <p className="text-[10px] text-center text-slate-600 py-4">Roster candidate empty</p>
                ) : (
                  filteredPlayers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => { onSelectPlayer(p, 'B'); setSlotBPickerOpen(false); setSearchQuery(''); }}
                      className="p-2 hover:bg-emerald-500/15 rounded-lg text-xs text-slate-100 font-semibold cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[9px] font-mono bg-slate-950 border border-slate-900 px-1.5 py-0.5 rounded">{p.position}</span>
                        <span>{p.name}{shortClubName(p.club) ? <span className="text-slate-500 font-normal"> ({shortClubName(p.club)})</span> : null}</span>
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

      {/* ML Similarity Score Banner */}
      {compareResult && (
        <div className="bg-[#151619] border border-emerald-800/40 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 uppercase tracking-wider font-bold"> Cosine Similarity</span>
            <span className="font-mono font-black text-emerald-400 text-lg">{compareResult.similarityScore.toFixed(1)}%</span>
          </div>
          <div className="flex gap-6">
            <div>
              <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">{compareResult.playerA.name} strengths</span>
              <span className="text-emerald-400 font-semibold capitalize">{compareResult.strengths.playerA.join(', ') || '—'}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-slate-500 font-bold block mb-1">{compareResult.playerB.name} strengths</span>
              <span className="text-slate-300 font-semibold capitalize">{compareResult.strengths.playerB.join(', ') || '—'}</span>
            </div>
          </div>
        </div>
      )}

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
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.goals : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Goals</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.goals : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.goals ?? 0} valB={playerB?.goals ?? 0} max={25} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.assists : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Assists</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.assists : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.assists ?? 0} valB={playerB?.assists ?? 0} max={15} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">
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
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">
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
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.matchesPlayed : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Games Played</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.matchesPlayed : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.matchesPlayed ?? 0} valB={playerB?.matchesPlayed ?? 0} max={110} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">
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
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">
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
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">
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
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.pace : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Pace</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.attributes.pace : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.attributes.pace ?? 50} valB={playerB?.attributes.pace ?? 50} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.shooting : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Shooting</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.attributes.shooting : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.attributes.shooting ?? 50} valB={playerB?.attributes.shooting ?? 50} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.passing : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Passing</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.attributes.passing : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.attributes.passing ?? 50} valB={playerB?.attributes.passing ?? 50} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.dribbling : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Dribbling</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.attributes.dribbling : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.attributes.dribbling ?? 50} valB={playerB?.attributes.dribbling ?? 50} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.physical : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Physical</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? playerB.attributes.physical : '-'}</span>
                </div>
                <DualComparativeBar valA={playerA?.attributes.physical ?? 50} valB={playerB?.attributes.physical ?? 50} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? playerA.attributes.defending : '-'}</span>
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
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{playerA !== null ? derivedA.attWorkRate : '-'}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Attacking Work Rate</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{playerB !== null ? derivedB.attWorkRate : '-'}</span>
                </div>
                <DualComparativeBar valA={derivedA.attWorkRate} valB={derivedB.attWorkRate} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{derivedA.defWorkRate}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Defensive Work Rate</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{derivedB.defWorkRate}</span>
                </div>
                <DualComparativeBar valA={derivedA.defWorkRate} valB={derivedB.defWorkRate} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{derivedA.skillMoves}</span>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px] text-center grow">Skill Moves</span>
                  <span className="font-extrabold text-slate-300 font-mono text-xs md:text-sm w-12 text-right">{derivedB.skillMoves}</span>
                </div>
                <DualComparativeBar valA={derivedA.skillMoves} valB={derivedB.skillMoves} />
              </div>

              {/* Stat Row */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-emerald-400 font-mono text-xs md:text-sm w-12 text-left">{derivedA.creativity}</span>
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
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded">
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
            <p className="text-xs text-slate-400 leading-relaxed">
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
                  fill="rgba(16, 185, 129, 0.22)"
                  stroke="#10b981"
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
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[#131422] border border-emerald-500/30 rounded-full text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
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
