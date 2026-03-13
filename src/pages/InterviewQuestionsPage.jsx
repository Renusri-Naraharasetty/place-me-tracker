import { useState } from 'react';
import { Calculator, Code, MessageCircle, ChevronRight, Hash, Terminal, Users } from 'lucide-react';

const QUESTIONS = {
  aptitude: [
    { q: "Find the missing number in the sequence: 2, 6, 12, 20, ?", a: "30. The pattern is +4, +6, +8, +10." },
    { q: "A train travels 60 km in 45 minutes. What is its speed in km/hr?", a: "80 km/hr. Speed = Distance / Time = 60 / (45/60) = 80." },
    { q: "If the ratio of two numbers is 3:5 and their sum is 40, find the numbers.", a: "15 and 25. 3x + 5x = 40 => 8x = 40 => x = 5. Numbers are 3*5 and 5*5." },
    { q: "What is the probability of getting two heads when flipping two coins?", a: "1/4 or 25%. Outcomes are HH, HT, TH, TT. Only HH is favorable." },
    { q: "Identify the next term: 1, 4, 9, 16, 25, ?", a: "36. These are squares of consecutive integers: 1², 2², 3², 4², 5², 6²." },
  ],
  coding: [
    { q: "Reverse a linked list", difficulty: "Easy", link: "https://leetcode.com/problems/reverse-linked-list/" },
    { q: "Two Sum Problem", difficulty: "Easy", link: "https://leetcode.com/problems/two-sum/" },
    { q: "Detect a cycle in a linked list", difficulty: "Medium", link: "https://leetcode.com/problems/linked-list-cycle/" },
    { q: "Longest substring without repeating characters", difficulty: "Medium", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
    { q: "Merge two sorted arrays", difficulty: "Easy", link: "https://leetcode.com/problems/merge-sorted-array/" },
    { q: "Implement a stack using queues", difficulty: "Medium", link: "https://leetcode.com/problems/implement-stack-using-queues/" },
  ],
  behavioural: [
    { q: "Tell me about yourself", tip: "Focus on your professional journey, key achievements, and why you are a good fit for this specific role." },
    { q: "Why do you want to work at this company?", tip: "Research the company's mission, values, and recent projects. Mention how your goals align with theirs." },
    { q: "Describe a challenge you faced and how you solved it", tip: "Use the STAR method (Situation, Task, Action, Result) to provide a structured and impactful answer." },
    { q: "What are your strengths and weaknesses?", tip: "Be honest about weaknesses but show how you are working on them. Highlight strengths relevant to the job." },
    { q: "Describe a time you worked in a team", tip: "Focus on collaboration, communication, and how you contributed to the team's overall success." },
  ]
};

export default function InterviewQuestionsPage() {
  const [activeTab, setActiveTab] = useState('aptitude');

  const tabs = [
    { id: 'aptitude', label: 'Aptitude', icon: Calculator, color: 'var(--accent-cyan)' },
    { id: 'coding', label: 'Coding', icon: Code, color: 'var(--accent-purple)' },
    { id: 'behavioural', label: 'Behavioural', icon: MessageCircle, color: 'var(--accent-amber)' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interview Questions</h1>
          <p className="page-subtitle">Master the most common questions and patterns</p>
        </div>
      </div>

      <div className="tabs-container" style={{ 
        display: 'flex', 
        gap: 'var(--sp-2)', 
        marginBottom: 'var(--sp-8)',
        background: 'rgba(255,255,255,0.03)',
        padding: 'var(--sp-1)',
        borderRadius: 'var(--radius-lg)',
        width: 'fit-content'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      <div className="questions-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: 'var(--sp-4)' 
      }}>
        {QUESTIONS[activeTab].map((item, i) => (
          <div key={i} className="glass-card slide-up" style={{ 
            animationDelay: `${i * 0.1}s`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'var(--sp-5)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                {activeTab === 'aptitude' && <Hash size={16} style={{ color: 'var(--accent-cyan)', opacity: 0.6 }} />}
                {activeTab === 'coding' && <Terminal size={16} style={{ color: 'var(--accent-purple)', opacity: 0.6 }} />}
                {activeTab === 'behavioural' && <Users size={16} style={{ color: 'var(--accent-amber)', opacity: 0.6 }} />}
                
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
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginRight: '4px' }}>Ans:</span> {item.a}
                </p>
              )}
              {activeTab === 'coding' && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ 
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-xs)', color: 'var(--accent-purple-light)', textDecoration: 'none', fontWeight: 600
                }}>
                  Practice on LeetCode <ChevronRight size={14} />
                </a>
              )}
              {activeTab === 'behavioural' && (
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent-amber)', fontWeight: 700, marginRight: '4px' }}>Tip:</span> {item.tip}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
