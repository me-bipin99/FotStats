import { Schema, model, Document } from 'mongoose';

interface LineupEntry {
  playerId: Schema.Types.ObjectId;
  position: string;
  shirtNumber: number;
}

export interface IMatch extends Document {
  homeTeam: Schema.Types.ObjectId;
  awayTeam: Schema.Types.ObjectId;
  date: Date;
  competition: string;
  status: 'upcoming' | 'live' | 'completed';
  venue: string;
  homeLineup: LineupEntry[];
  awayLineup: LineupEntry[];
  homeFormation: string;
  awayFormation: string;
  result?: {
    homeScore: number;
    awayScore: number;
  };
  outcome?: 'home_win' | 'draw' | 'away_win';
  createdAt: Date;
}

const lineupEntrySchema = new Schema<LineupEntry>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    position: { type: String, required: true },
    shirtNumber: { type: Number, required: true },
  },
  { _id: false }
);

const matchSchema = new Schema<IMatch>(
  {
    homeTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    awayTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    date: { type: Date, required: true },
    competition: { type: String, required: true },
    status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
    venue: { type: String },
    homeLineup: [lineupEntrySchema],
    awayLineup: [lineupEntrySchema],
    homeFormation: { type: String, default: '4-3-3' },
    awayFormation: { type: String, default: '4-3-3' },
    result: {
      homeScore: Number,
      awayScore: Number,
    },
    outcome: { type: String, enum: ['home_win', 'draw', 'away_win'] },
  },
  { timestamps: true }
);

export const Match = model<IMatch>('Match', matchSchema);
