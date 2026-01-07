// Bypass SSL validation for Aiven (Self-Signed Certs)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = require('pg');

// Use environment variable instead of hardcoded string to avoid Git secrets violation
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL environment variable is missing.");
  console.error("   Run with: set DATABASE_URL=your_connection_string&& node scripts/init_db.js");
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false, // Often required for managed DBs if CA not provided explicitly
  },
});

const query = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Ensure gen_random_uuid() is available

CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  context TEXT NOT NULL,
  notify_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

async function main() {
  console.log('Connecting to Aiven PostgreSQL...');
  try {
    await client.connect();
    console.log('Connected successfully.');
    
    console.log('Running Schema Migration...');
    await client.query(query);
    console.log('✅ Table "follow_ups" checked/created successfully.');
    
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  } finally {
    await client.end();
    console.log('Disconnected.');
  }
}

main();
