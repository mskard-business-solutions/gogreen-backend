/// <reference types="node" />
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Modify DATABASE_URL to disable SSL certificate verification for RDS
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (url && url.includes('rds.amazonaws.com')) {
    // Replace sslmode=require with sslmode=no-verify to bypass certificate verification
    return url.replace('sslmode=require', 'sslmode=no-verify');
  }
  return url || `postgresql://${process.env.DB_USER || 'khush'}:${process.env.DB_PASSWORD || 'khush123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'gogreen'}`;
};

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
