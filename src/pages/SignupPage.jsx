import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

export default function SignupPage() {
  const { signup, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', password: '', college: '', branch: '' });

  const set = (key) => (e) => { setForm(f => ({ ...f, [key]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Username validation: 4-20 chars, alphanumeric/underscore
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!usernameRegex.test(form.username)) {
      setError('Username must be 4-20 characters long and contain only letters, numbers, and underscores.');
      return;
    }

    // Password validation: min 6 chars, upper, lower, digit
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(form.password)) {
      setError('Password must include at least 6 characters, one uppercase letter, one lowercase letter, and a number.');
      return;
    }

    try {
      await signup(form);
      navigate('/');
    } catch (err) { /* error handled in context */ }
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="auth-logo">
          <h1>PlaceMe</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="toast error" style={{ position: 'relative', bottom: 'auto', right: 'auto', marginBottom: '1rem' }}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="signup-name" type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={set('name')} required />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input id="signup-username" type="text" className="form-input" placeholder="johndoe123" value={form.username} onChange={set('username')} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="signup-password" type="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">College</label>
              <input id="signup-college" type="text" className="form-input" placeholder="MIT, IIT..." value={form.college} onChange={set('college')} />
            </div>
            <div className="form-group">
              <label className="form-label">Branch</label>
              <input id="signup-branch" type="text" className="form-input" placeholder="CSE, ECE..." value={form.branch} onChange={set('branch')} />
            </div>
          </div>

          <button id="signup-submit" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
