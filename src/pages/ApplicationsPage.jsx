import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import ApplicationFormModal from '../components/ApplicationFormModal';
import { Plus, Search, Eye, Edit3, Trash2, Briefcase } from 'lucide-react';

const STATUS_OPTIONS = ['All', 'Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];

function badgeClass(status) {
  const map = {
    'Applied': 'badge-applied',
    'Shortlisted': 'badge-shortlisted',
    'Interview Scheduled': 'badge-interview',
    'Selected': 'badge-selected',
    'Rejected': 'badge-rejected',
  };
  return map[status] || 'badge-applied';
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { applications, loadingApps, fetchApplications, deleteApplication } = useData();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const filtered = applications.filter(app => {
    const matchSearch = app.company.toLowerCase().includes(search.toLowerCase()) || app.role.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      await deleteApplication(id);
    }
  };

  const handleOpenForm = (app = null) => {
    setEditApp(app);
    setShowModal(true);
  };

  return (
    <div className="fade-in page-enter" style={{ position: 'relative' }}>
      <div className="page-header" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
          <div>
            <h1 className="page-title bounce-in" style={{ display: 'inline-block' }}>Applications 💼</h1>
            <p className="page-subtitle">{applications.length} applications tracked so far ✨</p>
          </div>
          <button id="add-application-btn" className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} />
            Add Application
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="search-applications"
            type="text"
            className="form-input"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select
          id="status-filter"
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Applications Table */}
      {filtered.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Date Applied</th>
                <th>Resume</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <tr key={app.id}>
                  <td>
                    <div className="table-company">{app.company}</div>
                    {app.link && <a href={app.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>View link ↗</a>}
                  </td>
                  <td>{app.role}</td>
                  <td><span className={`badge ${badgeClass(app.status)}`}>{app.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>{new Date(app.date_applied).toLocaleDateString()}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>{app.resume_version || '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" title="View Details" onClick={() => navigate(`/applications/${app.id}`)}><Eye size={15} /></button>
                      <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => handleOpenForm(app)}><Edit3 size={15} /></button>
                      <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => handleDelete(app.id)} style={{ color: 'var(--accent-red)' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state bounce-in">
          <Briefcase size={48} className="empty-icon" />
          <h3>{search || statusFilter !== 'All' ? 'No matching applications 😔' : 'No applications yet 🥺'}</h3>
          <p>{search || statusFilter !== 'All' ? 'Try adjusting your filters or adding a new application.' : 'Start tracking your placement journey by adding your first application.'}</p>
          <button className="btn btn-primary empty-state-btn" onClick={() => handleOpenForm()}>
            <Plus size={16} /> Add Your First Application
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ApplicationFormModal
          app={editApp}
          onClose={() => { setShowModal(false); setEditApp(null); }}
        />
      )}
    </div>
  );
}
