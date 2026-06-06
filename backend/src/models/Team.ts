import { Schema, model, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  country: string;
  founded?: number;
  color: string;
  stadium: string;
  coach: string;
  players: Schema.Types.ObjectId[];
  formation: string;
  createdAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, unique: true },
    country: { type: String, default: 'Nepal' },
    founded: { type: Number },
    color: { type: String, default: '#DC2626' },
    stadium: { type: String },
    coach: { type: String },
    players: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    formation: { type: String, default: '4-3-3' },
  },
  { timestamps: true }
);

export const Team = model<ITeam>('Team', teamSchema);
