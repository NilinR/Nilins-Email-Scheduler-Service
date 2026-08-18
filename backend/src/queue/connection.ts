import { Redis } from 'ioredis';
import { config } from '../config.js';

//shared Redis connection for BullMQ
//maxRetriesPerRequest must be null for BullMQ requirements (WATCH/MULTI/EXEC transactions fail if a command is retried)
export const connection = new Redis({
  host: config.redisHost,
  port: config.redisPort,
  maxRetriesPerRequest: null,
});
