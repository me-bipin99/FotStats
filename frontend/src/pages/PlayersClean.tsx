import { useEffect, useState } from 'react';
import { playerAPI } from '@services/api';
import { useAuthStore } from '@context/authContext';

interface Player {
  _id: string;
  name: string;
  position: string;
  caps: number;
  goals: number;
  eloRating: number;
  roleClassification?: { primaryRole: string };
}

export default function PlayersClean() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState('All Positions');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token = useAuthStore(state => state.token);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const res = await playerAPI.getAll(page, 20);
        const data = res.data.data;

        if (data.players && Array.isArray(data.players)) {
          setPlayers(data.players);
          setFilteredPlayers(data.players);
          setTotalPages(data.pagination?.pages || 1);
        }
      } catch (error) {
        console.error('Failed to fetch players:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [page, token]);

  const positions = ['All Positions', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

  const handlePositionFilter = (pos: string) => {
    setPositionFilter(pos);
    if (pos === 'All Positions') {
      setFilteredPlayers(players);
    } else {
      setFilteredPlayers(
        players.filter(p => p.position?.includes(pos) || p.position === pos)
      );
    }
  };

  if (loading && players.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const getPositionColor = (position: string): string => {
    switch (position?.toUpperCase()) {
      case 'GOALKEEPER':
      case 'GK':
        return '#64748B';
      case 'DEFENDER':
      case 'DEF':
        return '#10B981';
      case 'MIDFIELDER':
      case 'MID':
        return '#003893';
      case 'FORWARD':
      case 'FWD':
        return '#C8102E';
      default:
        return '#94A3B8';
    }
  };

  return (
    <main className="bg-[#0c0d10] min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Players</h1>
          <p className="text-slate-500 text-sm">Nepali National Team Squad</p>
        </div>

        {/* Position Filter */}
        <div className="mb-6">
          <select
            value={positionFilter}
            onChange={(e) => handlePositionFilter(e.target.value)}
            className="input"
          >
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Caps</th>
                <th>Goals</th>
                <th>ELO Rating</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map(player => (
                  <tr key={player._id} className="table-row">
                    <td className="table-body">{player.name}</td>
                    <td className="table-body">
                      <span
                        style={{ color: getPositionColor(player.position) }}
                        className="font-semibold"
                      >
                        {player.position}
                      </span>
                    </td>
                    <td className="table-body">{player.caps}</td>
                    <td className="table-body font-mono text-red-400">{player.goals}</td>
                    <td className="table-body font-mono text-emerald-400">{player.eloRating.toFixed(1)}</td>
                    <td className="table-body text-slate-400">{player.roleClassification?.primaryRole || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No players found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary btn-sm"
          >
            ← Prev
          </button>
          <span className="text-slate-400 text-sm">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary btn-sm"
          >
            Next →
          </button>
        </div>
      </div>
    </main>
  );
}
