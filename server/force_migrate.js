import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_C7cudopM8fPq@ep-royal-cell-a42pwns2-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function run() {
  try {
    console.log("1. Adding 'username' column if missing...");
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE');
    
    console.log("2. Populating 'username' for existing users...");
    // Fallback username for anyone missing it
    await pool.query(`
      UPDATE users 
      SET username = COALESCE(split_part(email, '@', 1), MD5(id::text)) 
      WHERE username IS NULL
    `);

    console.log("3. Making 'username' NOT NULL...");
    await pool.query('ALTER TABLE users ALTER COLUMN username SET NOT NULL');

    console.log("4. Adding 'google_id' column if missing...");
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE');

    console.log("5. Making 'email' and 'password' nullable if they are currently NOT NULL...");
    await pool.query('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
    await pool.query('ALTER TABLE users ALTER COLUMN password DROP NOT NULL');

    console.log("Migration SUCCESSFUL.");
    
    const res = await pool.query("SELECT * FROM users LIMIT 1");
    console.log("Sample user record:", res.rows[0]);

  } catch (e) {
    console.error("Migration FAILED:", e.message);
  } finally {
    await pool.end();
  }
}
run();
