import { BullModuleOptions } from '@nestjs/bull';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisTlsEnabled =
  process.env.REDIS_TLS === 'true' ||
  (process.env.REDIS_TLS !== 'false' &&
    redisHost.toLowerCase().endsWith('.upstash.io'));

export const queueConfig: BullModuleOptions = {
  redis: {
    host: redisHost,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    ...(redisTlsEnabled ? { tls: {} } : {}),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
};
