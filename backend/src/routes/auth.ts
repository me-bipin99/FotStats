import express from 'express';
import { loginUser, registerUser, refreshToken } from '@controllers/authController';

export const authRoutes = express.Router();

authRoutes.post('/register', registerUser);
authRoutes.post('/login', loginUser);
authRoutes.post('/refresh', refreshToken);
