import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_C7cudopM8fPq@ep-royal-cell-a42pwns2-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function migrate() {
  try {
    console.log("Checking columns for 'users' table...");
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const columns = res.rows.map(r => r.column_name);
    console.log("Current columns:", columns);

    if (!columns.includes('username')) {
      console.log("Adding 'username' column...");
      // Add as nullable first
      await pool.query('ALTER TABLE users ADD COLUMN username TEXT UNIQUE');
      
      // Fill existing users with a default username (email prefix or 'user_id')
      console.log("Migrating existing users...");
      const users = await pool.query('SELECT id, email, name FROM users');
      for (const user of users.rows) {
        let base = (user.email ? user.email.split('@')[0] : user.name.split(' ')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (base.length < 4) base = 'user_' + base;
        
        let final = base;
        let counter = 1;
        while (true) {
          const check = await pool.query('SELECT id FROM users WHERE username = $1', [final]);
          if (check.rows.length === 0) break;
          final = `${base}_${counter}`;
          counter++;
        }
        
        await pool.query('UPDATE users SET username = $1 WHERE id = $2', [final, user.id]);
        console.log(`User ${user.id} -> ${final}`);
      }
      
      // Set NOT NULL
      await pool.query('ALTER TABLE users ALTER COLUMN username SET NOT NULL');
      console.log("'username' column added and populated.");
    }

    if (columns.includes('email')) {
      console.log("Making 'email' column nullable...");
      await pool.query('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
    }

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
