// Use environment variable if it exists (for production), otherwise default to local dev server
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(url, options = {}) {
  const res = await fetch(API + url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const api = {
  // Auth
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  googleLogin: (body) => request('/auth/google-login', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (username) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ username }) }),
  resetPassword: (token, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),

  // Applications
  getApplications: (userId) => request(`/applications/${userId}`),
  getApplication: (id) => request(`/application/${id}`),
  createApplication: (body) => request('/applications', { method: 'POST', body: JSON.stringify(body) }),
  updateApplication: (id, body) => request(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteApplication: (id) => request(`/applications/${id}`, { method: 'DELETE' }),

  // Interview Stages
  createInterviewStage: (body) => request('/interview-stages', { method: 'POST', body: JSON.stringify(body) }),
  updateInterviewStage: (id, body) => request(`/interview-stages/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteInterviewStage: (id) => request(`/interview-stages/${id}`, { method: 'DELETE' }),

  // Outcomes
  saveOutcome: (body) => request('/outcomes', { method: 'POST', body: JSON.stringify(body) }),
  deleteOutcome: (appId) => request(`/outcomes/${appId}`, { method: 'DELETE' }),

  // Interview Experiences
  createExperience: (body) => request('/interview-experiences', { method: 'POST', body: JSON.stringify(body) }),
  deleteExperience: (id) => request(`/interview-experiences/${id}`, { method: 'DELETE' }),

  // Resume Analysis
  saveAnalysis: (body) => request('/resume-analysis', { method: 'POST', body: JSON.stringify(body) }),
  getAnalyses: (userId) => request(`/resume-analyses/${userId}`),

  // Analytics
  getAnalytics: (userId) => request(`/analytics/${userId}`),

  // Community Discussions
  getDiscussions: (sort) => request(`/discussions?sort=${sort || 'recent'}`),
  getDiscussion: (id) => request(`/discussions/${id}`),
  createDiscussion: (body) => request('/discussions', { method: 'POST', body: JSON.stringify(body) }),
  addComment: (id, body) => request(`/discussions/${id}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  toggleLike: (id, userId) => request(`/discussions/${id}/like`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
};
