import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface GSAPTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
  isActive: boolean;
}

export default function GSAPTimer({ duration, onComplete, isActive }: GSAPTimerProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !circleRef.current || !textRef.current) return;

    const circumference = 2 * Math.PI * 45; // r=45
    circleRef.current.style.strokeDasharray = `${circumference}`;
    circleRef.current.style.strokeDashoffset = '0';

    const obj = { value: duration };
    textRef.current.innerText = duration.toString();

    const tl = gsap.timeline({
      onComplete: onComplete
    });

    tl.to(circleRef.current, {
      strokeDashoffset: circumference,
      duration: duration,
      ease: 'linear'
    }, 0);

    tl.to(obj, {
      value: 0,
      duration: duration,
      ease: 'linear',
      onUpdate: () => {
        if (textRef.current) {
          textRef.current.innerText = Math.ceil(obj.value).toString();
        }
      }
    }, 0);

    return () => {
      tl.kill();
    };
  }, [duration, isActive, onComplete]);

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          className="stroke-whapigen-panel fill-none"
          strokeWidth="6"
        />
        <circle
          ref={circleRef}
          cx="50"
          cy="50"
          r="45"
          className="stroke-whapigen-cyan fill-none drop-shadow-neon-cyan transition-all"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
      <div 
        ref={textRef} 
        className="text-4xl font-jetbrains font-bold text-white z-10 truncate w-3/4 text-center"
      >
        {duration}
      </div>
    </div>
  );
}
