import { useState, useEffect } from 'react';
import { Match, Player, TeamLineup } from '../types';
import {
  MapPin, Users, Calendar, AlertCircle, Info,
  CheckCircle2, Flame, Check, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  castVote, getMatchVotes, getPrediction, triggerPrediction, PredictionResult,
  getPlayers, optimizeSquad, SquadResult,
} from '../services/api';
import { getFormationCoords } from '../utils/pitchCoords';

function squadToLineup(squad: SquadResult, playerPool: Player[], isHome: boolean): TeamLineup {
  const byId = Object.fromEntries(playerPool.map((p) => [p.id, p]));

  const ordered = [...squad.startingXI].sort((a, b) => {
    const order = { GK: 0, DF: 1, MF: 2, FW: 3 };
    return (order[a.position as keyof typeof order] ?? 4) - (order[b.position as keyof typeof order] ?? 4);
  });

  const starters = ordered.map((xi, i) => ({
    player: byId[xi.playerId]
      ? { ...byId[xi.playerId], number: i + 1 }
      : {
          id: xi.playerId, name: xi.playerName, number: i + 1,
          position: xi.position as 'GK' | 'DF' | 'MF' | 'FW',
          positionDetail: xi.position, rating: 6.5, age: 0,
          height: '—', weight: '—', marketValue: '—',
          goals: 0, assists: 0, matchesPlayed: 0,
          yellowCards: 0, redCards: 0, preferredFoot: 'Right' as const,
          club: '—',
          attributes: { pace: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 },
        },
    position: xi.position as 'GK' | 'DF' | 'MF' | 'FW',
  }));

  const coords = getFormationCoords(
    squad.formation,
    starters.map((s) => ({ position: s.position })),
    isHome,
  );

  return {
    formation: squad.formation,
    starters: starters.map((s, i) => ({ player: s.player, x: coords[i].x, y: coords[i].y })),
    substitutes: squad.bench.map((b) =>
      byId[b.playerId] ?? {
        id: b.playerId, name: b.playerName, number: 0,
        position: b.position as 'GK' | 'DF' | 'MF' | 'FW',
        positionDetail: b.position, rating: 6.0, age: 0,
        height: '—', weight: '—', marketValue: '—',
        goals: 0, assists: 0, matchesPlayed: 0,
        yellowCards: 0, redCards: 0, preferredFoot: 'Right' as const,
        club: '—',
        attributes: { pace: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 },
      }
    ),
  };
}

interface MatchDetailsProps {
  match: Match;
  selectedPlayers: Player[];
  onSelectPlayerForComparison: (player: Player) => void;
  onVoteCountsChange: (matchId: string, counts: { home: number; draw: number; away: number }) => void;
}

