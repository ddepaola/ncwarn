import Redis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  client.on('error', err => {
    console.error('Redis connection error:', err);
  });

  client.on('connect', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Redis connected');
    }
  });

  return client;
}

export const redis = global.redis || createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  global.redis = redis;
}

export default redis;
