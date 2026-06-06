import { Schema, model, Document } from 'mongoose';

export interface IPlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface IPlayer extends Document {
  name: string;
  position: 'FW' | 'MF' | 'DF' | 'GK';
  nationality: string;
  age: number;
  team: Schema.Types.ObjectId;
  gender: 'M' | 'F';
  stats: IPlayerStats;
  careerStats: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
  eloRating: number;
  source: 'nepali' | 'european';
  createdAt: Date;
}

const playerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, index: true },
    position: { type: String, enum: ['FW', 'MF', 'DF', 'GK'], required: true },
    nationality: { type: String, default: 'Nepali' },
    age: { type: Number },
    team: { type: Schema.Types.ObjectId, ref: 'Team' },
    gender: { type: String, enum: ['M', 'F'], default: 'M' },
    stats: {
      pace: { type: Number, default: 50 },
      shooting: { type: Number, default: 50 },
      passing: { type: Number, default: 50 },
      dribbling: { type: Number, default: 50 },
      defending: { type: Number, default: 50 },
      physical: { type: Number, default: 50 },
    },
    careerStats: {
      appearances: { type: Number, default: 0 },
      goals: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      yellowCards: { type: Number, default: 0 },
      redCards: { type: Number, default: 0 },
    },
    eloRating: { type: Number, default: 1600 },
    source: { type: String, enum: ['nepali', 'european'], default: 'nepali' },
  },
  { timestamps: true }
);

export const Player = model<IPlayer>('Player', playerSchema);
