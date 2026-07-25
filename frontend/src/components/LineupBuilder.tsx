import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { getPlayers, optimizeSquad } from '../services/api';
import { Sparkles, RefreshCw, Layers, Plus, X, Search, ShieldAlert, Save, Clipboard, ChevronDown, Award, Users, Info } from 'lucide-react';

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

const SUB_SLOTS = [
  { id: 12, label: 'SUB 1' },
  { id: 13, label: 'SUB 2' },
  { id: 14, label: 'SUB 3' },
  { id: 15, label: 'SUB 4' },
  { id: 16, label: 'SUB 5' },
];

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

const POSITION_PRIORITY: Record<string, Record<string, number>> = {
  FW: { FW: 0, MF: 1, DF: 2, GK: 3 },
  MF: { MF: 0, FW: 1, DF: 2, GK: 3 },
  DF: { DF: 0, MF: 1, FW: 2, GK: 3 },
  GK: { GK: 0, DF: 1, MF: 2, FW: 3 },
};

type PlayerFilter = 'all-men' | 'nep-men' | 'nep-women';

const FILTER_LABELS: Record<PlayerFilter, string> = {
  'all-men': 'All Men',
  'nep-men': 'Nep Men',
  'nep-women': 'Nep Women',
};

export default function LineupBuilder() {
  const [activeFormation, setActiveFormation] = useState<string>('4-3-3');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [assignedPlayers, setAssignedPlayers] = useState<Record<number, Player>>({});
  const [savedLineups, setSavedLineups] = useState<Record<PlayerFilter, Record<number, Player>>>({
    'all-men': {}, 'nep-men': {}, 'nep-women': {},
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>('nep-men');
  const [loadingFilter, setLoadingFilter] = useState<PlayerFilter | null>(null);

  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [autoFilling, setAutoFilling] = useState(false);

  const activeSlots = FORMATIONS[activeFormation];

  const fetchBalancedPool = async (base: Parameters<typeof getPlayers>[0]): Promise<Player[]> => {
    const [gks, dfs, mfs, fws] = await Promise.all([
      getPlayers({ ...base, position: 'GK', limit: 20 }),
      getPlayers({ ...base, position: 'DF', limit: 60 }),
      getPlayers({ ...base, position: 'MF', limit: 75 }),
      getPlayers({ ...base, position: 'FW', limit: 60 }),
    ]);
    return [...gks.players, ...dfs.players, ...mfs.players, ...fws.players];
  };

  useEffect(() => {
    fetchBalancedPool({ source: 'nepali', gender: 'M' })
      .then(players => setAllPlayers(players))
      .catch(() => {});
  }, []);

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

  const fillLineupFromPlayers = async (players: Player[], label: string) => {
    const result = await optimizeSquad({
      teamId: 'nepal',
      availablePlayerIds: players.map((p: Player) => p.id),
      formationPreference: activeFormation,
    });
    const playerById: Record<string, Player> = {};
    players.forEach((p: Player) => { playerById[p.id] = p; });

    const defaults: Record<number, Player> = {};
    result.startingXI.forEach((entry, idx) => {
      const player = playerById[entry.playerId];
      if (player) defaults[idx + 1] = player;
    });
    result.bench.slice(0, 5).forEach((entry, idx) => {
      const player = playerById[entry.playerId];
      if (player) defaults[idx + 12] = player;
    });
    setAssignedPlayers(defaults);
  };

  const handleLoadDefaults = async () => {
    if (allPlayers.length === 0 || autoFilling) return;
    setAutoFilling(true);
    try {
      await fillLineupFromPlayers(allPlayers, FILTER_LABELS[playerFilter]);
    } catch {
      // silent — ML unavailable
    } finally {
      setAutoFilling(false);
    }
  };

  const handleFilterChange = async (filter: PlayerFilter) => {
    if (loadingFilter || autoFilling) return;
    // Save current lineup under the outgoing filter, restore the incoming filter's lineup
    setSavedLineups(prev => ({ ...prev, [playerFilter]: assignedPlayers }));
    setAssignedPlayers(savedLineups[filter]);
    setPlayerFilter(filter);
    setSelectedSlotId(null);
    setLoadingFilter(filter);
    try {
      const base: Parameters<typeof getPlayers>[0] = {};
      if (filter === 'nep-men') { base.source = 'nepali'; base.gender = 'M'; }
      else if (filter === 'nep-women') { base.source = 'nepali'; base.gender = 'F'; }
      else { base.gender = 'M'; }
      const players = await fetchBalancedPool(base);
      setAllPlayers(players);
    } catch {
      // silent — player fetch failed
    } finally {
      setLoadingFilter(null);
    }
  };

  const calculateSynergyBreakdown = () => {
    const starters = Object.entries(assignedPlayers)
      .filter(([id]) => Number(id) <= 11)
      .map(([_, p]) => p as Player);
    
    const subs = Object.entries(assignedPlayers)
      .filter(([id]) => Number(id) >= 12)
      .map(([_, p]) => p as Player);

    const totalStarters = starters.length;
    const totalSubs = subs.length;
    
    // 1. BASE STRENGTH COMPONENT (50% max weight)
    const avgStartersRating = totalStarters > 0
      ? starters.reduce((sum, p) => sum + p.rating, 0) / totalStarters
      : 0;
    
    const strengthBonus = totalStarters > 0
      ? Math.min(50, Math.round(((avgStartersRating - 5.5) / 3) * 50))
      : 0;

    // 2. ROLE-BASED BALANCE (25% max weight)
    const requiredRoles = { GK: 0, DF: 0, MF: 0, FW: 0 };
    activeSlots.forEach(s => {
      requiredRoles[s.role] = (requiredRoles[s.role] || 0) + 1;
    });

    const filledRoles = { GK: 0, DF: 0, MF: 0, FW: 0 };
    starters.forEach(p => {
      if (filledRoles[p.position] !== undefined) {
        filledRoles[p.position] += 1;
      }
    });

    let roleMatchPoints = 0;
    const roles: ('GK'|'DF'|'MF'|'FW')[] = ['GK', 'DF', 'MF', 'FW'];
    roles.forEach(r => {
      const needed = requiredRoles[r];
      const matchValue = filledRoles[r];
      if (needed > 0) {
        roleMatchPoints += Math.min(needed, matchValue) / needed;
      }
    });
    
    const roleBalanceScore = totalStarters > 0
      ? Math.round((roleMatchPoints / 4) * 25)
      : 0;

    // 3. COHESION MULTIPLIER (15% max weight)
    const clubCounts: Record<string, number> = {};
    starters.forEach(p => {
      if (p.club) {
        clubCounts[p.club] = (clubCounts[p.club] || 0) + 1;
      }
    });
    
    let clubCohesionBonus = 0;
    Object.values(clubCounts).forEach(count => {
      if (count >= 3) clubCohesionBonus += 8;
      else if (count === 2) clubCohesionBonus += 4;
    });
    clubCohesionBonus = Math.min(10, clubCohesionBonus);

    // Domestic/national integrity
    const areWomensList = starters.filter(p => isFemalePlayer(p)).length;
    const areMensList = starters.filter(p => !isFemalePlayer(p)).length;
    const cohesionScore = Math.min(15, clubCohesionBonus + (areWomensList >= 5 || areMensList >= 5 ? 5 : 0));

    // 4. BENCH FLEXIBILITY & QUALITY (10% max weight)
    const subPositions = new Set(subs.map(p => p.position));
    const subPosBonus = Math.min(5, subPositions.size * 1.5);

    const avgSubsRating = totalSubs > 0
      ? subs.reduce((sum, p) => sum + p.rating, 0) / totalSubs
      : 0;
    const subRatingBonus = totalSubs > 0
      ? Math.min(5, Math.round(((avgSubsRating - 6) / 2.5) * 5))
      : 0;
    
    const benchScore = Math.round(subPosBonus + subRatingBonus);
    
    const totalSynergyIndex = Math.min(100, strengthBonus + roleBalanceScore + cohesionScore + benchScore);

    return {
      strength: Math.max(0, strengthBonus),
      roleBalance: Math.max(0, roleBalanceScore),
      cohesion: Math.max(0, cohesionScore),
      bench: Math.max(0, benchScore),
      total: Math.max(0, totalSynergyIndex),
      startersCount: totalStarters,
      subsCount: totalSubs,
      avgStartersRating,
      avgSubsRating,
      filledRoles,
      requiredRoles
    };
  };

  const synergyBreakdown = calculateSynergyBreakdown();
  const synergyRating = synergyBreakdown.total;

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

  // Filter and sort available players to assign
  const activeSlotRole = (selectedSlotId !== null && selectedSlotId < 12)
    ? activeSlots.find(s => s.id === selectedSlotId)?.role
    : null;
  const assignedPlayerIds = new Set(Object.values(assignedPlayers).map((p) => (p as Player).id));
  const filteredPlayers = allPlayers
    .filter((p: Player) => {
      if (assignedPlayerIds.has(p.id)) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q) || p.position.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (activeSlotRole) {
        const priorities = POSITION_PRIORITY[activeSlotRole];
        const diff = (priorities[a.position] ?? 4) - (priorities[b.position] ?? 4);
        if (diff !== 0) return diff;
      }
      return b.rating - a.rating;
    });

  return (
    <div className="space-y-5">

      {/* Main Pitch view & selector split - Larger Pitch Column allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] xl:grid-cols-[1.65fr_1fr] gap-6 items-stretch">
        
        {/* Pitch Canvas container */}
        <div className="bg-[#151619] border border-[#202124] rounded-xl p-4 md:p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
          
          {/* Controls Bar */}
          <div className="w-full flex justify-between items-center bg-slate-950 border border-slate-850 p-3 rounded-xl mb-6 z-10 gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Formation:</span>
              <div className="relative">
                <select
                  value={activeFormation}
                  onChange={(e) => { setActiveFormation(e.target.value); setAssignedPlayers({}); }}
                  style={{ colorScheme: 'dark' }}
                  className="bg-[#0c0d12] border border-slate-800 hover:border-brand-500/50 text-slate-100 font-extrabold text-xs px-3.5 py-1.5 pr-9 rounded-xl appearance-none outline-none cursor-pointer transition duration-200"
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

            {/* Player pool filter + reset */}
            <div className="flex gap-2 text-xs items-center">
              <div className="flex gap-1">
                {(Object.keys(FILTER_LABELS) as PlayerFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFilterChange(f)}
                    disabled={!!loadingFilter || autoFilling}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      playerFilter === f
                        ? 'bg-brand-500/20 text-brand-400 border-brand-500/50'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    {loadingFilter === f && <Sparkles className="w-3 h-3 animate-spin" />}
                    {FILTER_LABELS[f]}
                  </button>
                ))}
              </div>

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
          <div className="relative w-full max-w-[880px] aspect-[100/62] bg-[#1a3824] border-4 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-radial-gradient">
            {/* Texture Pitch Lines */}
            <div className="absolute inset-x-0 inset-y-0 opacity-15 pointer-events-none border-x border-dashed border-white/40" />
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 -translate-x-1/2 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-28 h-28 border-2 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" /> {/* unslop-ignore: literal pitch center-circle marking */}
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
                      <div className={`relative w-11 h-11 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center font-bold text-center text-xs md:text-sm shadow-xl transition overflow-hidden motion-safe:group-hover:scale-105 ${
                        isSelected
                          ? 'bg-brand-500 text-white border-white'
                          : playerFilter === 'nep-women'
                          ? 'bg-gradient-to-br from-pink-600 to-pink-500 text-white border-pink-400'
                          : 'bg-gradient-to-br from-brand-600 to-brand-400 text-white border-brand-400'
                      }`}>
                        
                        {/* Jersey Number overlay */}
                        <span className="font-extrabold drop-shadow">
                          {assignedPlayer.number}
                        </span>

                        {/* rating pill */}
                        <span className="absolute -bottom-1 tracking-tighter text-[8px] font-mono font-black bg-black border border-slate-800 text-amber-400 px-1 rounded-md scale-90">
                          {assignedPlayer.rating}
                        </span>

                        {/* Top right remove handle on hover */}
                        <button
                          onClick={(e) => handleClearSlot(slot.id, e)}
                          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 hover:scale-110 bg-black/80 rounded-full p-1 text-red-400 border border-red-500/20 transition duration-150" // unslop-ignore: circular icon button, not a decorative pill default
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
                      <div /* unslop-ignore: circular avatar placeholder, not a decorative pill default */ className={`w-10 h-10 rounded-full border border-dashed flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-brand-500/20 border-brand-400 scale-105 text-brand-400 ring-2 ring-brand-500/25'
                          : 'bg-slate-950/60 border-white hover:bg-slate-900 text-white hover:border-brand-500/40'
                      }`}>
                        <Plus className="w-4 h-4 animate-pulse" />
                      </div>
                      
                      <span className="bg-slate-950/70 border border-slate-900 px-1 py-0.5 rounded text-[8.5px] font-mono tracking-wider font-extrabold text-white mt-1">
                        {slot.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Substitutes Bench section */}
          <div className="w-full mt-6 bg-slate-950/60 border border-slate-900 rounded-xl p-4 md:p-5 shadow-lg relative z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] bg-brand-500/10 text-brand-400 font-mono font-black rounded border border-brand-500/20 uppercase tracking-wider">Bench</span>
                <h4 className="text-xs font-extrabold text-slate-100 uppercase tracking-widest font-sans">Substitutes (Max 5)</h4>
              </div>
              <span className="text-[9.5px] text-slate-500 font-mono">Click slots below to select subs</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {SUB_SLOTS.map((subSlot) => {
                const assignedPlayer = assignedPlayers[subSlot.id];
                const isSelected = selectedSlotId === subSlot.id;
                const isWomen = playerFilter === 'nep-women';

                return (
                  <div
                    key={subSlot.id}
                    onClick={() => handleSelectSlot(subSlot.id)}
                    className={`group relative rounded-xl p-3 flex flex-col items-center justify-between min-h-[96px] cursor-pointer transition border select-none ${
                      assignedPlayer
                        ? isSelected
                          ? 'bg-brand-950/40 border-brand-400 shadow-md scale-[1.02]'
                          : isWomen
                          ? 'bg-gradient-to-b from-pink-950/20 to-pink-950/5 border-pink-500/20 hover:border-pink-500/40'
                          : 'bg-gradient-to-b from-brand-950/20 to-brand-950/5 border-brand-500/20 hover:border-brand-500/40'
                        : isSelected
                        ? 'bg-brand-500/10 border-brand-400 scale-[1.02]'
                        : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900 hover:border-slate-800'
                    }`}
                  >
                    {assignedPlayer ? (
                      <div className="w-full flex flex-col items-center relative">
                        {/* Little avatar elements matching male/female design */}
                        <div /* unslop-ignore: circular avatar, not a decorative pill default */ className={`w-9 h-9 rounded-full border flex items-end justify-center overflow-hidden mb-1 relative ${
                          isWomen
                            ? 'bg-gradient-to-b from-pink-900/40 to-pink-950 border-pink-500/20'
                            : 'bg-gradient-to-b from-brand-900/40 to-brand-950 border-brand-500/20'
                        }`}>
                          <DummyPlayerAvatar
                            className="w-[90%] h-[90%] absolute bottom-0 object-contain drop-shadow"
                            gender={isWomen ? 'female' : 'male'}
                          />
                        </div>

                        {/* Player Surname tag */}
                        <span className="text-[10px] font-bold text-slate-100 text-center truncate max-w-full leading-none mb-1 px-1">
                          {assignedPlayer.name.split(' ').pop()}
                        </span>

                        {/* Technical indicators: Position, Rating */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[8px] font-black text-slate-500 uppercase tracking-wide bg-slate-900 px-1 rounded border border-slate-850">
                            {assignedPlayer.position}
                          </span>
                          <span className="text-[8.5px] font-mono font-black text-amber-500">
                            ⭐{assignedPlayer.rating}
                          </span>
                        </div>

                        {/* Close clear button handle */}
                        <button
                          onClick={(e) => handleClearSlot(subSlot.id, e)}
                          className="absolute -top-4 right-0 lg:opacity-0 lg:group-hover:opacity-100 bg-black/80 rounded-full p-1 text-red-400 border border-red-500/20 transition duration-150 cursor-pointer" // unslop-ignore: circular icon button, not a decorative pill default
                          title="Remove substitute"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center my-auto">
                        <div /* unslop-ignore: circular placeholder, not a decorative pill default */ className={`w-6 h-6 rounded-full border border-dashed flex items-center justify-center mb-1 text-slate-500 transition ${
                          isSelected ? 'border-brand-400 text-brand-400 bg-brand-500/15' : 'border-slate-700 hover:border-slate-500'
                        }`}>
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[8.5px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                          {subSlot.label}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDEBAR DRAFT SELECTOR PANEL */}
        <div className="bg-[#151619] border border-[#202124] rounded-xl p-5 flex flex-col h-auto min-h-[550px] justify-between shadow-2xl relative">
          
          {selectedSlotId !== null ? (
            <div className="flex flex-col h-full justify-between">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold text-brand-400 uppercase block">DRAFTING POSITION</span>
                    <h4 className="text-xs font-bold text-white">
                      Select player for: <span className="text-brand-400">
                        {selectedSlotId >= 12 
                          ? `Substitute ${selectedSlotId - 11}` 
                          : activeSlots.find(s => s.id === selectedSlotId)?.label}
                      </span>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-brand-500"
                  />
                </div>

                {/* Scrollable list */}
                <div className="overflow-y-auto max-h-[calc(100vh-290px)] divide-y divide-slate-800/45 scrollbar-thin scrollbar-thumb-slate-850">
                  {filteredPlayers.length === 0 ? (
                    <div className="p-8 text-center text-slate-600">
                      <p className="text-xs">No star match</p>
                    </div>
                  ) : (
                    filteredPlayers.map((p: Player) => {
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
                          <div className="font-mono text-xs font-bold text-brand-400 uppercase shrink-0">
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
                <h5 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider font-sans">Tactics Dashboard Active</h5>
                <p className="text-xs text-slate-400 mt-2 max-w-[240px] leading-relaxed select-none">
                  Click on any node on the pitch to select and assign roster players.
                </p>
                
                <button 
                  onClick={handleLoadDefaults}
                  className="mt-5 bg-brand-500 hover:bg-brand-400 text-white font-extrabold font-sans text-xs px-4.5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-150"
                >
                  <span>Auto Pick XI</span>
                </button>
              </div>

              {/*  Synergy & Cohesion metrics placed below Tactics Dashboard Active */}
              <div className="border-t border-slate-800/80 pt-4 space-y-4">
                <span className="text-[10px] font-mono tracking-widest text-white font-bold uppercase block text-center">Team Cohesion Analytics</span>
                
                {/* Team Synergy rating */}
                <div className="bg-slate-950/85 border border-slate-900 rounded-xl p-4 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-xl rounded-full" /> {/* unslop-ignore: decorative blur orb, meant to be circular */}

                  <div className="flex justify-between items-center z-10 relative">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-mono text-brand-400 font-bold">TACTICAL CALIBRATION</span>
                      <span className="text-xs font-bold text-slate-400">Synergy Index</span>
                    </div>
                    <span className="text-xl font-black text-brand-400 font-mono tracking-tight">{synergyRating}%</span>
                  </div>

                  <div className="w-full bg-slate-900 h-2 rounded-full mt-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500" // unslop-ignore: progress-bar fill, conventional fully-rounded caps
                      style={{ width: `${synergyRating}%` }}
                    />
                  </div>

                  {/* Elegant detailed formula list */}
                  <div className="mt-3.5 space-y-1.5 pt-3 border-t border-slate-900/60 text-[10px]">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {/* unslop-ignore: one of 4 categorical legend colors (matched to blue/pink/amber below) — kept green so it stays distinct from the blue dot, not a brand accent */}
                        Base OVR Power (50% max)
                      </span>
                      <span className="font-mono text-slate-200">{synergyBreakdown.strength}%</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Role-Based Balance (25% max)
                      </span>
                      <span className="font-mono text-slate-200">{synergyBreakdown.roleBalance}%</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                        Squad Club Cohesion (15% max)
                      </span>
                      <span className="font-mono text-slate-200">{synergyBreakdown.cohesion}%</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Bench Flexibility (10% max)
                      </span>
                      <span className="font-mono text-slate-200">{synergyBreakdown.bench}%</span>
                    </div>
                  </div>
                </div>

                {/* Sub status details when active */}
                <div className="bg-[#111215]/80 rounded-xl p-3 border border-slate-900 flex flex-col gap-2">
                  <div className="flex items-center gap-2 justify-between text-[10.5px]">
                    <span className="text-slate-400 font-medium">Starter Average:</span>
                    <span className="font-mono font-bold text-slate-200">⭐ {synergyBreakdown.avgStartersRating > 0 ? (synergyBreakdown.avgStartersRating).toFixed(1) : '0.0'}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-between text-[10.5px]">
                    <span className="text-slate-400 font-medium">Subs Average:</span>
                    <span className="font-mono font-bold text-amber-500 font-medium">⭐ {synergyBreakdown.avgSubsRating > 0 ? (synergyBreakdown.avgSubsRating).toFixed(1) : '0.0'}</span>
                  </div>
                </div>

                {/* Assigned players and Value synergy counters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/85 border border-slate-900 p-3 rounded-xl text-center shadow-inner flex flex-col justify-center">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block mb-1 tracking-wider leading-none">Roster Depth</span>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-sm font-extrabold text-slate-200 font-mono">{synergyBreakdown.startersCount}</span>
                      <span className="text-[10px] text-slate-500 font-mono">/ 11</span>
                    </div>
                    <span className="text-[8.5px] text-slate-500 block font-sans mt-0.5">+{synergyBreakdown.subsCount}/5 Subs</span>
                  </div>

                  <div className="bg-slate-950/85 border border-slate-900 p-3 rounded-xl text-center shadow-inner flex flex-col justify-center">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block mb-1 tracking-wider leading-none">Squad Worth</span>
                    <span className="text-sm font-extrabold text-amber-500 font-mono">{squadValue}</span>
                    <span className="text-[8.5px] text-slate-500 block font-sans mt-1">Starters + Subs</span>
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
