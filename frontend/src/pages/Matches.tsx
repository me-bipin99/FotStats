import { useEffect, useState } from 'react';
import { matchAPI } from '@services/api';

interface Team {
  _id: string;
  teamId: string;
  name: string;
}

interface Match {
  _id: string;
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  status: 'scheduled' | 'live' | 'completed';
  result?: { homeGoals: number; awayGoals: number };
  prediction?: {
    homeWin: number;
    draw: number;
    awayWin: number;
    confidence: number;
  };
}

const STATUS_COLORS = {
  scheduled: 'text-text-secondary',
  live: 'text-semantic-win',
  completed: 'text-text-primary',
};

export default function Matches() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [formation, setFormation] = useState('4-3-3');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await matchAPI.getAll(page, ITEMS_PER_PAGE);
        const data = res.data.data;
        setMatches(data.matches || []);
        setTotalPages(data.pagination?.pages || 1);
        setSelectedMatch(null);
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [page]);

  useEffect(() => {
    let filtered = matches;
    if (statusFilter) {
      filtered = matches.filter(m => m.status === statusFilter);
    }
    setFilteredMatches(filtered);
  }, [matches, statusFilter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getMatchResult = (match: Match) => {
    if (match.status !== 'completed' || !match.result) return '—';
    const { homeGoals, awayGoals } = match.result;
    return `${homeGoals} - ${awayGoals}`;
  };

  const getPredictionBars = (match: Match) => {
    if (!match.prediction) return null;
    const { homeWin, draw, awayWin } = match.prediction;
    const total = homeWin + draw + awayWin;
    const home = (homeWin / total) * 100;
    const d = (draw / total) * 100;
    const away = (awayWin / total) * 100;

    return (
      <div className="flex h-2 gap-1 rounded overflow-hidden mb-3">
        <div className="bg-nepal-red" style={{ width: `${home}%` }} />
        <div className="bg-semantic-draw" style={{ width: `${d}%` }} />
        <div className="bg-semantic-loss" style={{ width: `${away}%` }} />
      </div>
    );
  };

  if (loading && matches.length === 0) {
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
          <h1 className="text-2xl font-bold text-text-primary mb-2">Matches</h1>
          <p className="text-text-secondary text-sm">International Fixtures & Predictions</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input py-2 px-3 text-sm"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
          <div className="flex-1" />
          <span className="text-text-secondary text-sm py-2">
            {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matches Table */}
          <div className="lg:col-span-2">
            <div className="card">
              <table className="w-full text-sm">
                <thead className="table-head">
                  <tr>
                    <th>Date</th>
                    <th>Home</th>
                    <th>Away</th>
                    <th>Status</th>
                    <th className="text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => (
                    <tr
                      key={match._id}
                      className="table-row hover:bg-dark-tertiary cursor-pointer transition-colors"
                      onClick={() => setSelectedMatch(match)}
                    >
                      <td className="text-text-secondary text-xs">{formatDate(match.date)}</td>
                      <td className="font-medium text-text-primary">{match.homeTeam?.name || '—'}</td>
                      <td className="font-medium text-text-primary">{match.awayTeam?.name || '—'}</td>
                      <td>
                        <span className={`text-xs font-semibold uppercase ${STATUS_COLORS[match.status]}`}>
                          {match.status}
                        </span>
                      </td>
                      <td className="text-right font-semibold">{getMatchResult(match)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredMatches.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-text-secondary mb-4">No matches found</p>
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

          {/* Prediction Panel */}
          {selectedMatch && (
            <div className="card sticky top-8 h-fit">
              <div className="mb-6 pb-6 border-b border-dark-border">
                <p className="text-text-secondary text-xs mb-2 uppercase tracking-wider">Match</p>
                <h2 className="text-lg font-semibold text-text-primary mb-3">
                  {selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}
                </h2>
                <p className="text-sm text-text-secondary">{formatDate(selectedMatch.date)}</p>
                <p className="text-xs text-text-muted mt-1">{selectedMatch.status.toUpperCase()}</p>
              </div>

              {/* Prediction */}
              {selectedMatch.prediction ? (
                <>
                  <p className="text-xs font-semibold text-text-secondary mb-4 uppercase">Win Probability</p>

                  {getPredictionBars(selectedMatch)}

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-primary">{selectedMatch.homeTeam?.name}</span>
                      <span className="text-nepal-red font-semibold">
                        {(selectedMatch.prediction.homeWin * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-primary">Draw</span>
                      <span className="text-semantic-draw font-semibold">
                        {(selectedMatch.prediction.draw * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-primary">{selectedMatch.awayTeam?.name}</span>
                      <span className="text-semantic-loss font-semibold">
                        {(selectedMatch.prediction.awayWin * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-dark-border pt-4">
                    <p className="text-text-secondary text-xs mb-2 uppercase tracking-wider">Formation</p>
                    <select
                      value={formation}
                      onChange={(e) => setFormation(e.target.value)}
                      className="input w-full py-2 px-3 text-sm"
                    >
                      <option value="4-3-3">4-3-3</option>
                      <option value="4-4-2">4-4-2</option>
                      <option value="4-2-3-1">4-2-3-1</option>
                      <option value="3-5-2">3-5-2</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-secondary text-sm">No prediction available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
