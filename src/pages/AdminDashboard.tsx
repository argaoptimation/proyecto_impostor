import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Plus, Users, Play, Clock, Hash, Loader2, Trash2, ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react';
import { GlitchLogo } from '../components/ui/GlitchLogo';
import { CyberRain } from '../components/ui/CyberRain';
import { RainToggle } from '../components/ui/RainToggle';


function GameSelect({ label, value, onChange, options }: { label: string, value: any, onChange: (v: any) => void, options: { label: string, value: any }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <label className="block text-[9px] font-jetbrains text-whapigen-cyan/50 mb-3 uppercase tracking-[0.4em] pl-2 font-black">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full glass-violet-select p-5 text-left flex justify-between items-center group hover:bg-purple-800/20"
      >
        <span className="font-jetbrains text-sm font-bold text-purple-100">{options.find(o => o.value === value)?.label}</span>
        <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-[#1a0b2e]/95 backdrop-blur-2xl border border-purple-500/30 rounded-[24px] overflow-x-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`p-5 hover:bg-whapigen-cyan/10 cursor-pointer text-xs font-jetbrains transition-all border-b border-white/5 last:border-0 flex items-center justify-between tracking-widest font-black ${value === opt.value ? 'text-whapigen-cyan bg-whapigen-cyan/5' : 'text-purple-100'}`}
            >
              {opt.label.toUpperCase()}
              {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-whapigen-cyan shadow-neon-cyan"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Default configuration as requested
  const [turnDuration, setTurnDuration] = useState(30);
  const [votingDuration, setVotingDuration] = useState(120);
  const [level, setLevel] = useState('A1');
  const [hintsEnabled, setHintsEnabled] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchRooms();

    // ── ACTIVE SESSIONS: live subscription on rooms table ──
    const roomChannel = supabase.channel(`dashboard:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `host_id=eq.${user.id}` }, () => {
        fetchRooms();
      })
      .subscribe();

    // Polling fallback mechanism
    const fetchRoomsFallback = setInterval(() => {
      fetchRooms();
    }, 2500);

    return () => {
      clearInterval(fetchRoomsFallback);
      supabase.removeChannel(roomChannel);
    };
  }, [user]);

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('host_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRooms(data);
    }
    setLoading(false);
  };

  const createRoom = async () => {
    setIsCreating(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert([{
          code,
          host_id: user?.id,
          status: 'LOBBY',
          turn_duration: turnDuration,
          voting_duration: votingDuration,
          level: level,
          hints_enabled: hintsEnabled
        }])
        .select()
        .single();

      if (roomError) throw roomError;

      const { error: stateError } = await supabase.from('game_state').upsert([{
        room_id: roomData.id,
        phase: 'LOBBY',
        current_turn_index: 0,
        is_paused: false
      }], { onConflict: 'room_id' });

      if (stateError) throw stateError;

      // Insert Admin as host in players
      await supabase.from('players').insert([{
        room_id: roomData.id,
        nickname: 'COORDINATOR',
        is_host: true
      }]);


      // Successfully created both records
      navigate(`/game/${roomData.id}`);
    } catch (error: any) {
      console.error("Room creation error:", error);
      // Suppress the visible alert on schema cache delays since the navigation handles successful flow
    } finally {
      setIsCreating(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    // Delete players first (if cascade isn't strictly set up)
    await supabase.from('players').delete().eq('room_id', roomId);
    // Delete game state
    await supabase.from('game_state').delete().eq('room_id', roomId);
    // Delete room
    await supabase.from('rooms').delete().eq('id', roomId);

    // Refresh rooms locally
    fetchRooms();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="h-[100dvh] p-8 max-w-6xl mx-auto flex flex-col relative overflow-x-hidden justify-between">
      {/* NEW: Cyber-Rain Background */}
      <CyberRain />
      <RainToggle />


      <header className="flex justify-between items-center pb-8 border-b border-white/5 relative z-20 gap-2">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="shrink-0">
            <GlitchLogo size="xs" isStatic={true} />
          </div>

          <div>
            <h1 className="text-header-premium text-xl md:text-3xl">
              CIL LENGUAS
            </h1>
            <p className="text-[8px] md:text-[9px] font-jetbrains text-purple-400 uppercase tracking-widest md:tracking-[0.5em] mt-1 md:mt-2 opacity-60 flex items-center gap-1 md:gap-2 line-clamp-1">
              <ShieldCheck className="w-3 h-3 text-whapigen-cyan animate-pulse shrink-0" /> COMMAND CENTER
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 md:gap-3 text-whapigen-red text-[9px] md:text-[10px] font-jetbrains hover:text-white hover:bg-whapigen-red transition-all rounded-full px-4 md:px-8 py-2 md:py-3 border border-whapigen-red/20 font-black uppercase tracking-widest shadow-lg hover:shadow-neon-pulse-red shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">logout</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 flex-grow py-12 items-start">

        <div className="md:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 flex flex-col gap-6 h-fit max-h-[75vh] overflow-y-auto relative group shadow-2xl animate-in slide-in-from-left duration-700">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-whapigen-cyan to-purple-600 blur-sm transition-all duration-500 opacity-50 group-hover:opacity-100"></div>
          <h2 className="text-xs font-black font-sora text-white tracking-[0.3em] flex items-center gap-4 uppercase">
            <div className="p-3 bg-gradient-to-br from-whapigen-cyan/20 to-purple-600/20 rounded-2xl border border-white/5">
              <Plus className="w-5 h-5 text-whapigen-cyan" />
            </div>
            SETUP PROTOCOL
          </h2>

          <div className="space-y-6">
            <GameSelect
              label="Turn Duration"
              value={turnDuration}
              onChange={setTurnDuration}
              options={[
                { label: '15s - Fast', value: 15 },
                { label: '30s - Standard', value: 30 },
                { label: '45s - Tactical', value: 45 },
                { label: '1m - Extended', value: 60 },
              ]}
            />

            <GameSelect
              label="Voting Duration"
              value={votingDuration}
              onChange={setVotingDuration}
              options={[
                { label: '1m - Blitz', value: 60 },
                { label: '2m - Strategic', value: 120 },
                { label: '3m - Detailed', value: 180 },
              ]}
            />

            <GameSelect
              label="English Level"
              value={level}
              onChange={setLevel}
              options={[
                { label: 'A1 - Beginner', value: 'A1' },
                { label: 'A2 - Elementary', value: 'A2' },
                { label: 'B1 - Intermediate', value: 'B1' },
                { label: 'B2 - Upper Int', value: 'B2' },
              ]}
            />


            <div>
              <label className="block text-[9px] font-jetbrains text-whapigen-cyan/50 mb-3 uppercase tracking-[0.4em] pl-2 font-black">
                Hints
              </label>
              <button
                type="button"
                onClick={() => setHintsEnabled(!hintsEnabled)}
                className={`w-full flex items-center justify-between p-5 rounded-[30px] backdrop-blur-xl border transition-all cursor-pointer ${hintsEnabled
                  ? 'bg-purple-600/20 border-purple-500/40 shadow-[0_0_20px_rgba(147,51,234,0.2)]'
                  : 'bg-black/60 border-white/5 hover:bg-black/40'
                  }`}
              >
                <span className="font-jetbrains text-sm text-white">{hintsEnabled ? 'ENABLED' : 'DISABLED'}</span>
                <div className={`w-12 h-6 rounded-full relative transition-all ${hintsEnabled ? 'bg-purple-600' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${hintsEnabled ? 'left-7 bg-white shadow-[0_0_10px_rgba(147,51,234,0.6)]' : 'left-1 bg-white/40'}`}></div>
                </div>
              </button>
            </div>
          </div>

          <button
            className="w-full bg-gradient-to-r from-whapigen-cyan to-purple-600 hover:from-white hover:to-white text-black font-sora tracking-[0.3em] font-black h-16 flex items-center justify-center transition-all rounded-full group/btn mt-6 disabled:opacity-50 disabled:cursor-not-allowed uppercase shadow-[0_10px_40px_rgba(0,240,255,0.2)] hover:shadow-neon-cyan/50 hover:-translate-y-1 active:translate-y-0"
            onClick={createRoom}
            disabled={isCreating}
          >
            {isCreating ? (
              <><Loader2 className="w-6 h-6 animate-spin mr-3" /> INITIALIZING...</>
            ) : (
              <>Launch Game <Play className="w-5 h-5 ml-3 fill-current group-hover/btn:translate-x-2 transition-transform" /></>
            )}
          </button>
        </div>

        <div className="md:col-span-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-4 md:p-12 flex flex-col gap-10 shadow-2xl relative overflow-x-hidden group/missions animate-in slide-in-from-right duration-700">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-600 to-whapigen-cyan blur-sm opacity-30 group-hover/missions:opacity-70 transition-opacity"></div>
          <h2 className="text-xs font-black font-jetbrains text-white flex items-center gap-4 tracking-[0.4em] uppercase mb-2">
            <Users className="w-5 h-5 text-purple-500" /> Active Missions
            <div className="flex items-center gap-2 px-3 py-1 bg-whapigen-cyan/10 rounded-full border border-whapigen-cyan/20">
              <div className="w-2 h-2 bg-whapigen-cyan rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]"></div>
              <span className="text-[10px] font-jetbrains text-whapigen-cyan font-black uppercase tracking-widest">ACTIVE</span>
            </div>
          </h2>

          {loading ? (
            <div className="text-center p-20 flex flex-col items-center gap-6">
              <Loader2 className="w-12 h-12 text-whapigen-cyan animate-spin opacity-20" />
              <p className="font-jetbrains text-whapigen-cyan/30 text-[10px] tracking-[0.5em] uppercase animate-pulse">Scanning Secure Channels...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center p-24 bg-white/[0.02] border border-dashed border-white/10 rounded-[30px] text-whapigen-cyan/30 font-jetbrains text-[9px] tracking-[0.5em] uppercase">
              NO ACTIVE MISSIONS DETECTED
            </div>
          ) : (
            <div className="grid gap-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {rooms.map((room) => (
                <div key={room.id} className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6 md:gap-0 p-4 md:p-8 w-full bg-white/5 border border-white/5 hover:border-purple-500/30 hover:shadow-[0_0_40px_rgba(147,51,234,0.1)] transition-all group/item rounded-[30px] backdrop-blur-2xl relative overflow-x-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-whapigen-cyan/5 to-purple-600/5 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-center md:justify-start gap-10 md:gap-6 w-full">
                      <span className="text-4xl font-black text-white font-sora tracking-tighter group-hover/item:text-whapigen-cyan transition-colors">{room.code}</span>
                      <span className={`text-[8px] px-4 py-1.5 rounded-full border font-black tracking-[0.3em] uppercase transition-all ${room.status === 'LOBBY' ? 'text-whapigen-cyan border-whapigen-cyan/20 bg-whapigen-cyan/5' : 'text-purple-400 border-purple-500/20 bg-purple-500/5'}`}>
                        {room.status}
                      </span>
                    </div>
                    <div className="flex justify-center md:justify-start gap-8 mt-4 w-full">
                      <p className="text-[10px] text-gray-500 font-jetbrains flex items-center gap-2 uppercase tracking-[0.2em] font-bold">
                        <Clock className="w-3.5 h-3.5 text-whapigen-cyan/40" /> {room.turn_duration}s
                      </p>
                      <p className="text-[10px] text-gray-500 font-jetbrains flex items-center gap-2 uppercase tracking-[0.2em] font-bold">
                        <Hash className="w-3.5 h-3.5 text-purple-500/40" /> {room.level}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center gap-4 w-full md:w-auto justify-center md:justify-end">
                    <button
                      className="h-14 px-10 bg-white/5 hover:bg-whapigen-cyan text-white hover:text-black hover:shadow-neon-cyan/50 font-sora text-[10px] tracking-[0.3em] transition-all rounded-full flex items-center gap-3 font-black uppercase ring-1 ring-white/10"
                      onClick={() => navigate(`/game/${room.id}`)}
                    >
                      Enter Mission <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      className="w-14 h-14 flex items-center justify-center bg-whapigen-red/5 border border-whapigen-red/10 text-whapigen-red hover:bg-whapigen-red hover:text-white transition-all rounded-full group/trash"
                      onClick={() => deleteRoom(room.id)}
                      title="Abort Mission"
                    >
                      <Trash2 className="w-5 h-5 group-hover/trash:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <footer className="mt-auto text-center mb-1 border-t border-white/5 pt-8 relative z-20">
        <p className="text-[10px] text-center font-jetbrains text-white/70 tracking-[0.6em] uppercase font-black ml-[0.6em]">
          POWERED BY <span className="text-vivid-gradient italic">WHAPIGEN</span> // AI AUTOMATION SYSTEMS
        </p>
      </footer>
    </div>
  );
}
