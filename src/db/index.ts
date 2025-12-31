import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'khush',
  password: process.env.DB_PASSWORD || 'khush123',
  database: process.env.DB_NAME || 'gogreen',
  ssl: false,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Export pool for raw queries if needed
export { pool };
