import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema.js';

const DATABASE_URL = process.env.DATABASE_URL;
//check url set
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set (see backend/.env)');
}
//create mysql connection pool
export const pool = mysql.createPool({
  uri: DATABASE_URL,
  connectionLimit: 10,
});
//create drizzle db client
export const db = drizzle(pool, { schema, mode: 'default' });
