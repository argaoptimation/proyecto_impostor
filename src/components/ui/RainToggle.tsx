import { useState, useEffect } from 'react';
import { CloudRain, CloudOff } from 'lucide-react';
import { RAIN_STORAGE_KEY, RAIN_EVENT_NAME } from '../../lib/constants';

export function RainToggle() {
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem(RAIN_STORAGE_KEY);
    // Si el usuario ya eligió algo antes, respetamos su decisión
    if (saved !== null) return saved === 'true';

    // Si es la primera vez que entra (sin importar el dispositivo): LLUVIA ON
    return true;
  });

  const toggleRain = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    localStorage.setItem(RAIN_STORAGE_KEY, String(newState));
    // Dispatch event for other components (like CyberRain) to react
    window.dispatchEvent(new CustomEvent(RAIN_EVENT_NAME, { detail: newState }));
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === RAIN_STORAGE_KEY) {
        setIsEnabled(e.newValue === 'true');
      }
    };
    const handleCustomEvent = (e: any) => {
      setIsEnabled(e.detail);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(RAIN_EVENT_NAME, handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(RAIN_EVENT_NAME, handleCustomEvent);
    };
  }, []);

  return (
    <button
      onClick={toggleRain}
      title={isEnabled ? "Disable Rain (Better Performance)" : "Enable Rain"}
      className={`
        fixed top-4 right-4 md:top-6 md:right-24 z-[100] 
        flex items-center justify-center w-10 h-10 md:w-12 md:h-12 
        rounded-full border backdrop-blur-xl transition-all duration-500
        ${isEnabled
          ? 'bg-whapigen-cyan/10 border-whapigen-cyan/30 text-whapigen-cyan shadow-neon-cyan/20'
          : 'bg-white/5 border-white/10 text-gray-500 gray-glow'}
        hover:scale-110 active:scale-95
      `}
    >
      {isEnabled ? (
        <CloudRain className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
      ) : (
        <CloudOff className="w-5 h-5 md:w-6 md:h-6" />
      )}
    </button>
  );
}
