import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const { login, googleLogin, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      // error is set in context
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="auth-logo">
          <h1>PlaceMe</h1>
          <p>Student Placement Intelligence</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="toast error" style={{ position: 'relative', bottom: 'auto', right: 'auto', marginBottom: '1rem' }}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-username"
                type="text"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
              <label className="form-label">Password</label>
              <Link to="/forgot-password" style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-purple-light)' }}>Forgot Password?</Link>
            </div>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
            />
          </div>

          <button id="login-submit" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 'var(--sp-4)' }} disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ position: 'relative', textAlign: 'center', marginBottom: 'var(--sp-4)' }}>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-card)', padding: '0 10px', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>OR</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={credentialResponse => {
                googleLogin(credentialResponse.credential).then(() => navigate('/'));
              }}
              onError={() => {
                setError('Google Login failed');
              }}
              theme="filled_black"
              size="large"
              width="300"
              shape="pill"
            />
          </div>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