export default function MatchDetails({ match, selectedPlayers, onSelectPlayerForComparison, onVoteCountsChange }: MatchDetailsProps) {
  const auth = useAuth();
  const loggedInUser = auth.user?.name ?? null;

  const [activeTab, setActiveTab] = useState<'lineup' | 'stats' | 'info'>('lineup');
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [voteOutcome, setVoteOutcome] = useState<'home_win' | 'draw' | 'away_win' | null>(null);
  const [voteCounts, setVoteCounts] = useState({ home_win: 0, draw: 0, away_win: 0 });
  const [predResult, setPredResult] = useState<PredictionResult | null>(null);
  const [voting, setVoting] = useState(false);
  // Single object keyed by matchId — avoids stale-content flicker when switching matches.
  // lineupLoading is derived: true whenever the current match hasn't been predicted yet.
  const [predCache, setPredCache] = useState<{
    matchId: string;
    home: TeamLineup | null;
    away: TeamLineup | null;
  }>({ matchId: '', home: null, away: null });
  const predictedHome = predCache.matchId === match.id ? predCache.home : null;
  const predictedAway = predCache.matchId === match.id ? predCache.away : null;
  const lineupLoading = match.status === 'UPCOMING' && predCache.matchId !== match.id;

  useEffect(() => {
    setVoteOutcome(null);
    setPredResult(null);
    getMatchVotes(match.id)
      .then(data => {
        setVoteCounts({ home_win: data.home_win, draw: data.draw, away_win: data.away_win });
        onVoteCountsChange(match.id, { home: data.home_win, draw: data.draw, away: data.away_win });
        if (data.userVote) setVoteOutcome(data.userVote as 'home_win' | 'draw' | 'away_win');
        if (data.home_win + data.draw + data.away_win > 0) {
          triggerPrediction(match.id).then(setPredResult).catch(() => {});
        }
      })
      .catch(() => {});
    getPrediction(match.id)
      .then(result => { if (result) setPredResult(result); })
      .catch(() => {});
  }, [match.id, auth.user?.id]);

  useEffect(() => {
    if (match.status !== 'UPCOMING') return;
    let cancelled = false;
    const matchId = match.id;

    const gender: 'M' | 'F' = match.category === 'WOMEN' ? 'F' : 'M';

    const fetchPool = async (team: typeof match.homeTeam): Promise<Player[]> => {
      const { players } = await getPlayers({ teamId: team.id, limit: 50 });
      if (players.length >= 11) return players;
      const fallbackSource = team.country && team.country !== 'Nepal'
        ? team.country.toLowerCase()
        : 'nepali';
      const { players: fallback } = await getPlayers({ source: fallbackSource, gender, limit: 120 });
      return fallback;
    };

    (async () => {
      try {
        const [homePlayers, awayPlayers] = await Promise.all([
          fetchPool(match.homeTeam),
          fetchPool(match.awayTeam),
        ]);

        const homeIds = homePlayers.map((p) => p.id);
        const awayIds = awayPlayers.map((p) => p.id);

        const [homeResult, awayResult] = await Promise.allSettled([
          homeIds.length
            ? optimizeSquad({ teamId: match.homeTeam.id, availablePlayerIds: homeIds, formationPreference: match.homeFormation || '4-3-3' })
            : Promise.resolve(null),
          awayIds.length
            ? optimizeSquad({ teamId: match.awayTeam.id, availablePlayerIds: awayIds, formationPreference: match.awayFormation || '4-3-3' })
            : Promise.resolve(null),
        ]);

        if (cancelled) return;
        const homeSquad = homeResult.status === 'fulfilled' ? homeResult.value : null;
        const awaySquad = awayResult.status === 'fulfilled' ? awayResult.value : null;
        setPredCache({
          matchId,
          home: homeSquad ? squadToLineup(homeSquad, homePlayers, true) : null,
          away: awaySquad ? squadToLineup(awaySquad, awayPlayers, false) : null,
        });
      } catch {
        // pool fetch failed — mark as done so spinner stops
        if (!cancelled) setPredCache({ matchId, home: null, away: null });
      }
    })();

    return () => { cancelled = true; };
  }, [match.id, match.status, match.homeTeam.id, match.awayTeam.id, match.homeFormation, match.awayFormation, match.category]);

  const userVote: '1' | 'X' | '2' | null =
    voteOutcome === 'home_win' ? '1' : voteOutcome === 'draw' ? 'X' : voteOutcome === 'away_win' ? '2' : null;

  const cv1 = voteCounts.home_win;
  const cvX = voteCounts.draw;
  const cv2 = voteCounts.away_win;
  const totalCrowdVotes = Math.max(1, cv1 + cvX + cv2);
  const pc1 = Math.round((cv1 / totalCrowdVotes) * 100);
  const pcX = Math.round((cvX / totalCrowdVotes) * 100);
  const pc2 = 100 - pc1 - pcX;

  const handleVoteChoice = async (choice: '1' | 'X' | '2') => {
    if (!loggedInUser || voteOutcome || voting) return;
    const outcomeMap = { '1': 'home_win', 'X': 'draw', '2': 'away_win' } as const;
    const outcome = outcomeMap[choice];
    // Optimistic update — bars respond immediately
    setVoteOutcome(outcome);
    const optimisticCounts = { ...voteCounts, [outcome]: voteCounts[outcome] + 1 };
    setVoteCounts(optimisticCounts);
    onVoteCountsChange(match.id, { home: optimisticCounts.home_win, draw: optimisticCounts.draw, away: optimisticCounts.away_win });
    setVoting(true);
    try {
      await castVote(match.id, outcome);
      const data = await getMatchVotes(match.id);
      setVoteCounts({ home_win: data.home_win, draw: data.draw, away_win: data.away_win });
      onVoteCountsChange(match.id, { home: data.home_win, draw: data.draw, away: data.away_win });
      triggerPrediction(match.id).then(setPredResult).catch(() => {});
    } catch {
      // Roll back optimistic update
      setVoteOutcome(null);
      setVoteCounts(voteCounts);
      onVoteCountsChange(match.id, { home: voteCounts.home_win, draw: voteCounts.draw, away: voteCounts.away_win });
    } finally {
      setVoting(false);
    }
  };

  // Function to define color based on player rating
  const getRatingColorClass = (rating: number) => {
    if (rating >= 10.0) return 'bg-blue-500 text-white font-black'; // Perfect 10 — Blue
    if (rating >= 7.0) return 'bg-emerald-500 text-black font-extrabold'; // 7+ — Green
    if (rating >= 5.0) return 'bg-yellow-500 text-black font-bold'; // 5–6.9 — Yellow
    return 'bg-rose-500 text-white font-medium'; // Below 5 — Red
  };

  const isPlayerSelected = (playerId: string) => {
    return selectedPlayers.some((p) => p.id === playerId);
  };

  // Upcoming matches always use ML prediction (ignore any pre-seeded lineup in DB)
  const homeLineup = match.status === 'UPCOMING' ? predictedHome : (match.homeLineup ?? null);
  const awayLineup = match.status === 'UPCOMING' ? predictedAway : (match.awayLineup ?? null);
  const isPredicted = match.status === 'UPCOMING';

  return (
    <div className="bg-[#151619] border border-slate-800/60 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* 1. Scoreline and Match Banner */}
      <div className="p-4 md:p-6 bg-gradient-to-b from-[#212228] to-[#151619] border-b border-[#202124] relative">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
          <span className="bg-brand-500/10 text-white font-bold px-2 py-0.5 rounded flex items-center gap-1.5 border border-brand-500/15">
            
            <span className="uppercase tracking-wider">{match.competition}</span>
          </span>
          <span className="text-white-400 font-mono text-[11px] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {match.date} &bull; {match.time}
          </span>
        </div>

        {/* Home vs Away display */}
        <div className="flex items-center justify-between gap-4 py-2">
          {/* Home team */}
          <div className="flex flex-col items-center flex-1 text-center">
            {match.homeTeam.logo ? (
              <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center p-1.5">
                <img
                  src={match.homeTeam.logo}
                  alt={match.homeTeam.name}
                  className="max-w-full max-h-full object-contain drop-shadow-md"
                  onError={(e) => { const el = e.currentTarget.closest('.team-badge-wrap') as HTMLElement; if (el) { el.style.display = 'none'; (el.nextElementSibling as HTMLElement)?.style.setProperty('display','flex'); } }}
                />
              </div>
            ) : null}
            <div
              /* unslop-ignore: circular team-color avatar disc */
              className="w-14 h-14 md:w-16 md:h-16 rounded-full items-center justify-center font-bold text-white text-xl shadow-lg ring-4 ring-slate-800/80"
              style={{ backgroundColor: match.homeTeam.color, border: `2px solid ${match.homeTeam.secondaryColor}`, display: match.homeTeam.logo ? 'none' : 'flex' }}
            >
              {match.homeTeam.shorthand}
            </div>
            <h4 className="mt-3 text-sm md:text-base font-bold text-white leading-tight">
              {match.homeTeam.name}
            </h4>
           
          </div>

          {/* Current Score / V / Live details */}
          <div className="flex flex-col items-center justify-center">
            {match.status === 'LIVE' || match.status === 'FINISHED' ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 md:gap-5">
                  <span className="text-4xl md:text-5xl font-mono font-black text-white tracking-tighter animate-fadeIn">
                    {match.homeScore ?? 0}
                  </span>
                  <span className="text-xl text-slate-600 font-semibold">:</span>
                  <span className="text-4xl md:text-5xl font-mono font-black text-white tracking-tighter animate-fadeIn">
                    {match.awayScore ?? 0}
                  </span>
                </div>
                {match.status === 'LIVE' ? (
                  <span className="mt-3 flex items-center gap-1 bg-brand-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full animate-pulse shadow-md shadow-brand-500/20"> {/* unslop-ignore: LIVE status pill, a true status chip not a decorative default */}
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span> {/* unslop-ignore: circular ping dot */}
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                    <span>LIVE &bull; {match.minute}'</span>
                  </span>
                ) : (
                  <span className="mt-3 bg-slate-800/60 border border-slate-700/60 text-slate-300 text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase flex items-center gap-1">
                    <Check className="w-3 h-3 text-slate-300" /> Finished
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center bg-[#0d0e10]/80 border border-slate-800/80 px-4 py-2.5 rounded-xl">
                <p className="text-[11px] text-white-500 uppercase font-bold tracking-widest font-mono">KICK OFF</p>
                <p className="text-xl md:text-2xl font-mono font-black text-white-500 mt-1">{match.time}</p>
                <span className="text-[10px] text-white-400 font-mono mt-1.5 px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800/60 font-semibold">Scheduled</span>
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center flex-1 text-center">
            {match.awayTeam.logo ? (
              <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center p-1.5">
                <img
                  src={match.awayTeam.logo}
                  alt={match.awayTeam.name}
                  className="max-w-full max-h-full object-contain drop-shadow-md"
                  onError={(e) => { const el = e.currentTarget.closest('.team-badge-wrap') as HTMLElement; if (el) { el.style.display = 'none'; (el.nextElementSibling as HTMLElement)?.style.setProperty('display','flex'); } }}
                />
              </div>
            ) : null}
            <div
              /* unslop-ignore: circular team-color avatar disc */
              className="w-14 h-14 md:w-16 md:h-16 rounded-full items-center justify-center font-bold text-white text-xl shadow-lg ring-4 ring-slate-800/80"
              style={{ backgroundColor: match.awayTeam.color, border: `2px solid ${match.awayTeam.secondaryColor}`, display: match.awayTeam.logo ? 'none' : 'flex' }}
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
            <MapPin className="w-3.5 h-3.5 text-white-200 shrink-0" />
            <span>{match.venue}</span>
          </span>
          {match.homeTeam.id === 'nepal' && (
            <span className="text-slate-600 hidden py-1 sm:inline">&bull;</span>
          )}
          {match.homeTeam.id === 'nepal' && (
            <span className="flex items-center gap-1 text-slate-400">
              <Users className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>Cap: {match.homeTeam.stadiumCapacity}</span>
            </span>
          )}
        </div>

        {/* 2. "Who Will Win?" Prediction Vote — same panel as scoreboard, divided not boxed */}
        <div className="mt-5 pt-5 border-t border-slate-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-xl pointer-events-none" /> {/* unslop-ignore: decorative blur orb, meant to be circular */}
        
        <h5 className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-white ">
            
            Crowd Consensus Prediction, Cast Your Vote!
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Total casts: {totalCrowdVotes.toLocaleString()}
          </span>
        </h5>

        {match.status === 'FINISHED' ? (
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
                    <span className="text-slate-400 truncate">{match.homeTeam.shorthand}</span>
                    <span className="text-brand-500">{pc1}%</span>
                  </div>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full transition-all duration-700" style={{ width: `${pc1}%` }} />
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
                    <span className="text-slate-400 truncate">{match.awayTeam.shorthand}</span>
                    <span className="text-rose-500">{pc2}%</span>
                  </div>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full transition-all duration-700 ml-auto" style={{ width: `${pc2}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-[10.5px] text-slate-400 leading-normal">
                Final Result: <strong className="text-white">{match.homeScore ?? 0} - {match.awayScore ?? 0}</strong> &bull; Crowd majority predicted <strong className="text-brand-400">{pc1 > pc2 && pc1 > pcX ? match.homeTeam.shorthand : pc2 > pc1 && pc2 > pcX ? match.awayTeam.shorthand : 'Draw'}</strong>. (Voting inactive for completed matches).
              </div>
            </div>
          </div>
        ) : userVote ? (
          /* Upcoming Match: User has voted -> displays win/loss predictions / percentage bars */
          <div className="space-y-4">
            <div className="p-3 bg-[#0c0d10] border border-slate-850 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-brand-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" /> Prediction Registered
                </span>
                <span className="text-[9.5px] text-slate-500 font-mono">Live Forecast</span>
              </div>

              {/* Prediction percentage bars */}
              <div className="grid grid-cols-[1fr_80px_1fr] gap-2 items-center">
                {/* Home */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-400 truncate">{match.homeTeam.shorthand}</span>
                    <span className="text-brand-500">{pc1}%</span>
                  </div>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full transition-all duration-700" style={{ width: `${pc1}%` }} />
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
                    <span className="text-slate-400 truncate">{match.awayTeam.shorthand}</span>
                    <span className="text-rose-500">{pc2}%</span>
                  </div>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full transition-all duration-700 ml-auto" style={{ width: `${pc2}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-brand-500/5 border border-brand-500/20 px-3 py-2 rounded-lg text-[10.5px] text-slate-300">
                You predicted <strong>{userVote === '1' ? match.homeTeam.name : userVote === '2' ? match.awayTeam.name : 'Draw'}</strong> to win. Accuracy weight applied.
              </div>
            </div>
          </div>
        ) : (
          /* Upcoming Match: User has NOT voted -> interactive voting options */
          <div className="space-y-3.5">
            {!loggedInUser && (
              <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded-lg text-[11px] text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Please <strong>Sign In</strong> from the top navbar profile menu to register your prediction vote.</span>
              </div>
            )}

            {/* Live crowd vote preview — visible before user casts */}
            {(cv1 + cvX + cv2) > 0 && (
              <div className="grid grid-cols-[1fr_80px_1fr] gap-2 items-center px-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-400 truncate">{match.homeTeam.shorthand}</span>
                    <span className="text-brand-500">{pc1}%</span>
                  </div>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full transition-all duration-700" style={{ width: `${pc1}%` }} />
                  </div>
                </div>
                <div className="space-y-1 text-center font-bold">
                  <span className="text-[10.5px] font-mono block text-slate-400">{pcX}% Draw</span>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-600 h-full transition-all duration-700 mx-auto" style={{ width: `${pcX}%` }} />
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex justify-between text-[11px] font-mono font-bold flex-row-reverse">
                    <span className="text-slate-400 truncate">{match.awayTeam.shorthand}</span>
                    <span className="text-rose-500">{pc2}%</span>
                  </div>
                  <div className="w-full bg-[#07080a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full transition-all duration-700 ml-auto" style={{ width: `${pc2}%` }} />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {/* Home win */}
              <button
                onClick={() => handleVoteChoice('1')}
                disabled={!loggedInUser || !!voting}
                className="bg-brand-500/5 border border-brand-500/15 hover:border-brand-500/40 disabled:opacity-40 disabled:hover:border-brand-500/15 p-3.5 rounded-xl hover:bg-brand-500/10 text-center transition-all cursor-pointer group active:scale-95"
              >
                <div className="text-[10px] font-mono text-brand-400 uppercase tracking-widest mb-1 font-bold">Win (1)</div>
                <div className="text-xs font-black text-slate-200 truncate group-hover:text-white">
                  {match.homeTeam.shorthand}
                </div>
              </button>

              {/* Draw */}
              <button
                onClick={() => handleVoteChoice('X')}
                disabled={!loggedInUser || !!voting}
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
                disabled={!loggedInUser || !!voting}
                className="bg-[#1c1214] border border-rose-500/15 hover:border-rose-500/40 disabled:opacity-40 disabled:hover:border-rose-500/15 p-3.5 rounded-xl hover:bg-rose-500/10 text-center transition-all cursor-pointer group active:scale-95"
              >
                <div className="text-[10px] font-mono text-rose-400 uppercase tracking-widest mb-1 font-bold font-mono">Win (2)</div>
                <div className="text-xs font-black text-slate-200 truncate group-hover:text-white">
                  {match.awayTeam.shorthand}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Algorithm 1 prediction row — shown pre-vote and post-vote for any non-finished match */}
        {match.status !== 'FINISHED' && predResult && (
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 mt-3 pt-3 border-t border-slate-800/60">
            <span className="font-bold uppercase tracking-wider text-slate-200">ML Consensus</span>
            <span className="font-mono">
              H <span className="text-brand-400 font-bold">{Math.round(predResult.prediction.homeWinProb * 100)}%</span>
              &nbsp;· D <span className="text-slate-400 font-bold">{Math.round(predResult.prediction.drawProb * 100)}%</span>
              &nbsp;· A <span className="text-rose-400 font-bold">{Math.round(predResult.prediction.awayWinProb * 100)}%</span>
              &nbsp;· conf <span className="text-amber-400 font-bold">{predResult.confidence.toFixed(0)}%</span>
            </span>
          </div>
        )}
        </div>
      </div>

      {/* 3. Details Navigation Tabs */}
      <div className="px-4 border-b border-slate-800 bg-[#12141C]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('lineup')}
            className={`py-3 text-xs font-bold uppercase tracking-wider relative transition-all ${
              activeTab === 'lineup' 
                ? 'text-brand-400 border-b-2 border-brand-500 font-extrabold'
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
                  ? 'text-brand-400 border-b-2 border-brand-500 font-extrabold'
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
                ? 'text-brand-400 border-b-2 border-brand-500 font-extrabold'
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
            {homeLineup && awayLineup ? (
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
                  <div className="absolute top-[50%] left-[50%] w-[16%] aspect-square border-2 border-white/5 rounded-full transform -translate-x-1/2 -translate-y-1/2" /> {/* unslop-ignore: literal pitch center-circle marking */}
                  <div className="absolute top-[50%] left-[50%] w-3 h-3 bg-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2" />

                  {/* Helper indicators overlay */}
                  <div className="absolute top-2.5 left-3.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    <span>{match.homeTeam.shorthand} ({homeLineup.formation})</span>
                  </div>
                  <div className="absolute top-2.5 right-3.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-end">
                    <span>{match.awayTeam.shorthand} ({awayLineup.formation})</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  </div>

                  {/* Home Team Players nodes on Left half of pitch */}
                  {homeLineup.starters.map(({ player, x, y }) => {
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
                          className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs cursor-pointer shadow-lg transition-all duration-300 motion-safe:hover:scale-120 ${
                            isSel
                              ? 'ring-4 ring-offset-2 ring-brand-500 scale-110'
                              : 'ring-2 ring-[#0A0B0E] group-hover:ring-brand-400/30'
                          }`}
                          style={{ 
                            backgroundColor: match.homeTeam.color, 
                            color: '#ffffff',
                          }}
                        >
                          {player.number}

                          {/* Hover highlight halo */}
                          {hoveredPlayer?.id === player.id && (
                            <div className="absolute -inset-1 rounded-full border border-white animate-ping opacity-60 pointer-events-none" /> // unslop-ignore: circular halo around a circular avatar
                          )}

                          {/* Float Player match Rating badge — finished/live matches only */}
                          {!isPredicted && (
                            <div className={`absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded text-[10px] font-black font-sans leading-none flex items-center shadow-md select-none ${getRatingColorClass(player.rating)}`}>
                              {player.rating.toFixed(1)}
                            </div>
                          )}
                        </div>

                        {/* Player name indicator */}
                        <span className="mt-1.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-[10.5px] tracking-tight text-center max-w-[80px] truncate leading-none shadow">
                          {player.name.split(' ').pop()}
                        </span>
                      </div>
                    );
                  })}

                  {/* Away Team Players nodes on Right half of pitch */}
                  {awayLineup.starters.map(({ player, x, y }) => {
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
                          className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs cursor-pointer shadow-lg transition-all duration-300 motion-safe:hover:scale-120 ${
                            isSel
                              ? 'ring-4 ring-offset-2 ring-rose-500 scale-110'
                              : 'ring-2 ring-[#0A0B0E] group-hover:ring-rose-500/45'
                          }`}
                          style={{ 
                            backgroundColor: match.awayTeam.color, 
                            color: '#ffffff',
                          }}
                        >
                          {player.number}

                          {/* Hover highlight halo */}
                          {hoveredPlayer?.id === player.id && (
                            <div className="absolute -inset-1 rounded-full border border-white animate-ping opacity-60 pointer-events-none" /> // unslop-ignore: circular halo around a circular avatar
                          )}

                          {/* Float Player match Rating badge — finished/live matches only */}
                          {!isPredicted && (
                            <div className={`absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans leading-none flex items-center shadow-md select-none ${getRatingColorClass(player.rating)}`}>
                              {player.rating.toFixed(1)}
                            </div>
                          )}
                        </div>

                        {/* Player name indicator */}
                        <span className="mt-1.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-[10.5px] tracking-tight text-center max-w-[80px] truncate leading-none shadow">
                          {player.name.split(' ').pop()}
                        </span>
                      </div>
                    );
                  })}

                  {/* Predicted Lineup Indicator centered at the bottom of the pitch container */}
                  {isPredicted && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-brand-500/10 border border-brand-500/25 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white-400 flex items-center gap-1.5 backdrop-blur-sm shadow-md shadow-black/50 select-none z-20"> {/* unslop-ignore: status pill, not a decorative default */}
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                      Predicted Lineup by Machine
                    </div>
                  )}
                </div>

                {/* Show Hover/Active Player Details inline — fixed height prevents layout shift */}
                <div className="h-14">
                  {hoveredPlayer && (
                    <div className="bg-[#1C1F2A] border border-slate-800 p-3 rounded-lg flex items-center justify-between animate-fadeIn text-xs h-full">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">
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
                </div>
              </>
            ) : lineupLoading ? (
              <div className="py-12 text-center text-slate-500 border border-slate-850 border-dashed rounded-xl">
                <Loader2 className="w-7 h-7 text-brand-500 mx-auto mb-2 animate-spin" />
                <p className="text-sm font-semibold text-slate-300">Predicting Lineup...</p>
                <p className="text-xs text-slate-500 mt-1">Machine is selecting the optimal XI from available players.</p>
              </div>
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
                  <div className="bg-brand-500 h-full rounded-l-full" style={{ width: `${match.stats.possession[0]}%` }} />
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
                    className="bg-brand-500 h-full rounded-l-full"
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
                    className="bg-brand-500 h-full rounded-l-full"
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
                    className="bg-brand-500 h-full rounded-l-full"
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
                    <span className="text-brand-400 font-bold text-lg">{match.stats.fouls[0]}</span>
                    <span className="text-slate-700">vs</span>
                    <span className="text-rose-500 font-bold text-lg">{match.stats.fouls[1]}</span>
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
                    <span className="text-slate-800 font-mono">vs</span>
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
                <Info className="w-4 h-4 text-brand-500" />
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
                  <span className="text-slate-300 font-semibold font-mono">{match.homeTeam.stadiumCapacity}</span>
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
            <div className="bg-brand-500/5 border border-brand-500/10 rounded-lg p-3 text-[10px] text-slate-500 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
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
