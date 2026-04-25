const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(64) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      profile_picture_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_certifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      tree_id VARCHAR(255) NOT NULL,
      cert_id VARCHAR(255) NOT NULL,
      obtained_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, tree_id, cert_id)
    );
  `);
  console.log('Database initialized');
}

module.exports = { pool, initDb };
