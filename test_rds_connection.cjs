const { Client } = require('pg');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'me-central-1' });

async function main() {
  let password = '2026Gogreen123';
  

  const client = new Client({
    host: 'go-green-database-1.clq6koywkjve.me-central-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'gogreen',
    password,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Attempting to connect to RDS...');
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT version()');
    console.log('Database version:', res.rows[0].version);
  } catch (error) {
    console.error('Database error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}
main().catch(console.error);
