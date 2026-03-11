import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

/* ─── AUTH ─── */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, college, branch } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
    
    // Check for existing user
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    
    const hashed = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    
    await pool.query(
      'INSERT INTO users (id, name, email, password, college, branch) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, name, email, hashed, college || '', branch || '']
    );
    
    const userRes = await pool.query('SELECT id, name, email, college, branch FROM users WHERE id = $1', [id]);
    res.status(201).json({ user: userRes.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];
    
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    
    const { password: _, ...safe } = user;
    res.json({ user: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ PlaceMe API running on port ${PORT} with PostgreSQL`);
});
