import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase } from '@config/database';
import { initializeRedis } from '@config/cache';
import { errorHandler } from '@middleware/errorHandler';
import { requestLogger } from '@middleware/requestLogger';
import { authRoutes } from '@routes/auth';
import { playerRoutes } from '@routes/players';
import { teamRoutes } from '@routes/teams';
import { matchRoutes } from '@routes/matches';
import { insightRoutes } from '@routes/insights';
import { predictionRoutes } from '@routes/predictions';
import { logger } from '@utils/logger';

// Load .env.local from current working directory (backend root)
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/players', playerRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/insights', insightRoutes);
app.use('/api/v1/predictions', predictionRoutes);

// Error handling
app.use(errorHandler);

// Initialize services and start server
async function bootstrap() {
  try {
    console.log('Bootstrap starting...');
    // Connect to MongoDB
    await connectDatabase();
    logger.info('MongoDB connected');
    console.log('After MongoDB connection');

    // Initialize Redis
    await initializeRedis();
    logger.info('Redis initialized');
    console.log('After Redis init');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`✓ Server listening on port ${PORT}`);
      logger.info(`Server running on port ${PORT}`);
    });
    console.log('listen() called');
  } catch (error) {
    console.error('Bootstrap error:', error);
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

bootstrap();

export default app;
