import { Response } from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { AuthRequest } from '@middleware/auth';
import { ApiError } from '@middleware/errorHandler';
import { User } from '@models/User';
import { logger } from '@utils/logger';

export async function registerUser(req: AuthRequest, res: Response) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new ApiError(400, 'Missing required fields');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'User already exists');
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      name,
      role: 'viewer',
    });

    logger.info('User registered', { email: user.email });

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: { userId: user._id, email: user.email },
    });
  } catch (error) {
    throw error;
  }
}

export async function loginUser(req: AuthRequest, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    logger.info('User logged in', { email: user.email });

    return res.json({
      status: 'success',
      token,
      expiresIn: '24h',
      data: { userId: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    throw error;
  }
}

export async function refreshToken(req: AuthRequest, res: Response) {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ApiError(400, 'Token required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    const newToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    return res.json({
      status: 'success',
      token: newToken,
      expiresIn: '24h',
    });
  } catch (error) {
    throw error;
  }
}
