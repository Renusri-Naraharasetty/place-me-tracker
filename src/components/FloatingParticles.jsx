import { useEffect, useRef } from 'react';

const EMOJIS = ['💼', '🎯', '🚀', '⭐', '💡', '🎓', '📝', '✨', '💻', '🏆'];

export default function FloatingParticles({ count = 15 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles = [];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      particle.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 8}s`;
      particle.style.animationDuration = `${12 + Math.random() * 18}s`;
      particle.style.fontSize = `${14 + Math.random() * 18}px`;
      particle.style.opacity = `${0.08 + Math.random() * 0.12}`;
      container.appendChild(particle);
      particles.push(particle);
    }

    return () => particles.forEach(p => p.remove());
  }, [count]);

  return <div ref={containerRef} className="particles-container" />;
}
