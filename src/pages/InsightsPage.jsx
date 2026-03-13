import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement
} from 'chart.js';
import { TrendingUp, AlertTriangle, BookOpen, Lightbulb, Target, BarChart2 } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } }
  },
  scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
  }
};

const doughnutOpts = {
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

const STATUS_COLORS = {
  'Applied':             'rgba(59, 130, 246, 0.75)',
  'Shortlisted':         'rgba(6, 182, 212, 0.75)',
  'Interview Scheduled': 'rgba(245, 158, 11, 0.75)',
  'Selected':            'rgba(16, 185, 129, 0.75)',
  'Rejected':            'rgba(239, 68, 68, 0.75)',
};

function NoDataPlaceholder({ message }) {
  return (
    <div style={{
      height: 200, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
      color: 'var(--text-muted)', opacity: 0.5, textAlign: 'center', padding: '0 1rem'
    }}>
      <BarChart2 size={36} />
      <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.5 }}>{message}</p>
    </div>
  );
}

export default function InsightsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAnalytics(user.id);
        setAnalytics(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  if (loading) return <div className="empty-state"><p>Loading insights...</p></div>;

  const data = analytics || {
    total: 0, rejections: 0, offers: 0, interviews: 0,
    rejectionStages: [], rejectionReasons: [], topMissingSkills: [],
    appsPerInterview: 0, statusCounts: [], rejectedApplications: []
  };

  // ── Applications by Status (always visible) ──
  const statusLabels = (data.statusCounts || []).map(s => s.status);
  const statusValues = (data.statusCounts || []).map(s => s.count);
  const statusChartData = {
    labels: statusLabels,
    datasets: [{
      data: statusValues,
      backgroundColor: statusLabels.map(l => STATUS_COLORS[l] || 'rgba(139, 92, 246, 0.6)'),
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  // ── Rejection by stage (needs outcomes) ──
  const rejStageData = {
    labels: (data.rejectionStages || []).map(r => r.rejection_stage),
    datasets: [{
      label: 'Rejections',
      data: (data.rejectionStages || []).map(r => r.count),
      backgroundColor: [
        'rgba(239, 68, 68, 0.6)', 'rgba(245, 158, 11, 0.6)', 'rgba(59, 130, 246, 0.6)',
        'rgba(236, 72, 153, 0.6)', 'rgba(139, 92, 246, 0.6)', 'rgba(6, 182, 212, 0.6)'
      ],
      borderWidth: 0,
      borderRadius: 8,
    }]
  };

  // ── Top missing skills (needs resume analysis) ──
  const skillData = {
    labels: (data.topMissingSkills || []).map(s => s.skill),
    datasets: [{
      label: 'Times Missing',
      data: (data.topMissingSkills || []).map(s => s.count),
      backgroundColor: 'rgba(139, 92, 246, 0.5)',
      borderColor: '#8b5cf6',
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  // ── Suggestions builder ──
  const suggestions = [];

  if (data.rejectionStages && data.rejectionStages.length > 0) {
    const topRejStage = data.rejectionStages.reduce((a, b) => a.count > b.count ? a : b);
    suggestions.push({
      icon: AlertTriangle,
      color: 'var(--accent-red)',
      bg: 'rgba(239, 68, 68, 0.15)',
      title: `Most rejections at: ${topRejStage.rejection_stage}`,
      tips: getStageImprovementTips(topRejStage.rejection_stage),
    });
  }

  if (data.rejections > 0 && data.rejectionStages && data.rejectionStages.length === 0) {
    suggestions.push({
      icon: AlertTriangle,
      color: 'var(--accent-red)',
      bg: 'rgba(239, 68, 68, 0.15)',
      title: `You have ${data.rejections} rejection${data.rejections > 1 ? 's' : ''}`,
      tips: [
        'Open each rejected application and log the rejection stage to unlock stage analysis',
        'Tailor your resume keywords to match the job description',
        'Consider reaching out to HR for feedback on your application',
      ],
    });
  }

  if (data.topMissingSkills && data.topMissingSkills.length > 0) {
    suggestions.push({
      icon: BookOpen,
      color: 'var(--accent-purple)',
      bg: 'rgba(139, 92, 246, 0.15)',
      title: 'Top Skills to Learn',
      tips: data.topMissingSkills.slice(0, 5).map(s => `Learn ${s.skill} — missing in ${s.count} analysis${s.count > 1 ? 'es' : ''}`),
    });
  }

  if (data.total > 0 && data.rejections > 0) {
    const rate = Math.round((data.rejections / data.total) * 100);
    if (rate > 70) {
      suggestions.push({
        icon: Target,
        color: 'var(--accent-amber)',
        bg: 'rgba(245, 158, 11, 0.15)',
        title: `High rejection rate: ${rate}%`,
        tips: [
          'Consider tailoring your resume for each application',
          'Focus on roles that match your current skill set',
          'Practice mock interviews to improve your performance',
          'Get your resume reviewed by seniors or career counselors',
        ],
      });
    }
  }

  if (data.rejectionReasons && data.rejectionReasons.length > 0) {
    suggestions.push({
      icon: Lightbulb,
      color: 'var(--accent-cyan)',
      bg: 'rgba(6, 182, 212, 0.15)',
      title: 'Common Rejection Reasons',
      tips: data.rejectionReasons.map(r => `"${r.rejection_reason}" — ${r.count} time${r.count > 1 ? 's' : ''}`),
    });
  }

  const noApps = data.total === 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insights &amp; Analysis</h1>
          <p className="page-subtitle">Identify patterns and improve your chances</p>
        </div>
      </div>

      {noApps ? (
        <div className="empty-state">
          <TrendingUp />
          <h3>No applications yet</h3>
          <p>Start adding applications to see insights here</p>
        </div>
      ) : (
        <>
          {/* Summary KPIs — always visible */}
          <div className="kpi-grid" style={{ marginBottom: 'var(--sp-8)' }}>
            <div className="kpi-card">
              <div className="kpi-icon purple"><TrendingUp size={22} /></div>
              <div className="kpi-value">{data.total}</div>
              <div className="kpi-label">Applications Tracked</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon red"><AlertTriangle size={22} /></div>
              <div className="kpi-value">{data.rejections || 0}</div>
              <div className="kpi-label">Total Rejections</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon green"><Target size={22} /></div>
              <div className="kpi-value">{data.offers || 0}</div>
              <div className="kpi-label">Offers Received</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon cyan"><BookOpen size={22} /></div>
              <div className="kpi-value">{(data.topMissingSkills || []).length}</div>
              <div className="kpi-label">Skills to Improve</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">

            {/* ① Applications by Status — always visible */}
            <div className="chart-card" style={{ minHeight: 360 }}>
              <h3 className="chart-title">Applications by Status</h3>
              {statusValues.length > 0 ? (
                <div style={{ height: 280 }}>
                  <Doughnut data={statusChartData} options={doughnutOpts} />
                </div>
              ) : (
                <NoDataPlaceholder message="Add applications to see your status breakdown here." />
              )}
            </div>

            {/* ② Rejection by Stage */}
            <div className="chart-card" style={{ minHeight: 360 }}>
              <h3 className="chart-title">Rejection by Stage</h3>
              {data.rejectionStages && data.rejectionStages.length > 0 ? (
                <div style={{ height: 280 }}>
                  <Bar data={rejStageData} options={chartOpts} />
                </div>
              ) : (
                <NoDataPlaceholder message="Log the interview stage where you were rejected to see detailed rejection insights here." />
              )}
            </div>

            {/* ③ Critical Skill Gaps */}
            <div className="chart-card" style={{ minHeight: 360 }}>
              <h3 className="chart-title">Critical Skill Gaps</h3>
              {data.topMissingSkills && data.topMissingSkills.length > 0 ? (
                <div style={{ height: 280 }}>
                  <Bar data={skillData} options={{ ...chartOpts, indexAxis: 'y' }} />
                </div>
              ) : (
                <NoDataPlaceholder message="Go to Resume Analysis and analyse your resume against a job description to see skill gaps." />
              )}
            </div>

            {/* ④ Apps Per Interview — always visible */}
            <div className="chart-card" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: 1 }}>
                {data.appsPerInterview || 0}
              </div>
              <h3 className="chart-title" style={{ margin: 'var(--sp-2) 0' }}>Apps Per Interview</h3>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-3)', maxWidth: 300 }}>
                How many applications you had to send before getting an interview.
                A lower number means better conversion.
              </p>
              <div style={{
                background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '8px', padding: 'var(--sp-2) var(--sp-4)',
                fontFamily: 'monospace', fontSize: 'var(--fs-sm)', color: 'var(--accent-cyan)', fontWeight: 600
              }}>
                Total Apps ÷ Interviews Reached
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{ marginTop: 'var(--sp-8)' }}>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, marginBottom: 'var(--sp-5)', color: 'var(--text-heading)' }}>
                💡 Improvement Suggestions
              </h2>
              {suggestions.map((s, i) => (
                <div className="insight-card" key={i}>
                  <div className="insight-header">
                    <div className="insight-icon" style={{ background: s.bg, color: s.color }}>
                      <s.icon size={20} />
                    </div>
                    <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{s.title}</h3>
                  </div>
                  <ul className="suggestion-list">
                    {s.tips.map((tip, j) => <li key={j}>{tip}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getStageImprovementTips(stage) {
  const tips = {
    'Aptitude Test': [
      'Practice quantitative aptitude and logical reasoning daily',
      'Use platforms like IndiaBix, PrepInsta for aptitude practice',
      'Time yourself while solving to improve speed',
    ],
    'Online Assessment': [
      'Solve coding problems on LeetCode, HackerRank regularly',
      'Focus on Data Structures and Algorithms fundamentals',
      'Practice contest-style timed problem solving',
    ],
    'Technical Interview': [
      'Review core CS fundamentals: DSA, OS, DBMS, Networks',
      'Practice explaining your thought process while coding',
      'Study common interview patterns (sliding window, two pointers, etc.)',
    ],
    'System Design': [
      'Study system design fundamentals (load balancing, caching, databases)',
      'Practice designing real-world systems (URL shortener, chat app)',
      'Learn about scalability, availability, and consistency tradeoffs',
    ],
    'HR Interview': [
      'Prepare your "Tell me about yourself" story',
      'Research the company culture and values before interviews',
      'Prepare answers for behavioral questions using STAR method',
    ],
    'Coding Round': [
      'Focus on medium-difficulty LeetCode problems',
      'Practice coding without IDE autocomplete',
      'Learn to handle edge cases systematically',
    ],
    'Resume Screening': [
      'Tailor your resume keywords to match the job description',
      'Quantify your achievements with numbers and metrics',
      'Keep your resume concise (1-2 pages) and well-formatted',
    ],
  };
  return tips[stage] || [
    'Continue practicing and improving your skills',
    'Seek feedback from peers and mentors',
    'Analyze what went wrong and prepare targeted improvements',
  ];
}
