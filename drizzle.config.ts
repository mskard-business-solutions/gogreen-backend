/// <reference types="node" />
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'khush',
    password: process.env.DB_PASSWORD || 'khush123',
    database: process.env.DB_NAME || 'gogreen',
    ssl: false,
  },
});
