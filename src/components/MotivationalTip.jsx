import { useState, useEffect } from 'react';

const TIPS = [
  { emoji: '💡', text: 'Tailor your resume for each job application' },
  { emoji: '🎯', text: 'Follow up on applications after 1-2 weeks' },
  { emoji: '📚', text: 'Practice coding problems daily for interviews' },
  { emoji: '🤝', text: 'Networking can open doors that resumes cannot' },
  { emoji: '⭐', text: 'Quantify your achievements with numbers' },
  { emoji: '🔍', text: 'Research the company before every interview' },
  { emoji: '🚀', text: 'Build projects to stand out from the crowd' },
  { emoji: '💪', text: 'Rejection is redirection — keep going!' },
  { emoji: '📝', text: 'Prepare your STAR stories for behavioral rounds' },
  { emoji: '🏆', text: 'Consistency beats intensity in job hunting' },
];

export default function MotivationalTip() {
  const [tip, setTip] = useState(TIPS[0]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
        setVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`motivational-tip ${visible ? 'tip-visible' : 'tip-hidden'}`}>
      <span className="tip-emoji bounce-in">{tip.emoji}</span>
      <span className="tip-text">{tip.text}</span>
    </div>
  );
}
