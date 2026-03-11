import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

/* ─── AUTH ─── */
app.post('/api/auth/signup', (req, res) => {
  try {
    const { name, email, password, college, branch } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const hashed = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, name, email, password, college, branch) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, email, hashed, college || '', branch || '');
    const user = db.prepare('SELECT id, name, email, college, branch FROM users WHERE id = ?').get(id);
    res.status(201).json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const { password: _, ...safe } = user;
    res.json({ user: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── APPLICATIONS ─── */
app.get('/api/applications/:userId', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/application/:id', (req, res) => {
  try {
    const app_row = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!app_row) return res.status(404).json({ error: 'Not found' });
    const stages = db.prepare('SELECT * FROM interview_stages WHERE application_id = ? ORDER BY created_at ASC').all(req.params.id);
    const outcome = db.prepare('SELECT * FROM outcomes WHERE application_id = ?').get(req.params.id);
    const experiences = db.prepare('SELECT * FROM interview_experiences WHERE application_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json({ ...app_row, interviewStages: stages, outcome: outcome || null, interviewExperiences: experiences });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/applications', (req, res) => {
  try {
    const { user_id, company, role, link, date_applied, resume_version, notes, status } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO applications (id, user_id, company, role, link, date_applied, resume_version, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, user_id, company, role, link || '', date_applied, resume_version || '', notes || '', status || 'Applied');
    const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/applications/:id', (req, res) => {
  try {
    const { company, role, link, date_applied, resume_version, notes, status } = req.body;
    db.prepare('UPDATE applications SET company=?, role=?, link=?, date_applied=?, resume_version=?, notes=?, status=?, updated_at=datetime(\'now\') WHERE id=?').run(company, role, link || '', date_applied, resume_version || '', notes || '', status, req.params.id);
    const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/applications/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── INTERVIEW STAGES ─── */
app.post('/api/interview-stages', (req, res) => {
  try {
    const { application_id, stage_type, stage_date, result, notes } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO interview_stages (id, application_id, stage_type, stage_date, result, notes) VALUES (?, ?, ?, ?, ?, ?)').run(id, application_id, stage_type, stage_date || '', result || 'Pending', notes || '');
    const row = db.prepare('SELECT * FROM interview_stages WHERE id = ?').get(id);
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/interview-stages/:id', (req, res) => {
  try {
    const { stage_type, stage_date, result, notes } = req.body;
    db.prepare('UPDATE interview_stages SET stage_type=?, stage_date=?, result=?, notes=? WHERE id=?').run(stage_type, stage_date || '', result || 'Pending', notes || '', req.params.id);
    const row = db.prepare('SELECT * FROM interview_stages WHERE id = ?').get(req.params.id);
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/interview-stages/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM interview_stages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── OUTCOMES ─── */
app.post('/api/outcomes', (req, res) => {
  try {
    const { application_id, outcome_type, selection_date, offer_type, stipend_salary, joining_date, rejection_date, rejection_stage, rejection_reason } = req.body;
    const id = uuidv4();
    const existing = db.prepare('SELECT id FROM outcomes WHERE application_id = ?').get(application_id);
    if (existing) {
      db.prepare('UPDATE outcomes SET outcome_type=?, selection_date=?, offer_type=?, stipend_salary=?, joining_date=?, rejection_date=?, rejection_stage=?, rejection_reason=? WHERE application_id=?').run(outcome_type, selection_date || '', offer_type || '', stipend_salary || '', joining_date || '', rejection_date || '', rejection_stage || '', rejection_reason || '', application_id);
      const row = db.prepare('SELECT * FROM outcomes WHERE application_id = ?').get(application_id);
      // Also update application status
      const newStatus = outcome_type === 'Selected' ? 'Selected' : 'Rejected';
      db.prepare('UPDATE applications SET status=?, updated_at=datetime(\'now\') WHERE id=?').run(newStatus, application_id);
      return res.json(row);
    }
    db.prepare('INSERT INTO outcomes (id, application_id, outcome_type, selection_date, offer_type, stipend_salary, joining_date, rejection_date, rejection_stage, rejection_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, application_id, outcome_type, selection_date || '', offer_type || '', stipend_salary || '', joining_date || '', rejection_date || '', rejection_stage || '', rejection_reason || '');
    // Also update application status
    const newStatus = outcome_type === 'Selected' ? 'Selected' : 'Rejected';
    db.prepare('UPDATE applications SET status=?, updated_at=datetime(\'now\') WHERE id=?').run(newStatus, application_id);
    const row = db.prepare('SELECT * FROM outcomes WHERE id = ?').get(id);
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/outcomes/:applicationId', (req, res) => {
  try {
    db.prepare('DELETE FROM outcomes WHERE application_id = ?').run(req.params.applicationId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── INTERVIEW EXPERIENCES ─── */
app.post('/api/interview-experiences', (req, res) => {
  try {
    const { application_id, question, difficulty, notes } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO interview_experiences (id, application_id, question, difficulty, notes) VALUES (?, ?, ?, ?, ?)').run(id, application_id, question, difficulty || 'Medium', notes || '');
    const row = db.prepare('SELECT * FROM interview_experiences WHERE id = ?').get(id);
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/interview-experiences/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM interview_experiences WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── RESUME ANALYSIS ─── */
app.post('/api/resume-analysis', (req, res) => {
  try {
    const { user_id, resume_text, jd_text, matched_skills, missing_skills, score } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO resume_analyses (id, user_id, resume_text, jd_text, matched_skills, missing_skills, score) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, user_id, resume_text, jd_text, JSON.stringify(matched_skills), JSON.stringify(missing_skills), score);
    const row = db.prepare('SELECT * FROM resume_analyses WHERE id = ?').get(id);
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/resume-analyses/:userId', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM resume_analyses WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
    res.json(rows.map(r => ({ ...r, matched_skills: JSON.parse(r.matched_skills), missing_skills: JSON.parse(r.missing_skills) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── ANALYTICS ─── */
app.get('/api/analytics/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const total = db.prepare('SELECT COUNT(*) as count FROM applications WHERE user_id = ?').get(userId).count;
    const statusCounts = db.prepare('SELECT status, COUNT(*) as count FROM applications WHERE user_id = ? GROUP BY status').all(userId);
    const monthlyApps = db.prepare("SELECT strftime('%Y-%m', date_applied) as month, COUNT(*) as count FROM applications WHERE user_id = ? GROUP BY month ORDER BY month").all(userId);
    const rejectionStages = db.prepare("SELECT rejection_stage, COUNT(*) as count FROM outcomes o JOIN applications a ON o.application_id = a.id WHERE a.user_id = ? AND o.outcome_type = 'Rejected' AND o.rejection_stage != '' GROUP BY rejection_stage").all(userId);
    const rejectionReasons = db.prepare("SELECT rejection_reason, COUNT(*) as count FROM outcomes o JOIN applications a ON o.application_id = a.id WHERE a.user_id = ? AND o.outcome_type = 'Rejected' AND o.rejection_reason != '' GROUP BY rejection_reason").all(userId);
    const interviewsExplicit = db.prepare('SELECT COUNT(DISTINCT a.id) as count FROM applications a JOIN interview_stages s ON a.id = s.application_id WHERE a.user_id = ?').get(userId).count;
    const interviewsWithOutcome = db.prepare("SELECT COUNT(DISTINCT application_id) as count FROM outcomes o JOIN applications a ON o.application_id = a.id WHERE a.user_id = ?").get(userId).count;
    const interviewsFromStatus = db.prepare("SELECT COUNT(*) as count FROM applications WHERE user_id = ? AND (status = 'Interview Scheduled' OR status = 'Shortlisted')").get(userId).count;
    const interviews = Math.max(interviewsExplicit, interviewsWithOutcome, interviewsFromStatus);

    const offersFromOutcomes = db.prepare("SELECT COUNT(*) as count FROM outcomes o JOIN applications a ON o.application_id = a.id WHERE a.user_id = ? AND o.outcome_type = 'Selected'").get(userId).count;
    const offersFromStatus = db.prepare("SELECT COUNT(*) as count FROM applications WHERE user_id = ? AND status = 'Selected'").get(userId).count;
    const offers = Math.max(offersFromOutcomes, offersFromStatus);

    const rejectionsFromOutcomes = db.prepare("SELECT COUNT(*) as count FROM outcomes o JOIN applications a ON o.application_id = a.id WHERE a.user_id = ? AND o.outcome_type = 'Rejected'").get(userId).count;
    const rejectionsFromStatus = db.prepare("SELECT COUNT(*) as count FROM applications WHERE user_id = ? AND status = 'Rejected'").get(userId).count;
    const rejections = Math.max(rejectionsFromOutcomes, rejectionsFromStatus);

    // Get missing skills from analyses
    const analyses = db.prepare('SELECT missing_skills FROM resume_analyses WHERE user_id = ?').all(userId);
    const missingSkillsMap = {};
    analyses.forEach(a => {
      const skills = JSON.parse(a.missing_skills || '[]');
      skills.forEach(s => { missingSkillsMap[s] = (missingSkillsMap[s] || 0) + 1; });
    });
    const topMissingSkills = Object.entries(missingSkillsMap)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // --- Advanced Career Intelligence ---
    const appsPerInterview = interviews > 0 ? (total / interviews).toFixed(1) : 0;

    // 2. Frequent Rejected Roles/Companies
    const rejectedApplications = db.prepare(`
      SELECT company, role, COUNT(*) as count 
      FROM applications a 
      JOIN outcomes o ON a.id = o.application_id 
      WHERE a.user_id = ? AND o.outcome_type = 'Rejected' 
      GROUP BY company, role 
      ORDER BY count DESC 
      LIMIT 5
    `).all(userId);

    // 3. Career Recommendations
    // Logic: Identify high frequency roles the user applies to and successful resume matches
    const rolePreferences = db.prepare("SELECT role, COUNT(*) as count FROM applications WHERE user_id = ? GROUP BY role ORDER BY count DESC LIMIT 3").all(userId);
    const topRoles = rolePreferences.map(r => r.role);
    
    // Default recommendations based on popular tech paths if no data
    const defaults = ["Software Engineer", "Frontend Developer", "Backend Developer", "Product Manager", "Data Analyst", "UI/UX Designer"];
    const recommendations = topRoles.length > 0 ? topRoles : defaults.slice(0, 3);

    // 4. Placement Probability Score Calculation
    // Factors: Conversion (30%), Resume Strength (30%), Application Volume (20%), Offers (20%)
    const conversionRate = total > 0 ? (interviews / total) : 0;
    const avgResumeScore = db.prepare("SELECT AVG(score) as avg FROM resume_analyses WHERE user_id = ?").get(userId).avg || 0;
    const volumeFactor = Math.min(1, total / 20); // Normalized against a target of 20 apps
    
    let probabilityScore = (conversionRate * 30) + (avgResumeScore * 0.3) + (volumeFactor * 20);
    if (offers > 0) probabilityScore += 20; 
    
    // Handle low activity edge case
    if (total === 0) probabilityScore = 0;
    
    const finalProbability = Math.min(100, Math.round(probabilityScore));

    res.json({ 
      total, 
      statusCounts, 
      monthlyApps, 
      rejectionStages, 
      rejectionReasons, 
      interviews, 
      offers, 
      rejections, 
      topMissingSkills,
      appsPerInterview,
      rejectedApplications,
      recommendations,
      placementProbability: finalProbability
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✓ PlaceMe API running on http://localhost:${PORT}`);
});
