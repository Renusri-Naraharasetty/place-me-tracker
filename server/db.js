import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use persistent disk path if on Render (or other cloud), otherwise local
const dbPath = process.env.DB_PATH || path.join(__dirname, 'placement.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    college TEXT DEFAULT '',
    branch TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    link TEXT DEFAULT '',
    date_applied TEXT NOT NULL,
    resume_version TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'Applied',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS interview_stages (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL,
    stage_type TEXT NOT NULL,
    stage_date TEXT DEFAULT '',
    result TEXT DEFAULT 'Pending',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS outcomes (
    id TEXT PRIMARY KEY,
    application_id TEXT UNIQUE NOT NULL,
    outcome_type TEXT NOT NULL,
    selection_date TEXT DEFAULT '',
    offer_type TEXT DEFAULT '',
    stipend_salary TEXT DEFAULT '',
    joining_date TEXT DEFAULT '',
    rejection_date TEXT DEFAULT '',
    rejection_stage TEXT DEFAULT '',
    rejection_reason TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS interview_experiences (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL,
    question TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Medium',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resume_analyses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    resume_text TEXT NOT NULL,
    jd_text TEXT NOT NULL,
    matched_skills TEXT DEFAULT '[]',
    missing_skills TEXT DEFAULT '[]',
    score REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export default db;
