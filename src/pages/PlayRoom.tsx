import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, EyeOff, Target, Crosshair, LogOut, Home, X, Loader2, Lock, Shield, Eye, MessageSquare, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { getRandomWordEntry, getHintsForWord } from '../data/words';
import { CyberRain } from '../components/ui/CyberRain';
import { RainToggle } from '../components/ui/RainToggle';


export default function PlayRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, players, gameState, loading, setActiveRoomId } = useGame();
  const { user, studentData, setStudentData, loading: authLoading } = useAuth();

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1: ALL HOOKS — must be above any conditional return
  // ══════════════════════════════════════════════════════════════════════════

  // ── State ──
  const [isConfirmedHost, setIsConfirmedHost] = useState(false);

  // ── Ref: GHOST-PURGE IMMUNIZER ──
  // Tracks whether this client's player has ever appeared in the live list.
  // Prevents a false-positive kick during the initial data-loading window.
  const hasBeenSeen = useRef(false);

  // ── Derived values (safe with optional chaining) ──
  const isTeacher = (!!user && room?.host_id === user.id) || isConfirmedHost;
  const isStudent = !!studentData && studentData.roomId === roomId;
  const activePlayers = players?.filter(p => !p.is_host) || [];
  const isMyTurn = gameState?.phase === 'SPEAKING_TURNS' && gameState?.current_turn_player_id === studentData?.playerId;

  // ── Effect: Set active room context ──
  useEffect(() => {
    if (roomId) setActiveRoomId(roomId);
  }, [roomId, setActiveRoomId]);

  // ── Effect: Coordinator DB check ──
  useEffect(() => {
    if (!user || !roomId) return;
    supabase
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .eq('host_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setIsConfirmedHost(true);
      });
  }, [user, roomId]);

  // ── Effect: Auth priority guard ──
  useEffect(() => {
    if (authLoading) return;
    if (isConfirmedHost) return;
    if (isTeacher) return;
    if (user) return;
    if (isStudent) return;
    navigate('/join');
  }, [authLoading, isConfirmedHost, user, room, isTeacher, isStudent, navigate]);

  // ── Effect: Auto-Kick listener ──
  useEffect(() => {
    if (!studentData?.playerId || isTeacher) return;
    let isSubscribed = false;
    const kickChannel = supabase.channel(`kick:${studentData.playerId}`)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'players', filter: `id=eq.${studentData.playerId}` }, (payload) => {
        // When this fires WITHOUT a prior KICK_ABS, it's an involuntary presence cleanup.
        // GameContext will check 'impostor_kicked' flag and handle accordingly.
        console.log('KICK-LISTENER: DB DELETE detected for', payload.old.id);
      })
      .on('broadcast', { event: 'KICK_ABS' }, (payload) => {
        if (payload.payload.target === studentData.playerId) {
          // ── EXPLICIT KICK: set flag FIRST so AUTO-REJOIN skips re-entry ──
          console.log('KICK-LISTENER: Explicit KICK_ABS — marking session as kicked.');
          sessionStorage.setItem('impostor_kicked', studentData.playerId);
          sessionStorage.clear(); // also wipe auth so re-join starts fresh
          setStudentData(null);
          window.location.href = '/join';
        }
      });

    kickChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') isSubscribed = true;
    });

    return () => {
      if (isSubscribed) supabase.removeChannel(kickChannel);
    };
  }, [studentData?.playerId, isTeacher, navigate, setStudentData]);

  // ── Effect: SESSION_ABORT listener (coordinator ends session for all) ──
  useEffect(() => {
    if (!roomId || isTeacher) return;
    let isSubscribed = false;
    const abortChannel = supabase.channel(`room:${roomId}:abort`)
      .on('broadcast', { event: 'SESSION_ABORT' }, () => {
        console.log('SESSION_ABORT received — clearing session and redirecting.');
        sessionStorage.clear();
        setStudentData(null);
        window.location.href = '/join';
      });

    abortChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') isSubscribed = true;
    });

    return () => {
      if (isSubscribed) supabase.removeChannel(abortChannel);
    };
  }, [roomId, isTeacher, setStudentData]);

  // ── Effect: STUDENT HEARTBEAT — ping last_seen every 15 seconds ──
  // Fix 3: Heartbeat Suicide Switch — if update returns an error (e.g. 400/404),
  // it means the player was reaped/kicked. Clear session and redirect immediately.
  useEffect(() => {
    if (!studentData?.playerId || isTeacher) return;
    const pid = studentData.playerId;
    let heartbeatInterval: ReturnType<typeof setInterval>;

    const sendHeartbeat = async () => {
      try {
        const { error } = await supabase
          .from('players')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', pid);

        if (error) {
          // A persistent 400/404 means this player's row was deleted by the Reaper.
          // Only act on definitive errors — transient network drops are silently ignored.
          console.warn('HEARTBEAT: Update failed:', error.message);
        }
      } catch (e) {
        // Silent catch — a dropped network packet should NOT kick the student.
        console.warn('HEARTBEAT: Network error silenced:', e);
      }
    };

    // Immediate first heartbeat
    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, 15_000);

    // Also ping when tab regains focus (handles mobile tab-sleep)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') sendHeartbeat();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [studentData?.playerId, isTeacher, navigate, setStudentData]);

  // ── Effect: LOBBY ABORT WATCHER (REMOVED) ──
  // The ABORT logic is now handled exclusively by the single-shot isAbortingRef watcher below.  // ── Effect: ZOMBIE SESSION DETECTOR ──
  // Cross-references the student's local session against the live players list.
  // Uses hasBeenSeen ref to grant immunity during the initial data-loading window.
  //
  // Guards:
  //  1. Skip if teacher — hosts are never purged.
  //  2. Skip if still loading — prevents a false positive on initial mount.
  //  3. Skip if no session — nothing to purge.
  //  4. Skip if players list is empty — transient state, not a confirmed deletion.
  useEffect(() => {
    if (isTeacher) return;
    if (loading) return;
    if (!studentData?.playerId && !studentData?.nickname) return;
    if (players.length === 0) return; // transient: wait for real data

    const isStillInRoom = players.some(p =>
      p.id === studentData?.playerId || p.nickname === studentData?.nickname
    );

    if (isStillInRoom) {
      hasBeenSeen.current = true;
      return;
    }

    if (hasBeenSeen.current) {
      console.warn(
        `[ZOMBIE DETECTOR] Player "${studentData?.nickname}" (${studentData?.playerId}) ` +
        `was confirmed in room but is now gone. Auto-purging ghost session.`
      );
      sessionStorage.clear();
      setStudentData(null);
      window.location.href = '/join';
    }
  }, [players, loading, isTeacher, studentData?.playerId, studentData?.nickname, setStudentData]);

  // ── Effect: FIX 2 — Mid-Game Global Abort ──
  // Single-shot guard: once we push LOBBY, we don't fire again until phase changes.
  const isAbortingRef = useRef(false);
  useEffect(() => {
    if (!gameState || !room) return;

    if (gameState.phase === 'LOBBY' || gameState.phase === 'RESULTS') {
      isAbortingRef.current = false; // reset so next active game can abort if needed
      return;
    }

    const alivePlayersList = activePlayers.filter(p => !p.is_eliminated);
    const aliveCount = alivePlayersList.length;
    if (aliveCount === 0) return;

    if (!isAbortingRef.current) {
      const impostorsAlive = alivePlayersList.filter(p => p.role === 'IMPOSTOR').length;
      const nativesAlive = aliveCount - impostorsAlive;

      // 1. Check Win Conditions first to avoid aborting a legitimate win
      if (impostorsAlive === 0 || nativesAlive <= impostorsAlive) {
        isAbortingRef.current = true;
        if (isTeacher) {
          console.warn('📝 DB WRITE - Cambiando game_state a RESULTS (Victoria detectada globalmente)');
          supabase.from('game_state').update({ phase: 'RESULTS' }).eq('room_id', room.id);
        }
        return;
      }

      // 2. Abort to LOBBY rule: if alive players drop < 3 and NO ONE WON, abort.
      if (aliveCount < 3) {
        isAbortingRef.current = true;
        if (isTeacher) {
          console.warn('📝 DB WRITE - Cambiando game_state a LOBBY (Abortando por falta de jugadores vivos)');
          supabase.from('game_state').update({
            phase: 'LOBBY',
            current_turn_index: 0,
            current_turn_player_id: null,
            turn_started_at: null,
            is_paused: false,
            secret_word: null
          }).eq('room_id', room.id);

          activePlayers.forEach(p =>
            supabase.from('players').update({ is_eliminated: false, turn_order: null }).eq('id', p.id)
          );
        }
      }
    }
  }, [activePlayers.length, gameState?.phase, isTeacher, room?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2: CONDITIONAL RETURNS — safe because all hooks are above
  // ══════════════════════════════════════════════════════════════════════════

  if (loading || !room || !gameState) {
    return (
      <div className="h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-8 overflow-x-hidden">
        <div className="absolute inset-0 z-0">
          <div className="particles-bg">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  '--duration': `${5 + Math.random() * 10}s`,
                  background: '#00f0ff',
                  opacity: 0.2
                } as any}
              />
            ))}
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="cyber-scanner mb-12 flex items-center justify-center">
            <div className="w-8 h-8 bg-whapigen-cyan/20 rounded-full animate-pulse"></div>
          </div>
          <p className="font-jetbrains text-whapigen-cyan/70 text-xs tracking-[0.8em] uppercase animate-pulse font-black">
            {!room ? 'CONNECTING TO ROOM...' : !gameState ? 'SYNCING GAME STATE...' : 'INITIALIZING SYSTEM...'}
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3: EVENT HANDLERS & RENDER (room and gameState guaranteed non-null)
  // ══════════════════════════════════════════════════════════════════════════

  const handleLeave = async () => {
    if (isStudent && studentData?.playerId) {
      await supabase.from('players').delete().eq('id', studentData.playerId);
      setStudentData(null);
      navigate('/join');
    } else if (isTeacher) {
      navigate('/admin/dashboard');
    }
  };

  const handleEndSession = async () => {
    if (isTeacher) {
      // 1. Reset phase to LOBBY so all clients see the transition immediately
      await supabase.from('game_state').update({
        phase: 'LOBBY',
        current_turn_index: 0,
        is_paused: false
      }).eq('room_id', room.id);

      // 2. Broadcast SESSION_ABORT so all students clear session and redirect
      const abortChannel = supabase.channel(`room:${room.id}:abort`);
      await abortChannel.subscribe();
      await abortChannel.send({
        type: 'broadcast',
        event: 'SESSION_ABORT',
        payload: { message: 'SESSION TERMINATED BY COORDINATOR' }
      });
      supabase.removeChannel(abortChannel);

      // 3. Clean up DB resources
      await supabase.from('players').delete().eq('room_id', room.id);
      await supabase.from('game_state').delete().eq('room_id', room.id);
      await supabase.from('rooms').delete().eq('id', room.id);
      navigate('/admin/dashboard');
    }
  };

  return (
    <div translate="no" className={`min-h-[100dvh] flex flex-col justify-start md:justify-between relative w-full overflow-y-auto overflow-x-hidden transition-all duration-700 bg-[#050505] ${isMyTurn ? 'shadow-[inset_0_0_120px_rgba(0,240,255,0.2)]' : ''}`}>
      <CyberRain />
      <RainToggle />

      {isMyTurn && (
        <div className="absolute inset-0 pointer-events-none border-[12px] border-whapigen-cyan/20 animate-pulse z-40 rounded-none duration-1000"></div>
      )}

      {/* Top Brand Navigation */}
      <div className="w-full flex justify-between items-center p-6 relative md:absolute md:top-0 z-[60] pointer-events-none">

        <button
          onClick={handleLeave}
          className="pointer-events-auto flex items-center gap-3 text-gray-400 hover:text-white font-jetbrains text-[10px] uppercase tracking-[0.3em] transition-all bg-black/60 backdrop-blur-xl px-8 py-3 rounded-full border border-white/5 hover:border-purple-500/50 hover:shadow-neon-pulse-violet font-black"
        >
          {isTeacher ? <><Home className="w-7 h-7 md:w-9 h-9" /> Dashboard</> : <><LogOut className="w-7 h-7 md:w-8 h-8 text-whapigen-red" /> Leave Mission</>}
        </button>
      </div>

      {/* STUDENT IDENTITY LABEL */}
      {!isTeacher && studentData?.nickname && (
        <div className="relative md:fixed md:bottom-8 md:left-8 z-50 pointer-events-none mt-4 md:mt-0 px-8 md:px-0">
          <div className="bg-gradient-to-r from-whapigen-cyan/20 to-purple-600/20 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-whapigen-cyan animate-pulse shadow-[0_0_10px_#00f0ff]"></div>
            <span className="font-jetbrains text-xs tracking-[0.4em] text-white/70 font-black uppercase">
              IDENT: {studentData.nickname}
            </span>
          </div>
        </div>
      )}

      <header className="relative md:fixed mt-2 md:top-8 md:left-8 md:right-8 z-30 md:z-[60] flex flex-col md:flex-row justify-between items-center p-4 md:p-6 bg-black/40 backdrop-blur-3xl rounded-3xl md:rounded-full border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] mx-4 md:mx-auto max-w-7xl animate-in slide-in-from-top duration-700 gap-4 md:gap-0">
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3">
            <span className="text-header-premium text-lg font-black tracking-[0.2em] whitespace-nowrap">CIL LENGUAS</span>
            <div className="w-1 h-6 bg-gradient-to-b from-whapigen-cyan to-purple-600 opacity-30"></div>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-header-premium text-2xl tracking-[0.1em]">
              {room.code}
            </h1>
            <div className="flex items-center gap-2">
              <span className="bg-purple-900/40 backdrop-blur-xl border border-purple-500/30 text-gray-300 font-jetbrains text-xs px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                LEVEL {room.level}
              </span>
              <span className="text-white/20 font-jetbrains text-[10px] tracking-widest px-1"></span>
              <span className="bg-cyan-900/40 backdrop-blur-xl border border-cyan-500/30 text-gray-300 font-jetbrains text-xs px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                {room.turn_duration}S TURNS
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end w-full md:w-auto">
          <span className="text-whapigen-cyan font-jetbrains text-[10px] tracking-[0.4em] border border-whapigen-cyan/30 bg-whapigen-cyan/10 px-4 py-1.5 rounded-full uppercase font-black animate-pulse shadow-neon-pulse-cyan text-center">
            PHASE: {gameState.phase.replace('_', ' ')}
          </span>
          <span className="text-xs text-white/70 font-jetbrains tracking-[0.2em] mt-2 flex items-center gap-2 font-black justify-center md:justify-end w-full">
            <Users className="w-3.5 h-3.5 text-whapigen-cyan/50" /> {activePlayers.length} PLAYERS
          </span>
        </div>
      </header>

      {/* ABORT SYSTEM LISTENER — useEffect prevents repeated triggers on re-render */}
      {(() => {
        // Stale-closure guard: this JSX only mounts for the teacher and is
        // a lightweight fallback. The real abort fires in the useEffect below.
        return null;
      })()}

      {/* PERSISTENT MEMORY MODULE FOR STUDENTS */}
      {!isTeacher && gameState.phase === 'SPEAKING_TURNS' && (
        <PersistentWordBar
          role={activePlayers.find(p => p.id === studentData?.playerId)?.role}
          secretWord={gameState.secret_word}
          hintsEnabled={!!room.hints_enabled}
          hints={getHintsForWord(gameState.secret_word || '', room.level)}
          phaseStartedAt={gameState.turn_started_at}
        />
      )}

      {isTeacher && (
        <div className="relative md:fixed md:top-[150px] md:left-8 md:right-8 z-[40] p-4 flex flex-col md:flex-row justify-between items-center mx-auto max-w-7xl px-4 md:px-10 mt-4 md:mt-0">
          <div className="flex items-center gap-3 font-jetbrains text-purple-300 font-black tracking-[0.4em] text-xs uppercase">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#9333ea]"></div>COORDINATOR OVERRIDE
          </div>
          {gameState.phase !== 'LOBBY' && (
            <div className="flex items-center gap-10 font-jetbrains text-[14px] tracking-[0.3em] font-black uppercase mt-4 md:mt-0">
              <div className="flex items-center gap-3">
                <span className="text-white">WORD:</span>
                <span className="text-white bg-white/5 px-4 py-1 rounded-full border border-white/5 text-[clamp(0.75rem,0.5vw+0.5rem,1rem)]">{gameState.secret_word || '???'}</span>
              </div>
              <div className="flex items-start gap-3">
                {/* Ajusté el label para que siempre diga IMPOSTORS si hay juego en curso */}
                <span className="text-white mt-1 text-xs font-bold tracking-wider opacity-60">IMPOSTORS:</span>

                <div className="flex flex-col gap-2">
                  {activePlayers
                    .filter(p => p.role === 'IMPOSTOR')
                    // !!! FIX DEL BAILE: Ordenamos alfabéticamente por nickname para fijar la posición !!!
                    .sort((a, b) => a.nickname.localeCompare(b.nickname))
                    // El .map renderiza dinámicamente cuántos impostores haya (1, 2, 3 o 10)
                    .map((impostor) => (
                      <span
                        key={impostor.id} // Clave única para React
                        className="text-whapigen-red bg-whapigen-red/5 px-4 py-1.5 rounded-full border border-whapigen-red/20 drop-shadow-neon-red text-[clamp(0.75rem,0.5vw+0.5rem,1rem)] text-center animate-in fade-in zoom-in-95 font-black uppercase tracking-wider"
                      >
                        {impostor.nickname}
                      </span>
                    ))}

                  {/* Fallback por si la partida no empezó o no hay impostores */}
                  {activePlayers.filter(p => p.role === 'IMPOSTOR').length === 0 && (
                    <span className="text-white/20 italic text-xs px-2 py-1">AWAITING INTEL...</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleEndSession}
                className="bg-whapigen-red hover:bg-white hover:text-black text-white px-6 py-2 rounded-full transition-all font-black"
              >
                ABORT MISSION
              </button>
            </div>
          )}
        </div>
      )}

      <main className="flex-grow pt-8 md:pt-[180px] md:-mt-20 pb-32 px-4 md:px-8 flex flex-col items-center justify-center relative z-10 w-full">
        {(() => {
          switch (gameState.phase) {
            case 'LOBBY': return <PhaseLobby isTeacher={isTeacher} roomId={roomId!} players={activePlayers} roomLevel={room.level} />;
            case 'ROLE_REVEAL': return <PhaseReveal isTeacher={isTeacher} roomId={roomId!} players={activePlayers} />;
            case 'SPEAKING_TURNS': return <PhaseSpeaking isTeacher={isTeacher} room={room} gameState={gameState} players={activePlayers} />;
            case 'VOTING': return <PhaseVoting isTeacher={isTeacher} roomId={roomId!} players={activePlayers} gameState={gameState} room={room} />;
            case 'ROUND_STANDBY': return <PhaseStandby isTeacher={isTeacher} roomId={roomId!} players={activePlayers} gameState={gameState} />;
            case 'RESULTS': return <PhaseResults isTeacher={isTeacher} roomId={roomId!} players={activePlayers} />;
            default: return <div className="text-white">UNKNOWN PHASE: {gameState.phase}</div>;
          }
        })()}
      </main>

      <footer className="relative md:fixed md:bottom-2 left-0 right-0 z-50 flex flex-col items-center gap-4 md:transform md:translate-y-2 pointer-events-none mt-auto pb-8 md:pb-0">
        <p className="text-[10px] font-jetbrains text-white/70 tracking-[0.6em] uppercase font-black px-4 text-center">
          POWERED BY <span className="bg-gradient-to-r from-whapigen-cyan to-purple-500 bg-clip-text text-transparent italic">WHAPIGEN</span> // AI AUTOMATION SYSTEMS
        </p>
      </footer>
    </div>
  );
}

