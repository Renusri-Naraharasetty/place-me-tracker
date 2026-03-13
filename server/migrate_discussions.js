import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_C7cudopM8fPq@ep-royal-cell-a42pwns2-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

const migrationQuery = `
  CREATE TABLE IF NOT EXISTS discussions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    stage TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS discussion_comments (
    id TEXT PRIMARY KEY,
    discussion_id TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS discussion_likes (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discussion_id TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, discussion_id)
  );
`;

async function migrate() {
  try {
    await pool.query(migrationQuery);
    console.log('✓ Discussion tables created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
