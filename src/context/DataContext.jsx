import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingApps, setLoadingApps] = useState(false);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    setLoadingApps(true);
    try {
      const data = await api.getApplications(user.id);
      setApplications(data);
    } catch (e) {
      console.error('Failed to fetch applications:', e);
    } finally {
      setLoadingApps(false);
    }
  }, [user]);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getAnalytics(user.id);
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    }
  }, [user]);

  const addApplication = async (appData) => {
    const created = await api.createApplication({ ...appData, user_id: user.id });
    setApplications(prev => [created, ...prev]);
    return created;
  };

  const updateApplication = async (id, appData) => {
    const updated = await api.updateApplication(id, appData);
    setApplications(prev => prev.map(a => a.id === id ? updated : a));
    return updated;
  };

  const deleteApplication = async (id) => {
    await api.deleteApplication(id);
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  return (
    <DataContext.Provider value={{
      applications, loadingApps,
      fetchApplications, addApplication, updateApplication, deleteApplication,
      analytics, fetchAnalytics
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
