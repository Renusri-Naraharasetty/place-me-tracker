import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Password validation: min 6 chars, upper, lower, digit
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must include at least 6 characters, one uppercase letter, one lowercase letter, and a number.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.resetPassword(token, password);
      setMessage(res.message);
    } catch (err) {
      setError(err.message || 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return <div className="auth-page"><div className="auth-card">Invalid Link</div></div>;

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="auth-logo">
          <h1>PlaceMe</h1>
          <p>Create new password</p>
        </div>

        {message ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={48} color="var(--accent-green)" style={{ marginBottom: '1rem' }} />
            <div className="toast success" style={{ position: 'relative', display: 'block', marginBottom: '1.5rem' }}>{message}</div>
            <Link to="/login" className="btn btn-primary">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="toast error" style={{ position: 'relative', display: 'block', marginBottom: '1rem' }}>{error}</div>}

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Min. 6 characters" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              <Lock size={18} />
              {loading ? 'Updating password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
