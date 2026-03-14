import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import pool from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'placeme-super-secret-key-2024';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email transporter (will use environment variables)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || 'mock-user',
    pass: process.env.SMTP_PASS || 'mock-pass',
  },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

/* ─── AUTH ─── */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, username, password, college, branch } = req.body;
    if (!name || !username || !password) return res.status(400).json({ error: 'Name, username, and password are required' });
    
    // Username validation: 4-20 chars, alphanumeric/underscore
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username must be 4-20 characters long and contain only letters, numbers, and underscores.' });
    }

    // Check for existing user by username
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'This username is already taken. Please choose another one.' });
    
    // Password validation: min 6 chars, upper, lower, digit
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'Password must include at least 6 characters, one uppercase letter, one lowercase letter, and a number.' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    
    await pool.query(
      'INSERT INTO users (id, name, username, password, college, branch) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, name, username, hashed, college || '', branch || '']
    );
    
    const userRes = await pool.query('SELECT id, name, username, college, branch FROM users WHERE id = $1', [id]);
    const user = userRes.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ user, token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    
    const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userRes.rows[0];
    
    if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const { password: _, ...safe } = user;
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user: safe, token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/google-login', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, sub: google_id } = ticket.getPayload();

    // Check if user exists by google_id or email
    let userRes = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [google_id, email]);
    let user = userRes.rows[0];

    if (!user) {
      // Create user if not exists
      const id = uuidv4();
      
      // Generate a unique username from name or email prefix
      let baseUsername = (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (baseUsername.length < 4) baseUsername = 'user_' + baseUsername;
      baseUsername = baseUsername.slice(0, 15); // Leave room for suffix

      let finalUsername = baseUsername;
      let counter = 1;
      while (true) {
        const check = await pool.query('SELECT id FROM users WHERE username = $1', [finalUsername]);
        if (check.rows.length === 0) break;
        finalUsername = `${baseUsername}_${counter}`;
        counter++;
      }

      await pool.query(
        'INSERT INTO users (id, name, username, email, google_id) VALUES ($1, $2, $3, $4, $5)',
        [id, name, finalUsername, email, google_id]
      );
      userRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      user = userRes.rows[0];
    } else if (!user.google_id) {
      // Link google id if email matches but google_id not set
      await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [google_id, user.id]);
      user.google_id = google_id;
    }

    const { password: _, ...safe } = user;
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user: safe, token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    const userRes = await pool.query('SELECT id, password FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'Username not found' });

    const user = userRes.rows[0];
    if (!user.password) {
      return res.status(400).json({ error: 'This user signed up with Google. Please use Google Login.' });
    }

    const resetToken = jwt.sign({ id: user.id, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });

    // Since we no longer require email for manual signup, 
    // we return the token directly or a success message.
    // As per user request: 1. clicks forgot 2. enters username 3. system verifies 4. user creates new
    // We will return a success state so the frontend can move to step 4 with the token.
    res.json({ message: 'User verified.', token: resetToken });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'reset') throw new Error('Invalid token type');

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long and include an uppercase letter, lowercase letter, and a number.' });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, decoded.id]);

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (e) { res.status(400).json({ error: 'Invalid or expired reset token' }); }
});

