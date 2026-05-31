import { createClient } from 'redis';
import { logger } from '@utils/logger';

export let redisClient: ReturnType<typeof createClient> | null = null;

export async function initializeRedis(): Promise<void> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on('error', (err) => logger.error('Redis error:', err));
    redisClient.on('connect', () => logger.info('Redis connected'));

    await redisClient.connect();
  } catch (error) {
    logger.error('Redis connection failed', error);
    throw error;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (!redisClient) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttl?: number): Promise<void> {
  try {
    if (!redisClient) return;
    const options = ttl ? { EX: ttl } : {};
    await redisClient.set(key, JSON.stringify(value), options);
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    if (!redisClient) return;
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
  }
}
