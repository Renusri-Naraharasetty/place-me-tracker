import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, MessageSquare, ThumbsUp, Search, Filter, 
  Clock, TrendingUp, Users, Target, X, Trash2
} from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter';

const STAGES = ['Aptitude / Coding', 'Technical Interview', 'HR Interview', 'Group Discussion', 'System Design', 'Other'];

export default function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recent');
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    title: '',
    company: '',
    role: '',
    stage: 'Technical Interview',
    content: '',
    tags: ''
  });

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const data = await api.getDiscussions(sort);
      setDiscussions(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [sort]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = form.tags.split(',').map(t => t.trim()).filter(t => t !== '');
      await api.createDiscussion({ ...form, tags: tagsArray, user_id: user.id });
      setShowModal(false);
      setForm({ title: '', company: '', role: '', stage: 'Technical Interview', content: '', tags: '' });
      fetchDiscussions();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;
    try {
      await api.deleteDiscussion(id);
      fetchDiscussions();
    } catch (e) { alert(e.message); }
  };

  const filteredDiscussions = discussions.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.company.toLowerCase().includes(search.toLowerCase()) ||
    d.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Community Discussions 🤝</h1>
          <p className="page-subtitle">Learn from others' interview experiences and share your own.</p>
        </div>
        <button className="btn btn-primary bounce-in" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Share Experience
        </button>
      </div>

      <div className="discussion-controls" style={{ 
        display: 'flex', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)', 
        flexWrap: 'wrap', alignItems: 'center' 
      }}>
        <div className="search-box" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 40 }} 
            placeholder="Search company, role or topic..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="sort-group" style={{ display: 'flex', gap: 'var(--sp-2)', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12 }}>
          <button className={`btn btn-sm ${sort === 'recent' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSort('recent')}>
            <Clock size={14} /> Recent
          </button>
          <button className={`btn btn-sm ${sort === 'liked' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSort('liked')}>
            <TrendingUp size={14} /> Top Liked
          </button>
          <button className={`btn btn-sm ${sort === 'commented' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSort('commented')}>
            <MessageSquare size={14} /> Most Discussed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading discussions...</p></div>
      ) : filteredDiscussions.length > 0 ? (
        <div className="discussion-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--sp-5)' }}>
          {filteredDiscussions.map(d => (
            <div key={d.id} className="card discussion-card slide-up clickable" onClick={() => navigate(`/community/${d.id}`)} style={{ 
              transition: 'transform 0.2s, border-color 0.2s',
              cursor: 'pointer'
            }}>
              <div className="flex-between" style={{ marginBottom: 'var(--sp-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                  <span className="badge badge-applied" style={{ fontSize: '10px' }}>{d.stage}</span>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
                {user && user.id === d.user_id && (
                  <button 
                    className="btn btn-ghost btn-danger btn-sm" 
                    onClick={(e) => handleDelete(e, d.id)}
                    title="Delete discussion"
                    style={{ padding: 4, height: 'auto', minHeight: 0 }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>{d.title}</h3>
              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={12} /> {d.company}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-purple-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Target size={12} /> {d.role}
                </div>
              </div>
              <p style={{ 
                fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', 
                marginBottom: 'var(--sp-4)', lineClamp: 3, display: '-webkit-box', 
                WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
              }}>
                {d.content}
              </p>
              <div className="flex-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 'var(--sp-3)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Posted by @{d.username}</span>
                <div style={{ display: 'flex', gap: 'var(--sp-3)', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-xs)' }}>
                    <ThumbsUp size={14} /> {d.like_count}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-xs)' }}>
                    <MessageSquare size={14} /> {d.comment_count}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
          <h3>No discussions found</h3>
          <p>Be the first to share an experience!</p>
        </div>
      )}

      {/* Modal */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Share Your Experience</h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Post Title</label>
                  <input 
                    className="form-input" 
                    placeholder="e.g. My Google SDE-1 Interview Journey" 
                    value={form.title} 
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <input className="form-input" placeholder="e.g. Google" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-input" placeholder="e.g. Software Engineer" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Interview Stage</label>
                  <select className="form-select" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Experience / Questions Asked</label>
                  <textarea 
                    className="form-textarea" 
                    rows={6} 
                    placeholder="Share the details... what questions were asked? how was the interviewer?" 
                    value={form.content} 
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (Optional)</label>
                  <input className="form-input" placeholder="e.g. python, dsa, system-design (comma separated)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Post</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
