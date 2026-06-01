import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { playerAPI } from '@services/api';

interface Player {
  name: string;
  position: string;
  goals: number;
  assists: number;
}

interface XGChartData {
  name: string;
  actual: number;
  xG: number;
}

interface XGChartProps {
  playerId: string;
}

export default function XGChart({ playerId }: XGChartProps) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<XGChartData>({
    name: '',
    actual: 0,
    xG: 0,
  });
  const [similarPlayers, setSimilarPlayers] = useState<Player[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await playerAPI.getAnalytics(playerId);
        const data = res.data.data;

        // Get player actual goals
        const player = await playerAPI.getById(playerId);
        const actualGoals = player.data.data.stats?.goals || 0;

        setChartData({
          name: data.role || 'Player',
          actual: actualGoals,
          xG: data.xG || 0,
        });

        setSimilarPlayers(data.similar_players || []);
      } catch (err) {
        console.error('Failed to fetch xG data:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [playerId]);

  if (loading) {
    return (
      <div className="card">
        <p className="text-text-secondary text-sm text-center py-6">Loading xG data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p className="text-semantic-loss text-sm text-center py-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Goals vs Expected Goals (xG)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[chartData]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3E52" />
            <XAxis dataKey="name" stroke="#94A3B8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94A3B8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1A2332', border: '1px solid #334155', borderRadius: '4px' }}
              labelStyle={{ color: '#F1F5F9' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="actual" fill="#C8102E" name="Actual Goals" radius={[4, 4, 0, 0]} />
            <Bar dataKey="xG" fill="#003893" name="Expected Goals (xG)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Similar Players */}
      {similarPlayers.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Similar Players (KNN)</h3>
          <div className="space-y-3">
            {similarPlayers.slice(0, 5).map((player, idx) => (
              <div key={idx} className="flex justify-between items-center pb-3 border-b border-dark-border last:border-b-0">
                <div>
                  <p className="text-text-primary font-medium">{player.name}</p>
                  <p className="text-text-secondary text-xs">{player.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-nepal-red font-semibold">{player.goals}</p>
                  <p className="text-text-secondary text-xs">goals</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
