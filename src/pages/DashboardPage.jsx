import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Briefcase, Users, Trophy, XCircle, TrendingUp, Target } from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter';
import MotivationalTip from '../components/MotivationalTip';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
    }
  },
  scales: {
    x: {
      ticks: { color: '#64748b', font: { family: 'Inter' } },
      grid: { color: 'rgba(255,255,255,0.04)' }
    },
    y: {
      ticks: { color: '#64748b', font: { family: 'Inter' } },
      grid: { color: 'rgba(255,255,255,0.04)' }
    }
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 16 }
    }
  },
  cutout: '65%'
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { analytics, fetchAnalytics, fetchApplications, applications } = useData();
  const [adminStats, setAdminStats] = useState(null);

  const isAdmin = user?.username === 'renu_chikki';

  useEffect(() => {
    fetchAnalytics();
    fetchApplications();
    if (isAdmin) {
      api.getAdminStats()
        .then(setAdminStats)
        .catch(err => console.error('Error fetching admin stats:', err));
    }
  }, [fetchAnalytics, fetchApplications, isAdmin]);

  const data = analytics || { total: 0, interviews: 0, offers: 0, rejections: 0, statusCounts: [], monthlyApps: [], rejectionStages: [], topMissingSkills: [] };
  const rejectionRate = data.total > 0 ? Math.round((data.rejections / data.total) * 100) : 0;


  // Status distribution chart
  const statusMap = {};
  (data.statusCounts || []).forEach(s => { statusMap[s.status] = s.count; });
  const statusLabels = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];
  const statusColors = ['#3b82f6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];
  const statusData = {
    labels: statusLabels,
    datasets: [{
      data: statusLabels.map(l => statusMap[l] || 0),
      backgroundColor: statusColors,
      borderWidth: 0,
      hoverOffset: 8
    }]
  };

  // Monthly applications chart
  const monthLabels = (data.monthlyApps || []).map(m => m.month);
  const monthData = {
    labels: monthLabels.length > 0 ? monthLabels : ['No data'],
    datasets: [{
      label: 'Applications',
      data: monthLabels.length > 0 ? data.monthlyApps.map(m => m.count) : [0],
      backgroundColor: 'rgba(139, 92, 246, 0.5)',
      borderColor: '#8b5cf6',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false
    }]
  };

  // Progress over time (cumulative)
  let cumulative = 0;
  const progressData = {
    labels: monthLabels.length > 0 ? monthLabels : ['No data'],
    datasets: [{
      label: 'Total Applications',
      data: monthLabels.length > 0 ? data.monthlyApps.map(m => { cumulative += m.count; return cumulative; }) : [0],
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#06b6d4'
    }]
  };

  // Recent applications for quick view
  const recentApps = applications.slice(0, 5);

  return (
    <div className="fade-in page-enter" style={{ position: 'relative' }}>
      <div className="page-header" style={{ position: 'relative', zIndex: 1 }}>
        <div>
          <h1 className="page-title bounce-in" style={{ display: 'inline-block' }}>Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]} 👋 Let's tracking those applications!</p>
        </div>
      </div>

      {/* Top Intelligence Grid */}
      <div className="intelligence-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: 'var(--sp-5)',
        marginBottom: 'var(--sp-6)',
        position: 'relative', 
        zIndex: 1 
      }}>
        {/* Placement Probability */}
        <div className="chart-card highlight-card" style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--sp-6)',
          textAlign: 'center',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          background: 'rgba(139, 92, 246, 0.05)'
        }}>
          <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 'var(--sp-3)' }}>
            <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle cx="70" cy="70" r="60" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <circle cx="70" cy="70" r="60" fill="transparent" stroke="var(--accent-purple-light)" strokeWidth="12" 
                strokeDasharray={`${(data.placementProbability || 0) * 3.77} 377`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div style={{ 
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)'
            }}>
              {data.placementProbability || 0}%
            </div>
          </div>
          <h3 className="chart-title" style={{ margin: 0, fontSize: 'var(--fs-base)' }}>Placement Probability</h3>
        </div>

        {/* Career Timeline */}
        <div className="chart-card">
          <h3 className="chart-title">Growth Timeline</h3>
          <div className="timeline-mini" style={{ padding: '0 var(--sp-2)' }}>
             {(data.monthlyApps || []).slice(-3).map((m, i) => (
                <div key={i} style={{ 
                  display: 'flex', gap: 'var(--sp-4)', paddingBottom: 'var(--sp-3)',
                  borderLeft: '2px solid rgba(139, 92, 246, 0.2)', marginLeft: 8, paddingLeft: 16,
                  position: 'relative'
                }}>
                  <div style={{ 
                    position: 'absolute', left: -6, top: 0, width: 10, height: 10, 
                    borderRadius: '50%', background: 'var(--accent-purple)'
                  }}></div>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.month}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                      {m.count} Application{m.count > 1 ? 's' : ''} {i === 2 && '➔ Current'}
                    </div>
                  </div>
                </div>
             ))}
             {(!data.monthlyApps || data.monthlyApps.length === 0) && (
               <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>Timeline will appear as you apply.</p>
             )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="chart-card">
          <h3 className="chart-title">Top Applied Roles</h3>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-3)', marginTop: '-var(--sp-2)' }}>Roles you've applied to most frequently</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {(data.recommendations || []).map((role, i) => (
              <div key={i} style={{ 
                padding: 'var(--sp-2) var(--sp-3)', background: 'rgba(255,255,255,0.03)', 
                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', gap: 'var(--sp-3)'
              }}>
                <div style={{ color: 'var(--accent-cyan)' }}><Target size={14} /></div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Quick Stats */}
      {isAdmin && adminStats && (
        <div className="slide-up" style={{ marginBottom: 'var(--sp-8)' }}>
          <div className="card" style={{ 
            background: 'rgba(139, 92, 246, 0.1)', 
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--sp-6)',
            padding: 'var(--sp-5) var(--sp-6)'
          }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-purple-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Platform Users</div>
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>{adminStats.totalUsers}</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-purple-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Total Applications</div>
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>{adminStats.totalApplications}</div>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-purple-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Community Posts</div>
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>{adminStats.totalDiscussions}</div>
            </div>
            <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
               <span className="badge badge-purple" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple-light)' }}>Admin View</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 'var(--sp-8)', position: 'relative', zIndex: 1 }}>
        <MotivationalTip />
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ 
        position: 'relative', 
        zIndex: 1,
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--sp-6)',
        flexWrap: 'wrap'
      }}>
        <div className="kpi-card" onClick={() => navigate('/applications')} style={{ cursor: 'pointer', flex: '1 1 200px' }}>
          <div className="kpi-icon purple"><Briefcase size={22} /></div>
          <div className="kpi-value"><AnimatedCounter end={data.total} /></div>
          <div className="kpi-label">Total Applications</div>
        </div>
        <div className="kpi-card" onClick={() => navigate('/interview-questions')} style={{ cursor: 'pointer', flex: '1 1 200px' }}>
          <div className="kpi-icon blue"><Users size={22} /></div>
          <div className="kpi-value"><AnimatedCounter end={data.interviews} /></div>
          <div className="kpi-label">Interviews</div>
        </div>
        <div className="kpi-card" style={{ flex: '1 1 200px' }}>
          <div className="kpi-icon green"><Trophy size={22} /></div>
          <div className="kpi-value"><AnimatedCounter end={data.offers} /></div>
          <div className="kpi-label">Offers Received</div>
        </div>
        <div className="kpi-card" style={{ flex: '1 1 200px' }}>
          <div className="kpi-icon orange"><XCircle size={22} /></div>
          <div className="kpi-value"><AnimatedCounter end={rejectionRate} />%</div>
          <div className="kpi-label">Rejection Rate</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid" style={{ position: 'relative', zIndex: 1 }}>
        <div className="chart-card">
          <h3 className="chart-title">Status Distribution</h3>
          <div style={{ height: 280 }}>
            <Doughnut data={statusData} options={doughnutOptions} />
          </div>
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Applications per Month</h3>
          <div style={{ height: 280 }}>
            <Bar data={monthData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-card full-width">
          <h3 className="chart-title">Progress Over Time</h3>
          <div style={{ height: 260 }}>
            <Line data={progressData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentApps.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Applications</h3>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Date Applied</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map(app => (
                  <tr key={app.id}>
                    <td className="table-company">{app.company}</td>
                    <td>{app.role}</td>
                    <td><span className={`badge badge-${app.status.toLowerCase().replace(' ', '-').replace('interview scheduled', 'interview')}`}>{app.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>{new Date(app.date_applied).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
