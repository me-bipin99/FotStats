import type { Match, Player, Team } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api/v1';
const TOKEN_KEY = 'FOTNEP_TOKEN';

// ─── Raw API shapes (what the backend returns) ───────────────────────────────

export interface ApiPlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface ApiPlayer {
  _id: string;
  name: string;
  position: 'FW' | 'MF' | 'DF' | 'GK';
  nationality: string;
  age: number;
  gender: 'M' | 'F';
  team?: ApiTeam | string;
  stats: ApiPlayerStats;
  careerStats: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
  eloRating: number;
  source: 'nepali' | 'european';
}

export interface ApiTeam {
  _id: string;
  name: string;
  country: string;
  color: string;
  stadium?: string;
  coach?: string;
  players?: ApiPlayer[];
  formation: string;
  founded?: number;
}

export interface ApiMatch {
  _id: string;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  date: string;
  competition: string;
  status: 'upcoming' | 'live' | 'completed';
  venue?: string;
  homeFormation: string;
  awayFormation: string;
  homeLineup: { playerId: ApiPlayer | string; position: string; shirtNumber: number }[];
  awayLineup: { playerId: ApiPlayer | string; position: string; shirtNumber: number }[];
  result?: { homeScore: number; awayScore: number };
  voteCounts?: { home_win: number; draw: number; away_win: number };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  reputation: number;
}

export interface CompareResult {
  playerA: { id: string; name: string; stats: ApiPlayerStats };
  playerB: { id: string; name: string; stats: ApiPlayerStats };
  similarityScore: number;
  attributeComparison: Record<string, { playerA: number; playerB: number }>;
  strengths: { playerA: string[]; playerB: string[] };
}

export interface SquadResult {
  teamId: string;
  startingXI: { playerId: string; playerName: string; position: string; bench: false }[];
  bench: { playerId: string; playerName: string; position: string; bench: true }[];
  formation: string;
  confidence: number;
  tacticalInsights: string[];
  keyMissingPlayers: { playerId: string; reason: string }[];
}

export interface PredictionResult {
  matchId: string;
  prediction: { homeWinProb: number; drawProb: number; awayWinProb: number };
  confidence: number;
  voteBreakdown: { homeWin: number; draw: number; awayWin: number };
}

// ─── Adapter functions ────────────────────────────────────────────────────────

function normalizeStatus(s: 'upcoming' | 'live' | 'completed'): 'UPCOMING' | 'LIVE' | 'FINISHED' {
  if (s === 'live') return 'LIVE';
  if (s === 'completed') return 'FINISHED';
  return 'UPCOMING';
}

function deriveCategory(competition: string): 'MEN' | 'WOMEN' | 'DOMESTIC' {
  const lower = competition.toLowerCase();
  if (lower.includes('women') || lower.includes('female') || lower.includes('saff women')) return 'WOMEN';
  if (lower.includes('nsl') || lower.includes('a-division') || lower.includes('martyr') || lower.includes('domestic') || lower.includes('club')) return 'DOMESTIC';
  return 'MEN';
}

function teamShorthand(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
}

export function adaptTeam(t: ApiTeam): Team {
  return {
    id: t._id,
    name: t.name,
    shorthand: teamShorthand(t.name),
    color: t.color || '#DC2626',
    secondaryColor: '#94a3b8',
    rating: 7.0,
    coach: t.coach || '—',
    stadium: t.stadium || '—',
    stadiumCapacity: '—',
  };
}

export function adaptPlayer(p: ApiPlayer): Player {
  const teamName =
    p.team && typeof p.team === 'object' ? (p.team as ApiTeam).name : p.nationality || 'Nepal';
  return {
    id: p._id,
    name: p.name,
    number: 0,
    position: p.position,
    positionDetail: p.position,
    rating: Math.min(Math.round((p.eloRating / 240) * 10) / 10, 10),
    age: p.age || 0,
    height: '—',
    weight: '—',
    marketValue: '—',
    goals: p.careerStats.goals,
    assists: p.careerStats.assists,
    matchesPlayed: p.careerStats.appearances,
    yellowCards: p.careerStats.yellowCards,
    redCards: p.careerStats.redCards,
    preferredFoot: 'Right',
    club: teamName,
    attributes: {
      pace: p.stats.pace,
      shooting: p.stats.shooting,
      passing: p.stats.passing,
      dribbling: p.stats.dribbling,
      defending: p.stats.defending,
      physical: p.stats.physical,
    },
  };
}

export function adaptMatch(m: ApiMatch): Match {
  const d = new Date(m.date);
  const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const votes = m.voteCounts ?? { home_win: 0, draw: 0, away_win: 0 };
  return {
    id: m._id,
    category: deriveCategory(m.competition),
    competition: m.competition,
    date: dateStr,
    time: timeStr,
    status: normalizeStatus(m.status),
    venue: m.venue || '—',
    homeTeam: adaptTeam(m.homeTeam),
    awayTeam: adaptTeam(m.awayTeam),
    homeScore: m.result?.homeScore,
    awayScore: m.result?.awayScore,
    predictionVotes: {
      home: votes.home_win,
      draw: votes.draw,
      away: votes.away_win,
    },
  };
}

