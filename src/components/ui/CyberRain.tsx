import { useEffect, useState } from 'react';
import { RAIN_STORAGE_KEY, RAIN_EVENT_NAME } from '../../lib/constants';

export function CyberRain() {
  const [particles, setParticles] = useState<{ id: number; left: string; duration: string; delay: string; opacity: number }[]>([]);
  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(RAIN_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return !isMobile;
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    const handleEvent = (e: any) => setIsEnabled(e.detail);
    window.addEventListener(RAIN_EVENT_NAME, handleEvent);
    return () => window.removeEventListener(RAIN_EVENT_NAME, handleEvent);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      setParticles([]);
      return;
    }
    const count = 30;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 3}s`,
      delay: `${Math.random() * 5}s`,
      opacity: 0.1 + Math.random() * 0.4
    }));
    setParticles(newParticles);
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <div className="cyber-rain fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="rain-particle"
          style={{
            left: p.left,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}
