import { useEffect, useState } from 'react';
import { playerAPI } from '@services/api';

interface PlayerPair {
  p1: string;
  p2: string;
  synergy: 'high' | 'medium' | 'low';
}

interface SynergyMatrixProps {
  playerIds: string[];
}

const SYNERGY_COLORS = {
  high: { bg: 'bg-green-900/20', border: 'border-green-700', badge: 'badge', class: 'text-semantic-good' },
  medium: { bg: 'bg-yellow-900/20', border: 'border-yellow-700', badge: 'badge', class: 'text-semantic-draw' },
  low: { bg: 'bg-gray-900/20', border: 'border-gray-700', badge: 'badge', class: 'text-text-muted' },
};

const SYNERGY_LABELS = {
  high: 'High Synergy',
  medium: 'Medium Synergy',
  low: 'Low Synergy',
};

export default function SynergyMatrix({ playerIds }: SynergyMatrixProps) {
  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState<PlayerPair[]>([]);
  const [error, setError] = useState('');
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSynergy = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch player names
        const nameMap: Record<string, string> = {};
        for (const id of playerIds) {
          try {
            const res = await playerAPI.getById(id);
            nameMap[id] = res.data.data.name || id;
          } catch {
            nameMap[id] = id;
          }
        }
        setPlayerNames(nameMap);

        // Fetch cluster data
        const res = await playerAPI.compare(playerIds);
        const data = res.data.data;

        // Generate pairs from synergy data
        const synergyPairs: PlayerPair[] = [];

        if (data.synergy_pairs) {
          // Extract pairs from backend response
          data.synergy_pairs.forEach((pair: [string, string]) => {
            synergyPairs.push({
              p1: pair[0],
              p2: pair[1],
              synergy: 'high',
            });
          });
        }

        // Add same-cluster pairs (medium synergy)
        if (data.clusters) {
          Object.values(data.clusters).forEach((cluster: any) => {
            if (Array.isArray(cluster)) {
              for (let i = 0; i < cluster.length; i++) {
                for (let j = i + 1; j < cluster.length; j++) {
                  if (!synergyPairs.some(p => (p.p1 === cluster[i] && p.p2 === cluster[j]) || (p.p1 === cluster[j] && p.p2 === cluster[i]))) {
                    synergyPairs.push({
                      p1: cluster[i],
                      p2: cluster[j],
                      synergy: 'medium',
                    });
                  }
                }
              }
            }
          });
        }

        // Add low synergy for remaining pairs
        for (let i = 0; i < playerIds.length; i++) {
          for (let j = i + 1; j < playerIds.length; j++) {
            if (
              !synergyPairs.some(
                p =>
                  (p.p1 === playerIds[i] && p.p2 === playerIds[j]) ||
                  (p.p1 === playerIds[j] && p.p2 === playerIds[i])
              )
            ) {
              synergyPairs.push({
                p1: playerIds[i],
                p2: playerIds[j],
                synergy: 'low',
              });
            }
          }
        }

        setPairs(synergyPairs);
      } catch (err) {
        console.error('Failed to fetch synergy data:', err);
        setError('Failed to load synergy matrix');
      } finally {
        setLoading(false);
      }
    };

    fetchSynergy();
  }, [playerIds]);

  if (loading) {
    return (
      <div className="card">
        <p className="text-text-secondary text-sm text-center py-6">Loading synergy data...</p>
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

  if (pairs.length === 0) {
    return (
      <div className="card">
        <p className="text-text-secondary text-sm text-center py-6">No synergy data available</p>
      </div>
    );
  }

  // Group pairs by synergy level
  const highSynergy = pairs.filter(p => p.synergy === 'high');
  const mediumSynergy = pairs.filter(p => p.synergy === 'medium');
  const lowSynergy = pairs.filter(p => p.synergy === 'low');

  const PairList = ({ items, level }: { items: PlayerPair[]; level: keyof typeof SYNERGY_COLORS }) => (
    <div>
      <h4 className="text-sm font-semibold text-text-primary mb-2">{SYNERGY_LABELS[level]}</h4>
      <div className="space-y-2">
        {items.map((pair, idx) => (
          <div key={idx} className={`p-3 rounded border ${SYNERGY_COLORS[level].bg} ${SYNERGY_COLORS[level].border}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-primary">
                {playerNames[pair.p1]} ↔ {playerNames[pair.p2]}
              </p>
              <span className={`badge text-xs ${SYNERGY_COLORS[level].class}`}>{level}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-text-primary mb-6">Player Synergy Matrix (K-Means)</h3>

      <div className="space-y-6">
        {highSynergy.length > 0 && <PairList items={highSynergy} level="high" />}
        {mediumSynergy.length > 0 && <PairList items={mediumSynergy} level="medium" />}
        {lowSynergy.length > 0 && <PairList items={lowSynergy} level="low" />}
      </div>

      <p className="text-text-secondary text-xs mt-6 pt-4 border-t border-dark-border">
        Synergy calculated using K-Means clustering. High synergy = same cluster. Medium = adjacent clusters. Low = different clusters.
      </p>
    </div>
  );
}
