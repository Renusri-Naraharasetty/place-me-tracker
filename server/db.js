import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_C7cudopM8fPq@ep-royal-cell-a42pwns2-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

// Initialization query using Postgres syntax
const initQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    college TEXT DEFAULT '',
    branch TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    link TEXT DEFAULT '',
    date_applied TEXT NOT NULL,
    resume_version TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'Applied',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS interview_stages (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    stage_type TEXT NOT NULL,
    stage_date TEXT DEFAULT '',
    result TEXT DEFAULT 'Pending',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS outcomes (
    id TEXT PRIMARY KEY,
    application_id TEXT UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    outcome_type TEXT NOT NULL,
    selection_date TEXT DEFAULT '',
    offer_type TEXT DEFAULT '',
    stipend_salary TEXT DEFAULT '',
    joining_date TEXT DEFAULT '',
    rejection_date TEXT DEFAULT '',
    rejection_stage TEXT DEFAULT '',
    rejection_reason TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS interview_experiences (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Medium',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS resume_analyses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_text TEXT NOT NULL,
    jd_text TEXT NOT NULL,
    matched_skills TEXT DEFAULT '[]',
    missing_skills TEXT DEFAULT '[]',
    score REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

pool.query(initQuery)
  .then(() => console.log('PostgreSQL Database connected and initialized.'))
  .catch(err => console.error("Database initialization failed:", err));

export default pool;
