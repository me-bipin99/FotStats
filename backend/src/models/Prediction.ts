import { Schema, model, Document } from 'mongoose';

export interface IPrediction extends Document {
  matchId: Schema.Types.ObjectId;
  prediction: {
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
  };
  confidence: number;
  voteBreakdown: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  timestamp: Date;
}

const predictionSchema = new Schema<IPrediction>({
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  prediction: {
    homeWinProb: Number,
    drawProb: Number,
    awayWinProb: Number,
  },
  confidence: { type: Number, min: 0, max: 100 },
  voteBreakdown: {
    homeWin: Number,
    draw: Number,
    awayWin: Number,
  },
  timestamp: { type: Date, default: Date.now },
});

export const Prediction = model<IPrediction>('Prediction', predictionSchema);
