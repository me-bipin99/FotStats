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
        <div className="text-slate-400">Loading players...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Players</h1>
          <p className="text-slate-400">Nepali National Team Squad</p>
        </div>

        {/* Position Filter */}
        <div className="mb-6">
          <select
            value={positionFilter}
            onChange={(e) => handlePositionFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-4 py-2 text-slate-100"
          >
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700 border-b border-slate-600">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Pos</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Caps</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Goals</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">ELO</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map(player => (
                  <tr key={player._id} className="border-b border-slate-700 hover:bg-slate-700">
                    <td className="px-6 py-4 text-sm text-slate-100">{player.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{player.position}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{player.caps}</td>
                    <td className="px-6 py-4 text-sm text-red-400">{player.goals}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{player.eloRating}</td>
                    <td className="px-6 py-4 text-sm text-blue-400">{player.roleClassification?.primaryRole}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
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
            className="px-4 py-2 bg-slate-700 text-slate-300 rounded disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="text-slate-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-slate-700 text-slate-300 rounded disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
