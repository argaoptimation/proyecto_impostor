import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface ResultsScreenProps {
  room: any;
  players: any[];
  isHost: boolean;
}

export default function ResultsScreen({ room, players, isHost }: ResultsScreenProps) {
  const [votes, setVotes] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('votes').select('*').eq('room_id', room.id).then(({ data }) => {
       if (data) setVotes(data);
    });
  }, [room.id]);

  // Determine who got the most votes
  const tallies = players.reduce((acc, p) => {
    acc[p.id] = votes.filter(v => v.target_id === p.id).length;
    return acc;
  }, {} as Record<string, number>);

  const sortedTallies = (Object.entries(tallies) as [string, number][]).sort((a, b) => b[1] - a[1]);
  const maxVotes = sortedTallies.length > 0 ? sortedTallies[0][1] : 0;
  
  // Find ties
  const eliminatedPlayerIds = sortedTallies.filter(v => v[1] === maxVotes && maxVotes > 0).map(v => v[0]);
  
  const trueImpostor = players.find(p => p.role === 'IMPOSTOR');
  const impostorEliminated = trueImpostor && eliminatedPlayerIds.includes(trueImpostor.id);

  const resetGame = async () => {
    if (!isHost) return;
    
    // Cleanup votes & game_state
    await supabase.from('votes').delete().eq('room_id', room.id);
    await supabase.from('game_state').delete().eq('room_id', room.id);
    // Reset room
    await supabase.from('rooms').update({ status: 'LOBBY' }).eq('id', room.id);
  };

  const exitRoom = () => {
    localStorage.removeItem('currentPlayerNickname');
    navigate('/join');
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-4xl font-sora font-bold text-whapigen-cyan mb-4 tracking-widest">TRANSMISSION ENDED</h2>
      
      <div className={`p-8 w-full glass-panel border-4 my-8 ${impostorEliminated ? 'border-whapigen-green shadow-neon-green' : 'border-whapigen-red shadow-neon-red'}`}>
         <h3 className="text-2xl font-sora mb-2 uppercase text-white">
           {impostorEliminated ? 'CREWMATES SECURED THE SHIP' : 'THE IMPOSTOR ESCAPED'}
         </h3>
         <p className="font-jetbrains text-gray-400">
           The Impostor was: <span className="text-whapigen-cyan font-bold p-1 bg-whapigen-panel ml-2">[{trueImpostor?.nickname}]</span>
         </p>
      </div>

      <div className="w-full text-left font-jetbrains mb-12">
        <h4 className="border-b border-whapigen-border pb-2 mb-4 text-gray-500">VOTE SUMMARY</h4>
        <div className="flex flex-col gap-2">
          {sortedTallies.map(([id, count]) => {
            const p = players.find(pl => pl.id === id);
            if (!p) return null;
            return (
              <div key={id} className={`flex justify-between items-center p-3 text-sm ${eliminatedPlayerIds.includes(id) ? 'bg-whapigen-panel' : ''}`}>
                <span className={p.id === trueImpostor?.id ? 'text-whapigen-red font-bold' : 'text-gray-300'}>{p.nickname}</span>
                <span className="text-whapigen-cyan">{count} VOTES</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 w-full justify-center">
        {isHost ? (
          <Button variant="primary" onClick={resetGame} className="w-64">
             RESET PROTOCOL
          </Button>
        ) : (
          <Button variant="ghost" onClick={exitRoom} className="w-64">
             DISCONNECT TERMINAL
          </Button>
        )}
      </div>
    </div>
  );
}
