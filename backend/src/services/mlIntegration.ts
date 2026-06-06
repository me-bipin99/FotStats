const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function callML<T>(endpoint: string, payload: unknown): Promise<T> {
  const res = await fetch(`${ML_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`ML service error on ${endpoint}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface VotePayload {
  userId: string;
  outcome: 'home_win' | 'draw' | 'away_win';
  reputation: number;
}

export function predictMatch(matchId: string, votes: VotePayload[]) {
  return callML('/predict-match', { matchId, votes });
}

export function comparePlayers(playerAId: string, playerBId: string) {
  return callML('/compare-players', { playerAId, playerBId });
}

export function optimizeSquad(
  teamId: string,
  availablePlayerIds: string[],
  formationPreference: string,
  constraints: { injured: string[]; suspended: string[] }
) {
  return callML('/optimize-squad', { teamId, availablePlayerIds, formationPreference, constraints });
}
