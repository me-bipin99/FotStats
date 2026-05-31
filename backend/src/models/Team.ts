import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  teamId: string;
  name: string;
  league: mongoose.Types.ObjectId;
  city: string;
  founded: number;
  squad: mongoose.Types.ObjectId[];
  coach: {
    name: string;
    since: Date;
  };
  stats: Record<string, any>;
  strength: {
    overall: number;
    attack: number;
    midfield: number;
    defense: number;
  };
  formHistory: Array<{
    matchDate: Date;
    opponent: string;
    result: 'W' | 'D' | 'L';
    goalsFor: number;
    goalsAgainst: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    teamId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    league: { type: Schema.Types.ObjectId, ref: 'League' },
    city: String,
    founded: Number,
    squad: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    coach: {
      name: String,
      since: Date,
    },
    stats: mongoose.Schema.Types.Mixed,
    strength: {
      overall: Number,
      attack: Number,
      midfield: Number,
      defense: Number,
    },
    formHistory: [
      {
        matchDate: Date,
        opponent: String,
        result: { type: String, enum: ['W', 'D', 'L'] },
        goalsFor: Number,
        goalsAgainst: Number,
      },
    ],
  },
  { timestamps: true }
);

teamSchema.index({ teamId: 1 });
teamSchema.index({ league: 1 });
teamSchema.index({ name: 1 });

export const Team = mongoose.model<ITeam>('Team', teamSchema);
