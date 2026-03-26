import { useState } from 'react';
import { Button } from '../ui/Button';
import { Eye, EyeOff } from 'lucide-react';

export default function SecretWordButton({ word, role }: { word: string, role: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 my-8">
      <div className={`text-sm font-jetbrains p-2 border border-dashed rounded-sm clip-edges ${
        role === 'IMPOSTOR' ? 'text-whapigen-red border-whapigen-red' : 'text-whapigen-cyan border-whapigen-cyan'
      }`}>
        YOUR ROLE: {role}
      </div>

      <Button
        variant={revealed ? 'glass' : 'primary'}
        onPointerDown={() => setRevealed(true)}
        onPointerUp={() => setRevealed(false)}
        onPointerLeave={() => setRevealed(false)}
        className="w-full max-w-sm h-20 text-xl font-bold tracking-widest relative overflow-hidden"
      >
        {revealed ? (
          <span className={`flex items-center gap-3 ${role === 'IMPOSTOR' ? 'text-whapigen-red' : 'text-whapigen-cyan'}`}>
            <Eye className="w-6 h-6" /> {word}
          </span>
        ) : (
          <span className="flex items-center gap-3 text-white">
            <EyeOff className="w-6 h-6" /> HOLD TO REVEAL WORD
          </span>
        )}
      </Button>
    </div>
  );
}
