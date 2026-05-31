import { Response } from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { AuthRequest } from '@middleware/auth';
import { ApiError } from '@middleware/errorHandler';

export async function registerUser(req: AuthRequest, res: Response) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new ApiError(400, 'Missing required fields');
    }

    // TODO: Check if user exists
    // TODO: Hash password
    // TODO: Create user in database

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
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

    // TODO: Find user by email
    // TODO: Verify password
    // TODO: Generate JWT token

    const token = jwt.sign(
      { userId: 'user_id', email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      status: 'success',
      token,
      expiresIn: process.env.JWT_EXPIRE || '24h',
    });
  } catch (error) {
    throw error;
  }
}

export async function refreshToken(req: AuthRequest, res: Response) {
  try {
    // TODO: Implement refresh token logic
    res.json({
      status: 'success',
      message: 'Token refreshed',
    });
  } catch (error) {
    throw error;
  }
}
