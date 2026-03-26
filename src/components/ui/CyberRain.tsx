import { useEffect, useState } from 'react';

export function CyberRain() {
  const [particles, setParticles] = useState<{ id: number; left: string; duration: string; delay: string; opacity: number }[]>([]);

  useEffect(() => {
    const count = 30;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 3}s`,
      delay: `${Math.random() * 5}s`,
      opacity: 0.1 + Math.random() * 0.4
    }));
    setParticles(newParticles);
  }, []);

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
