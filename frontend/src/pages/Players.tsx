import { useEffect, useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { playerAPI } from '@services/api';
import XGChart from '@components/XGChart';
import HeatmapCanvas from '@components/HeatmapCanvas';

interface Player {
  _id: string;
  playerId: string;
  name: string;
  position: string;
  stats: any;
  roleClassification?: { primaryRole: string };
}

const POSITION_BADGES = {
  GK: 'badge-gk',
  DEF: 'badge-def',
  MID: 'badge-mid',
  FWD: 'badge-fwd',
};

export default function Players() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [positionFilter, setPositionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const res = await playerAPI.getAll(page, ITEMS_PER_PAGE);
        const data = res.data.data;
        setPlayers(data.players || []);
        setTotalPages(data.pagination?.pages || 1);
        setSelectedPlayer(null);
      } catch (error) {
        console.error('Failed to fetch players:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [page]);

  useEffect(() => {
    let filtered = players;
    if (positionFilter) {
      filtered = players.filter(p => p.position === positionFilter);
    }
    setFilteredPlayers(filtered);
  }, [players, positionFilter]);

  const getRadarData = (player: Player) => {
    return [
      { name: 'Goals', value: Math.min((player.stats?.goals || 0) * 5, 100) },
      { name: 'Assists', value: Math.min((player.stats?.assists || 0) * 10, 100) },
      { name: 'Caps', value: Math.min((player.stats?.caps || 0) / 0.74, 100) },
      { name: 'ELO', value: Math.min((player.stats?.eloRating || 0) / 3, 100) },
      { name: 'Pass Acc', value: player.stats?.passAccuracy || 0 },
    ];
  };

  if (loading && players.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-8 w-8 border-2 border-nepal-red border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <main className="bg-dark-primary min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Players</h1>
          <p className="text-text-secondary text-sm">Nepali National Team Squad</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={positionFilter}
            onChange={(e) => {
              setPositionFilter(e.target.value);
              setPage(1);
            }}
            className="input py-2 px-3 text-sm"
          >
            <option value="">All Positions</option>
            <option value="GK">Goalkeeper</option>
            <option value="DEF">Defender</option>
            <option value="MID">Midfielder</option>
            <option value="FWD">Forward</option>
          </select>
          <div className="flex-1" />
          <span className="text-text-secondary text-sm py-2">
            {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players Table */}
          <div className="lg:col-span-2">
            <div className="card">
              <table className="w-full text-sm">
                <thead className="table-head">
                  <tr>
                    <th>Name</th>
                    <th>Pos</th>
                    <th className="text-right">Caps</th>
                    <th className="text-right">Goals</th>
                    <th className="text-right">ELO</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr
                      key={player._id}
                      className="table-row hover:bg-dark-tertiary cursor-pointer transition-colors"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <td className="font-medium text-text-primary">{player.name}</td>
                      <td>
                        <span className={`badge ${POSITION_BADGES[player.position as keyof typeof POSITION_BADGES]}`}>
                          {player.position}
                        </span>
                      </td>
                      <td className="text-right">{player.stats?.caps || 0}</td>
                      <td className="text-right text-nepal-red font-semibold">{player.stats?.goals || 0}</td>
                      <td className="text-right">{Math.round(player.stats?.eloRating || 0)}</td>
                      <td className="text-text-secondary text-xs">{player.roleClassification?.primaryRole || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPlayers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-text-secondary mb-4">No players found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-sm btn-secondary disabled:opacity-50"
                >
                  ← Prev
                </button>
                <span className="text-text-secondary text-sm py-2 px-4">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-sm btn-secondary disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedPlayer && (
            <div className="card sticky top-8 h-fit">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-text-primary mb-2">{selectedPlayer.name}</h2>
                <span className={`badge ${POSITION_BADGES[selectedPlayer.position as keyof typeof POSITION_BADGES]}`}>
                  {selectedPlayer.position}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="space-y-4 mb-6 border-b border-dark-border pb-6">
                <div>
                  <p className="text-text-secondary text-xs mb-1">International Caps</p>
                  <p className="text-stat">{selectedPlayer.stats?.caps || 0}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-xs mb-1">Goals</p>
                  <p className="text-stat text-nepal-red">{selectedPlayer.stats?.goals || 0}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-xs mb-1">Assists</p>
                  <p className="text-stat">{selectedPlayer.stats?.assists || 0}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-xs mb-1">ELO Rating</p>
                  <p className="text-stat text-nepal-blue">{Math.round(selectedPlayer.stats?.eloRating || 0)}</p>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-text-secondary mb-3 uppercase">Performance</p>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={getRadarData(selectedPlayer)}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="name" stroke="#94A3B8" style={{ fontSize: '10px' }} />
                    <PolarRadiusAxis stroke="#334155" style={{ fontSize: '10px' }} />
                    <Radar name="Stats" dataKey="value" stroke="#C8102E" fill="#C8102E" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Visualization Components - Full Width Below */}
        {selectedPlayer && (
          <div className="lg:col-span-3 space-y-6 mt-6">
            <XGChart playerId={selectedPlayer.playerId} />
            <HeatmapCanvas playerId={selectedPlayer.playerId} position={selectedPlayer.position} role={selectedPlayer.roleClassification?.primaryRole} />
          </div>
        )}
      </div>
    </main>
  );
}
