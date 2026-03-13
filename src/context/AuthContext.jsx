import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('placeme_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      localStorage.setItem('placeme_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('placeme_user');
      localStorage.removeItem('placeme_token');
    }
  }, [user]);

  const saveAuth = (data) => {
    setUser(data.user);
    if (data.token) localStorage.setItem('placeme_token', data.token);
  };

  const signup = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.signup(data);
      saveAuth(res);
      return res.user;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.login({ username, password });
      saveAuth(res);
      return res.user;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (credential) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.googleLogin({ credential });
      saveAuth(res);
      return res.user;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, signup, login, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
