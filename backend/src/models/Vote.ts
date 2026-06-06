import { Schema, model, Document } from 'mongoose';

export interface IVote extends Document {
  userId: Schema.Types.ObjectId;
  matchId: Schema.Types.ObjectId;
  outcome: 'home_win' | 'draw' | 'away_win';
  correct: boolean | null;
  timestamp: Date;
}

const voteSchema = new Schema<IVote>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
  outcome: { type: String, enum: ['home_win', 'draw', 'away_win'], required: true },
  correct: { type: Boolean, default: null },
  timestamp: { type: Date, default: Date.now },
});

voteSchema.index({ userId: 1, matchId: 1 }, { unique: true });

export const Vote = model<IVote>('Vote', voteSchema);
