import { useState, useMemo } from 'react';
import { 
  Calculator, Code, MessageCircle, ChevronRight, Hash, 
  Terminal, Users, Search, Filter, X 
} from 'lucide-react';
import { INTERVIEW_QUESTIONS } from '../data/interviewQuestions';

export default function InterviewQuestionsPage() {
  const [activeTab, setActiveTab] = useState('aptitude');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  const tabs = [
    { id: 'aptitude', label: 'Aptitude', icon: Calculator, color: 'var(--accent-cyan)' },
    { id: 'coding', label: 'Coding', icon: Code, color: 'var(--accent-purple)' },
    { id: 'behavioural', label: 'Behavioural', icon: MessageCircle, color: 'var(--accent-amber)' },
  ];

  const filteredQuestions = useMemo(() => {
    let list = INTERVIEW_QUESTIONS[activeTab] || [];
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.q.toLowerCase().includes(query) || 
        (item.topic && item.topic.toLowerCase().includes(query)) ||
        (item.explanation && item.explanation.toLowerCase().includes(query)) ||
        (item.tip && item.tip.toLowerCase().includes(query))
      );
    }

    // Apply difficulty filter (only for coding)
    if (activeTab === 'coding' && difficultyFilter !== 'All') {
      list = list.filter(item => item.difficulty === difficultyFilter);
    }

    return list;
  }, [activeTab, searchQuery, difficultyFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setDifficultyFilter('All');
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interview Questions</h1>
          <p className="page-subtitle">Master the most common questions and patterns</p>
        </div>
      </div>

      {/* Primary Controls */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 'var(--sp-4)', 
        alignItems: 'center',
        marginBottom: 'var(--sp-8)',
        justifyContent: 'space-between'
      }}>
        <div className="tabs-container" style={{ 
          display: 'flex', 
          gap: 'var(--sp-2)', 
          background: 'rgba(255,255,255,0.03)',
          padding: 'var(--sp-1)',
          borderRadius: 'var(--radius-lg)',
          width: 'fit-content'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setDifficultyFilter('All'); }}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
                padding: 'var(--sp-3) var(--sp-6)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === tab.id ? tab.color : 'transparent',
                color: activeTab === tab.id ? '#000' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: 'var(--fs-sm)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                boxShadow: activeTab === tab.id ? `0 4px 12px ${tab.color}44` : 'none'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder={`Search ${activeTab} questions...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 45px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-primary)',
              fontSize: 'var(--fs-sm)',
              outline: 'none',
              transition: 'var(--transition)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.05)'}
          />
          {searchQuery && (
            <X 
              size={18} 
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }} 
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>
      </div>

      {/* Secondary Filters (Coding specific) */}
      {activeTab === 'coding' && (
        <div className="slide-down" style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)', alignItems: 'center' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)', marginRight: 'var(--sp-2)' }} />
          {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: 'var(--fs-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition)',
                border: '1px solid',
                background: difficultyFilter === diff ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                borderColor: difficultyFilter === diff ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)',
                color: difficultyFilter === diff ? 'white' : 'var(--text-muted)'
              }}
            >
              {diff}
            </button>
          ))}
        </div>
      )}

      {/* Questions Grid */}
      <div className="questions-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: 'var(--sp-4)',
        maxHeight: 'calc(100vh - 350px)',
        overflowY: 'auto',
        paddingRight: 'var(--sp-2)',
        paddingBottom: 'var(--sp-4)'
      }}>
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((item, i) => (
            <div key={item.id || i} className="glass-card slide-up" style={{ 
              animationDelay: `${(i % 10) * 0.05}s`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 'var(--sp-5)',
              minHeight: '180px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                    {activeTab === 'aptitude' && <Hash size={16} style={{ color: 'var(--accent-cyan)', opacity: 0.6 }} />}
                    {activeTab === 'coding' && <Terminal size={16} style={{ color: 'var(--accent-purple)', opacity: 0.6 }} />}
                    {activeTab === 'behavioural' && <Users size={16} style={{ color: 'var(--accent-amber)', opacity: 0.6 }} />}
                    
                    {item.topic && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                        {item.topic}
                      </span>
                    )}
                  </div>
                  
                  {item.difficulty && (
                    <span className={`badge badge-${item.difficulty.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {item.difficulty}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 'var(--sp-4)' }}>
                  {item.q}
                </h3>
              </div>
              
              <div style={{ 
                marginTop: 'auto',
                paddingTop: 'var(--sp-4)',
                borderTop: '1px solid rgba(255,255,255,0.05)'
              }}>
                {activeTab === 'aptitude' && (
                  <div>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: 'var(--accent-cyan)' }}>Ans:</span> {item.a}
                    </p>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                      {item.explanation}
                    </p>
                  </div>
                )}
                {activeTab === 'coding' && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ 
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-xs)', color: 'var(--accent-purple-light)', textDecoration: 'none', fontWeight: 600
                  }}>
                    Practice on LeetCode <ChevronRight size={14} />
                  </a>
                )}
                {activeTab === 'behavioural' && (
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--accent-amber)', fontWeight: 700, marginRight: '4px' }}>Tip:</span> {item.tip}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: 'var(--sp-12)',
            color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <Search size={40} style={{ opacity: 0.2, marginBottom: 'var(--sp-4)' }} />
            <h3>No questions found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
            <button 
              onClick={clearFilters}
              style={{ 
                marginTop: 'var(--sp-4)',
                padding: 'var(--sp-2) var(--sp-6)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-purple)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
