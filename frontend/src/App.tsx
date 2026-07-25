import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MatchFeed from './components/MatchFeed';
import MatchDetails from './components/MatchDetails';
import PlayerComparison from './components/PlayerComparison';
import PlayerStats from './components/PlayerStats';
import LineupBuilder from './components/LineupBuilder';
import { getMatches } from './services/api';
import { Player, Match } from './types';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'compare' | 'stats' | 'lineups'>('home');
  const [selectedCategory, setSelectedCategory] = useState<'MEN' | 'WOMEN' | 'DOMESTIC' | 'ALL'>('ALL');
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [comparisonPlayers, setComparisonPlayers] = useState<Player[]>([]);

  useEffect(() => {
    setMatchesLoading(true);
    setMatchesError(null);
    getMatches({ limit: 50 })
      .then(({ matches: fetched }) => {
        setMatches(fetched);
        if (!selectedMatchId && fetched.length > 0) {
          setSelectedMatchId(fetched[0].id);
        }
      })
      .catch((err) => setMatchesError(err.message))
      .finally(() => setMatchesLoading(false));
  }, []);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  const handleSelectCategoryAndRoute = (category: 'MEN' | 'WOMEN' | 'DOMESTIC' | 'ALL') => {
    setSelectedCategory(category);
    setActiveTab('home');
    if (category !== 'ALL') {
      const first = matches.find((m) => m.category === category);
      if (first) setSelectedMatchId(first.id);
    }
  };

  const handleSelectComparePlayer = (player: Player, slot: 'A' | 'B') => {
    setComparisonPlayers((prev) => {
      const next = [...prev];
      if (slot === 'A') next[0] = player;
      else next[1] = player;
      return next;
    });
  };

  const handleClearCompareSlot = (slot: 'A' | 'B') => {
    setComparisonPlayers((prev) => {
      const next = [...prev];
      if (slot === 'A') next[0] = undefined as any;
      else next[1] = undefined as any;
      return next;
    });
  };

  const handleVoteCountsChange = useCallback((matchId: string, counts: { home: number; draw: number; away: number }) => {
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, predictionVotes: counts } : m)));
  }, []);

  const handleSelectPlayerFromTacticalPitch = (player: Player) => {
    setComparisonPlayers((prev) => {
      if (prev.some((p) => p?.id === player.id)) return prev;
      const next = [...prev];
      if (!next[0]) next[0] = player;
      else if (!next[1]) next[1] = player;
      else next[1] = player;
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0d0e10] text-slate-200 flex flex-col font-sans select-none antialiased selection:bg-brand-500/20 selection:text-brand-400">

      <Header activeTab={activeTab} onChangeTab={setActiveTab} />

      <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 py-6 md:px-6 xl:px-8 space-y-6">

        {activeTab === 'home' && (
          <div className="bg-[#151619] border border-slate-800/60 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              <span className="text-slate-500">
                Welcome to the <strong>FotNep Match Center</strong>. Highlighting live scopes, tactics planners, and biometric comparisons.
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 cursor-default">
              <span>⚽ FotNep Version v1.5</span>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 ${activeTab === 'home' ? 'lg:grid-cols-[290px_1fr]' : ''} gap-6 items-start`}>

          {activeTab === 'home' && (
            <div className="lg:sticky lg:top-[80px] space-y-6">
              {matchesError ? (
                <div className="bg-[#151619] border border-rose-800/40 rounded-xl p-6 text-center text-xs text-rose-400">
                  <p className="mb-2 font-bold">Could not load matches</p>
                  <p className="text-slate-500 mb-3">{matchesError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-1.5 mx-auto text-brand-400 hover:text-brand-300 transition"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                </div>
              ) : (
                <MatchFeed
                  matches={matches}
                  selectedMatchId={selectedMatchId}
                  onSelectMatch={handleSelectMatch}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategoryAndRoute}
                />
              )}
            </div>
          )}

          <div className="space-y-6">

            {activeTab === 'home' && (
              matchesLoading ? (
                <div className="bg-[#151619] border border-slate-800/60 rounded-xl p-12 text-center text-slate-500 text-sm animate-pulse">
                  Loading match data…
                </div>
              ) : selectedMatch ? (
                <MatchDetails
                  match={selectedMatch}
                  selectedPlayers={comparisonPlayers}
                  onSelectPlayerForComparison={handleSelectPlayerFromTacticalPitch}
                  onVoteCountsChange={handleVoteCountsChange}
                />
              ) : (
                <div className="bg-[#151619] border border-slate-800/60 rounded-xl p-12 text-center text-slate-500 text-sm">
                  No matches available. Make sure the database is seeded.
                </div>
              )
            )}

            {activeTab === 'compare' && (
              <PlayerComparison
                selectedPlayers={comparisonPlayers}
                onSelectPlayer={handleSelectComparePlayer}
                onClearSlot={handleClearCompareSlot}
              />
            )}

            {activeTab === 'stats' && <PlayerStats />}

            {activeTab === 'lineups' && <LineupBuilder />}

          </div>

        </div>

      </main>

      <footer className="border-t border-slate-900 bg-[#0c0d10] py-6 px-4 md:px-6 text-center text-xs text-gray-500 mt-12">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 FotNep &bull; analytical app. All rights reserved.</p>
          <div className="flex gap-4.5 font-medium text-slate-500">
            <span className="hover:text-red-400 cursor-pointer text-slate-400 hover:text-brand-500">Privacy Policy</span>
            <span>&middot;</span>
            <span className="hover:text-red-400 cursor-pointer text-slate-400 hover:text-brand-500">Terms of Service</span>
            <span>&middot;</span>
            <span className="hover:text-red-400 cursor-pointer text-slate-400 hover:text-brand-500 font-bold">Contact For  API</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
