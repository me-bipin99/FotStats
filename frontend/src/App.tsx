import React, { useState } from 'react';
import Header from './components/Header';
import MatchFeed from './components/MatchFeed';
import MatchDetails from './components/MatchDetails';
import PlayerComparison from './components/PlayerComparison';
import PlayerStats from './components/PlayerStats';
import LineupBuilder from './components/LineupBuilder';
import { mockMatches, mockPlayers } from './data/mockData';
import { Player, Match } from './types';
import { Shield, Sparkles, AlertCircle, RefreshCw, Trophy, ChevronRight, Check, Calendar } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'compare' | 'stats' | 'lineups'>('home');
  const [selectedCategory, setSelectedCategory] = useState<'MEN' | 'WOMEN' | 'DOMESTIC' | 'ALL'>('ALL');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('m1'); // Default to live NPL vs IND
  const [comparisonPlayers, setComparisonPlayers] = useState<Player[]>([
    mockPlayers.anjan, // Preset comparison Slot A: Anjan Bista
    mockPlayers.bimal, // Preset comparison Slot B: Bimal Gharti Magar
  ]);

  // Retrieve currently highlighted match
  const selectedMatch = mockMatches.find((m) => m.id === selectedMatchId) || mockMatches[0];

  // Callback to handle choosing a match from the feed sidebar
  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    
    // Auto-load some players from the new match if applicable to enhance user experience
    const newMatch = mockMatches.find((m) => m.id === matchId);
    if (newMatch && newMatch.homeLineup && newMatch.awayLineup) {
      const homeStar = newMatch.homeLineup.starters[1]?.player;
      const awayStar = newMatch.awayLineup.starters[1]?.player;
      if (homeStar && awayStar) {
        setComparisonPlayers([homeStar, awayStar]);
      }
    }
  };

  const handleSelectCategoryAndRoute = (category: 'MEN' | 'WOMEN' | 'DOMESTIC' | 'ALL') => {
    setSelectedCategory(category);
    // When clicking category icon, open on main screen the schedule
    setActiveTab('home');
    
    // Set selected match to first match of the category to improve user navigation
    if (category !== 'ALL') {
      const matchesOfCat = mockMatches.filter(m => m.category === category);
      if (matchesOfCat.length > 0) {
        setSelectedMatchId(matchesOfCat[0].id);
      }
    }
  };

  // Callback to handle adding players to Slot A or Slot B inside head-to-head comparison
  const handleSelectComparePlayer = (player: Player, slot: 'A' | 'B') => {
    setComparisonPlayers((prev) => {
      const next = [...prev];
      if (slot === 'A') {
        next[0] = player;
      } else {
        next[1] = player;
      }
      return next;
    });
  };

  // Clear specific compares slot
  const handleClearCompareSlot = (slot: 'A' | 'B') => {
    setComparisonPlayers((prev) => {
      const next = [...prev];
      if (slot === 'A') {
        // Shift Slot B to Slot A or empty
        next[0] = next[1];
        next[1] = undefined as any;
      } else {
        next[1] = undefined as any;
      }
      return next.filter(Boolean); // Clean any undefined values
    });
  };

  // Dynamic selector for loading players into Slot A/B on tactical model clicks
  const handleSelectPlayerFromTacticalPitch = (player: Player) => {
    setComparisonPlayers((prev) => {
      // If player already exists in either slots, do nothing to prevent duplicacy
      if (prev.some((p) => p?.id === player.id)) return prev;

      const next = [...prev];
      if (!next[0]) {
        next[0] = player;
      } else if (!next[1]) {
        next[1] = player;
      } else {
        // If both loaded, rotate slots (Replace Slot B with newest selection)
        next[1] = player;
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0d0e10] text-slate-200 flex flex-col font-sans select-none antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* Primary Brand Navbar & Navigation */}
      <Header activeTab={activeTab} onChangeTab={setActiveTab} />
      
      {/* Main Grid Wrapper */}
      <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 py-6 md:px-6 xl:px-8 space-y-6">
        
        {/* Decorative Alert notice for premium look - only shown on homepage */}
        {activeTab === 'home' && (
          <div className="bg-[#151619] border border-slate-800/60 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-450">
                Welcome to the <strong>FotNep Match Center</strong>. Highlighting live scopes, tactics planners, and biometric comparisons.
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 hover:text-slate-300 transition cursor-default">
              <span>⚽ Gorkhali Databank v1.4</span>
            </div>
          </div>
        )}

        {/* Primary Functional Grid */}
        <div className={`grid grid-cols-1 ${activeTab === 'home' ? 'lg:grid-cols-[290px_1fr]' : ''} gap-6 items-start`}>
          
          {/* COLUMN 1: Soccer matches listings & searches info */}
          {activeTab === 'home' && (
            <div className="lg:sticky lg:top-[80px] space-y-6">
              <MatchFeed 
                matches={mockMatches} 
                selectedMatchId={selectedMatchId}
                onSelectMatch={handleSelectMatch}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategoryAndRoute}
              />


            </div>
          )}

          {/* COLUMN 2: Central Workspaces (Match details, tactical boards, player compares) */}
          <div className="space-y-6">
            
            {activeTab === 'home' && (
              <>
                {/* Main Interactive Scoreboard, Win/Loss Predictor, Pitch Lines */}
                <MatchDetails 
                  match={selectedMatch}
                  selectedPlayers={comparisonPlayers}
                  onSelectPlayerForComparison={handleSelectPlayerFromTacticalPitch}
                />
              </>
            )}

            {activeTab === 'compare' && (
              <PlayerComparison 
                selectedPlayers={comparisonPlayers}
                onSelectPlayer={handleSelectComparePlayer}
                onClearSlot={handleClearCompareSlot}
              />
            )}

            {activeTab === 'stats' && (
              <PlayerStats />
            )}

            {activeTab === 'lineups' && (
              <LineupBuilder />
            )}

          </div>

        </div>

      </main>

      {/* Humble Footer */}
      <footer className="border-t border-slate-900 bg-[#0c0d10] py-6 px-4 md:px-6 text-center text-xs text-gray-500 mt-12">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 FotNep &bull; Nepal Football Prototype Hub. All rights reserved.</p>
          <div className="flex gap-4.5 font-medium text-slate-500">
            <span className="hover:text-red-400 cursor-pointer text-slate-400 hover:text-emerald-450">Privacy Policy</span>
            <span>&middot;</span>
            <span className="hover:text-red-400 cursor-pointer text-slate-400 hover:text-emerald-450">Terms of Service</span>
            <span>&middot;</span>
            <span className="hover:text-red-400 cursor-pointer text-slate-400 hover:text-emerald-450 font-bold">Gorkhali Databank API</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
