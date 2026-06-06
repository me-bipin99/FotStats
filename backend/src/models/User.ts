import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  reputation: number;
  predictionsCorrect: number;
  predictionsTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    reputation: { type: Number, default: 50, min: 0, max: 100 },
    predictionsCorrect: { type: Number, default: 0 },
    predictionsTotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