// ─── HTTP client ──────────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: { ...headers, ...options?.headers } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function apiRegister(email: string, password: string, name: string): Promise<{ token: string; user: AuthUser }> {
  return request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
}

export async function getMe(): Promise<AuthUser> {
  return request<AuthUser>('/auth/me');
}

// ─── Players ─────────────────────────────────────────────────────────────────

export async function getPlayers(params?: {
  position?: string;
  search?: string;
  gender?: 'M' | 'F';
  limit?: number;
  offset?: number;
}): Promise<{ players: Player[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.position) qs.set('position', params.position);
  if (params?.search) qs.set('search', params.search);
  if (params?.gender) qs.set('gender', params.gender);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const raw = await request<{ players: ApiPlayer[]; total: number }>(`/players?${qs}`);
  return { players: raw.players.map(adaptPlayer), total: raw.total };
}

export async function getPlayer(id: string): Promise<Player> {
  const raw = await request<ApiPlayer>(`/players/${id}`);
  return adaptPlayer(raw);
}

export async function getRawPlayer(id: string): Promise<ApiPlayer> {
  return request<ApiPlayer>(`/players/${id}`);
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  const raw = await request<{ teams: ApiTeam[] }>('/teams');
  return raw.teams.map(adaptTeam);
}

export async function getTeam(id: string): Promise<Team> {
  const raw = await request<ApiTeam>(`/teams/${id}`);
  return adaptTeam(raw);
}

export async function getRawTeam(id: string): Promise<ApiTeam & { players: ApiPlayer[] }> {
  return request(`/teams/${id}`);
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export async function getMatches(params?: {
  status?: 'upcoming' | 'live' | 'completed';
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ matches: Match[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const raw = await request<{ matches: ApiMatch[]; total: number }>(`/matches?${qs}`);
  return { matches: raw.matches.map(adaptMatch), total: raw.total };
}

export async function getMatch(id: string): Promise<Match> {
  const raw = await request<ApiMatch>(`/matches/${id}`);
  return adaptMatch(raw);
}

export async function getRawMatch(id: string): Promise<ApiMatch> {
  return request<ApiMatch>(`/matches/${id}`);
}

export async function createMatch(data: {
  homeTeam: string;
  awayTeam: string;
  date: string;
  competition: string;
  venue?: string;
  homeFormation?: string;
  awayFormation?: string;
}): Promise<{ match: ApiMatch }> {
  return request('/matches', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMatch(
  id: string,
  updates: Partial<{
    date: string;
    competition: string;
    venue: string;
    status: 'upcoming' | 'live' | 'completed';
    homeFormation: string;
    awayFormation: string;
    result: { homeScore: number; awayScore: number };
  }>
): Promise<{ match: ApiMatch }> {
  return request(`/matches/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
}

// ─── Votes ────────────────────────────────────────────────────────────────────

export async function castVote(matchId: string, outcome: 'home_win' | 'draw' | 'away_win'): Promise<void> {
  await request('/votes', { method: 'POST', body: JSON.stringify({ matchId, outcome }) });
}

export async function getMatchVotes(matchId: string): Promise<{ home_win: number; draw: number; away_win: number }> {
  return request(`/votes/${matchId}`);
}

export async function getLeaderboard(limit = 10): Promise<{ leaderboard: { _id: string; name: string; reputation: number; predictionsCorrect: number; predictionsTotal: number }[] }> {
  return request(`/votes/leaderboard?limit=${limit}`);
}

// ─── Predictions (Algorithm 1) ────────────────────────────────────────────────

export async function triggerPrediction(matchId: string): Promise<PredictionResult> {
  return request('/predict-match', { method: 'POST', body: JSON.stringify({ matchId }) });
}

export async function getPrediction(matchId: string): Promise<PredictionResult | null> {
  try {
    return await request<PredictionResult>(`/predict-match/${matchId}`);
  } catch {
    return null;
  }
}

// ─── Player Comparison (Algorithm 2) ─────────────────────────────────────────

export async function comparePlayers(playerAId: string, playerBId: string): Promise<CompareResult> {
  return request('/compare-players', { method: 'POST', body: JSON.stringify({ playerAId, playerBId }) });
}

// ─── Squad Optimization (Algorithm 3) ────────────────────────────────────────

export async function optimizeSquad(params: {
  teamId: string;
  availablePlayerIds: string[];
  formationPreference: string;
  constraints?: { injured: string[]; suspended: string[] };
}): Promise<SquadResult> {
  return request('/optimize-squad', {
    method: 'POST',
    body: JSON.stringify({ ...params, constraints: params.constraints ?? { injured: [], suspended: [] } }),
  });
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
