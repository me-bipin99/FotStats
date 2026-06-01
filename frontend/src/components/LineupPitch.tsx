interface Player {
  playerId?: string;
  name: string;
  position: string;
}

interface LineupPitchProps {
  lineup: Player[];
  formation: string;
}

const POSITION_COLORS = {
  GK: '#64748B',
  DEF: '#10B981',
  MID: '#003893',
  FWD: '#C8102E',
};

const FORMATION_COORDS: Record<string, Record<string, Array<[number, number]>>> = {
  '4-3-3': {
    GK: [[50, 10]],
    DEF: [[20, 30], [35, 30], [65, 30], [80, 30]],
    MID: [[30, 55], [50, 50], [70, 55]],
    FWD: [[25, 80], [50, 85], [75, 80]],
  },
  '4-4-2': {
    GK: [[50, 10]],
    DEF: [[20, 30], [35, 30], [65, 30], [80, 30]],
    MID: [[20, 55], [35, 60], [65, 60], [80, 55]],
    FWD: [[35, 80], [65, 80]],
  },
  '4-2-3-1': {
    GK: [[50, 10]],
    DEF: [[20, 30], [35, 30], [65, 30], [80, 30]],
    MID: [[35, 50], [65, 50], [25, 65], [50, 70], [75, 65]],
    FWD: [[50, 85]],
  },
  '3-5-2': {
    GK: [[50, 10]],
    DEF: [[30, 30], [50, 25], [70, 30]],
    MID: [[20, 55], [35, 60], [50, 65], [65, 60], [80, 55]],
    FWD: [[35, 85], [65, 85]],
  },
};

export default function LineupPitch({ lineup, formation }: LineupPitchProps) {
  const coords = FORMATION_COORDS[formation] || FORMATION_COORDS['4-3-3'];

  // Organize players by position
  const playersByPosition: Record<string, Player[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };

  lineup.forEach(player => {
    const pos = player.position || 'FWD';
    const key = pos === 'GK' ? 'GK' : pos === 'DEF' ? 'DEF' : pos === 'MID' ? 'MID' : 'FWD';
    if (playersByPosition[key]) {
      playersByPosition[key].push(player);
    }
  });

  // Map players to coordinates
  const playerPositions: Array<{ player: Player; x: number; y: number; color: string }> = [];

  Object.keys(playersByPosition).forEach(pos => {
    const players = playersByPosition[pos];
    const positions = coords[pos] || [];

    players.forEach((player, idx) => {
      if (idx < positions.length) {
        const [x, y] = positions[idx];
        playerPositions.push({
          player,
          x,
          y,
          color: POSITION_COLORS[pos as keyof typeof POSITION_COLORS] || '#64748B',
        });
      }
    });
  });

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Formation: {formation}</h3>
        <span className="text-text-secondary text-xs">{lineup.length} players</span>
      </div>

      <svg viewBox="0 0 100 100" className="w-full bg-green-900 rounded" style={{ aspectRatio: '1/1.5' }}>
        {/* Pitch lines */}
        <line x1="0" y1="0" x2="100" y2="0" stroke="#F1F5F9" strokeWidth="0.5" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="#F1F5F9" strokeWidth="0.5" />
        <line x1="0" y1="0" x2="0" y2="100" stroke="#F1F5F9" strokeWidth="0.5" />
        <line x1="100" y1="0" x2="100" y2="100" stroke="#F1F5F9" strokeWidth="0.5" />

        {/* Center line */}
        <line x1="50" y1="0" x2="50" y2="100" stroke="#F1F5F9" strokeWidth="0.5" />

        {/* Center circle */}
        <circle cx="50" cy="50" r="8" fill="none" stroke="#F1F5F9" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="0.5" fill="#F1F5F9" />

        {/* Penalty boxes (left) */}
        <rect x="0" y="25" width="15" height="50" fill="none" stroke="#F1F5F9" strokeWidth="0.5" />
        <rect x="0" y="35" width="5" height="30" fill="none" stroke="#F1F5F9" strokeWidth="0.5" />

        {/* Penalty boxes (right) */}
        <rect x="85" y="25" width="15" height="50" fill="none" stroke="#F1F5F9" strokeWidth="0.5" />
        <rect x="95" y="35" width="5" height="30" fill="none" stroke="#F1F5F9" strokeWidth="0.5" />

        {/* Players */}
        {playerPositions.map((item, idx) => (
          <g key={idx}>
            {/* Circle */}
            <circle cx={item.x} cy={item.y} r="3.5" fill={item.color} stroke="#F1F5F9" strokeWidth="0.3" />

            {/* Player number/initial */}
            <text
              x={item.x}
              y={item.y + 0.8}
              textAnchor="middle"
              fontSize="2"
              fill="#F1F5F9"
              fontWeight="bold"
              className="pointer-events-none"
            >
              {(idx + 1).toString()}
            </text>

            {/* Player name (small) */}
            <text
              x={item.x}
              y={item.y + 6}
              textAnchor="middle"
              fontSize="1.2"
              fill="#F1F5F9"
              className="pointer-events-none"
            >
              {item.player.name.split(' ').pop()?.substring(0, 8) || ''}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-dark-border">
        <div className="text-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#64748B' }} />
            <span className="text-text-secondary">GK</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
            <span className="text-text-secondary">DEF</span>
          </div>
        </div>
        <div className="text-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#003893' }} />
            <span className="text-text-secondary">MID</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C8102E' }} />
            <span className="text-text-secondary">FWD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
