import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { User, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: username, 2: new password
  const [username, setUsername] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleVerifyUsername = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.forgotPassword(username);
      setResetToken(res.token);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Username not found or invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Password validation: min 6 chars, upper, lower, digit
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must include at least 6 characters, one uppercase letter, one lowercase letter, and a number.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.resetPassword(resetToken, newPassword);
      setMessage(res.message);
      setStep(3); // success
    } catch (err) {
      setError(err.message || 'Reset failed. Token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="auth-logo">
          <h1>PlaceMe</h1>
          <p>Reset your password</p>
        </div>

        {error && <div className="toast error" style={{ position: 'relative', display: 'block', marginBottom: '1rem' }}>{error}</div>}

        {step === 1 && (
          <form onSubmit={handleVerifyUsername}>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Enter your username to verify your account.
            </p>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter your username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '1.5rem' }} disabled={loading}>
              <User size={18} />
              {loading ? 'Verifying...' : 'Verify Username'}
            </button>
            <div className="auth-footer">
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Account verified! Create a new strong password for <b>{username}</b>.
            </p>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Min. 6 characters" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
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
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={48} color="var(--accent-green)" style={{ marginBottom: '1rem' }} />
            <div className="toast success" style={{ position: 'relative', display: 'block', marginBottom: '1.5rem' }}>{message}</div>
            <Link to="/login" className="btn btn-primary">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
