import pool from './server/db.js';

async function checkUser() {
  try {
    const res = await pool.query("SELECT * FROM users WHERE username = 'renu_chikki'");
    console.log(res.rows);
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUser();