// ---------------- LOBBY PHASE ----------------
function PhaseLobby({ isTeacher, roomId, players, roomLevel }: { isTeacher: boolean, roomId: string, players: any[], roomLevel: string }) {
  const { refreshPlayers } = useGame(); // Keep hook call alive for context subscription
  const [startError, setStartError] = useState<string | null>(null);

  // ── canStart: disabled if < 3 players ──
  const canStart = (players?.length || 0) >= 3;

  const startGame = async () => {
    // ── FIX 1: STRICT GUARD ──
    if (players.length < 3) return;

    // ── LIVE VALIDATION: re-fetch directly from DB, never trust stale state ──
    const { data: livePlayers } = await supabase
      .from('players')
      .select('id, nickname')
      .eq('room_id', roomId)
      .eq('is_host', false);

    if (!livePlayers || livePlayers.length < 3) {
      setStartError(`MISSION STANDBY: WAITING FOR REINFORCEMENTS`);
      return;
    }
    setStartError(null);


    // ── SCALABLE IMPOSTOR COUNT ──
    const n = livePlayers.length;
    let impostorCount = 1;
    if (n >= 12) impostorCount = 3;
    else if (n >= 6) impostorCount = 2;
    // Safety: never assign more impostors than (playerCount - 1)
    impostorCount = Math.min(impostorCount, n - 1);

    console.log(`[Role Allocator] Allocating ${impostorCount} IMPOSTOR(s) for ${n} player(s)`);

    // ── ANTI-REPEAT RING: track how many times each player has been impostor ──
    // Stored as a JSON map { [playerId]: consecutiveRoundCount } in localStorage.
    const historyKey = `impostor_history_${roomId}`;
    let history: Record<string, number> = {};
    try {
      const raw = localStorage.getItem(historyKey);
      if (raw) history = JSON.parse(raw);
    } catch (_) { history = {}; }

    // Build candidate pool: exclude players who've been impostor 2+ consecutive rounds
    const candidates = livePlayers.filter(p => (history[p.id] || 0) < 2);
    const candidatePool = candidates.length >= impostorCount ? candidates : livePlayers;

    // Shuffle candidates and pick impostors
    const shuffledCandidates = [...candidatePool].sort(() => Math.random() - 0.5);
    const impostorIds = new Set<string>(shuffledCandidates.slice(0, impostorCount).map(p => p.id));

    // Update history: +1 for impostors, reset to 0 for natives
    const newHistory: Record<string, number> = {};
    for (const p of livePlayers) {
      newHistory[p.id] = impostorIds.has(p.id) ? (history[p.id] || 0) + 1 : 0;
    }
    localStorage.setItem(historyKey, JSON.stringify(newHistory));

    // Get the word first before assigning roles individually
    const wordEntry = getRandomWordEntry(roomLevel);

    // ── DISTRIBUTE ROLES AND INITIAL TURN ORDER ──
    const shuffledForOrder = [...livePlayers].sort(() => Math.random() - 0.5);
    const turnOrderMap = new Map(shuffledForOrder.map((p, i) => [p.id, i]));

    const roleUpdates = livePlayers.map(p => {
      const isImpostor = impostorIds.has(p.id);
      return supabase.from('players').update({
        role: isImpostor ? 'IMPOSTOR' : 'CITIZEN',
        secret_word: isImpostor ? null : wordEntry.word,
        is_eliminated: false,
        turn_order: turnOrderMap.get(p.id)
      }).eq('id', p.id);
    });

    await Promise.all(roleUpdates);
    console.log('[Role Allocator] Roles and secret_words distributed independently.');

    // Wipe any stale votes from a previous round before entering
    await supabase.from('votes').delete().eq('room_id', roomId);

    // Pick first speaker based on turn_order 0
    const firstPlayer = shuffledForOrder[0];
    console.warn('📝 DB WRITE - Cambiando game_state:', { nuevaFase: 'ROLE_REVEAL', disparadoPor: 'startGame' });
    await supabase.from('game_state').update({
      phase: 'ROLE_REVEAL',
      secret_word: wordEntry.word,
      current_turn_player_id: firstPlayer.id,
      current_turn_index: 0,
      current_round: 1,
      max_rounds: 3
    }).eq('room_id', roomId);
  };

  const [showBriefing, setShowBriefing] = useState(false);

  return (
    <div className="relative z-40 md:z-auto w-full max-w-2xl text-center space-y-8 pt-8 md:pt-20 animate-in fade-in duration-500">

      <div className="mb-8 relative">
        <Target className="w-24 h-24 mx-auto text-whapigen-cyan/20 absolute -top-4 left-1/2 -translate-x-1/2 -rotate-45" />
        <h2 className="text-4xl md:text-5xl font-sora font-extrabold text-white uppercase tracking-tight relative z-10">
          Waiting for
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-whapigen-cyan to-purple-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            Instructions ({players.length}/16)
          </span>
        </h2>

        <button
          onClick={() => setShowBriefing(true)}
          className="flex items-center justify-center gap-x-2 px-4 py-3 bg-white/5 backdrop-blur-md border border-whapigen-cyan/30 rounded-full text-whapigen-cyan font-jetbrains text-[9px] md:text-xs tracking-[0.3em] uppercase hover:bg-whapigen-cyan/10 hover:border-whapigen-cyan/60 transition-all cursor-pointer w-[90%] max-w-sm md:w-auto mx-auto mt-8 shadow-[0_0_15px_rgba(0,240,255,0.1)] whitespace-normal text-center"
        >
          <Target className="w-4 h-4" /> MISSION BRIEFING / HOW TO PLAY
        </button>
      </div>

      <div className="relative z-[1] pointer-events-auto bg-black/95 backdrop-blur-xl border border-white/5 p-12 min-h-[300px] w-full max-w-4xl flex flex-wrap gap-4 items-center justify-center rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-x-hidden">
        <div className="particles-bg opacity-30">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                '--duration': `${15 + Math.random() * 15}s`,
                background: i % 2 === 0 ? '#00f0ff' : '#9333ea',
              } as any}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-digital-grid bg-[length:50px_50px] opacity-[0.02] pointer-events-none"></div>
        {players.length === 0 ? (
          <div className="text-whapigen-cyan/20 font-jetbrains text-[10px] tracking-[1em] uppercase font-black animate-pulse flex flex-col items-center gap-6">
            <div className="w-1 px-40 h-[1px] bg-gradient-to-r from-transparent via-whapigen-cyan to-transparent"></div>
            SYNC SIGNAL ACTIVE
            <div className="w-1 px-40 h-[1px] bg-gradient-to-r from-transparent via-whapigen-cyan to-transparent"></div>
          </div>
        ) : (
          [...players].sort((a, b) => a.nickname.localeCompare(b.nickname)).map(p => (
            <div key={p.id} className="bg-black/40 backdrop-blur-xl border border-white/10 text-white px-6 py-3 flex items-center gap-4 font-jetbrains text-xs tracking-[0.2em] rounded-full animate-in zoom-in-50 duration-500 group shadow-lg hover:shadow-neon-pulse-cyan hover:border-whapigen-cyan/30 transition-all font-black" style={{ transform: 'translateZ(0)' }}>
              <div className="w-3 h-3 rounded-full bg-whapigen-cyan animate-pulse shadow-neon-pulse-cyan"></div>
              {p.nickname}
              {isTeacher && (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!p.id) { console.error('KICK ERROR: player id is undefined', p); return; }
                    console.log('🛑 KICK INTENT:', p.id);
                    await supabase.from('players').delete().eq('id', p.id);

                    // Send explicit broadcast to stop auto-rejoin
                    const ch = supabase.channel(`kick:${p.id}:${Date.now()}`);
                    ch.subscribe((status) => {
                      if (status === 'SUBSCRIBED') {
                        ch.send({ type: 'broadcast', event: 'KICK_ABS', payload: { target: p.id } })
                          .then(() => {
                            supabase.removeChannel(ch);
                            refreshPlayers(); // Update Admin UI immediately
                          });
                      }
                    });
                  }}
                  className="relative z-[9999] pointer-events-auto text-whapigen-red/40 hover:text-white hover:bg-whapigen-red w-8 h-8 rounded-full flex items-center justify-center transition-all ml-4 border border-whapigen-red/20 shadow-inner group-hover:text-whapigen-red group-hover:scale-110 shadow-neon-pulse-red cursor-pointer"
                  title="Kick Player"
                >
                  <X className="w-4 h-4" style={{ pointerEvents: 'none' }} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {isTeacher ? (
        <div className="flex flex-col items-center gap-2 mt-12 w-full max-w-2xl">
          {/* MISSION STANDBY BANNER - shown when hard abort triggered */}
          {!canStart && (
            <div className="w-full bg-whapigen-red/5 border border-whapigen-red/30 rounded-[30px] p-10 text-center animate-pulse shadow-neon-pulse-red backdrop-blur-xl">
              <div className="flex items-center justify-center gap-4 mb-5">
                <span className="w-2.5 h-2.5 rounded-full bg-whapigen-red animate-ping"></span>
                <span className="text-whapigen-red font-jetbrains font-black tracking-[0.4em] text-xs uppercase">STATUS: MISSION STANDBY</span>
                <span className="w-2.5 h-2.5 rounded-full bg-whapigen-red animate-ping"></span>
              </div>
              <h3 className="text-white font-sora font-black text-xl uppercase mb-3">INSUFFICIENT PLAYERS</h3>
              <p className="text-white/70 font-jetbrains text-xs tracking-[0.3em] font-black">{players.length}/16 PLAYERS — NEED {3 - players.length} REINFORCEMENTS</p>
              {startError && <p className="text-whapigen-red font-jetbrains text-[10px] mt-4 tracking-[0.2em]">{startError}</p>}
            </div>
          )}
          {canStart && startError && (
            <div className="flex items-center gap-3 bg-whapigen-red/10 border border-whapigen-red/30 text-whapigen-red font-jetbrains text-[10px] tracking-[0.3em] uppercase px-8 py-3 rounded-full">
              <span className="w-2 h-2 rounded-full bg-whapigen-red animate-ping"></span>
              <span key="start-error">{startError}</span>
            </div>
          )}
          <button
            onClick={startGame}
            disabled={!canStart}
            className="mb-30 h-20 px-24 bg-gradient-to-r from-whapigen-cyan to-purple-600 hover:from-white hover:to-white text-black font-sora font-black tracking-[0.4em] transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-full w-full uppercase shadow-[0_15px_60px_rgba(0,240,255,0.3)] hover:shadow-neon-cyan/50 hover:-translate-y-1 active:translate-y-0"
          >
            <span style={{ pointerEvents: 'none' }}>{!canStart ? `LOCKED: ${players.length}/16 PLAYERS` : 'Start Mission'}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 mt-12 w-full max-w-xl mx-auto">
          {!canStart ? (
            <div className="w-full bg-whapigen-red/5 border border-whapigen-red/20 rounded-[30px] p-8 text-center animate-pulse shadow-neon-pulse-red backdrop-blur-xl">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="w-2 h-2 rounded-full bg-whapigen-red animate-ping"></span>
                <span className="text-whapigen-red font-jetbrains font-black tracking-[0.4em] text-xs uppercase">MISSION STANDBY</span>
              </div>
              <p className="text-white/70 font-jetbrains text-xs tracking-[0.3em] font-black italic">AWAITING ADDITIONAL PLAYERS ({players.length}/16)</p>
            </div>
          ) : (
            <div className="text-whapigen-cyan font-jetbrains text-xs tracking-[0.4em] uppercase animate-pulse text-center font-black drop-shadow-neon-cyan">
              ENCRYPTION ACTIVE: AWAITING COORDINATOR ORDERS
            </div>
          )}
        </div>
      )}

      {/* Mission Briefing Modal */}
      {showBriefing && createPortal((
        <div className="fixed inset-0 z-[99999] bg-black md:bg-black/80 md:backdrop-blur-md flex flex-col overflow-y-auto w-full h-full p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative w-full max-w-2xl md:my-auto flex flex-col p-8 bg-[#050505]/95 backdrop-blur-2xl border border-whapigen-cyan/20 rounded-[40px] shadow-[0_20px_80px_rgba(0,240,255,0.2)] group/card mx-auto">
            <button
              onClick={() => setShowBriefing(false)}
              className="absolute top-4 right-4 z-[100000] text-whapigen-cyan hover:text-white"
            >
              <div className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-whapigen-cyan/10 flex items-center justify-center border border-whapigen-cyan/20 hover:bg-whapigen-cyan/30 transition-all">
                <X className="w-6 h-6 md:w-5 md:h-5" />
              </div>
            </button>
            <h3 className="text-xl md:text-2xl pr-12 md:pr-0font-sora font-black text-transparent bg-clip-text bg-gradient-to-r from-whapigen-cyan to-purple-400 uppercase mb-8 drop-shadow-neon-cyan tracking-tighter text-center md:text-left">
              MISSION BRIEFING
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="bg-whapigen-cyan/5 border border-whapigen-cyan/10 p-8 rounded-[30px] hover:border-whapigen-cyan/40 transition-all group/info flex flex-col items-start gap-4 h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-whapigen-cyan/10 flex items-center justify-center border border-whapigen-cyan/20 group-hover/info:bg-whapigen-cyan/20 transition-all">
                    <Eye className="w-5 h-5 text-whapigen-cyan" />
                  </div>
                  <h4 className="text-whapigen-cyan font-jetbrains font-black text-[12px] tracking-[0.3em] uppercase">REVEAL</h4>
                </div>
                <p className="text-whapigen-cyan/60 font-jetbrains text-[11px] leading-relaxed tracking-wider font-medium">Check your role. Players receive the secret word; the Impostor does not know it and is left in the dark.</p>
              </div>

              <div className="bg-whapigen-cyan/5 border border-whapigen-cyan/10 p-8 rounded-[30px] hover:border-purple-500/40 transition-all group/info flex flex-col items-start gap-4 h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover/info:bg-purple-500/20 transition-all">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <h4 className="text-whapigen-cyan font-jetbrains font-black text-[12px] tracking-[0.3em] uppercase">HINT</h4>
                </div>
                <p className="text-whapigen-cyan/60 font-jetbrains text-[11px] leading-relaxed tracking-wider font-medium">The Impostor gets a hint to help them blend in. <span className="text-whapigen-cyan">CAUTION FOR PLAYERS:</span> if your clues are too obvious, the Impostor may guess the secret word.</p>
              </div>

              <div className="bg-whapigen-cyan/5 border border-whapigen-cyan/10 p-8 rounded-[30px] hover:border-cyan-500/40 transition-all group/info flex flex-col items-start gap-4 h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover/info:bg-cyan-500/20 transition-all">
                    <MessageSquare className="w-5 h-5 text-whapigen-cyan" />
                  </div>
                  <h4 className="text-whapigen-cyan font-jetbrains font-black text-[12px] tracking-[0.3em] uppercase">VOTE</h4>
                </div>
                <p className="text-whapigen-cyan/60 font-jetbrains text-[11px] leading-relaxed tracking-wider font-medium">Discuss and vote for the player you think is the Impostor. The Player with the most votes is eliminated.</p>
              </div>

              <div className="bg-whapigen-cyan/5 border border-whapigen-cyan/10 p-8 rounded-[30px] hover:border-whapigen-green/40 transition-all group/info flex flex-col items-start gap-4 h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-whapigen-green/10 flex items-center justify-center border border-whapigen-green/20 group-hover/info:bg-whapigen-green/20 transition-all">
                    <ShieldCheck className="w-5 h-5 text-whapigen-green" />
                  </div>
                  <h4 className="text-whapigen-cyan font-jetbrains font-black text-[12px] tracking-[0.3em] uppercase">WIN</h4>
                </div>
                <p className="text-whapigen-cyan/60 font-jetbrains text-[11px] leading-relaxed tracking-wider font-medium">Players win by correctly eliminating the Impostor. The Impostor wins by blending in and avoiding detection or by guessing the secret word.</p>
              </div>
            </div>

            <button
              onClick={() => setShowBriefing(false)}
              className="w-full mt-10 h-20 bg-gradient-to-r from-purple-600 to-whapigen-cyan hover:from-white hover:to-white text-black font-sora tracking-[0.5em] font-black rounded-full transition-all shadow-[0_15px_40px_rgba(0,240,255,0.2)] uppercase text-xs hover:-translate-y-1 active:translate-y-0"
            >
              CONFIRM BRIEFING
            </button>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}

// ---------------- ROLE REVEAL PHASE ----------------
function PhaseReveal({ isTeacher, roomId, players }: { isTeacher: boolean, roomId: string, players: any[] }) {
  const [revealed, setRevealed] = useState(false);
  const { gameState } = useGame();
  const { studentData } = useAuth();

  const currentPlayer = players.find(p => p.id === studentData?.playerId);
  const role = currentPlayer?.role;
  const secretWord = gameState?.secret_word;

  const beginSpeaking = async () => {
    try {
      // 1. ATOMIC PHASE TRANSITION: Fetch entirely fresh players from DB
      const { data: freshPlayers, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_eliminated', false)
        .eq('is_host', false);

      if (fetchError || !freshPlayers) {
        console.error("Failed to fetch fresh players:", fetchError);
        return;
      }

      // 2. SAFETY GUARD: Check minimum players
      if (freshPlayers.length < 3) {
        console.warn("Safety Guard: Insufficient fresh players. Aborting transition to LOBBY.");
        await supabase.from('game_state').update({
          phase: 'LOBBY',
          current_turn_index: 0,
          is_paused: false
        }).eq('room_id', roomId);
        return;
      }

      // 3. FIND FIRST ALIVE PLAYER IN SEQUENCE
      const firstPlayer = freshPlayers.sort((a, b) => (a.turn_order || 0) - (b.turn_order || 0))[0];

      if (!firstPlayer) {
        console.error("No alive first player found");
        return;
      }

      // 4. Update GameState using verified ID and its existing turn_order
      const { error } = await supabase.from('game_state').update({
        phase: 'SPEAKING_TURNS',
        current_turn_index: firstPlayer.turn_order || 0,
        current_turn_player_id: firstPlayer.id,
        turn_started_at: new Date().toISOString(),
        is_paused: false
      }).eq('room_id', roomId);

      if (error) {
        console.error("Error updating game_state to SPEAKING_TURNS:", error);
      }
    } catch (e) {
      console.error("Critical error in beginSpeaking:", e);
    }
  };

  if (isTeacher) {
    return (
      <div className="text-center font-jetbrains w-full max-w-md space-y-8 animate-in slide-in-from-bottom-4 pt-[140px]">
        <h2 className="text-2xl font-sora font-bold text-white uppercase text-whapigen-cyan drop-shadow-neon-cyan mb-8">ROLE DISTRIBUTED</h2>
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] text-center p-20 shadow-2xl w-full max-w-lg group">
          <div className="mb-10 p-5 rounded-full bg-white/5 inline-block group-hover:bg-whapigen-cyan/10 transition-colors">
            <Loader2 className="w-10 h-10 text-whapigen-cyan animate-spin" />
          </div>
          <p className="text-white text-xs font-jetbrains font-black tracking-[0.5em] mb-12 uppercase animate-pulse">AWAITING CONFIRMATION...</p>
          <button
            onClick={beginSpeaking}
            className="w-full h-20 bg-gradient-to-r from-whapigen-cyan to-purple-600 text-black hover:scale-105 active:scale-95 font-sora font-black tracking-[0.3em] transition-all rounded-full uppercase shadow-2xl ring-2 ring-white/10"
          >
            Launch System
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg text-center space-y-8 pt-8 md:pt-0 animate-in zoom-in-95 relative z-50">
      <h2 className="text-3xl font-sora font-extrabold text-white uppercase tracking-wider shadow-md">TOP SECRET DATA</h2>

      <div
        className={`bg-black/60 backdrop-blur-xl p-8 md:p-16 transition-all duration-700 relative cursor-pointer group select-none overflow-x-hidden rounded-[40px] border shadow-[0_30px_50px_rgba(0,0,0,0.5)] flex items-center justify-center min-h-[200px] md:min-h-[250px] w-full z-50 animate-pulse-slow ${revealed ? 'border-whapigen-cyan shadow-neon-pulse-cyan' : 'border-white/5 hover:border-purple-500/30 shadow-neon-pulse-violet'}`}
        onClick={() => setRevealed(prev => !prev)}
      >
        <div className="absolute inset-0 bg-digital-grid bg-[length:60px_60px] opacity-[0.03] pointer-events-none"></div>
        {!revealed ? (
          <div className="flex flex-col items-center gap-6 animate-in zoom-in-50">
            <Lock className="w-16 h-16 text-whapigen-cyan animate-pulse" />
            <p className="font-jetbrains text-sm tracking-[0.5em] text-white/70 uppercase">Tap to decrypt</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 animate-in slide-in-from-bottom duration-500 w-full px-4 md:px-12">
            <div className="flex items-center gap-4 text-green-400 font-jetbrains text-sm tracking-[0.3em] uppercase">
              <Shield className="w-8 h-8" />
              <span>Sector Secured</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-full min-w-0">
              <span className="text-cyan-500 font-jetbrains text-xs md:text-sm tracking-[0.8em] font-black uppercase mb-4 ml-[0.8em]">IDENTITY</span>
              <div className="flex items-center justify-center w-full min-w-0">
                <h1 className="text-white font-sora font-black uppercase tracking-tighter leading-none text-center drop-shadow-neon-cyan whitespace-nowrap flex-nowrap text-[clamp(1.2rem,8vw,2.5rem)] md:text-[clamp(1.5rem,5vw,2.5rem)]">
                  {role === 'IMPOSTOR' ? 'IMPOSTOR' : 'PLAYER'}
                </h1>
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4"></div>

            <div className="flex flex-col items-center gap-2 w-full">
              <span className="text-purple-400 font-jetbrains text-sm tracking-[0.8em] font-black uppercase mb-4 ml-[0.8em]">SECRET WORD</span>
              <div className="flex items-center justify-center w-full min-w-0">
                <h1 className="text-white font-sora font-black uppercase tracking-tighter leading-none text-center drop-shadow-neon-violet break-words overflow-visible text-[clamp(1.2rem,8vw,2.5rem)] md:text-[clamp(1.5rem,5vw,2.5rem)]">
                  {role === 'IMPOSTOR' ? '???' : secretWord}
                </h1>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isTeacher && (
        <div className="text-whapigen-cyan font-jetbrains text-xs tracking-[0.3em] uppercase mt-8 animate-pulse text-center">
          AWAITING COORDINATOR ORDERS...
        </div>
      )}
    </div>
  );
}

// ---------------- SPEAKING TURNS PHASE ----------------
function PhaseSpeaking({ isTeacher, room, gameState, players }: { isTeacher: boolean, room: any, gameState: any, players: any[] }) {
  const { studentData } = useAuth();
  const { refreshPlayers, serverTimeOffset } = useGame();
  const circleRef = useRef(null);
  const tlRef = useRef<gsap.core.Tween | null>(null);
  const currentPlayer = players.find((p: any) => p.id === gameState.current_turn_player_id);

  // Jump-free Absolute Timer
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setTick] = useState(0);
  const pausedTimeRef = useRef(room.turn_duration);

  // Derive absolute time
  let rawTimeLeftMs = room.turn_duration * 1000;
  if (gameState.turn_started_at) {
    const startedAt = new Date(gameState.turn_started_at).getTime();
    const nowWithOffset = Date.now() + (serverTimeOffset || 0);
    const elapsedMs = nowWithOffset - startedAt;
    rawTimeLeftMs = (room.turn_duration * 1000) - elapsedMs;
  }
  let actualTimeLeft = Math.max(0, Math.floor(rawTimeLeftMs / 1000));

  if (!gameState.is_paused) {
    pausedTimeRef.current = actualTimeLeft;
  }
  const displayTime = gameState.is_paused ? pausedTimeRef.current : actualTimeLeft;

  useEffect(() => {
    if (gameState.is_paused) return; // freeze visual tick
    const interval = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(interval);
  }, [gameState.is_paused]);

  useEffect(() => {
    if (actualTimeLeft <= 0 && isTeacher && !gameState.is_paused) {
      handleNextTurn();
    }
  }, [actualTimeLeft, isTeacher, gameState.is_paused]);

  // Initial GSAP setup
  useEffect(() => {
    if (!gameState.turn_started_at) return;

    // Force reset GSAP explicitly so resuming skipped turns doesn't glitch the visual circle (ONLY on new turn triggers)
    // To preserve pause state seamlessly, we ONLY set if the tween is brand new or we are changing target.
    if (!tlRef.current) {
      gsap.set(circleRef.current, { strokeDashoffset: 283 });
    }

    // Capture the elapsed percentage to prevent "jumping to zero"
    let currentOffset = 283;
    if (gameState.turn_started_at) {
      const startedAt = new Date(gameState.turn_started_at).getTime();
      const nowWithOffset = Date.now() + (serverTimeOffset || 0);
      const elapsedS = (nowWithOffset - startedAt) / 1000;
      const progress = Math.min(1, Math.max(0, elapsedS / room.turn_duration));
      currentOffset = 283 - (283 * progress);
    }

    gsap.set(circleRef.current, { strokeDashoffset: currentOffset });

    // Animate circular perimeter stroke Dash offset
    tlRef.current = gsap.to(circleRef.current, {
      strokeDashoffset: 0,
      duration: room.turn_duration * (currentOffset / 283), // Only tween remaining time iteratively
      ease: 'none',
      paused: gameState.is_paused
    });

    return () => {
      if (tlRef.current) tlRef.current.kill();
    };
  }, [gameState.current_turn_player_id, gameState.turn_started_at]);

  // Handle Pause/Resume Sync — kill existing tween to prevent ghost timer background execution
  useEffect(() => {
    if (!tlRef.current) return;
    if (gameState.is_paused) {
      tlRef.current.pause();
    } else {
      // Kill the stale tween so the visual clock can't fire at wrong thresholds
      tlRef.current.kill();
      // Recompute remaining time and restart a fresh tween from current offset
      const startedAt = new Date(gameState.turn_started_at || Date.now()).getTime();
      const nowWithOffset = Date.now() + (serverTimeOffset || 0);
      const elapsedS = (nowWithOffset - startedAt) / 1000;
      const progress = Math.min(1, Math.max(0, elapsedS / room.turn_duration));
      const currentOffset = 283 - (283 * progress);
      gsap.set(circleRef.current, { strokeDashoffset: currentOffset });
      tlRef.current = gsap.to(circleRef.current, {
        strokeDashoffset: 0,
        duration: room.turn_duration * (currentOffset / 283),
        ease: 'none',
      });
    }
    return () => { if (tlRef.current) tlRef.current.kill(); };
  }, [gameState.is_paused]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextTurn = async () => {
    if (gameState.phase === 'LOBBY' || players.filter((p: any) => !p.is_host).length < 3) {
      console.warn('⛔ handleNextTurn BLOQUEADO: Fase de Lobby activa o faltan jugadores.');
      return;
    }
    // 1. FIND ALL CANDIDATES: Alive players with turn_order > current
    const nextCandidates = players
      .filter((p: any) => !p.is_eliminated && !p.is_host && (p.turn_order || 0) > gameState.current_turn_index)
      .sort((a, b) => (a.turn_order || 0) - (b.turn_order || 0));

    const nextPlayer = nextCandidates[0];

    if (nextPlayer) {
      console.warn('📝 DB WRITE - Cambiando game_state:', { nuevaFase: 'Mismo (Siguiente Turno)', disparadoPor: 'handleNextTurn' });
      await supabase.from('game_state').update({
        current_turn_index: nextPlayer.turn_order,
        current_turn_player_id: nextPlayer.id,
        turn_started_at: new Date().toISOString(),
        is_paused: false
      }).eq('room_id', room.id);
    } else {
      // ── PRE-VOTING WIPE: delete ALL votes for this room before entering voting ──
      // This prevents 'auto-vote' bugs caused by stale rows from previous rounds.
      await supabase.from('votes').delete().eq('room_id', room.id);
      console.warn('📝 DB WRITE - Cambiando game_state:', { nuevaFase: 'VOTING', disparadoPor: 'handleNextTurn (Ronda Terminada)' });
      await supabase.from('game_state').update({
        phase: 'VOTING',
        is_paused: false,
        turn_started_at: new Date().toISOString()
      }).eq('room_id', room.id);
    }
  };

  const togglePause = async () => {
    if (gameState.is_paused) {
      // Shifting turn_started_at forward by the time we were paused
      const elapsedMs = (room.turn_duration - displayTime) * 1000;
      const newStartedAt = new Date(Date.now() - elapsedMs).toISOString();
      await supabase.from('game_state').update({ is_paused: false, turn_started_at: newStartedAt }).eq('room_id', room.id);
    } else {
      await supabase.from('game_state').update({ is_paused: true }).eq('room_id', room.id);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full pt-2 md:pt-40 animate-in zoom-in-95 duration-500 min-h-[70vh]">
      <div className="text-center space-y-2 px-4">
        <h3 className="text-whapigen-cyan font-jetbrains tracking-[0.3em] text-xs md:text-sm uppercase">
          {currentPlayer?.id === studentData?.playerId ? (
            <span key="your-turn" className="animate-pulse shadow-neon-pulse-cyan px-4 py-1 rounded-full border border-whapigen-cyan/30">YOUR TURN TO OPERATE</span>
          ) : (
            <span key="waiting-for" className="text-white/70">{`WAITING FOR ${currentPlayer?.nickname || '...'}`}</span>
          )}
        </h3>
        <h2 className={`text-4xl md:text-6xl font-sora font-bold text-white uppercase transition-all duration-500 flex items-center justify-center gap-4 ${currentPlayer?.id === studentData?.playerId ? 'border-neon-active p-8 rounded-[40px] bg-whapigen-cyan/5 scale-95' : 'drop-shadow-neon-cyan opacity-80'}`}>
          {currentPlayer?.id === studentData?.playerId ? <span key="arrow-left" className="arrow-indicator">{">>"}</span> : null}
          <span key="player-name">{currentPlayer?.nickname || 'UNKNOWN'}</span>
          {currentPlayer?.id === studentData?.playerId ? <span key="arrow-right" className="arrow-indicator">{"<<"}</span> : null}
        </h2>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Glow behind :Degradado radial nativo para evitar el corte cuadrado */}
        <div className="absolute -inset-24 bg-[radial-gradient(circle,rgba(0,240,255,0.25)_0%,transparent_60%)] pointer-events-none"></div>
        <svg className="absolute w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
          {/* Background Track */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="#222" strokeWidth="2" />
          {/* Animated Progress Track */}
          <circle
            ref={circleRef}
            cx="50" cy="50" r="45"
            fill="none"
            stroke={displayTime <= 5 ? '#ff003c' : '#00F0FF'}
            strokeWidth="4"
            strokeDasharray="283"
            strokeDashoffset="283"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${displayTime <= 5 ? '#ff003c' : '#00F0FF'})` }}
            className={displayTime <= 5 ? 'animate-pulse' : ''}
          />
        </svg>
        <div className={`relative z-10 text-6xl font-jetbrains font-extrabold text-white drop-shadow-md ${displayTime <= 5 ? 'text-[#ff003c] animate-pulse drop-shadow-neon-red' : ''}`}>
          {displayTime}
        </div>
      </div>

      {!isTeacher && gameState.current_turn_player_id === studentData?.playerId && (
        <button
          onClick={handleNextTurn}
          className="mt-8 px-12 py-4 rounded-full font-sora text-[12px] tracking-[0.4em] transition-all font-black uppercase bg-gradient-to-r from-whapigen-cyan to-blue-500 text-black shadow-[0_10px_30px_rgba(0,240,255,0.3)] hover:scale-105 active:scale-95"
        >
          Ready / End Turn
        </button>
      )}

      {isTeacher && (
        <div className="flex flex-col items-center gap-10 mt-8 w-full">
          <div className="flex gap-8">
            <button
              onClick={togglePause}
              className={`px-16 py-5 rounded-full font-sora text-[10px] tracking-[0.3em] font-black transition-all uppercase shadow-lg ${gameState.is_paused ? 'bg-gradient-to-r from-green-400 to-green-600 text-black shadow-[0_15px_40px_rgba(34,197,94,0.3)] hover:scale-105' : 'bg-white/5 border border-white/10 text-whapigen-cyan hover:bg-whapigen-cyan hover:text-black hover:shadow-neon-cyan/50'}`}
            >
              <span style={{ pointerEvents: 'none' }}>{gameState.is_paused ? 'Resume Mission' : 'Pause'}</span>
            </button>
            <button
              onClick={handleNextTurn}
              className="bg-whapigen-red/10 border border-whapigen-red/30 text-whapigen-red hover:bg-whapigen-red hover:text-white px-16 py-5 rounded-full font-sora text-[10px] tracking-[0.3em] font-black transition-all uppercase shadow-lg hover:shadow-neon-red/40"
            >
              Force Skip
            </button>
          </div>

          <div className="relative z-[1] pointer-events-auto flex flex-wrap gap-4 justify-center max-w-4xl px-12 animate-in fade-in border-t border-white/5 pt-16 w-full mt-8 mb-20">
            {[...players].filter((p: any) => !p.is_host).sort((a: any, b: any) => a.nickname.localeCompare(b.nickname)).map((p: any) => (
              <div key={p.id} className={`text-[10px] flex items-center gap-4 px-6 py-3 font-jetbrains rounded-full transition-all shadow-xl font-bold uppercase tracking-[0.2em] relative group/kick backdrop-blur-xl ${p.is_eliminated ? 'bg-black/20 text-white/10 grayscale opacity-40' : 'bg-white/5 border border-white/5 text-purple-400/80 hover:border-purple-500/30 hover:shadow-neon-pulse-violet'}`} style={{ transform: 'translateZ(0)' }}>
                <div className={`w-2 h-2 rounded-full ${p.is_eliminated ? 'bg-gray-800' : 'bg-purple-500 shadow-neon-pulse-violet'}`}></div>
                <span className={p.is_eliminated ? 'line-through' : ''}>{p.nickname}</span>
                {!p.is_eliminated && (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!p.id) { console.error('KICK ERROR: player id is undefined', p); return; }
                      console.log('🛑 KICK INTENT:', p.id);
                      await supabase.from('players').delete().eq('id', p.id);

                      // Send explicit broadcast to stop auto-rejoin
                      const ch = supabase.channel(`kick:${p.id}:${Date.now()}`);
                      ch.subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                          ch.send({ type: 'broadcast', event: 'KICK_ABS', payload: { target: p.id } })
                            .then(() => {
                              supabase.removeChannel(ch);
                              refreshPlayers(); // Update Admin UI immediately
                            });
                        }
                      });
                    }}
                    className="relative z-[9999] pointer-events-auto cursor-pointer text-whapigen-red/30 hover:text-whapigen-red hover:scale-125 transition-all ml-2 p-1 bg-white/5 rounded-full border border-white/5 shadow-neon-pulse-red"
                    title="Kick Player"
                  >
                    <X className="w-3.5 h-3.5" style={{ pointerEvents: 'none' }} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      )}
    </div>
  );
}

// ---------------- VOTING PHASE ----------------
function PhaseVoting({ isTeacher, roomId, players, gameState, room }: { isTeacher: boolean, roomId: string, players: any[], gameState: any, room: any }) {
  const { studentData } = useAuth();
  const { refreshPlayers, serverTimeOffset } = useGame();
  const [votes, setVotes] = useState<any[]>([]);
  const alivePlayers = players.filter((p: any) => !p.is_eliminated && !p.is_host);
  const currentUser = players.find((p: any) => p.id === studentData?.playerId);
  const isSpectator = currentUser?.is_eliminated;

  const circleRef = useRef(null);
  const tlRef = useRef<gsap.core.Tween | null>(null);

  // Jump-free Absolute Timer
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setTick] = useState(0);
  const pausedTimeRef = useRef(room.voting_duration);

  useEffect(() => {
    setVotes([]);

    const fetchVotes = async () => {
      const { data, error } = await supabase.from('votes').select('*').eq('room_id', roomId);
      if (error) console.error('❌ FETCH VOTES ERROR:', error);
      else {
        console.log('📥 FETCH VOTES DB (Current Length):', data?.length);
        setVotes(data || []);
      }
    };

    // Initial fetch with small delay to let DB settle after round transition
    const timer = setTimeout(fetchVotes, 300);

    let isSubscribed = false;
    const channel = supabase.channel(`votes_sync_${roomId}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        fetchVotes();
      });

    channel.subscribe((status, err) => {
      console.log('🔌 CANAL VOTES STATUS:', status, err || '');
      if (status === 'SUBSCRIBED') isSubscribed = true;
    });

    // Polling fallback mechanism
    const fetchVotesFallback = setInterval(() => {
      fetchVotes();
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(fetchVotesFallback);
      if (isSubscribed) supabase.removeChannel(channel);
    };
  }, [roomId]);

  let rawTimeLeftMs = room.voting_duration * 1000;
  if (gameState.turn_started_at) {
    const startedAt = new Date(gameState.turn_started_at).getTime();
    const nowWithOffset = Date.now() + (serverTimeOffset || 0);
    const elapsedMs = nowWithOffset - startedAt;
    rawTimeLeftMs = (room.voting_duration * 1000) - elapsedMs;
  }
  let actualTimeLeft = Math.max(0, Math.floor(rawTimeLeftMs / 1000));

  if (!gameState.is_paused) {
    pausedTimeRef.current = actualTimeLeft;
  }
  const displayTime = gameState.is_paused ? pausedTimeRef.current : actualTimeLeft;

  useEffect(() => {
    if (gameState.is_paused) return; // freeze visual tick
    const interval = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(interval);
  }, [gameState.is_paused]);

  // ── SMART VOTING LISTENER: fires calculateResults when all votes are cast
  // Dedicated useEffect so it's never blocked by the timer or is_paused state.
  useEffect(() => {
    if (isTeacher && votes.length > 0 && votes.length === alivePlayers.length) {
      console.log('[VOTING] All votes in — triggering calculateResults()');
      calculateResults();
    }
  }, [votes, alivePlayers, isTeacher]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer expiry fallback (in case someone never votes)
  useEffect(() => {
    if (actualTimeLeft <= 0 && isTeacher && !gameState.is_paused) {
      console.log('[VOTING] Timer expired — triggering calculateResults()');
      calculateResults();
    }
  }, [actualTimeLeft, isTeacher, gameState.is_paused]); // eslint-disable-line react-hooks/exhaustive-deps

  // GSAP logic
  useEffect(() => {
    if (!gameState.turn_started_at) return;

    tlRef.current = gsap.to(circleRef.current, {
      strokeDashoffset: 0,
      duration: room.voting_duration,
      ease: 'none',
      paused: gameState.is_paused
    });

    return () => {
      if (tlRef.current) tlRef.current.kill();
    };
  }, [gameState.turn_started_at]);

  // Handle Pause/Resume Sync — kill stale GSAP tween to prevent ghost timer
  useEffect(() => {
    if (!tlRef.current) return;
    if (gameState.is_paused) {
      tlRef.current.pause();
    } else {
      tlRef.current.kill();
      // Rebuild tween from current remaining time so the visual threshold (5s red) is accurate
      const startedAt = new Date(gameState.turn_started_at || Date.now()).getTime();
      const nowWithOffset = Date.now() + (serverTimeOffset || 0);
      const elapsedS = (nowWithOffset - startedAt) / 1000;
      const progress = Math.min(1, Math.max(0, elapsedS / room.voting_duration));
      const currentOffset = 283 - (283 * progress);
      gsap.set(circleRef.current, { strokeDashoffset: currentOffset });
      tlRef.current = gsap.to(circleRef.current, {
        strokeDashoffset: 0,
        duration: room.voting_duration * (currentOffset / 283),
        ease: 'none',
      });
    }
    return () => { if (tlRef.current) tlRef.current.kill(); };
  }, [gameState.is_paused]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePause = async () => {
    if (gameState.is_paused) {
      const elapsedMs = (room.voting_duration - displayTime) * 1000;
      const newStartedAt = new Date(Date.now() - elapsedMs).toISOString();
      await supabase.from('game_state').update({ is_paused: false, turn_started_at: newStartedAt }).eq('room_id', room.id);
    } else {
      await supabase.from('game_state').update({ is_paused: true }).eq('room_id', room.id);
    }
  };

  const hasVoted = votes.some(v => v.voter_id === studentData?.playerId);

  const handleVote = async (targetId: string) => {
    console.log('⚙️ FUNCIÓN EJECUTADA para:', targetId);
    if (isSpectator) {
      console.warn('⛔ VOTO BLOQUEADO: El usuario es espectador.');
      return;
    }
    if (!studentData?.playerId) {
      console.warn('Bloqueado por validación: studentData.playerId es undefined');
      return;
    }
    const { error } = await supabase.from('votes').upsert(
      { room_id: roomId, voter_id: studentData.playerId, target_id: targetId },
      { onConflict: 'room_id,voter_id' }
    );
    if (error) console.error('❌ ERROR al insertar voto:', error.message);
    else console.log('✅ VOTO REGISTRADO para:', targetId);
  };

  const calculateResults = async () => {
    if (gameState.phase === 'LOBBY' || players.filter((p: any) => !p.is_host).length < 3) {
      console.warn('⛔ calculateResults BLOQUEADO: Fase de Lobby activa o faltan jugadores.');
      return;
    }

    // --- CANDADO 1: Mínimo de 3 jugadores vivos ---
    // Si ya solo quedan 3, no permitimos eliminaciones para que el juego no se rompa.
    if (alivePlayers.length <= 3) {
      console.warn('⚠️ MÍNIMO ALCANZADO: Manteniendo 3 jugadores para estabilidad de la partida.');
      await processRoundEnd(null);
      return;
    }

    // Traemos los votos frescos de la DB
    const { data: liveVotes } = await supabase.from('votes').select('*').eq('room_id', roomId);

    // --- CANDADO 2: Si nadie votó, nadie muere ---
    // Eliminamos el "randomTarget" porque queremos justicia por votos.
    if (!liveVotes || liveVotes.length === 0) {
      console.log('🗳️ SIN VOTOS: Empate técnico por silencio.');
      await processRoundEnd(null);
      return;
    }

    // 1. Conteo de votos
    const targetCounts: Record<string, number> = {};
    liveVotes.forEach(v => {
      targetCounts[v.target_id] = (targetCounts[v.target_id] || 0) + 1;
    });

    // 2. Encontrar el máximo y ver cuántos lo comparten
    const maxVotes = Math.max(...Object.values(targetCounts), 0);
    const topCandidates = Object.keys(targetCounts).filter(id => targetCounts[id] === maxVotes);

    // --- CANDADO 3: Regla de Mayoría y Empate ---
    // Solo hay eliminado si hay EXACTAMENTE un candidato con el máximo de votos.
    // Si topCandidates.length > 1, significa que hay empate (ej: 2 votos para A, 2 para B).
    const eliminatedId = topCandidates.length === 1 ? topCandidates[0] : null;

    if (!eliminatedId && maxVotes > 0) {
      console.log('⚖️ EMPATE DETECTADO: Varios jugadores tienen', maxVotes, 'votos. Nadie sale.');
    }

    await processRoundEnd(eliminatedId);
  };

  // Separated: the actual elimination + round transition logic
  const processRoundEnd = async (eliminatedId: string | null) => {
    // TAREA 1: SOLO ese jugador sea marcado como is_eliminated
    if (eliminatedId) {
      await supabase.from('players').update({ is_eliminated: true }).eq('id', eliminatedId);
      refreshPlayers(); // TAREA 3: UI Sync Inmediata

      const eliminatedPlayer = alivePlayers.find((p: any) => p.id === eliminatedId);
      if (eliminatedPlayer?.role === 'IMPOSTOR') {
        const winners = alivePlayers.filter((p: any) => p.id !== eliminatedId);
        const updates = winners.map((p: any) => supabase.from('players').update({ score: (p.score || 0) + 10 }).eq('id', p.id));
        await Promise.all(updates);
      } else if (eliminatedPlayer) {
        // Native killed -> Impostor +2 pts
        const impostor = players.find((p: any) => p.role === 'IMPOSTOR');
        if (impostor) {
          await supabase.from('players').update({ score: (impostor.score || 0) + 2 }).eq('id', impostor.id);
        }
      }
    }

    // TAREA 2: Lógica de Victoria (Delegada a global o manejada acá si sobrevive)
    const newAlive = eliminatedId ? alivePlayers.filter((p: any) => p.id !== eliminatedId) : alivePlayers;

    const impostorsAlive = newAlive.filter((p: any) => p.role === 'IMPOSTOR').length;
    const nativesAlive = newAlive.length - impostorsAlive;

    if (impostorsAlive === 0) {
      // Ganan Nativos
      await supabase.from('game_state').update({ phase: 'RESULTS' }).eq('room_id', roomId);
    } else if (nativesAlive <= impostorsAlive) {
      // Ganan Impostores por superioridad
      console.warn('📝 DB WRITE - Cambiando game_state:', { nuevaFase: 'RESULTS', disparadoPor: 'processRoundEnd (Superioridad)' });
      await supabase.from('game_state').update({ phase: 'RESULTS' }).eq('room_id', roomId);
    } else if (gameState.current_round >= gameState.max_rounds) {
      // Ganan Impostores por supervivencia
      console.warn('📝 DB WRITE - Cambiando game_state:', { nuevaFase: 'RESULTS', disparadoPor: 'processRoundEnd (Supervivencia)' });
      await supabase.from('game_state').update({ phase: 'RESULTS' }).eq('room_id', roomId);
    } else {
      // Standby Intermedio (Nadie gana aún, a la siguiente ronda)
      await supabase.from('votes').delete().eq('room_id', roomId);
      console.warn('📝 DB WRITE - Cambiando game_state:', { nuevaFase: 'ROUND_STANDBY', disparadoPor: 'processRoundEnd' });
      await supabase.from('game_state').update({ phase: 'ROUND_STANDBY' }).eq('room_id', roomId);
    }
  };

  return (
    <div className="w-full max-w-4xl text-center flex flex-col items-center gap-8 pt-8 md:pt-0 animate-in slide-in-from-bottom-8 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-center gap-20 w-full bg-black/40 backdrop-blur-xl p-20 rounded-[40px] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.4)] animate-pulse-slow shadow-neon-pulse-violet">
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
            <circle
              ref={circleRef}
              cx="50" cy="50" r="46"
              fill="none"
              stroke={displayTime <= 5 ? '#ff003c' : '#a855f7'}
              strokeWidth="8"
              strokeDasharray="289"
              strokeDashoffset="289"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 20px ${displayTime <= 5 ? '#ff003c' : '#9333ea'})` }}
              className={displayTime <= 5 ? 'animate-pulse' : ''}
            />
          </svg>
          <div className={`relative z-10 text-6xl font-jetbrains font-black text-white ${displayTime <= 5 ? 'text-[#ff003c] animate-pulse drop-shadow-neon-red' : 'drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`}>
            {displayTime}
          </div>
        </div>

        <div className="space-y-6 text-left max-w-lg">
          <div className="flex items-center gap-4 md:pt-20 text-purple-500 drop-shadow-neon-violet animate-pulse mb-2">
            <Crosshair className="w-10 h-10" />
            <span className="font-jetbrains text-xs tracking-[0.8em] font-black uppercase ml-2">It's time to vote!</span>
          </div>
          <h2 className="text-6xl font-black font-sora text-white uppercase tracking-tighter leading-none mb-4">Eliminate <br /><span className="bg-gradient-to-r from-whapigen-cyan to-purple-400 bg-clip-text text-transparent">The Impostor</span></h2>
          <p className="text-white/70 font-jetbrains text-xs tracking-[0.4em] font-black uppercase leading-relaxed max-w-sm">
            {isTeacher ? 'Monitoring mission consensus signals...' : isSpectator ? 'SPECTATOR MODE // Awaiting next mission' : (hasVoted ? 'Action Secured. Awaiting mission verdict' : 'think of a suspected impostor and cast your veredict')}
          </p>
          {isTeacher && (
            <button
              onClick={togglePause}
              className={`mt-10 px-12 py-5 rounded-full font-sora text-[10px] tracking-[0.4em] transition-all font-black uppercase shadow-2xl overflow-x-hidden relative group/pause ${gameState.is_paused ? 'bg-gradient-to-r from-green-400 to-green-600 text-black shadow-[0_20px_50px_rgba(34,197,94,0.3)]' : 'bg-white/5 border border-white/10 text-whapigen-cyan hover:bg-whapigen-cyan hover:text-black hover:shadow-neon-cyan/50'}`}
            >
              <span style={{ pointerEvents: 'none' }}>{gameState.is_paused ? 'Resume Voting' : 'Pause Protocol'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full px-4">
        {[...alivePlayers].sort((a: any, b: any) => a.nickname.localeCompare(b.nickname)).map((p: any) => {
          const voteCount = votes.filter(v => v.target_id === p.id).length;
          const isMe = p.id === studentData?.playerId;

          return (
            <div
              key={p.id}
              className={`px-6 py-4 bg-black/40 backdrop-blur-xl border transition-all duration-700 flex flex-col items-center justify-between rounded-[30px] shadow-2xl relative overflow-x-hidden group/card animate-pulse-slow ${voteCount > 0 ? 'border-whapigen-red shadow-[0_0_80px_rgba(255,49,49,0.15)] bg-whapigen-red/5' : 'border-white/5 hover:border-whapigen-cyan/30'}`}
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-whapigen-cyan to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className="w-12 h-12 rounded-2xl mb-2 bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner group-hover/card:scale-110 transition-transform duration-500">
                  <Users className="w-6 h-6 text-whapigen-cyan/20 group-hover/card:text-whapigen-cyan transition-colors" />
                </div>
                <p className="text-white font-sora tracking-tighter font-black uppercase text-2xl group-hover/card:text-whapigen-cyan transition-colors">{p.nickname}</p>
                {isTeacher && (
                  <div className="flex flex-col items-center gap-4 mt-4 w-full">
                    <span className="text-white font-black font-jetbrains text-xs tracking-[0.5em] uppercase px-6 py-2 rounded-full border border-white/5 bg-white/5">
                      Votes: {voteCount}
                    </span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        console.log('🛑 DOM CLICK DETECTADO en jugador:', p.id);
                        await supabase.from('players').delete().eq('id', p.id);
                        const ch = supabase.channel(`kick:${p.id}:${Date.now()}`);
                        ch.subscribe((status) => {
                          if (status === 'SUBSCRIBED') {
                            ch.send({ type: 'broadcast', event: 'KICK_ABS', payload: { target: p.id } })
                              .then(() => {
                                supabase.removeChannel(ch);
                                refreshPlayers(); // Update Admin UI immediately
                              });
                          }
                        });
                      }}
                      className="relative z-[9999] pointer-events-auto text-whapigen-red/70 hover:text-white transition-all bg-white/5 hover:bg-whapigen-red border border-white/10 hover:border-whapigen-red px-6 py-2 rounded-full text-[9px] font-black tracking-[0.4em] w-full uppercase"
                    >
                      Kick System
                    </button>
                  </div>
                )}
              </div>

              {!isTeacher && !isMe && !isSpectator && (
                <div className="w-full mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🛑 DOM CLICK DETECTADO en jugador:', p.id);
                      handleVote(p.id);
                    }}
                    disabled={hasVoted}
                    className={`relative z-50 pointer-events-auto w-full font-sora text-[11px] tracking-[0.4em] py-5 rounded-3xl transition-all font-black uppercase shadow-[0_8px_0_#4c1d95] ${hasVoted ? 'bg-white/5 text-white/10 border border-white/5 translate-y-2 shadow-none cursor-default' : 'bg-gradient-to-br from-purple-600 to-purple-800 text-white border-t border-purple-400/30 hover:-translate-y-1 hover:shadow-neon-pulse-violet active:translate-y-2 active:shadow-none'}`}
                    style={{ transform: 'translateZ(0)' }}
                  >
                    <span style={{ pointerEvents: 'none' }}>{hasVoted ? 'Voted' : 'VOTE'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isTeacher && (
        <div className="flex flex-col items-center mt-8 space-y-4">
          {votes.length < alivePlayers.length ? (
            <div className="text-white/70 font-jetbrains text-xs tracking-[0.6em] animate-pulse border border-white/5 p-6 rounded-full bg-white/5 uppercase font-black backdrop-blur-xl px-12 shadow-inner">
              Consensus in Progress: {votes.length}/{alivePlayers.length}
            </div>
          ) : (
            <button
              onClick={calculateResults}
              className="h-20 px-24 bg-gradient-to-r from-whapigen-cyan to-purple-600 text-black hover:scale-105 active:scale-95 font-sora font-black tracking-[0.4em] uppercase rounded-full transition-all shadow-[0_20px_60px_rgba(0,240,255,0.2)] hover:shadow-neon-cyan/50 ring-2 ring-white/10"
            >
              Authorize Verdict
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- RESULTS PHASE ----------------
function PhaseResults({ isTeacher, roomId, players }: { isTeacher: boolean, roomId: string, players: any[] }) {
  const { gameState } = useGame();
  // Check if Natives or Impostor won
  const impostor = players.find((p: any) => p.role === 'IMPOSTOR');
  const aliveNatives = players.filter((p: any) => p.role !== 'IMPOSTOR' && !p.is_eliminated && !p.is_host);

  const impostorWon = aliveNatives.length <= 1;

  return (
    <div className="w-full max-w-2xl text-center space-y-12 pt-8 md:pt-48 animate-in zoom-in-50 duration-700 min-h-screen">
      <div className="space-y-6 flex flex-col items-center">
        <p className="font-jetbrains text-xs tracking-[0.4em] text-white/70 mb-2">ROUNDS PLAYED: {gameState?.current_round ?? 0}</p>
        <h3 className="text-whapigen-cyan font-jetbrains tracking-[0.3em] text-sm uppercase">MISSION CONCLUDED</h3>
        <h2 className={`text-6xl font-sora font-black uppercase tracking-tighter drop-shadow-md ${impostorWon ? 'text-whapigen-red drop-shadow-neon-red' : 'text-whapigen-green drop-shadow-neon-green'}`}>
          {impostorWon ? 'IMPOSTOR WINS' : 'PLAYERS WINS'}
        </h2>
        <p className="text-white/70 font-jetbrains text-lg tracking-[0.4em] uppercase pt-4 opacity-70">
          The Impostor was {impostor?.nickname}
        </p>
      </div>

      {/* Scoreboard */}
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-16 mt-8 md:mt-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)] w-full max-w-2xl transform hover:scale-[1.02] transition-transform duration-700 shadow-neon-pulse-cyan">
        <h3 className="text-white font-black font-jetbrains tracking-[0.8em] text-lg mb-3 md:mb-3 border-b border-white/5 pb-6 uppercase ml-[0.8em] text-center">Scoreboard</h3>
        <div className="flex flex-col gap-2">
          {[...players].filter((p: any) => !p.is_host).sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).map((p: any) => (
            <div key={p.id} className="flex justify-between items-center bg-white/[0.03] p-6 rounded-[30px] border border-white/5 transition-all hover:bg-white/[0.06] hover:border-whapigen-cyan/20 group/row group relative overflow-x-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-whapigen-cyan/5 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-2 md:gap-6 relative z-10">
                <div className={`w-3 h-3 rounded-full ${p.is_eliminated ? 'bg-gray-800' : 'bg-whapigen-cyan shadow-neon-cyan'}`}></div>
                <span className={`font-sora tracking-tighter text-xl uppercase ${p.is_eliminated ? 'text-white/20 line-through' : 'text-white font-black'}`}>{p.nickname}</span>
              </div>
              <div className="relative z-10">
                <span className="font-jetbrains font-black text-white text-[12px] md:text-[18px] tracking-widest px-5 py-2 bg-white/5 rounded-full border border-white/5 group-hover/row:bg-whapigen-cyan group-hover/row:text-black transition-all group-hover/row:scale-110">
                  {p.score || 0} PTS
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isTeacher && (
        <button
          onClick={async () => {
            console.warn('📝 DB WRITE - Cambiando game_state:', { nuevaFase: 'LOBBY', disparadoPor: 'Reset Protocol' });
            await supabase.from('players').update({ is_eliminated: false, turn_order: null }).eq('room_id', roomId);
            await supabase.from('game_state').update({ phase: 'LOBBY', current_turn_index: 0 }).eq('room_id', roomId);
          }}
          className="px-24 py-6 bg-gradient-to-r from-whapigen-cyan to-purple-600 text-black hover:scale-105 active:scale-95 font-sora font-black tracking-[0.5em] uppercase rounded-full transition-all shadow-2xl mt-12 ring-2 ring-white/10"
        >
          RESET GAME
        </button>
      )}
    </div>
  );
}

// ---------------- ROUND STANDBY PHASE ----------------
function PhaseStandby({ isTeacher, roomId, players, gameState }: { isTeacher: boolean, roomId: string, players: any[], gameState: any }) {
  const startNextRound = async () => {
    const alivePlayers = players
      .filter(p => !p.is_eliminated && !p.is_host)
      .sort((a, b) => (a.turn_order || 0) - (b.turn_order || 0));

    if (alivePlayers.length === 0) return;

    const firstPlayer = alivePlayers[0];

    console.warn('📝 DB WRITE - Cambiando game_state:', { nuevaFase: 'SPEAKING_TURNS', disparadoPor: 'PhaseStandby (Siguiente Ronda)' });
    await supabase.from('game_state').update({
      phase: 'SPEAKING_TURNS',
      current_round: gameState.current_round + 1,
      current_turn_index: firstPlayer.turn_order || 0,
      current_turn_player_id: firstPlayer.id,
      turn_started_at: new Date().toISOString()
    }).eq('room_id', roomId);
  };

  return (
    <div className="w-full max-w-2xl text-center space-y-12 md:mt-48 pt-8 md:pt-0 animate-in zoom-in-50 duration-700 min-h-screen">
      <div className="space-y-4">
        <h3 className="text-whapigen-cyan font-jetbrains tracking-[0.3em] text-sm uppercase">ROUND {gameState.current_round} CONCLUDED</h3>
        <h2 className="text-4xl md:text-5xl font-sora font-black uppercase tracking-tighter drop-shadow-md text-white">
          AWAITING COORDINATOR
        </h2>
        <p className="text-white/70 font-jetbrains text-xs tracking-[0.4em] uppercase pt-4">
          Calculating next operational sequence...
        </p>
      </div>

      {isTeacher && (
        <button
          onClick={startNextRound}
          className="mt-12 w-full max-w-md mx-auto h-20 bg-gradient-to-r from-whapigen-cyan to-purple-600 hover:from-white hover:to-white text-black font-sora font-black tracking-[0.4em] transition-all rounded-full uppercase shadow-[0_15px_60px_rgba(0,240,255,0.3)] hover:shadow-neon-cyan/50 hover:-translate-y-1 active:translate-y-0"
        >
          INITIALIZE NEXT ROUND
        </button>
      )}
    </div>
  );
}

// ---------------- PERSISTENT WORD HELPER ----------------
function PersistentWordBar({ role, secretWord, hintsEnabled, hints, phaseStartedAt }: {
  role?: string;
  secretWord: string | null;
  hintsEnabled?: boolean;
  hints?: [string, string] | null;
  phaseStartedAt?: string | null;
}) {
  const [revealed, setRevealed] = useState(false);
  const [canReceiveIntel, setCanReceiveIntel] = useState(false);
  const [intelRevealed, setIntelRevealed] = useState(false);

  // ── IMPOSTOR HINT TIMER: unlock "RECEIVE INTEL" button after 10 seconds ──
  useEffect(() => {
    if (role !== 'IMPOSTOR' || !hintsEnabled || !hints || !phaseStartedAt) {
      setCanReceiveIntel(false);
      setIntelRevealed(false);
      return;
    }

    const startedAt = new Date(phaseStartedAt).getTime();
    const elapsed = Date.now() - startedAt;
    const remainingMs = Math.max(0, 10_000 - elapsed);

    if (elapsed >= 10_000) {
      setCanReceiveIntel(true);
      return;
    }

    const timer = setTimeout(() => setCanReceiveIntel(true), remainingMs);
    return () => clearTimeout(timer);
  }, [role, hintsEnabled, hints, phaseStartedAt]);

  return (
    <div
      className="relative md:fixed md:top-[153px] md:left-1/2 md:-translate-x-1/2 z-[80] bg-black/60 backdrop-blur-xl border border-white/5 text-whapigen-cyan font-jetbrains px-8 md:px-12 py-3 md:py-5 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.5)] cursor-pointer select-none max-w-[85vw] mx-auto md:mx-0 transition-all hover:bg-white/5 group/word ring-1 ring-white/10 mt-4"
      onClick={() => setRevealed(prev => !prev)}
    >
      <div className="absolute inset-0 bg-digital-grid bg-[length:20px_20px] opacity-[0.01] pointer-events-none"></div>
      {!revealed ? (
        <div className="flex items-center gap-4 font-black tracking-[0.3em] text-[10px] ml-[0.3em] group-hover/word:text-whapigen-cyan transition-colors">
          <EyeOff className="w-4 h-4 text-white/20 group-hover/word:text-whapigen-cyan transition-all" />
          <span className="text-white/70 font-sora text-sm md:text-xs uppercase group-hover/word:text-white transition-colors animate-pulse">TOUCH TO REVEAL</span>
        </div>
      ) : (
        role === 'IMPOSTOR' ? (
          <div className="flex flex-col items-center gap-3 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-2 md:gap-4 tracking-[0.2em] md:tracking-[0.4em] font-black text-[9px] md:text-[11px] w-max max-w-[80vw] md:max-w-none bg-whapigen-red/10 px-4 md:px-8 py-1 rounded-full border border-whapigen-red/20 whitespace-normal text-center">
              <EyeOff className="w-4 h-4 md:w-4 md:h-4 shrink-0 text-whapigen-red shadow-neon-red shadow-[0_0_15px_#ff3131]" />
              <span className="text-whapigen-red shadow-neon-red">YOU ARE THE IMPOSTOR</span>
            </div>
            {/* ── IMPOSTOR HINT: "RECEIVE INTEL" toggle appears after 10s ── */}
            {canReceiveIntel && hints && (
              <button
                onClick={(e) => { e.stopPropagation(); setIntelRevealed(prev => !prev); }}
                className={`flex items-center gap-2 tracking-[0.2em] text-[9px] font-bold px-6 py-2 rounded-full border transition-all cursor-pointer hover:scale-105 animate-in fade-in slide-in-from-bottom duration-700 ${intelRevealed
                  ? 'text-purple-300 bg-purple-600/30 border-purple-500/50 shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                  : 'text-purple-400 bg-purple-600/20 hover:bg-purple-600/40 border-purple-500/30 hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                  }`}
              >
                <Crosshair className="w-3 h-3" />
                <span key={intelRevealed ? 'hide-intel' : 'receive-intel'}>{intelRevealed ? 'HIDE HINT' : 'HINT'}</span>
              </button>
            )}
            {intelRevealed && hints && (
              <div className="flex items-center gap-4 tracking-[0.2em] text-[9px] md:text-[11px] font-bold text-purple-400/90 bg-purple-600/10 px-6 py-1.5 rounded-full border border-purple-500/20 animate-in fade-in slide-in-from-bottom duration-700">
                <span className="text-purple-500/50">HINT:</span>
                <span>{hints[0]}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-2 tracking-[0.2em] md:tracking-[0.2em] text-[9px] md:text-[11px] w-max max-w-[80vw] md:max-w-none bg-whapigen-cyan/10 px-4 py-1 rounded-full border border-whapigen-cyan/20 whitespace-normal text-center">
            <Target className="w-4 h-4 text-whapigen-cyan shadow-neon-cyan" />
            <span className="text-white/70 text-sm">SECRET WORD:</span>
            <span className="font-black text-white uppercase drop-shadow-neon-cyan tracking-[0.4em] break-words flex items-center justify-center min-w-0 text-center" style={{ fontSize: 'clamp(0.85rem, 3.5vw, 1.5rem)' }}>
              {secretWord}
            </span>
          </div>
        )
      )}
    </div>
  );
}


