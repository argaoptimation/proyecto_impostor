import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface VotingHubProps {
  room: any;
  players: any[];
  currentPlayer: any | null;
  isHost: boolean;
}

export default function VotingHub({ room, players, currentPlayer, isHost }: VotingHubProps) {
  const [votes, setVotes] = useState<any[]>([]);
  const [myVoteTarget, setMyVoteTarget] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current votes
    const fetchVotes = async () => {
      const { data } = await supabase.from('votes').select('*').eq('room_id', room.id);
      if (data) {
        setVotes(data);
        if (currentPlayer) {
          const mv = data.find(v => v.voter_id === currentPlayer.id);
          if (mv) setMyVoteTarget(mv.target_id);
        }
      }
    };
    fetchVotes();

    const channel = supabase.channel(`votes_${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${room.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setVotes((prev) => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, currentPlayer]);

  const handleVote = async (targetId: string) => {
    if (!currentPlayer || myVoteTarget) return;

    const { error } = await supabase.from('votes').insert([{
      room_id: room.id,
      voter_id: currentPlayer.id,
      target_id: targetId
    }]);

    if (!error) {
      setMyVoteTarget(targetId);
    }
  };

  const handleFinishVoting = async () => {
    if (!isHost) return;
    await supabase.from('rooms').update({ status: 'RESULTS' }).eq('id', room.id);
  };

  const maxVotes = players.length;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      <h2 className="text-3xl font-sora text-whapigen-cyan mb-8 tracking-widest text-center">ELIMINATION PROTOCOL</h2>
      <p className="text-gray-400 font-jetbrains mb-8 text-center max-w-xl">
        Select the crew member you suspect is the Impostor. Votes are final once cast.
      </p>

      <div className="w-full mb-8 font-jetbrains text-sm flex justify-between items-center bg-whapigen-panel p-4 clip-edges">
         <span>TOTAL VOTES CAST:</span>
         <span className="text-whapigen-cyan font-bold">{votes.length} / {maxVotes}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {players.map(p => {
           const playerVotes = votes.filter(v => v.target_id === p.id).length;
           const votePercentage = maxVotes > 0 ? (playerVotes / maxVotes) * 100 : 0;
           const isMyTarget = myVoteTarget === p.id;
           
           return (
             <div 
               key={p.id} 
               onClick={() => handleVote(p.id)}
               className={`glass-panel p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 flex flex-col gap-4 relative overflow-hidden ${isMyTarget ? 'border-whapigen-red shadow-neon-red' : 'border-whapigen-border hover:border-whapigen-cyan'}`}
             >
                {/* Progress Bar Background */}
                <div 
                  className="absolute bottom-0 left-0 bg-whapigen-red/20 transition-all duration-1000 ease-in-out" 
                  style={{ width: `${votePercentage}%`, height: '100%' }}
                ></div>

                <div className="z-10 flex justify-between items-center">
                   <h3 className="font-sora font-bold text-lg text-white group-hover:text-whapigen-cyan truncate">
                     {p.nickname} {p.id === currentPlayer?.id && '(YOU)'}
                   </h3>
                   <div className="text-whapigen-cyan font-jetbrains font-bold">
                     {playerVotes}
                   </div>
                </div>

                <div className="z-10 w-full h-1 bg-whapigen-panel mt-auto">
                   <div className="h-full bg-whapigen-red transition-all duration-500" style={{ width: `${votePercentage}%` }}></div>
                </div>
             </div>
           );
        })}
      </div>

      {isHost && (
        <Button variant="danger" className="mt-12 w-full max-w-md" onClick={handleFinishVoting}>
           FINALIZE VOTING (SHOW RESULTS)
        </Button>
      )}
    </div>
  );
}
