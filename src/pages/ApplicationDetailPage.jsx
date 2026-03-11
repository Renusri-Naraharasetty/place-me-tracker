import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { ArrowLeft, Plus, Trash2, Check, X, Clock, AlertTriangle, Award, MessageSquare, Edit3 } from 'lucide-react';

const STATUSES = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];
const STAGE_TYPES = ['Aptitude Test', 'Online Assessment', 'Technical Interview', 'System Design', 'HR Interview', 'Group Discussion', 'Coding Round', 'Other'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function badgeClass(status) {
  const map = { 'Applied': 'badge-applied', 'Shortlisted': 'badge-shortlisted', 'Interview Scheduled': 'badge-interview', 'Selected': 'badge-selected', 'Rejected': 'badge-rejected', 'Passed': 'badge-passed', 'Failed': 'badge-failed', 'Pending': 'badge-pending' };
  return map[status] || 'badge-applied';
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showStageForm, setShowStageForm] = useState(false);
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [showExpForm, setShowExpForm] = useState(false);

  const [stageForm, setStageForm] = useState({ stage_type: 'Technical Interview', stage_date: '', result: 'Pending', notes: '' });
  const [outcomeForm, setOutcomeForm] = useState({ outcome_type: 'Selected', selection_date: '', offer_type: '', stipend_salary: '', joining_date: '', rejection_date: '', rejection_stage: '', rejection_reason: '' });
  const [expForm, setExpForm] = useState({ question: '', difficulty: 'Medium', notes: '' });

  const fetchApp = useCallback(async () => {
    try {
      const data = await api.getApplication(id);
      setApp(data);
      if (data.outcome) {
        setOutcomeForm({
          outcome_type: data.outcome.outcome_type || 'Selected',
          selection_date: data.outcome.selection_date || '',
          offer_type: data.outcome.offer_type || '',
          stipend_salary: data.outcome.stipend_salary || '',
          joining_date: data.outcome.joining_date || '',
          rejection_date: data.outcome.rejection_date || '',
          rejection_stage: data.outcome.rejection_stage || '',
          rejection_reason: data.outcome.rejection_reason || '',
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchApp(); }, [fetchApp]);

  if (loading) return <div className="empty-state"><p>Loading...</p></div>;
  if (!app) return <div className="empty-state"><h3>Application not found</h3></div>;

  // Pipeline
  const pipelineStatus = STATUSES.indexOf(app.status);
  const isRejected = app.status === 'Rejected';

  // Handlers
  const addStage = async (e) => {
    e.preventDefault();
    await api.createInterviewStage({ application_id: id, ...stageForm });
    setStageForm({ stage_type: 'Technical Interview', stage_date: '', result: 'Pending', notes: '' });
    setShowStageForm(false);
    fetchApp();
  };

  const deleteStage = async (stageId) => {
    await api.deleteInterviewStage(stageId);
    fetchApp();
  };

  const saveOutcome = async (e) => {
    e.preventDefault();
    await api.saveOutcome({ application_id: id, ...outcomeForm });
    setShowOutcomeForm(false);
    fetchApp();
  };

  const addExperience = async (e) => {
    e.preventDefault();
    await api.createExperience({ application_id: id, ...expForm });
    setExpForm({ question: '', difficulty: 'Medium', notes: '' });
    setShowExpForm(false);
    fetchApp();
  };

  const deleteExperience = async (expId) => {
    await api.deleteExperience(expId);
    fetchApp();
  };

  return (
    <div className="fade-in">
      <a className="back-link" onClick={() => navigate('/applications')} style={{ cursor: 'pointer' }}>
        <ArrowLeft size={16} /> Back to Applications
      </a>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{app.company}</h1>
          <p className="page-subtitle">{app.role}</p>
        </div>
        <span className={`badge ${badgeClass(app.status)}`} style={{ fontSize: 'var(--fs-sm)', padding: '4px 16px' }}>{app.status}</span>
      </div>

      {/* Pipeline Stepper */}
      <div className="card" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="pipeline">
          {STATUSES.filter(s => s !== 'Rejected').map((step, i) => {
            let cls = '';
            if (isRejected) {
              cls = i <= 2 ? 'completed' : '';
              if (i === 3) cls = 'rejected';
            } else {
              if (i < pipelineStatus) cls = 'completed';
              else if (i === pipelineStatus) cls = 'active';
            }
            return (
              <div className={`pipeline-step ${cls}`} key={step}>
                <div className="pipeline-dot">
                  {cls === 'completed' ? <Check size={14} /> : cls === 'rejected' ? <X size={14} /> : null}
                </div>
                <div className="pipeline-label">{step === 'Interview Scheduled' ? 'Interview' : step}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Application Details */}
      <div className="card detail-section">
        <h3 className="detail-section-title"><MessageSquare size={20} /> Application Details</h3>
        <div className="detail-grid">
          <div className="detail-item"><label>Date Applied</label><p>{new Date(app.date_applied).toLocaleDateString()}</p></div>
          <div className="detail-item"><label>Resume Version</label><p>{app.resume_version || '—'}</p></div>
          <div className="detail-item"><label>Application Link</label><p>{app.link ? <a href={app.link} target="_blank" rel="noopener noreferrer">{app.link.substring(0, 40)}...</a> : '—'}</p></div>
        </div>
        {app.notes && <div style={{ marginTop: 'var(--sp-4)' }}><label style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</label><p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginTop: 'var(--sp-1)' }}>{app.notes}</p></div>}
      </div>

      {/* Interview Stages */}
      {/* Interview Experiences */}
      <div className="detail-section page-enter">
        <div className="flex-between mb-4">
          <h3 className="detail-section-title" style={{ margin: 0 }}><AlertTriangle size={20} /> Interview Experiences 💭</h3>
          <button className="btn btn-secondary btn-sm bounce-in" onClick={() => setShowExpForm(!showExpForm)}>
            <Plus size={14} /> Log Experience
          </button>
        </div>

        {showExpForm && (
          <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
            <form onSubmit={addExperience}>
              <div className="form-group">
                <label className="form-label">Question / Topic</label>
                <textarea className="form-textarea" placeholder="What was asked?" value={expForm.question} onChange={e => setExpForm(f => ({ ...f, question: e.target.value }))} rows={2} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-select" value={expForm.difficulty} onChange={e => setExpForm(f => ({ ...f, difficulty: e.target.value }))}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-input" placeholder="How you answered, what to improve..." value={expForm.notes} onChange={e => setExpForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowExpForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {app.interviewExperiences && app.interviewExperiences.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {app.interviewExperiences.map(exp => (
              <div className="card timeline-item" key={exp.id} style={{ padding: 'var(--sp-4)' }}>
                <div className="flex-between">
                  <div>
                    <p style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{exp.question}</p>
                    {exp.notes && <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginTop: 'var(--sp-1)' }}>{exp.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span className={`badge badge-${exp.difficulty.toLowerCase()}`}>{exp.difficulty}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteExperience(exp.id)} style={{ color: 'var(--accent-red)' }}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>
            <p>No interview experiences logged yet 📝</p>
          </div>
        )}
      </div>
    
      {/* Right Column (Sidebar) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
        {/* Outcome */}
        <div className="detail-section page-enter">
          <div className="flex-between mb-4">
            <h3 className="detail-section-title" style={{ margin: 0 }}><Award size={20} /> Outcome 🏆</h3>
            {!app.outcome && (
              <button className="btn btn-secondary btn-sm bounce-in" onClick={() => setShowOutcomeForm(!showOutcomeForm)}>
                <Plus size={14} /> Record
              </button>
            )}
            {app.outcome && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowOutcomeForm(!showOutcomeForm)}>
                <Edit3 size={14} /> Edit
              </button>
            )}
          </div>

          {showOutcomeForm && (
            <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
              <form onSubmit={saveOutcome}>
                <div className="form-group">
                  <label className="form-label">Outcome Type</label>
                  <select className="form-select" value={outcomeForm.outcome_type} onChange={e => setOutcomeForm(f => ({ ...f, outcome_type: e.target.value }))}>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {outcomeForm.outcome_type === 'Selected' ? (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Selection Date</label>
                        <input type="date" className="form-input" value={outcomeForm.selection_date} onChange={e => setOutcomeForm(f => ({ ...f, selection_date: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Offer Type</label>
                        <input type="text" className="form-input" placeholder="Full-time / Intern" value={outcomeForm.offer_type} onChange={e => setOutcomeForm(f => ({ ...f, offer_type: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Stipend / Salary</label>
                        <input type="text" className="form-input" placeholder="e.g. ₹50,000/month" value={outcomeForm.stipend_salary} onChange={e => setOutcomeForm(f => ({ ...f, stipend_salary: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Joining Date</label>
                        <input type="date" className="form-input" value={outcomeForm.joining_date} onChange={e => setOutcomeForm(f => ({ ...f, joining_date: e.target.value }))} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Rejection Date</label>
                        <input type="date" className="form-input" value={outcomeForm.rejection_date} onChange={e => setOutcomeForm(f => ({ ...f, rejection_date: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Rejection Stage</label>
                        <select className="form-select" value={outcomeForm.rejection_stage} onChange={e => setOutcomeForm(f => ({ ...f, rejection_stage: e.target.value }))}>
                          <option value="">Select stage</option>
                          {STAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          <option value="Resume Screening">Resume Screening</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rejection Reason</label>
                      <textarea className="form-textarea" placeholder="What was the reason?" value={outcomeForm.rejection_reason} onChange={e => setOutcomeForm(f => ({ ...f, rejection_reason: e.target.value }))} rows={2} />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                  <button type="submit" className="btn btn-primary btn-sm">Save</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowOutcomeForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {app.outcome && !showOutcomeForm && (
            <div className="card">
              {app.outcome.outcome_type === 'Selected' ? (
                <div className="detail-grid">
                  <div className="detail-item"><label>Result</label><p><span className="badge badge-selected bounce-in">🎉 Selected</span></p></div>
                  <div className="detail-item"><label>Selection Date</label><p>{app.outcome.selection_date ? new Date(app.outcome.selection_date).toLocaleDateString() : '—'}</p></div>
                  <div className="detail-item"><label>Offer Type</label><p>{app.outcome.offer_type || '—'}</p></div>
                  <div className="detail-item"><label>Stipend / Salary</label><p>{app.outcome.stipend_salary || '—'}</p></div>
                  <div className="detail-item"><label>Joining Date</label><p>{app.outcome.joining_date ? new Date(app.outcome.joining_date).toLocaleDateString() : '—'}</p></div>
                </div>
              ) : (
                <div className="detail-grid">
                  <div className="detail-item"><label>Result</label><p><span className="badge badge-rejected">Rejected 😔</span></p></div>
                  <div className="detail-item"><label>Rejection Date</label><p>{app.outcome.rejection_date ? new Date(app.outcome.rejection_date).toLocaleDateString() : '—'}</p></div>
                  <div className="detail-item"><label>Stage</label><p>{app.outcome.rejection_stage || '—'}</p></div>
                  <div className="detail-item"><label>Reason</label><p>{app.outcome.rejection_reason || '—'}</p></div>
                </div>
              )}
            </div>
          )}

          {!app.outcome && !showOutcomeForm && (
            <div className="card" style={{ textAlign:'center', padding:'var(--sp-8)', color:'var(--text-muted)' }}>
              <p>No outcome recorded yet 🌱</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

