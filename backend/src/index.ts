import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/database';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes (import and mount as implemented)
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/players', playerRoutes);
// app.use('/api/v1/teams', teamRoutes);
// app.use('/api/v1/matches', matchRoutes);
// app.use('/api/v1/votes', voteRoutes);
// app.use('/api/v1/predict-match', predictionRoutes);
// app.use('/api/v1/compare-players', comparisonRoutes);
// app.use('/api/v1/optimize-squad', squadRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fotnep-backend', version: '1.0.0' });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
