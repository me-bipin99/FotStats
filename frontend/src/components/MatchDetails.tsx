import React, { useState } from 'react';
import { Match, Player, TeamLineup } from '../types';
import { 
  Shield, MapPin, Users, Calendar, AlertCircle, Info,
  CheckCircle2, Award, Flame, User, BarChart2, CornerDownRight,
  Trophy, LogIn, LogOut, RefreshCw, Sparkles, Star, Check
} from 'lucide-react';

interface MatchDetailsProps {
  match: Match;
  selectedPlayers: Player[];
  onSelectPlayerForComparison: (player: Player) => void;
}

export default function MatchDetails({ match, selectedPlayers, onSelectPlayerForComparison }: MatchDetailsProps) {
  const [activeTab, setActiveTab] = useState<'lineup' | 'stats' | 'info'>('lineup');
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);

  // 1. Unified Reputation & Weighted Prediction States loaded from LocalStorage
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('FOTNEP_LOGGED_IN') || null;
  });

  const [usersList, setUsersList] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('FOTNEP_USERS');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { username: 'Gorkhali_Expert', reputation: 32, correct: 12, wrong: 4, isExpert: true },
      { username: 'Nepali_Madridista', reputation: 25, correct: 10, wrong: 5, isExpert: true },
      { username: 'Cheli_Power', reputation: 18, correct: 8, wrong: 6, isExpert: true },
      { username: 'football_guy_97', reputation: 9, correct: 5, wrong: 6, isExpert: false },
    ];
  });

  // Keep state hydrated in sync across siblings in real-time
  React.useEffect(() => {
    const handleAuthChange = () => {
      setLoggedInUser(localStorage.getItem('FOTNEP_LOGGED_IN') || null);
      const savedUsers = localStorage.getItem('FOTNEP_USERS');
      if (savedUsers) {
        try { setUsersList(JSON.parse(savedUsers)); } catch (e) {}
      }
    };
    window.addEventListener('fotnep-auth-change', handleAuthChange);
    return () => window.removeEventListener('fotnep-auth-change', handleAuthChange);
  }, []);

  const [predictionsByMatch, setPredictionsByMatch] = useState<Record<string, '1' | 'X' | '2'>>(() => {
    const saved = localStorage.getItem('FOTNEP_PREDICTIONS');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  // Keep track of match result overrides (Simulate fast-forward results)
  const [matchOverrides, setMatchOverrides] = useState<Record<string, { status: 'FINISHED', homeScore: number, awayScore: number }>>(() => {
    const saved = localStorage.getItem('FOTNEP_MATCH_OVERRIDES');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [customUsername, setCustomUsername] = useState('');
  const [activePredictTab, setActivePredictTab] = useState<'predict' | 'leaderboard'>('predict');
  const [simulatingResult, setSimulatingResult] = useState(false);
  const [settleMessage, setSettleMessage] = useState<{ text: string, type: 'success' | 'info' | 'error' } | null>(null);

  // Derive current match status details based on simulated overrides
  const isMatchOverridden = !!matchOverrides[match.id];
  const currentMatchStatus = isMatchOverridden ? 'FINISHED' : match.status;
  const currentHomeScore = isMatchOverridden ? matchOverrides[match.id].homeScore : match.homeScore;
  const currentAwayScore = isMatchOverridden ? matchOverrides[match.id].awayScore : match.awayScore;

  // The active vote for this match
  const userVote = predictionsByMatch[match.id] || null;

  // Get current user profile details
  const currentUserObj = usersList.find(u => u.username === loggedInUser);
  const userRep = currentUserObj ? currentUserObj.reputation : 0;
  
  // Power multiplier: each point represents reliability. Max(1, rounded 1 + rep/5)
  const userWeight = currentUserObj 
    ? Math.max(1, Math.round(1 + currentUserObj.reputation / 5)) 
    : 1;

  // Static expert choices based on matchId hash to simulate a competitive environment
  const getExpertChoices = (matchId: string) => {
    const sumChars = matchId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return [
      { username: 'Gorkhali_Expert', choice: sumChars % 3 === 0 ? 'X' : (sumChars % 2 === 0 ? '1' : '2'), weight: 7 },
      { username: 'Nepali_Madridista', choice: sumChars % 2 === 0 ? '1' : 'X', weight: 6 },
      { username: 'Cheli_Power', choice: sumChars % 5 === 0 ? '2' : '1', weight: 5 },
      { username: 'football_guy_97', choice: sumChars % 4 === 0 ? 'X' : '1', weight: 3 }
    ] as const;
  };

  // Vote calculation & aggregation
  // 1. Unweighted crowd scores
  const baseV1 = match.predictionVotes.home;
  const baseVX = match.predictionVotes.draw;
  const baseV2 = match.predictionVotes.away;
  const baseSum = baseV1 + baseVX + baseV2;

  const totalCrowdVotes = baseSum + (userVote ? 1 : 0);
  const cv1 = baseV1 + (userVote === '1' ? 1 : 0);
  const cvX = baseVX + (userVote === 'X' ? 1 : 0);
  const cv2 = baseV2 + (userVote === '2' ? 1 : 0);

  const pc1 = Math.round((cv1 / totalCrowdVotes) * 100);
  const pcX = Math.round((cvX / totalCrowdVotes) * 100);
  const pc2 = Math.round((cv2 / totalCrowdVotes) * 100);

  // 2. Weighted Expert statistical distributions
  const expertChoices = getExpertChoices(match.id);
  const expHomeWeight = expertChoices.filter(e => e.choice === '1').reduce((acc, curr) => acc + curr.weight, 0);
  const expDrawWeight = expertChoices.filter(e => e.choice === 'X').reduce((acc, curr) => acc + curr.weight, 0);
  const expAwayWeight = expertChoices.filter(e => e.choice === '2').reduce((acc, curr) => acc + curr.weight, 0);

  const userWeightedChoice = userVote ? userWeight : 0;
  const wHomeSum = expHomeWeight + (userVote === '1' ? userWeightedChoice : 0);
  const wDrawSum = expDrawWeight + (userVote === 'X' ? userWeightedChoice : 0);
  const wAwaySum = expAwayWeight + (userVote === '2' ? userWeightedChoice : 0);
  const wTotalExp = wHomeSum + wDrawSum + wAwaySum;

  const pExp1 = wTotalExp > 0 ? Math.round((wHomeSum / wTotalExp) * 100) : 34;
  const pExpX = wTotalExp > 0 ? Math.round((wDrawSum / wTotalExp) * 100) : 33;
  const pExp2 = wTotalExp > 0 ? Math.round((wAwaySum / wTotalExp) * 100) : 33;

  // 3. Combined weighted forecast: 35% crowd standard inputs + 65% expert weighted reliability
  const weightedH = Math.round(0.35 * pc1 + 0.65 * pExp1);
  const weightedX = Math.round(0.35 * pcX + 0.65 * pExpX);
  const weightedA = Math.max(0, 100 - weightedH - weightedX); // maintain precise mathematical bounds

  // Save predictions
  const handleVoteChoice = (choice: '1' | 'X' | '2') => {
    if (!loggedInUser) return;
    if (userVote) return;

    const nextPredictions = { ...predictionsByMatch, [match.id]: choice };
    setPredictionsByMatch(nextPredictions);
    localStorage.setItem('FOTNEP_PREDICTIONS', JSON.stringify(nextPredictions));
    setSettleMessage(null);

    // If match finished, evaluate score instantly
    if (currentMatchStatus === 'FINISHED') {
      evaluatePrediction(choice, currentHomeScore ?? 0, currentAwayScore ?? 0);
    }
  };

  // Helper to evaluate a vote outcome and alter users points
  const evaluatePrediction = (prediction: '1' | 'X' | '2', homeScr: number, awayScr: number) => {
    if (!localStorage.getItem('FOTNEP_LOGGED_IN')) return; // safe check
    const currentUsername = localStorage.getItem('FOTNEP_LOGGED_IN');

    let actualResult: '1' | 'X' | '2' = 'X';
    if (homeScr > awayScr) actualResult = '1';
    else if (awayScr > homeScr) actualResult = '2';

    const isCorrect = prediction === actualResult;
    const pointsAwarded = isCorrect ? 3 : -1;

    setUsersList(prev => {
      const updated = prev.map(u => {
        if (u.username === currentUsername) {
          const nextRep = u.reputation + pointsAwarded;
          return {
            ...u,
            reputation: nextRep,
            correct: u.correct + (isCorrect ? 1 : 0),
            wrong: u.wrong + (isCorrect ? 0 : 1)
          };
        }
        return u;
      });
      localStorage.setItem('FOTNEP_USERS', JSON.stringify(updated));
      return updated;
    });

    if (isCorrect) {
      setSettleMessage({
        text: `🎉 Correct guess! Nepal finished ${homeScr}-${awayScr}. You earned +3 Reputation points.`,
        type: 'success'
      });
    } else {
      setSettleMessage({
        text: `💔 Wrong prediction. Nepal finished ${homeScr}-${awayScr}. You lost -1 Reputation point.`,
        type: 'error'
      });
    }
  };

  // Fast-forward simulation of upcoming matches
  const handleSimulateFinish = () => {
    if (!userVote) return;
    setSimulatingResult(true);
    setSettleMessage(null);

    setTimeout(() => {
      // Simulate goals based on relative quality
      const homeStrength = match.homeTeam.rating + 0.3; // home crowd boost
      const awayStrength = match.awayTeam.rating;

      let homeScr = 0;
      let awayScr = 0;
      const rnd = Math.random();

      if (homeStrength > awayStrength) {
        if (rnd < 0.55) {
          homeScr = Math.floor(Math.random() * 3) + 1;
          awayScr = Math.floor(Math.random() * homeScr);
        } else if (rnd < 0.8) {
          homeScr = awayScr = Math.floor(Math.random() * 3);
        } else {
          awayScr = Math.floor(Math.random() * 2) + 1;
          homeScr = Math.floor(Math.random() * awayScr);
        }
      } else {
        if (rnd < 0.45) {
          homeScr = Math.floor(Math.random() * 2) + 1;
          awayScr = Math.floor(Math.random() * homeScr);
        } else if (rnd < 0.75) {
          homeScr = awayScr = Math.floor(Math.random() * 3);
        } else {
          awayScr = Math.floor(Math.random() * 3) + 1;
          homeScr = Math.floor(Math.random() * awayScr);
        }
      }

      const overrides = {
        ...matchOverrides,
        [match.id]: { status: 'FINISHED' as const, homeScore: homeScr, awayScore: awayScr }
      };
      setMatchOverrides(overrides);
      localStorage.setItem('FOTNEP_MATCH_OVERRIDES', JSON.stringify(overrides));
      setSimulatingResult(false);

      // Determine outcome and award points
      evaluatePrediction(userVote, homeScr, awayScr);
    }, 1200);
  };

  const handleLogin = (username: string) => {
    setLoggedInUser(username);
    localStorage.setItem('FOTNEP_LOGGED_IN', username);
    setSettleMessage(null);
    window.dispatchEvent(new Event('fotnep-auth-change'));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customUsername.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanName) return;

    const exists = usersList.find(u => u.username.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      handleLogin(exists.username);
    } else {
      const newUser = { username: cleanName, reputation: 0, correct: 0, wrong: 0, isExpert: false };
      const updatedList = [...usersList, newUser];
      setUsersList(updatedList);
      localStorage.setItem('FOTNEP_USERS', JSON.stringify(updatedList));
      handleLogin(cleanName);
    }
    setCustomUsername('');
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('FOTNEP_LOGGED_IN');
    setSettleMessage(null);
    window.dispatchEvent(new Event('fotnep-auth-change'));
  };

  // Function to define color based on player rating
  const getRatingColorClass = (rating: number) => {
    if (rating >= 8.0) return 'bg-emerald-700 text-white font-bold'; // Elegant Green
    if (rating >= 7.0) return 'bg-emerald-500 text-black font-extrabold'; // Lime/Light Green
    if (rating >= 6.0) return 'bg-slate-700 text-slate-200 font-semibold'; // Slate Grey
    return 'bg-rose-500/80 text-white font-medium'; // Rose Red
  };

  const isPlayerSelected = (playerId: string) => {
    return selectedPlayers.some((p) => p.id === playerId);
  };

  return (
    <div className="bg-[#151619] border border-slate-800/60 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* 1. Scoreline and Match Banner */}
      <div className="p-4 md:p-6 bg-gradient-to-b from-[#212228] to-[#151619] border-b border-[#202124] relative">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
          <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded flex items-center gap-1.5 border border-emerald-500/15">
            <Award className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">{match.competition}</span>
          </span>
          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {match.date} &bull; {match.time}
          </span>
        </div>

        {/* Home vs Away display */}
        <div className="flex items-center justify-between gap-4 py-2">
          {/* Home team */}
          <div className="flex flex-col items-center flex-1 text-center">
            <div 
              className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-white text-xl shadow-lg ring-4 ring-slate-800/80"
              style={{ backgroundColor: match.homeTeam.color, border: `2px solid ${match.homeTeam.secondaryColor}` }}
            >
              {match.homeTeam.shorthand}
            </div>
            <h4 className="mt-3 text-sm md:text-base font-bold text-white leading-tight">
              {match.homeTeam.name}
            </h4>
            <span className="text-[10px] text-slate-500 font-mono mt-1">H2H Rating: {match.homeTeam.rating}</span>
          </div>

          {/* Current Score / V / Live details */}
          <div className="flex flex-col items-center justify-center">
            {currentMatchStatus === 'LIVE' || currentMatchStatus === 'FINISHED' ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 md:gap-5">
                  <span className="text-4xl md:text-5xl font-mono font-black text-white tracking-tighter animate-fadeIn">
                    {currentHomeScore}
                  </span>
                  <span className="text-xl text-slate-600 font-semibold">:</span>
                  <span className="text-4xl md:text-5xl font-mono font-black text-white tracking-tighter animate-fadeIn">
                    {currentAwayScore}
                  </span>
                </div>
                {currentMatchStatus === 'LIVE' ? (
                  <span className="mt-3 flex items-center gap-1 bg-emerald-500 text-black text-[11px] font-extrabold px-2.5 py-1 rounded-full animate-pulse shadow-md shadow-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                    <span>LIVE &bull; {match.minute}'</span>
                  </span>
                ) : (
                  <span className="mt-3 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" /> Finished
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center bg-[#0d0e10]/80 border border-slate-800/80 px-4 py-2.5 rounded-xl">
                <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest font-mono">KICK OFF</p>
                <p className="text-xl md:text-2xl font-mono font-black text-emerald-450 mt-1">{match.time}</p>
                <span className="text-[10px] text-slate-400 font-mono mt-1.5 px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800/60 font-semibold">Scheduled</span>
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center flex-1 text-center">
            <div 
              className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-white text-xl shadow-lg ring-4 ring-slate-800/80"
              style={{ backgroundColor: match.awayTeam.color, border: `2px solid ${match.awayTeam.secondaryColor}` }}
            >
              {match.awayTeam.shorthand}
            </div>
            <h4 className="mt-3 text-sm md:text-base font-bold text-white leading-tight">
              {match.awayTeam.name}
            </h4>
            <span className="text-[10px] text-slate-500 font-mono mt-1">H2H Rating: {match.awayTeam.rating}</span>
          </div>
        </div>

        {/* Stadium and Venue info footer */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4 pt-4 border-t border-slate-800/40 text-xs text-slate-400">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{match.venue}</span>
          </span>
          {match.homeTeam.id === 'nepal' && (
            <span className="text-slate-600 hidden py-1 sm:inline">&bull;</span>
          )}
          {match.homeTeam.id === 'nepal' && (
            <span className="flex items-center gap-1 text-slate-400">
              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Cap: {match.homeTeam.stadiumCapacity}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. "Who Will Win?" Prediction Vote (Simplified & De-cluttered) */}
      <div className="m-4 p-5 bg-[#101115] border border-slate-800/80 rounded-xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        
        <h5 className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Flame className="w-4 h-4 text-emerald-500 animate-pulse" />
            Who Will Win? Prediction Vote
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Total casts: {totalCrowdVotes.toLocaleString()}
          </span>
        </h5>

        {currentMatchStatus === 'FINISHED' ? (
          /* Finished Matches: Displays past votes and their prediction directly */
          <div className="space-y-4">
            <div className="p-3 bg-[#0c0d10] border border-slate-850 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                  Past Predictions & Outcome
                </span>
                <span className="text-[9.5px] text-slate-500 font-mono">Prediction Closed</span>
              </div>

              {/* Show clean prediction bars */}
              <div className="grid grid-cols-[1fr_80px_1fr] gap-2 items-center">
                {/* Home */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-350 truncate">{match.homeTeam.shorthand}</span>
                    <span className="text-emerald-450">{pc1}%</span>
                  </div>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${pc1}%` }} />
                  </div>
                </div>
                {/* Draw */}
                <div className="space-y-1 text-center font-bold">
                  <span className="text-[10.5px] font-mono block text-slate-400">{pcX}% Draw</span>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-600 h-full transition-all duration-700 mx-auto" style={{ width: `${pcX}%` }} />
                  </div>
                </div>
                {/* Away */}
                <div className="space-y-1 text-right">
                  <div className="flex justify-between text-[11px] font-mono font-bold flex-row-reverse">
                    <span className="text-slate-350 truncate">{match.awayTeam.shorthand}</span>
                    <span className="text-rose-450">{pc2}%</span>
                  </div>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full transition-all duration-700 ml-auto" style={{ width: `${pc2}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-[10.5px] text-slate-400 leading-normal">
                Final Result: <strong className="text-white">{currentHomeScore} - {currentAwayScore}</strong> &bull; Crowd majority predicted <strong className="text-emerald-400">{pc1 > pc2 && pc1 > pcX ? match.homeTeam.shorthand : pc2 > pc1 && pc2 > pcX ? match.awayTeam.shorthand : 'Draw'}</strong>. (Voting inactive for completed matches).
              </div>
            </div>
          </div>
        ) : userVote ? (
          /* Upcoming Match: User has voted -> displays win/loss predictions / percentage bars */
          <div className="space-y-4">
            <div className="p-3 bg-[#0c0d10] border border-slate-850 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-445 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-445" /> Prediction Registered
                </span>
                <span className="text-[9.5px] text-slate-500 font-mono">Live Forecast</span>
              </div>

              {/* Prediction percentage bars */}
              <div className="grid grid-cols-[1fr_80px_1fr] gap-2 items-center">
                {/* Home */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-350 truncate">{match.homeTeam.shorthand}</span>
                    <span className="text-emerald-450">{pc1}%</span>
                  </div>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${pc1}%` }} />
                  </div>
                </div>
                {/* Draw */}
                <div className="space-y-1 text-center font-bold">
                  <span className="text-[10.5px] font-mono block text-slate-400">{pcX}% Draw</span>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-600 h-full transition-all duration-700 mx-auto" style={{ width: `${pcX}%` }} />
                  </div>
                </div>
                {/* Away */}
                <div className="space-y-1 text-right">
                  <div className="flex justify-between text-[11px] font-mono font-bold flex-row-reverse">
                    <span className="text-slate-350 truncate">{match.awayTeam.shorthand}</span>
                    <span className="text-rose-450">{pc2}%</span>
                  </div>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full transition-all duration-700 ml-auto" style={{ width: `${pc2}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 px-3 py-2 rounded-lg text-[10.5px] text-slate-300">
                You predicted <strong>{userVote === '1' ? match.homeTeam.name : userVote === '2' ? match.awayTeam.name : 'Draw'}</strong> to win. Accuracy weight applied.
              </div>
            </div>
          </div>
        ) : (
          /* Upcoming Match: User has NOT voted -> interactive voting options */
          <div className="space-y-3.5">
            {!loggedInUser && (
              <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded-lg text-[11px] text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Please <strong>Sign In</strong> from the top navbar profile menu to register your prediction vote.</span>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-3">
              {/* Home win */}
              <button
                onClick={() => handleVoteChoice('1')}
                disabled={!loggedInUser}
                className="bg-emerald-500/5 border border-emerald-500/15 hover:border-emerald-500/40 disabled:opacity-40 disabled:hover:border-emerald-500/15 p-3.5 rounded-xl hover:bg-emerald-500/10 text-center transition-all cursor-pointer group active:scale-95"
              >
                <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1 font-bold">Win (1)</div>
                <div className="text-xs font-black text-slate-200 truncate group-hover:text-white">
                  {match.homeTeam.shorthand}
                </div>
              </button>

              {/* Draw */}
              <button
                onClick={() => handleVoteChoice('X')}
                disabled={!loggedInUser}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 p-3.5 rounded-xl hover:bg-slate-850 text-center transition-all cursor-pointer group active:scale-95"
              >
                <div className="text-[10px] font-mono text-slate-500 group-hover:text-slate-350 uppercase tracking-widest mb-1 font-bold">Draw (X)</div>
                <div className="text-xs font-black text-slate-200 group-hover:text-white">
                  Draw
                </div>
              </button>

              {/* Away win */}
              <button
                onClick={() => handleVoteChoice('2')}
                disabled={!loggedInUser}
                className="bg-[#1c1214] border border-rose-500/15 hover:border-rose-500/40 disabled:opacity-40 disabled:hover:border-rose-500/15 p-3.5 rounded-xl hover:bg-rose-500/10 text-center transition-all cursor-pointer group active:scale-95"
              >
                <div className="text-[10px] font-mono text-rose-400 uppercase tracking-widest mb-1 font-bold font-mono">Loss (2)</div>
                <div className="text-xs font-black text-slate-200 truncate group-hover:text-white">
                  {match.awayTeam.shorthand}
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Details Navigation Tabs */}
      <div className="px-4 border-b border-slate-800 bg-[#12141C]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('lineup')}
            className={`py-3 text-xs font-bold uppercase tracking-wider relative transition-all ${
              activeTab === 'lineup' 
                ? 'text-emerald-400 border-b-2 border-emerald-500 font-extrabold' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Tactical Lineup
          </button>
          {match.stats && (
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-3 text-xs font-bold uppercase tracking-wider relative transition-all ${
                activeTab === 'stats' 
                  ? 'text-emerald-400 border-b-2 border-emerald-500 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Match Stats
            </button>
          )}
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 text-xs font-bold uppercase tracking-wider relative transition-all ${
              activeTab === 'info' 
                ? 'text-emerald-400 border-b-2 border-emerald-500 font-extrabold' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            H2H & Details
          </button>
        </div>
      </div>

      {/* 4. Tab Content */}
      <div className="p-4 md:p-5 flex-1 flex flex-col justify-center">
        
        {/* TAB 1: TACTICAL LINEUP (HORIZONTALLY RENDERED PITCH) */}
        {activeTab === 'lineup' && (
          <div className="space-y-4 animate-fadeIn">
            {match.homeLineup && match.awayLineup ? (
              <>
                {/* Horizontal Pitch Wrapper inside Elegant Slate framework */}
                <div className="relative aspect-[16/9] w-full bg-[#0A0B0E] border-2 border-slate-800 rounded-xl overflow-hidden shadow-inner group">
                  {/* Neon Soccer Pitch markings */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#12141C] to-[#1E222D]" />
                  <div className="absolute inset-y-0 left-0 w-[2px] bg-white/5" />
                  <div className="absolute inset-y-0 right-0 w-[2px] bg-white/5" />
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-white/5" />
                  <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5" />
                  
                  {/* Left Penalty Box (Home) */}
                  <div className="absolute inset-y-[20%] left-0 w-[18%] border-y-2 border-r-2 border-white/5" />
                  <div className="absolute inset-y-[35%] left-0 w-[6%] border-y-2 border-r-2 border-white/10" />
                  {/* Left Goal Area */}
                  <div className="absolute top-[50%] left-[13%] w-2 h-2 rounded-full bg-white/10 transform -translate-y-1/2" />

                  {/* Right Penalty Box (Away) */}
                  <div className="absolute inset-y-[20%] right-0 w-[18%] border-y-2 border-l-2 border-white/5" />
                  <div className="absolute inset-y-[35%] right-0 w-[6%] border-y-2 border-l-2 border-white/10" />
                  {/* Right Goal Area */}
                  <div className="absolute top-[50%] right-[13%] w-2 h-2 rounded-full bg-white/10 transform -translate-y-1/2" />

                  {/* Center Line and Circle */}
                  <div className="absolute inset-y-0 left-[50%] w-[2px] bg-white/10 transform -translate-x-1/2" />
                  <div className="absolute top-[50%] left-[50%] w-[16%] aspect-square border-2 border-white/5 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute top-[50%] left-[50%] w-3 h-3 bg-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2" />

                  {/* Helper indicators overlay */}
                  <div className="absolute top-2.5 left-3.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{match.homeTeam.shorthand} ({match.homeLineup.formation})</span>
                  </div>
                  <div className="absolute top-2.5 right-3.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-end">
                    <span>{match.awayTeam.shorthand} ({match.awayLineup.formation})</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  </div>

                  {/* Home Team Players nodes on Left half of pitch */}
                  {match.homeLineup.starters.map(({ player, x, y }) => {
                    const isSel = isPlayerSelected(player.id);
                    return (
                      <div
                        key={`home-${player.id}`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
                      >
                        {/* Interactive player container */}
                        <div 
                          onClick={() => onSelectPlayerForComparison(player)}
                          onMouseEnter={() => setHoveredPlayer(player)}
                          onMouseLeave={() => setHoveredPlayer(null)}
                          className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs cursor-pointer shadow-lg transition-all duration-300 hover:scale-120 ${
                            isSel 
                              ? 'ring-4 ring-offset-2 ring-emerald-500 scale-110' 
                              : 'ring-2 ring-[#0A0B0E] group-hover:ring-emerald-400/30'
                          }`}
                          style={{ 
                            backgroundColor: match.homeTeam.color, 
                            color: '#ffffff',
                          }}
                        >
                          {player.number}

                          {/* Hover highlight halo */}
                          {hoveredPlayer?.id === player.id && (
                            <div className="absolute -inset-1 rounded-full border border-white animate-ping opacity-60 pointer-events-none" />
                          )}

                          {/* Float Player match Rating badge */}
                          <div className={`absolute -bottom-1 -right-1 px-1 py-0.5 rounded text-[8px] font-black font-sans leading-none flex items-center shadow-md scale-95 select-none ${getRatingColorClass(player.rating)}`}>
                            {player.rating.toFixed(1)}
                          </div>
                        </div>

                        {/* Player name indicator */}
                        <span className="mt-1.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-[8px] tracking-tight text-center max-w-[70px] truncate leading-none shadow">
                          {player.name.split(' ').pop()}
                        </span>
                      </div>
                    );
                  })}

                  {/* Away Team Players nodes on Right half of pitch */}
                  {match.awayLineup.starters.map(({ player, x, y }) => {
                    const isSel = isPlayerSelected(player.id);
                    return (
                      <div
                        key={`away-${player.id}`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
                      >
                        {/* Interactive player container */}
                        <div 
                          onClick={() => onSelectPlayerForComparison(player)}
                          onMouseEnter={() => setHoveredPlayer(player)}
                          onMouseLeave={() => setHoveredPlayer(null)}
                          className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs cursor-pointer shadow-lg transition-all duration-300 hover:scale-120 ${
                            isSel 
                              ? 'ring-4 ring-offset-2 ring-rose-500 scale-110' 
                              : 'ring-2 ring-[#0A0B0E] group-hover:ring-rose-450/45'
                          }`}
                          style={{ 
                            backgroundColor: match.awayTeam.color, 
                            color: '#ffffff',
                          }}
                        >
                          {player.number}

                          {/* Hover highlight halo */}
                          {hoveredPlayer?.id === player.id && (
                            <div className="absolute -inset-1 rounded-full border border-white animate-ping opacity-60 pointer-events-none" />
                          )}

                          {/* Float Player match Rating badge */}
                          <div className={`absolute -bottom-1 -right-1 px-1 py-0.5 rounded text-[8px] font-bold font-sans leading-none flex items-center shadow-md scale-95 select-none ${getRatingColorClass(player.rating)}`}>
                            {player.rating.toFixed(1)}
                          </div>
                        </div>

                        {/* Player name indicator */}
                        <span className="mt-1.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-[8px] tracking-tight text-center max-w-[70px] truncate leading-none shadow">
                          {player.name.split(' ').pop()}
                        </span>
                      </div>
                    );
                  })}

                  {/* Predicted Lineup Indicator centered at the bottom of the pitch container */}
                  {currentMatchStatus !== 'FINISHED' && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 backdrop-blur-sm shadow-md shadow-black/50 select-none z-20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Predicted Lineup by Machine
                    </div>
                  )}
                </div>

                {/* Show Hover/Active Player Details inline */}
                {hoveredPlayer && (
                  <div className="bg-[#1C1F2A] border border-slate-800 p-3 rounded-lg flex items-center justify-between animate-fadeIn text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                        {hoveredPlayer.name[0]}
                      </div>
                      <div>
                        <h6 className="font-bold text-white leading-snug flex items-center gap-2">
                          <span>{hoveredPlayer.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">#{hoveredPlayer.number}</span>
                        </h6>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{hoveredPlayer.positionDetail} &bull; {hoveredPlayer.club}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-right font-mono">
                      <div className="text-xs">
                        <span className="text-slate-500 uppercase text-[9px] block">Matches</span>
                        <span className="text-slate-300 font-bold">{hoveredPlayer.matchesPlayed}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500 uppercase text-[9px] block">Rating</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getRatingColorClass(hoveredPlayer.rating)}`}>
                          {hoveredPlayer.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-slate-500 border border-slate-850 border-dashed rounded-xl">
                <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">Lineups Unavailable</p>
                <p className="text-xs text-slate-500 mt-1">Starting rosters will be announced usually 1 hour before kickoff.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DETAILED MATCH STATS */}
        {activeTab === 'stats' && match.stats && (
          <div className="space-y-4 animate-fadeIn max-w-xl mx-auto w-full">
            <h5 className="text-xs uppercase tracking-widest font-bold text-slate-500 text-center mb-2">
              Performance Statistics Summary
            </h5>

            <div className="space-y-4">
              {/* Possession */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-400 font-mono">{match.stats.possession[0]}%</span>
                  <span className="text-slate-300">Ball Possession</span>
                  <span className="text-slate-400 font-mono">{match.stats.possession[1]}%</span>
                </div>
                <div className="h-2 bg-[#0A0B0E] rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: `${match.stats.possession[0]}%` }} />
                  <div className="bg-rose-500 h-full rounded-r-full" style={{ width: `${match.stats.possession[1]}%` }} />
                </div>
              </div>

              {/* Shots in total */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-400 font-mono">{match.stats.shots[0]}</span>
                  <span className="text-slate-300 font-medium">Total Shots</span>
                  <span className="text-slate-400 font-mono">{match.stats.shots[1]}</span>
                </div>
                <div className="h-2 bg-[#0A0B0E] rounded-full overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full rounded-l-full" 
                    style={{ width: `${(match.stats.shots[0] / (match.stats.shots[0] + match.stats.shots[1])) * 100}%` }} 
                  />
                  <div 
                    className="bg-rose-500 h-full rounded-r-full ml-auto" 
                    style={{ width: `${(match.stats.shots[1] / (match.stats.shots[0] + match.stats.shots[1])) * 100}%` }} 
                  />
                </div>
              </div>

              {/* Shots on target */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-400 font-mono">{match.stats.shotsOnTarget[0]}</span>
                  <span className="text-slate-300 font-medium">Shots On Target</span>
                  <span className="text-slate-400 font-mono">{match.stats.shotsOnTarget[1]}</span>
                </div>
                <div className="h-2 bg-[#0A0B0E] rounded-full overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full rounded-l-full" 
                    style={{ width: `${(match.stats.shotsOnTarget[0] / (match.stats.shotsOnTarget[0] + match.stats.shotsOnTarget[1])) * 100}%` }} 
                  />
                  <div 
                    className="bg-rose-500 h-full rounded-r-full ml-auto" 
                    style={{ width: `${(match.stats.shotsOnTarget[1] / (match.stats.shotsOnTarget[0] + match.stats.shotsOnTarget[1])) * 100}%` }} 
                  />
                </div>
              </div>

              {/* Corners */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-400 font-mono">{match.stats.corners[0]}</span>
                  <span className="text-slate-300 font-medium">Corners</span>
                  <span className="text-slate-400 font-mono">{match.stats.corners[1]}</span>
                </div>
                <div className="h-2 bg-[#0A0B0E] rounded-full overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full rounded-l-full" 
                    style={{ width: `${(match.stats.corners[0] / (match.stats.corners[0] + match.stats.corners[1])) * 100}%` }} 
                  />
                  <div 
                    className="bg-rose-500 h-full rounded-r-full ml-auto" 
                    style={{ width: `${(match.stats.corners[1] / (match.stats.corners[0] + match.stats.corners[1])) * 100}%` }} 
                  />
                </div>
              </div>

              {/* Fouls and discipline */}
              <div className="grid grid-cols-2 gap-4 pt-3.5 border-t border-slate-800/40">
                <div className="bg-[#12141C] p-3 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Fouls Committed</span>
                  <div className="flex items-center justify-around mt-1.5 font-mono">
                    <span className="text-emerald-400 font-bold text-lg">{match.stats.fouls[0]}</span>
                    <span className="text-slate-700">vs</span>
                    <span className="text-rose-450 font-bold text-lg">{match.stats.fouls[1]}</span>
                  </div>
                </div>

                <div className="bg-[#12141C] p-3 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Discipline Cards</span>
                  <div className="flex items-center justify-around mt-1.5">
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <span className="w-2.5 h-3.5 bg-amber-500 rounded-sm shadow-sm" />
                      <span className="font-bold text-slate-300">{match.stats.yellowCards[0]}</span>
                      <span className="w-2.5 h-3.5 bg-rose-600 rounded-sm shadow-sm ml-1" />
                      <span className="font-bold text-slate-300">{match.stats.redCards[0]}</span>
                    </div>
                    <span className="text-slate-750 font-mono">vs</span>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <span className="w-2.5 h-3.5 bg-amber-500 rounded-sm shadow-sm opacity-90" />
                      <span className="font-bold text-slate-300">{match.stats.yellowCards[1]}</span>
                      <span className="w-2.5 h-3.5 bg-rose-600 rounded-sm shadow-sm ml-1" />
                      <span className="font-bold text-slate-300">{match.stats.redCards[1]}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: H2H & DETAILS */}
        {activeTab === 'info' && (
          <div className="space-y-4 animate-fadeIn max-w-xl mx-auto w-full">
            <div className="bg-[#12141C] border border-slate-800 p-4 rounded-xl space-y-4.5">
              <h5 className="text-[11px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-500" />
                Team Comparatives & Venue Info
              </h5>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Home Team Head Coach</span>
                  <span className="text-slate-200 font-semibold">{match.homeTeam.coach}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Away Team Head Coach</span>
                  <span className="text-slate-200 font-semibold">{match.awayTeam.coach}</span>
                </div>

                <div className="col-span-2 border-t border-slate-800/80 my-1 pt-2" />

                <div>
                  <span className="text-slate-500 block mb-1">Official Stadium</span>
                  <span className="text-slate-200 font-semibold">{match.homeTeam.stadium}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Seating Capacity</span>
                  <span className="text-slate-250 font-semibold font-mono">{match.homeTeam.stadiumCapacity}</span>
                </div>

                {match.homeTeam.fifaRank && (
                  <>
                    <div className="col-span-2 border-t border-slate-800/80 my-1 pt-2" />
                    <div>
                      <span className="text-slate-500 block mb-1">Home FIFA World Ranking</span>
                      <span className="text-slate-200 font-bold font-mono">#{match.homeTeam.fifaRank}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Away FIFA World Ranking</span>
                      <span className="text-slate-200 font-bold font-mono">#{match.awayTeam.fifaRank || 'Unranked'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* General Disclaimer */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-[10px] text-slate-500 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>FotNep Analytics Board Notice:</strong> This match prototype uses simulated live coordinates from Nepal's actual national soccer matches and A-Division league results. All market values, player ages, and tactical lineups are calibrated against current season datasets.
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
