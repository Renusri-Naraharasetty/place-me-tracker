import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, ThumbsUp, MessageSquare, Send, 
  User, Calendar, Target, Briefcase, Bookmark
} from 'lucide-react';

export default function DiscussionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);

  const fetchDiscussion = async () => {
    try {
      const res = await api.getDiscussion(id);
      setData(res);
      // Simplified: Just use a local state or check if user ID is in a hypothetical likes list from backend
      // For now, toggleLike handles backend toggle.
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDiscussion();
  }, [id]);

  const handleLike = async () => {
    try {
      const res = await api.toggleLike(id, user.id);
      setLiked(res.liked);
      fetchDiscussion();
    } catch (e) { console.error(e); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await api.addComment(id, { user_id: user.id, content: comment });
      setComment('');
      fetchDiscussion();
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="empty-state"><p>Loading discussion...</p></div>;
  if (!data) return <div className="empty-state"><h3>Post not found</h3></div>;

  return (
    <div className="fade-in page-enter" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button className="back-link mb-6" onClick={() => navigate('/community')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <ArrowLeft size={16} /> Back to Community
      </button>

      <article className="card slide-up" style={{ padding: 'var(--sp-6)' }}>
        <div className="flex-between mb-4">
          <span className="badge badge-shortlisted">{data.stage}</span>
          <span className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
             <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
             {new Date(data.created_at).toLocaleDateString()}
          </span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 'var(--sp-4)', color: 'var(--text-heading)' }}>{data.title}</h1>

        <div style={{ display: 'flex', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)', flexWrap: 'wrap' }}>
          <div className="meta-pill" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', padding: '6px 12px', borderRadius: '20px', fontSize: 'var(--fs-xs)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Briefcase size={14} /> {data.company}
          </div>
          <div className="meta-pill" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple-light)', padding: '6px 12px', borderRadius: '20px', fontSize: 'var(--fs-xs)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={14} /> {data.role}
          </div>
          <div className="meta-pill" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '20px', fontSize: 'var(--fs-xs)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={14} /> Posted by @{data.username}
          </div>
        </div>

        <div className="discussion-content" style={{ 
          fontSize: 'var(--fs-base)', lineHeight: 1.7, color: 'var(--text-primary)', 
          whiteSpace: 'pre-wrap', marginBottom: 'var(--sp-8)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 'var(--sp-6)' 
        }}>
          {data.content}
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center' }}>
          <button 
            className={`btn ${liked ? 'btn-primary' : 'btn-secondary'} bounce-in`} 
            onClick={handleLike}
            style={{ borderRadius: '30px' }}
          >
            <ThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} /> {data.like_count} Likes
          </button>
          <div className="text-muted" style={{ fontSize: 'var(--fs-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={16} /> {data.comments.length} Comments
          </div>
        </div>
      </article>

      {/* Comment Section */}
      <section className="mt-8">
        <h3 className="mb-4" style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>Discussion ({data.comments.length})</h3>
        
        <div className="card mb-6" style={{ padding: 'var(--sp-4)' }}>
          <form onSubmit={handleComment}>
            <textarea 
              className="form-textarea mb-3" 
              placeholder="Write a comment..." 
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                <Send size={14} /> Post Comment
              </button>
            </div>
          </form>
        </div>

        <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {data.comments.map(c => (
            <div key={c.id} className="card slide-up" style={{ padding: 'var(--sp-4)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex-between mb-2">
                <span style={{ fontWeight: 700, color: 'var(--accent-purple-light)', fontSize: 'var(--fs-sm)' }}>@{c.username}</span>
                <span className="text-muted" style={{ fontSize: '10px' }}>{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>{c.content}</p>
            </div>
          ))}
          {data.comments.length === 0 && (
            <p className="text-muted" style={{ textAlign: 'center', margin: '40px 0' }}>No comments yet. Start the conversation!</p>
          )}
        </div>
      </section>
    </div>
  );
}
