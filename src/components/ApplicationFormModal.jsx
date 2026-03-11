import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../context/DataContext';
import { X } from 'lucide-react';

const STATUSES = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];

export default function ApplicationFormModal({ app, onClose }) {
  const { addApplication, updateApplication } = useData();
  const isEdit = !!app;

  const [form, setForm] = useState({
    company: app?.company || '',
    role: app?.role || '',
    link: app?.link || '',
    date_applied: app?.date_applied || new Date().toISOString().split('T')[0],
    resume_version: app?.resume_version || '',
    notes: app?.notes || '',
    status: app?.status || 'Applied',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      setError('Company and role are required');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateApplication(app.id, form);
      } else {
        await addApplication(form);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Application' : 'New Application'}</h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="toast error" style={{ position: 'relative', bottom: 'auto', right: 'auto', marginBottom: '1rem' }}>{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Company *</label>
                <input id="app-company" type="text" className="form-input" placeholder="e.g. Google" value={form.company} onChange={set('company')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <input id="app-role" type="text" className="form-input" placeholder="e.g. SDE Intern" value={form.role} onChange={set('role')} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Application Link</label>
              <input type="url" className="form-input" placeholder="https://..." value={form.link} onChange={set('link')} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date Applied</label>
                <input type="date" className="form-input" value={form.date_applied} onChange={set('date_applied')} />
              </div>
              <div className="form-group">
                <label className="form-label">Resume Version</label>
                <input type="text" className="form-input" placeholder="e.g. v2.1" value={form.resume_version} onChange={set('resume_version')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" placeholder="Any additional notes..." value={form.notes} onChange={set('notes')} rows={3} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="app-save-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (isEdit ? 'Update' : 'Add Application')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
