import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_C7cudopM8fPq@ep-royal-cell-a42pwns2-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function getCount() {
  try {
    const res = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`Total users: ${res.rows[0].count}`);
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

getCount();
