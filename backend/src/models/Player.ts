import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  playerId: string;
  name: string;
  team: mongoose.Types.ObjectId;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  nationality: string;
  dateOfBirth: Date;
  physicalAttributes: {
    height: number;
    weight: number;
    footedness: 'Left' | 'Right' | 'Both';
  };
  contractDetails: {
    contractStart: Date;
    contractEnd: Date;
    contractStatus: 'Active' | 'Expired' | 'Negotiating';
    marketValue: number;
  };
  stats: Record<string, any>;
  estimatedStats: {
    xG: number;
    xA: number;
    injuryRisk: number;
    fatigueLevel: number;
    recoveryTime?: number;
  };
  formHistory: Array<{
    matchDate: Date;
    opponent: string;
    rating: number;
    minutes: number;
    goals: number;
    assists: number;
    keyStats?: Record<string, any>;
  }>;
  injuryHistory: Array<{
    injuryType: string;
    dateStart: Date;
    dateEnd?: Date;
    status: 'Active' | 'Recovered' | 'Monitoring';
    severity: 'Minor' | 'Moderate' | 'Severe';
  }>;
  roleClassification: {
    primaryRole: string;
    secondaryRole?: string;
    cluster?: number;
    confidence?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const playerSchema = new Schema<IPlayer>(
  {
    playerId: { type: String, required: true, unique: true },
    name: { type: String, required: true, minlength: 2, maxlength: 100 },
    team: { type: Schema.Types.ObjectId, ref: 'Team' },
    position: { type: String, enum: ['GK', 'DEF', 'MID', 'FWD'] },
    nationality: String,
    dateOfBirth: Date,
    physicalAttributes: {
      height: Number,
      weight: Number,
      footedness: { type: String, enum: ['Left', 'Right', 'Both'] },
    },
    contractDetails: {
      contractStart: Date,
      contractEnd: Date,
      contractStatus: { type: String, enum: ['Active', 'Expired', 'Negotiating'] },
      marketValue: Number,
    },
    stats: mongoose.Schema.Types.Mixed,
    estimatedStats: {
      xG: Number,
      xA: Number,
      injuryRisk: { type: Number, min: 0, max: 1 },
      fatigueLevel: { type: Number, min: 0, max: 1 },
      recoveryTime: Number,
    },
    formHistory: [
      {
        matchDate: Date,
        opponent: String,
        rating: { type: Number, min: 0, max: 10 },
        minutes: Number,
        goals: Number,
        assists: Number,
        keyStats: mongoose.Schema.Types.Mixed,
      },
    ],
    injuryHistory: [
      {
        injuryType: String,
        dateStart: Date,
        dateEnd: Date,
        status: { type: String, enum: ['Active', 'Recovered', 'Monitoring'] },
        severity: { type: String, enum: ['Minor', 'Moderate', 'Severe'] },
      },
    ],
    roleClassification: {
      primaryRole: String,
      secondaryRole: String,
      cluster: Number,
      confidence: Number,
    },
  },
  { timestamps: true }
);

playerSchema.index({ playerId: 1 });
playerSchema.index({ team: 1 });
playerSchema.index({ position: 1 });
playerSchema.index({ 'stats.season2026.goals': -1 });
playerSchema.index({ 'formHistory.matchDate': -1 });

export const Player = mongoose.model<IPlayer>('Player', playerSchema);
