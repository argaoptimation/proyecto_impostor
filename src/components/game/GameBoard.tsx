import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import GSAPTimer from './GSAPTimer';
import SecretWordButton from './SecretWordButton';
import { Button } from '../ui/Button';

interface GameBoardProps {
  room: any;
  players: any[];
  gameState: any;
  currentPlayer: any | null; // Student view
  isHost: boolean;
}

export default function GameBoard({ room, players, gameState, currentPlayer, isHost }: GameBoardProps) {
  const [activeTurnPlayer, setActiveTurnPlayer] = useState<any | null>(null);

  useEffect(() => {
    if (gameState?.current_turn_player_id) {
      const active = players.find(p => p.id === gameState.current_turn_player_id);
      setActiveTurnPlayer(active);
    } else {
      setActiveTurnPlayer(null);
    }
  }, [gameState, players]);

  const handleTurnComplete = async () => {
    if (!isHost) return;
    
    // Find next player or go to voting
    const currentIndex = players.findIndex(p => p.id === gameState.current_turn_player_id);
    if (currentIndex === -1 || currentIndex === players.length - 1) {
      // Go to voting
      await supabase.from('rooms').update({ status: 'VOTING' }).eq('id', room.id);
    } else {
      // Next player
      const nextId = players[currentIndex + 1].id;
      await supabase.from('game_state').update({
        current_turn_player_id: nextId,
        turn_start_time: new Date().toISOString()
      }).eq('room_id', room.id);
    }
  };

  const skipTurnEarly = async () => {
    if (currentPlayer && activeTurnPlayer && currentPlayer.id === activeTurnPlayer.id) {
       // Allow player to finish early. We can call handleTurnComplete logic via a Postgres RPC or just set turn time to 0, 
       // but since only the host can reliably advance securely, the player can update game state manually if RLS allows.
       // For this prototype, anyone can update game_state (RLS rule was created).
       const currentIndex = players.findIndex(p => p.id === activeTurnPlayer.id);
       if (currentIndex === players.length - 1) {
         await supabase.from('rooms').update({ status: 'VOTING' }).eq('id', room.id);
       } else {
         const nextId = players[currentIndex + 1].id;
         await supabase.from('game_state').update({
           current_turn_player_id: nextId,
           turn_start_time: new Date().toISOString()
         }).eq('room_id', room.id);
       }
    }
  };

  // 1. Role Reveal Phase
  if (room.status === 'ROLE_REVEAL') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center w-full">
        <h2 className="text-3xl font-sora text-whapigen-cyan mb-8 tracking-widest">ROLE REVEAL</h2>
        <p className="text-gray-400 font-jetbrains mb-4 max-w-lg">
          The simulation has assigned roles. Memorize your parameter (Secret Word). 
          Do not let others see your screen.
        </p>

        {currentPlayer && (
          <SecretWordButton 
            role={currentPlayer.role} 
            word={currentPlayer.role === 'IMPOSTOR' ? 'YOU ARE THE IMPOSTOR' : currentPlayer.secret_word} 
          />
        )}

        {isHost && (
          <Button 
            className="mt-8"
            onClick={() => supabase.from('rooms').update({ status: 'SPEAKING_TURNS' }).eq('id', room.id)}
          >
            START SPEAKING TURNS
          </Button>
        )}
      </div>
    );
  }

  // 2. Speaking Turns Phase
  if (room.status === 'SPEAKING_TURNS') {
    return (
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl mx-auto items-start p-4">
        {/* Left column: Players List */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <h3 className="font-jetbrains text-whapigen-cyan border-b border-whapigen-border pb-2">PARTICIPANTS</h3>
          {players.map(p => {
             const isActive = activeTurnPlayer?.id === p.id;
             return (
               <div key={p.id} className={`p-4 border ${isActive ? 'border-whapigen-cyan bg-whapigen-cyan/10 shadow-neon-cyan' : 'border-whapigen-border bg-whapigen-panel'} clip-edges transition-all`}>
                 <span className={`font-jetbrains font-bold ${isActive ? 'text-whapigen-cyan' : 'text-gray-400'}`}>
                   {p.nickname} {p.id === currentPlayer?.id && '(YOU)'}
                 </span>
               </div>
             );
          })}
        </div>
        
        {/* Right column: Timer & Turn actions */}
        <div className="w-full md:w-2/3 glass-panel p-8 flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-2xl font-sora text-white mb-2">ACTIVE TRANSMISSION</h2>
          <p className="font-jetbrains text-whapigen-cyan text-xl mb-8">
            {activeTurnPlayer ? activeTurnPlayer.nickname : 'AWAITING CONNECTION...'}
          </p>
          
          {activeTurnPlayer && (
            <GSAPTimer 
              key={activeTurnPlayer.id + gameState?.turn_start_time} // remount to reset animation
              duration={room.turn_duration} 
              isActive={true} 
              onComplete={handleTurnComplete} 
            />
          )}

          {currentPlayer && activeTurnPlayer?.id === currentPlayer.id && (
            <Button variant="glass" className="mt-8 border-whapigen-cyan text-whapigen-cyan w-full max-w-xs" onClick={skipTurnEarly}>
              TRANSMISSION READY (SKIP)
            </Button>
          )}

          {isHost && (
            <div className="mt-auto pt-8 flex gap-4 w-full">
              <Button variant="danger" className="flex-1 text-xs" onClick={() => supabase.from('rooms').update({ status: 'VOTING' }).eq('id', room.id)}>
                FORCE VOTING
              </Button>
              <Button variant="ghost" className="flex-1 text-xs" onClick={handleTurnComplete}>
                SKIP TURN
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
