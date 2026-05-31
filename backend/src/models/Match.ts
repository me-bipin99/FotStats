import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  matchId: string;
  homeTeam: mongoose.Types.ObjectId;
  awayTeam: mongoose.Types.ObjectId;
  league: mongoose.Types.ObjectId;
  date: Date;
  status: 'scheduled' | 'live' | 'completed';
  result: {
    homeGoals: number;
    awayGoals: number;
  };
  prediction: {
    homeWin: number;
    draw: number;
    awayWin: number;
    confidence: number;
  };
  lineups: {
    home: mongoose.Types.ObjectId[];
    away: mongoose.Types.ObjectId[];
  };
  events: Array<{
    type: string;
    player?: mongoose.Types.ObjectId;
    minute: number;
    team: 'home' | 'away';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    matchId: { type: String, required: true, unique: true },
    homeTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    awayTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    league: { type: Schema.Types.ObjectId, ref: 'League' },
    date: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'live', 'completed'], default: 'scheduled' },
    result: {
      homeGoals: Number,
      awayGoals: Number,
    },
    prediction: {
      homeWin: Number,
      draw: Number,
      awayWin: Number,
      confidence: Number,
    },
    lineups: {
      home: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
      away: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    },
    events: [
      {
        type: String,
        player: { type: Schema.Types.ObjectId, ref: 'Player' },
        minute: Number,
        team: { type: String, enum: ['home', 'away'] },
      },
    ],
  },
  { timestamps: true }
);

matchSchema.index({ matchId: 1 });
matchSchema.index({ homeTeam: 1 });
matchSchema.index({ awayTeam: 1 });
matchSchema.index({ date: -1 });
matchSchema.index({ status: 1 });

export const Match = mongoose.model<IMatch>('Match', matchSchema);
