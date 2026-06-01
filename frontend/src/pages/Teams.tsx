import { useEffect, useState } from 'react';
import { teamAPI } from '@services/api';
import LineupPitch from '@components/LineupPitch';
import SynergyMatrix from '@components/SynergyMatrix';

interface Team {
  _id: string;
  teamId: string;
  name: string;
  city?: string;
  squad: any[];
}

interface Player {
  _id: string;
  playerId: string;
  name: string;
  position: string;
  stats: any;
}

const POSITION_BADGES = {
  GK: 'badge-gk',
  DEF: 'badge-def',
  MID: 'badge-mid',
  FWD: 'badge-fwd',
};

export default function Teams() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
  const [loadingSquad, setLoadingSquad] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const res = await teamAPI.getAll();
        const teamsData = res.data.data.teams || [];
        setTeams(teamsData);
        if (teamsData.length > 0) {
          setSelectedTeam(teamsData[0]);
          await loadSquad(teamsData[0]);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const loadSquad = async (team: Team) => {
    try {
      setLoadingSquad(true);
      const res = await teamAPI.getSquad(team.teamId);
      const squadData = res.data.data.squad || [];
      setSquadPlayers(squadData);
    } catch (error) {
      console.error('Failed to fetch squad:', error);
    } finally {
      setLoadingSquad(false);
    }
  };

  const handleTeamSelect = async (team: Team) => {
    setSelectedTeam(team);
    await loadSquad(team);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <main className="bg-dark-primary min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Teams</h1>
          <p className="text-text-secondary text-sm">Football Teams & Squads</p>
        </div>

        {/* Teams List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {teams.map((team) => (
            <div
              key={team._id}
              onClick={() => handleTeamSelect(team)}
              className={`card cursor-pointer transition-all ${
                selectedTeam?._id === team._id ? 'border-emerald-500 bg-[#1a1b1f]' : 'hover:border-emerald-500/50'
              }`}
            >
              <h3 className="text-lg font-semibold text-text-primary mb-2">{team.name}</h3>
              {team.city && <p className="text-text-secondary text-sm mb-3">{team.city}</p>}
              <p className="text-xs text-text-muted">Squad Size: {team.squad?.length || 0} players</p>
            </div>
          ))}
        </div>

        {/* Squad Details */}
        {selectedTeam && (
          <div className="card">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-2">{selectedTeam.name} - Squad</h2>
              <p className="text-text-secondary text-sm">{squadPlayers.length} players</p>
            </div>

            {loadingSquad ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin">
                  <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
                </div>
              </div>
            ) : squadPlayers.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="table-head">
                  <tr>
                    <th>Name</th>
                    <th>Pos</th>
                    <th className="text-right">Caps</th>
                    <th className="text-right">Goals</th>
                    <th className="text-right">Assists</th>
                  </tr>
                </thead>
                <tbody>
                  {squadPlayers.map((player) => (
                    <tr key={player._id} className="table-row hover:bg-dark-tertiary cursor-pointer">
                      <td className="font-medium text-text-primary">{player.name}</td>
                      <td>
                        <span className={`badge ${POSITION_BADGES[player.position as keyof typeof POSITION_BADGES]}`}>
                          {player.position}
                        </span>
                      </td>
                      <td className="text-right text-sm">{player.stats?.caps || 0}</td>
                      <td className="text-right text-nepal-red font-semibold">{player.stats?.goals || 0}</td>
                      <td className="text-right text-sm">{player.stats?.assists || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <p className="text-text-secondary">No squad data available</p>
              </div>
            )}
          </div>
        )}

        {/* Visualization Components */}
        {selectedTeam && squadPlayers.length > 0 && (
          <div className="space-y-6 mt-8">
            <LineupPitch lineup={squadPlayers} formation="4-3-3" />
            <SynergyMatrix playerIds={squadPlayers.map(p => p.playerId)} />
          </div>
        )}
      </div>
    </main>
  );
}
