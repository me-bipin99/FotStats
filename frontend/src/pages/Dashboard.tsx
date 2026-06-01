import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { playerAPI, teamAPI, matchAPI, insightAPI } from '@services/api';

interface DashboardStats {
  totalPlayers: number;
  totalTeams: number;
  totalMatches: number;
  predictionAccuracy: number;
}

interface TopGoalScorer {
  name: string;
  goals: number;
}

interface PositionDistribution {
  position: string;
  count: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    totalTeams: 0,
    totalMatches: 0,
    predictionAccuracy: 0,
  });
  const [topScorers, setTopScorers] = useState<TopGoalScorer[]>([]);
  const [positionDist, setPositionDist] = useState<PositionDistribution[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch players
        const playersRes = await playerAPI.getAll(1, 200);
        const players = playersRes.data.data.players || [];

        // Fetch teams
        const teamsRes = await teamAPI.getAll();
        const teams = teamsRes.data.data.teams || [];

        // Fetch matches
        const matchesRes = await matchAPI.getAll(1, 200);
        const matches = matchesRes.data.data.matches || [];

        // Calculate position distribution
        const posCounts: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
        players.forEach((p: any) => {
          if (p.position && posCounts[p.position] !== undefined) {
            posCounts[p.position]++;
          }
        });

        setPositionDist([
          { position: 'GK', count: posCounts.GK },
          { position: 'DEF', count: posCounts.DEF },
          { position: 'MID', count: posCounts.MID },
          { position: 'FWD', count: posCounts.FWD },
        ]);

        // Sort by goals (approximation using stats)
        const scorers = players
          .filter((p: any) => p.stats?.goals > 0)
          .sort((a: any, b: any) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
          .slice(0, 10)
          .map((p: any) => ({ name: p.name, goals: p.stats?.goals || 0 }));

        setTopScorers(scorers);

        setStats({
          totalPlayers: players.length,
          totalTeams: teams.length,
          totalMatches: matches.length,
          predictionAccuracy: 0, // Will be fetched separately if needed
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const algorithms = [
    { name: 'KNN', desc: 'xG & Similarity' },
    { name: 'K-Means', desc: 'Player Clustering' },
    { name: 'Naive Bayes', desc: 'Match Prediction' },
    { name: 'ELO', desc: 'Player Ratings' },
    { name: 'Genetic Algorithm', desc: 'Squad Optimization' },
  ];

  const POSITION_COLORS = {
    GK: '#64748B',
    DEF: '#10B981',
    MID: '#003893',
    FWD: '#C8102E',
  };

  return (
    <main className="bg-[#0c0d10] min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Dashboard</h1>
          <p className="text-slate-500 text-sm">Nepali National Team Analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card-compact">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Total Players</p>
            <p className="text-stat text-[#C8102E]">{stats.totalPlayers}</p>
          </div>
          <div className="card-compact">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Teams</p>
            <p className="text-stat text-blue-400">{stats.totalTeams}</p>
          </div>
          <div className="card-compact">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Matches</p>
            <p className="text-stat text-slate-300">{stats.totalMatches}</p>
          </div>
          <div className="card-compact">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Prediction Accuracy</p>
            <p className="text-stat text-emerald-400">{stats.predictionAccuracy}%</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Scorers Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Top 10 Goal Scorers</h2>
            {topScorers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topScorers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3E52" />
                  <XAxis dataKey="name" stroke="#94A3B8" style={{ fontSize: '12px' }} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#94A3B8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A2332', border: '1px solid #334155', borderRadius: '4px' }}
                    labelStyle={{ color: '#F1F5F9' }}
                  />
                  <Bar dataKey="goals" fill="#C8102E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-secondary text-sm py-8 text-center">No scorer data available</p>
            )}
          </div>

          {/* Position Distribution Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Player Distribution by Position</h2>
            {positionDist.some(p => p.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={positionDist}
                    dataKey="count"
                    nameKey="position"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {positionDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={POSITION_COLORS[entry.position as keyof typeof POSITION_COLORS] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A2332', border: '1px solid #334155', borderRadius: '4px' }}
                    labelStyle={{ color: '#F1F5F9' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-secondary text-sm py-8 text-center">No position data available</p>
            )}
          </div>
        </div>

        {/* Algorithms Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">ML Algorithms (5 Total)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {algorithms.map((algo, idx) => (
              <div key={idx} className="bg-[#0c0d10] border border-[#202124] rounded-lg p-4 text-center hover:border-emerald-500/30 transition-all duration-150">
                <p className="text-emerald-400 font-semibold mb-1">{algo.name}</p>
                <p className="text-xs text-slate-500">{algo.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