/* ─── APPLICATIONS ─── */
app.get('/api/applications/:userId', async (req, res) => {
  try {
    const rows = await pool.query('SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC', [req.params.userId]);
    res.json(rows.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/application/:id', async (req, res) => {
  try {
    const appRes = await pool.query('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (appRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const stages = await pool.query('SELECT * FROM interview_stages WHERE application_id = $1 ORDER BY created_at ASC', [req.params.id]);
    const outcome = await pool.query('SELECT * FROM outcomes WHERE application_id = $1', [req.params.id]);
    const experiences = await pool.query('SELECT * FROM interview_experiences WHERE application_id = $1 ORDER BY created_at ASC', [req.params.id]);
    
    res.json({ 
      ...appRes.rows[0], 
      interviewStages: stages.rows, 
      outcome: outcome.rows[0] || null, 
      interviewExperiences: experiences.rows 
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/applications', async (req, res) => {
  try {
    const { user_id, company, role, link, date_applied, resume_version, notes, status } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO applications (id, user_id, company, role, link, date_applied, resume_version, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, user_id, company, role, link || '', date_applied, resume_version || '', notes || '', status || 'Applied']
    );
    const row = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    res.status(201).json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/applications/:id', async (req, res) => {
  try {
    const { company, role, link, date_applied, resume_version, notes, status } = req.body;
    await pool.query(
      'UPDATE applications SET company=$1, role=$2, link=$3, date_applied=$4, resume_version=$5, notes=$6, status=$7, updated_at=CURRENT_TIMESTAMP WHERE id=$8',
      [company, role, link || '', date_applied, resume_version || '', notes || '', status, req.params.id]
    );
    const row = await pool.query('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    res.json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/applications/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM applications WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── INTERVIEW STAGES ─── */
app.post('/api/interview-stages', async (req, res) => {
  try {
    const { application_id, stage_type, stage_date, result, notes } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO interview_stages (id, application_id, stage_type, stage_date, result, notes) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, application_id, stage_type, stage_date || '', result || 'Pending', notes || '']
    );
    const row = await pool.query('SELECT * FROM interview_stages WHERE id = $1', [id]);
    res.status(201).json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/interview-stages/:id', async (req, res) => {
  try {
    const { stage_type, stage_date, result, notes } = req.body;
    await pool.query(
      'UPDATE interview_stages SET stage_type=$1, stage_date=$2, result=$3, notes=$4 WHERE id=$5',
      [stage_type, stage_date || '', result || 'Pending', notes || '', req.params.id]
    );
    const row = await pool.query('SELECT * FROM interview_stages WHERE id = $1', [req.params.id]);
    res.json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/interview-stages/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM interview_stages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── OUTCOMES ─── */
app.post('/api/outcomes', async (req, res) => {
  try {
    const { application_id, outcome_type, selection_date, offer_type, stipend_salary, joining_date, rejection_date, rejection_stage, rejection_reason } = req.body;
    const id = uuidv4();
    
    const existing = await pool.query('SELECT id FROM outcomes WHERE application_id = $1', [application_id]);
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE outcomes SET outcome_type=$1, selection_date=$2, offer_type=$3, stipend_salary=$4, joining_date=$5, rejection_date=$6, rejection_stage=$7, rejection_reason=$8 WHERE application_id=$9',
        [outcome_type, selection_date || '', offer_type || '', stipend_salary || '', joining_date || '', rejection_date || '', rejection_stage || '', rejection_reason || '', application_id]
      );
      
      const newStatus = outcome_type === 'Selected' ? 'Selected' : 'Rejected';
      await pool.query('UPDATE applications SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [newStatus, application_id]);
      
      const row = await pool.query('SELECT * FROM outcomes WHERE application_id = $1', [application_id]);
      return res.json(row.rows[0]);
    }
    
    await pool.query(
      'INSERT INTO outcomes (id, application_id, outcome_type, selection_date, offer_type, stipend_salary, joining_date, rejection_date, rejection_stage, rejection_reason) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [id, application_id, outcome_type, selection_date || '', offer_type || '', stipend_salary || '', joining_date || '', rejection_date || '', rejection_stage || '', rejection_reason || '']
    );
    
    const newStatus = outcome_type === 'Selected' ? 'Selected' : 'Rejected';
    await pool.query('UPDATE applications SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', [newStatus, application_id]);
    
    const row = await pool.query('SELECT * FROM outcomes WHERE id = $1', [id]);
    res.status(201).json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/outcomes/:applicationId', async (req, res) => {
  try {
    await pool.query('DELETE FROM outcomes WHERE application_id = $1', [req.params.applicationId]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── INTERVIEW EXPERIENCES ─── */
app.post('/api/interview-experiences', async (req, res) => {
  try {
    const { application_id, question, difficulty, notes } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO interview_experiences (id, application_id, question, difficulty, notes) VALUES ($1, $2, $3, $4, $5)',
      [id, application_id, question, difficulty || 'Medium', notes || '']
    );
    const row = await pool.query('SELECT * FROM interview_experiences WHERE id = $1', [id]);
    res.status(201).json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/interview-experiences/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM interview_experiences WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── RESUME ANALYSIS ─── */
app.post('/api/resume-analysis', async (req, res) => {
  try {
    const { user_id, resume_text, jd_text, matched_skills, missing_skills, score } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO resume_analyses (id, user_id, resume_text, jd_text, matched_skills, missing_skills, score) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, user_id, resume_text, jd_text, JSON.stringify(matched_skills), JSON.stringify(missing_skills), score]
    );
    const row = await pool.query('SELECT * FROM resume_analyses WHERE id = $1', [id]);
    res.status(201).json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/resume-analyses/:userId', async (req, res) => {
  try {
    const rows = await pool.query('SELECT * FROM resume_analyses WHERE user_id = $1 ORDER BY created_at DESC', [req.params.userId]);
    res.json(rows.rows.map(r => ({ ...r, matched_skills: JSON.parse(r.matched_skills), missing_skills: JSON.parse(r.missing_skills) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── ANALYTICS ─── */
app.get('/api/analytics/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Total count
    let t_res = await pool.query('SELECT COUNT(*) as count FROM applications WHERE user_id = $1', [userId]);
    const total = parseInt(t_res.rows[0].count, 10);
    
    // Status counts
    let st_res = await pool.query('SELECT status, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY status', [userId]);
    const statusCounts = st_res.rows.map(r => ({ ...r, count: parseInt(r.count, 10) }));

    // Monthly Apps
    let ma_res = await pool.query("SELECT SUBSTRING(date_applied, 1, 7) as month, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY month ORDER BY month", [userId]);
    const monthlyApps = ma_res.rows.map(r => ({ ...r, count: parseInt(r.count, 10) }));

    // Rejection Stages
    let rs_res = await pool.query("SELECT rejection_stage, COUNT(*) as count FROM outcomes o JOIN applications a ON o.application_id = a.id WHERE a.user_id = $1 AND o.outcome_type = 'Rejected' AND o.rejection_stage != '' GROUP BY rejection_stage", [userId]);
    const rejectionStages = rs_res.rows.map(r => ({ ...r, count: parseInt(r.count, 10) }));

    // Rejection Reasons
    let rr_res = await pool.query("SELECT rejection_reason, COUNT(*) as count FROM outcomes o JOIN applications a ON o.application_id = a.id WHERE a.user_id = $1 AND o.outcome_type = 'Rejected' AND o.rejection_reason != '' GROUP BY rejection_reason", [userId]);
    const rejectionReasons = rr_res.rows.map(r => ({ ...r, count: parseInt(r.count, 10) }));

    // Interviews
    let ie_res = await pool.query('SELECT COUNT(DISTINCT a.id) as count FROM applications a JOIN interview_stages s ON a.id = s.application_id WHERE a.user_id = $1', [userId]);
    let iw_res = await pool.query("SELECT COUNT(DISTINCT application_id) as count FROM outcomes o JOIN applications a ON o.application_id = a.id WHERE a.user_id = $1", [userId]);
    let is_res = await pool.query("SELECT COUNT(*) as count FROM applications WHERE user_id = $1 AND (status = 'Interview Scheduled' OR status = 'Shortlisted')", [userId]);
    
    const interviewsExplicit = parseInt(ie_res.rows[0].count, 10);
    const interviewsWithOutcome = parseInt(iw_res.rows[0].count, 10);
    const interviewsFromStatus = parseInt(is_res.rows[0].count, 10);
    const interviews = Math.max(interviewsExplicit, interviewsWithOutcome, interviewsFromStatus);

    // Offers
    let oo_res = await pool.query("SELECT COUNT(*) as count FROM outcomes o JOIN applications a ON o.application_id = a.id WHERE a.user_id = $1 AND o.outcome_type = 'Selected'", [userId]);
    let os_res = await pool.query("SELECT COUNT(*) as count FROM applications WHERE user_id = $1 AND status = 'Selected'", [userId]);
    const offersFromOutcomes = parseInt(oo_res.rows[0].count, 10);
    const offersFromStatus = parseInt(os_res.rows[0].count, 10);
    const offers = Math.max(offersFromOutcomes, offersFromStatus);

    // Rejections
    let ro_res = await pool.query("SELECT COUNT(*) as count FROM outcomes o JOIN applications a ON o.application_id = a.id WHERE a.user_id = $1 AND o.outcome_type = 'Rejected'", [userId]);
    let ro_st = await pool.query("SELECT COUNT(*) as count FROM applications WHERE user_id = $1 AND status = 'Rejected'", [userId]);
    const rejectionsFromOutcomes = parseInt(ro_res.rows[0].count, 10);
    const rejectionsFromStatus = parseInt(ro_st.rows[0].count, 10);
    const rejections = Math.max(rejectionsFromOutcomes, rejectionsFromStatus);

    // Missing Skills
    let an_res = await pool.query('SELECT missing_skills FROM resume_analyses WHERE user_id = $1', [userId]);
    const missingSkillsMap = {};
    an_res.rows.forEach(a => {
      const skills = JSON.parse(a.missing_skills || '[]');
      skills.forEach(s => { missingSkillsMap[s] = (missingSkillsMap[s] || 0) + 1; });
    });
    const topMissingSkills = Object.entries(missingSkillsMap)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Intelligence
    const appsPerInterview = interviews > 0 ? (total / interviews).toFixed(1) : 0;

    let rej_apps = await pool.query(`
      SELECT company, role, COUNT(*) as count 
      FROM applications a 
      JOIN outcomes o ON a.id = o.application_id 
      WHERE a.user_id = $1 AND o.outcome_type = 'Rejected' 
      GROUP BY company, role 
      ORDER BY count DESC 
      LIMIT 5
    `, [userId]);
    const rejectedApplications = rej_apps.rows.map(r => ({ ...r, count: parseInt(r.count, 10) }));

    let pref_apps = await pool.query("SELECT role, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY role ORDER BY count DESC LIMIT 3", [userId]);
    const topRoles = pref_apps.rows.map(r => r.role);
    const defaults = ["Software Engineer", "Frontend Developer", "Backend Developer", "Product Manager", "Data Analyst", "UI/UX Designer"];
    const recommendations = topRoles.length > 0 ? topRoles : defaults.slice(0, 3);

    const conversionRate = total > 0 ? (interviews / total) : 0;
    let avg_res = await pool.query("SELECT AVG(score) as avg FROM resume_analyses WHERE user_id = $1", [userId]);
    const avgResumeScore = parseFloat(avg_res.rows[0].avg) || 0;
    const volumeFactor = Math.min(1, total / 20);
    
    let probabilityScore = (conversionRate * 30) + (avgResumeScore * 0.3) + (volumeFactor * 20);
    if (offers > 0) probabilityScore += 20; 
    if (total === 0) probabilityScore = 0;
    
    const finalProbability = Math.min(100, Math.round(probabilityScore));

    res.json({ 
      total, statusCounts, monthlyApps, rejectionStages, rejectionReasons, 
      interviews, offers, rejections, topMissingSkills,
      appsPerInterview, rejectedApplications, recommendations,
      placementProbability: finalProbability
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── COMMUNITY DISCUSSIONS ─── */
app.get('/api/discussions', async (req, res) => {
  try {
    const { sort = 'recent' } = req.query;
    let orderBy = 'd.created_at DESC';
    if (sort === 'liked') orderBy = 'like_count DESC, d.created_at DESC';
    if (sort === 'commented') orderBy = 'comment_count DESC, d.created_at DESC';

    const query = `
      SELECT d.*, u.username, 
        (SELECT COUNT(*) FROM discussion_comments WHERE discussion_id = d.id) as comment_count,
        (SELECT COUNT(*) FROM discussion_likes WHERE discussion_id = d.id) as like_count
      FROM discussions d
      JOIN users u ON d.user_id = u.id
      ORDER BY ${orderBy}
    `;
    const rows = await pool.query(query);
    res.json(rows.rows.map(r => ({ 
      ...r, 
      comment_count: parseInt(r.comment_count, 10), 
      like_count: parseInt(r.like_count, 10),
      tags: JSON.parse(r.tags || '[]')
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/discussions', async (req, res) => {
  try {
    const { user_id, title, company, role, stage, content, tags } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO discussions (id, user_id, title, company, role, stage, content, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, user_id, title, company, role, stage, content, JSON.stringify(tags || [])]
    );
    const row = await pool.query('SELECT d.*, u.username FROM discussions d JOIN users u ON d.user_id = u.id WHERE d.id = $1', [id]);
    res.status(201).json({ ...row.rows[0], tags: JSON.parse(row.rows[0].tags || '[]'), comment_count: 0, like_count: 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/discussions/:id', async (req, res) => {
  try {
    const discRes = await pool.query(`
      SELECT d.*, u.username,
        (SELECT COUNT(*) FROM discussion_likes WHERE discussion_id = d.id) as like_count
      FROM discussions d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = $1
    `, [req.params.id]);

    if (discRes.rows.length === 0) return res.status(404).json({ error: 'Post not found' });

    const comments = await pool.query(`
      SELECT c.*, u.username
      FROM discussion_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.discussion_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.id]);

    res.json({
      ...discRes.rows[0],
      tags: JSON.parse(discRes.rows[0].tags || '[]'),
      like_count: parseInt(discRes.rows[0].like_count, 10),
      comments: comments.rows
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/discussions/:id/comments', async (req, res) => {
  try {
    const { user_id, content } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO discussion_comments (id, discussion_id, user_id, content) VALUES ($1, $2, $3, $4)',
      [id, req.params.id, user_id, content]
    );
    const row = await pool.query('SELECT c.*, u.username FROM discussion_comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1', [id]);
    res.status(201).json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/discussions/:id/like', async (req, res) => {
  try {
    const { user_id } = req.body;
    const existing = await pool.query('SELECT * FROM discussion_likes WHERE user_id = $1 AND discussion_id = $2', [user_id, req.params.id]);
    
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM discussion_likes WHERE user_id = $1 AND discussion_id = $2', [user_id, req.params.id]);
      res.json({ liked: false });
    } else {
      await pool.query('INSERT INTO discussion_likes (user_id, discussion_id) VALUES ($1, $2)', [user_id, req.params.id]);
      res.json({ liked: true });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/discussions/:id', async (req, res) => {
  try {
    // Note: In a production app, we would verify ownership via JWT
    await pool.query('DELETE FROM discussions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3001;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ PlaceMe API running on port ${PORT} with PostgreSQL`);
});
