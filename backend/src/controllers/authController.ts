import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import type { AuthRequest } from '../middleware/authMiddleware';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Email or password incorrect' });
    return;
  }
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRY || '7d') as unknown as number,
  });
  res.json({ token, user: { id: user._id, email: user.email, name: user.name, reputation: user.reputation } });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409).json({ error: 'EMAIL_TAKEN', message: 'Email already registered' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, name });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRY || '7d') as unknown as number,
  });
  res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, reputation: user.reputation } });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.userId).select('email name reputation').lean();
  if (!user) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }
  res.json({ id: user._id, email: user.email, name: user.name, reputation: user.reputation });
}
