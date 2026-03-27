import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type GamePhase = 'LOBBY' | 'ROLE_REVEAL' | 'SPEAKING_TURNS' | 'VOTING' | 'ROUND_STANDBY' | 'RESULTS';

interface Player {
  id: string;
  nickname: string;
  room_id: string;
  role: 'IMPOSTOR' | 'NATIVE';
  is_host: boolean;
  turn_order?: number;
  is_eliminated?: boolean;
  score?: number;
  last_seen?: string;
  created_at: string;
}

interface GameState {
  id: string;
  room_id: string;
  phase: GamePhase;
  current_turn_player_id: string | null;
  current_turn_index: number;
  secret_word: string | null;
  turn_started_at: string | null;
  is_paused: boolean;
  current_round: number;
  max_rounds: number;
  created_at: string;
}

export interface Room {
  id: string;
  code: string;
  status: 'LOBBY' | 'ROLE_REVEAL' | 'SPEAKING_TURNS' | 'VOTING' | 'ROUND_STANDBY' | 'RESULTS';
  host_id: string;
  turn_duration: number;
  voting_duration: number;
  level: string;
  hints_enabled?: boolean;
}

interface GameContextType {
  room: Room | null;
  players: Player[];
  gameState: GameState | null;
  loading: boolean;
  joinRoom: (code: string, nickname: string) => Promise<'success' | 'duplicate' | 'error' | 'spectator' | 'full'>;
  setActiveRoomId: (id: string | null) => void;
  refreshPlayers: () => Promise<void>;
}

const GameContext = createContext<GameContextType>({
  room: null,
  players: [],
  gameState: null,
  loading: true,
  joinRoom: async () => 'error',
  setActiveRoomId: () => {},
  refreshPlayers: async () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, studentData, setStudentData } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  // ── STABLE REFS: capture studentData and userId at channel-setup time so the
  //    main useEffect does NOT need them in its dependency array, avoiding
  //    the channel teardown/rebuild loop that was causing lobby instability.
  const studentDataRef = useRef(studentData);
  useEffect(() => { studentDataRef.current = studentData; }, [studentData]);

  const userIdRef = useRef(user?.id);
  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);

  const joinRoom = async (code: string, nickname: string) => {
    // 1. Find Room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single();

    if (roomError || !roomData) return 'error';

    // 1.5 Stale-row check: if a matching nickname exists, check its age.
    // Ghost rows (>30s old) from kicked/disconnected players are deleted.
    // Fresh rows (<30s old) indicate an active player; reject with 'duplicate'.
    const { data: dupCheck } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomData.id)
      .ilike('nickname', nickname)
      .maybeSingle();

    if (dupCheck) {
      const createdAt = new Date(dupCheck.created_at).getTime();
      const ageSeconds = (Date.now() - createdAt) / 1000;
      if (ageSeconds < 30) return 'duplicate';
      await supabase.from('players').delete().eq('id', dupCheck.id);
    }

    // 1.8 Check Mid-Game Intrusion
    const { data: stateData } = await supabase.from('game_state').select('phase').eq('room_id', roomData.id).maybeSingle();
    const isMidGame = stateData && stateData.phase !== 'LOBBY';

    // 1.9 Check Room Capacity (Limit: 16 students)
    const { count, error: countError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomData.id)
      .eq('is_host', false);

    if (countError) return 'error';
    if (count !== null && count >= 16) return 'full';

    // 2. Add Player
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .insert([{ room_id: roomData.id, nickname, is_host: false, is_eliminated: !!isMidGame }])
      .select()
      .single();

    if (playerError || !playerData) return 'error';

    // 3. Set Auth (also writes to sessionStorage via setStudentData)
    setStudentData({ nickname, roomId: roomData.id, playerId: playerData.id });
    setActiveRoomId(roomData.id);

    return isMidGame ? 'spectator' : 'success';
  };

  // Restore activeRoomId from studentData if missing (e.g. page refresh)
  useEffect(() => {
    if (studentData?.roomId && !activeRoomId) {
      setActiveRoomId(studentData.roomId);
    }
  }, [studentData, activeRoomId]);

  const refreshPlayers = async () => {
    if (!activeRoomId) return;
    const { data } = await supabase.from('players').select('*').eq('room_id', activeRoomId);
    if (data) setPlayers(data);
  };

  useEffect(() => {
    if (!activeRoomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const roomId = activeRoomId;
    let channel: ReturnType<typeof supabase.channel>;
    // FIX 4: Track subscription state to prevent WebSocket closure errors.
    // Only call removeChannel during cleanup if the channel actually opened.
    let channelSubscribed = false;

    // ── Declare presence vars at top of effect so DELETE closure can reference them ──
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;
    let presenceCleanupInterval: number | null = null;
    let keepAliveInterval: number | null = null;
    let fallbackInterval: number | null = null;

    const setupRoom = async () => {
      const [roomRes, playersRes] = await Promise.all([
        supabase.from('rooms').select('*').eq('id', roomId).maybeSingle(),
        supabase.from('players').select('*').eq('room_id', roomId),
      ]);

      if (!roomRes.data) {
        if (userIdRef.current) {
          console.warn('🚨 SALA INEXISTENTE - Retornando Admin al Dashboard');
          window.location.href = '/admin/dashboard';
        } else {
          console.warn('🚨 SALA INEXISTENTE - Expulsando a /join');
          sessionStorage.clear();
          window.location.href = '/join';
        }
        return;
      }
      setRoom(roomRes.data);
      if (playersRes.data) setPlayers(playersRes.data);

      // Fetch Game State (with polling fallback for cold-start)
      const fetchState = async () => {
        const stateRes = await supabase.from('game_state').select('*').eq('room_id', roomId);
        if (stateRes.data && stateRes.data.length > 0) {
          setGameState(stateRes.data[0]);
          setLoading(false);
          return true;
        }
        return false;
      };

      const found = await fetchState();
      if (!found) {
        const interval = setInterval(async () => {
          const success = await fetchState();
          if (success) clearInterval(interval);
        }, 1000);
      }

      // Polling fallback mechanism for Supabase Realtime failures
      fallbackInterval = window.setInterval(async () => {
        const stateRes = await supabase.from('game_state').select('*').eq('room_id', roomId).maybeSingle();
        if (stateRes.data) setGameState(stateRes.data);

        const playersRes = await supabase.from('players').select('*').eq('room_id', roomId);
        if (playersRes.data) setPlayers(playersRes.data);
      }, 5000);

      // ── MAIN REALTIME CHANNEL ────────────────────────────────────────────
      channel = supabase.channel(`room:${roomId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state', filter: `room_id=eq.${roomId}` }, (payload) => {
          const newState = payload.new as GameState;
          if (newState && newState.phase) {
            console.log('🔄 REALTIME - Estado recibido de DB:', newState.phase);
            setGameState(newState);
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, async () => {
          const { data } = await supabase.from('players').select('*').eq('room_id', roomId);
          if (data) setPlayers(data);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, async () => {
          const { data } = await supabase.from('players').select('*').eq('room_id', roomId);
          if (data) setPlayers(data);
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, async (payload) => {
          const sd = studentDataRef.current;
          const deletedId = (payload.old as any)?.id;

          // ── KICK CHECK: if this student was explicitly kicked, clear session and do NOT rejoin ──
          // The kick-channel broadcast sets sessionStorage key 'impostor_kicked' before the DELETE.
          // We use this as a definitive signal to skip the auto-rejoin path.
          const wasKicked = sessionStorage.getItem('impostor_kicked') === deletedId;

          if (deletedId && sd?.playerId === deletedId && sd?.roomId === roomId) {
            if (wasKicked) {
              console.log('AUTO-REJOIN: Explicit KICK detected — skipping rejoin, clearing session.');
              sessionStorage.clear();
              // Navigation handled by kick-channel broadcast handler in PlayRoom
            } else {
              console.log('AUTO-REJOIN: Self-deletion detected (involuntary). Re-inserting...');
              // Small delay to let any inflight KICK_ABS arrive first
              await new Promise(r => setTimeout(r, 600));
              if (sessionStorage.getItem('impostor_student_auth')) {
                const { data: reinserted } = await supabase
                  .from('players')
                  .insert([{ id: deletedId, room_id: roomId, nickname: sd.nickname, is_host: false }])
                  .select().single();
                if (reinserted) {
                  console.log('AUTO-REJOIN: Success.');
                  if (presenceChannel) await presenceChannel.track({ player_id: deletedId, ts: Date.now() });
                  const { data } = await supabase.from('players').select('*').eq('room_id', roomId);
                  if (data) setPlayers(data);
                  return;
                }
              }
            }
          }

          // Always re-fetch after any DELETE so all clients get accurate count immediately
          const { data } = await supabase.from('players').select('*').eq('room_id', roomId);
          if (data) setPlayers(data);

          // ── HARD ABORT: now handled exclusively by the single-shot watcher in PlayRoom.tsx ──
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
          if (payload.eventType === 'DELETE') {
             if (userIdRef.current) {
                console.warn('🚨 SALA ELIMINADA - Retornando Admin al Dashboard');
                window.location.href = '/admin/dashboard';
             } else {
                console.warn('🚨 SALA ELIMINADA POR ADMIN - Expulsando a /join');
                sessionStorage.clear();
                window.location.href = '/join';
             }
          } else {
             setRoom(payload.new as Room);
          }
        });

      // ── PRESENCE: HOST COORDINATOR (PASSIVE — NO AUTO-DELETE) ────────────
      // The host tracks who is online for UI purposes ONLY.
      // Players are NEVER deleted automatically. Only explicit Admin Kick does DELETE.
      if (userIdRef.current === roomRes.data?.host_id) {
        presenceChannel = supabase.channel(`presence_sync:${roomId}`);

        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            // Passive: just log sync state. No deletes.
            const state = presenceChannel!.presenceState();
            console.log('PRESENCE: sync — online count:', Object.keys(state).length);
          })
          .on('presence', { event: 'join' }, ({ newPresences }: any) => {
            console.log('PRESENCE: join —', newPresences.map((p: any) => p.player_id));
          })
          .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
            // Log only — NEVER delete. Admin must kick manually.
            console.log('PRESENCE: leave (no action) —', leftPresences.map((p: any) => p.player_id));
          })
          .subscribe();

      // ── PRESENCE: STUDENT ────────────────────────────────────────────────
      } else if (studentDataRef.current?.playerId) {
        // Students emit presence every 10 seconds (keep-alive) so the host
        // never sees them as "idle" and fires false 'leave' events.
        presenceChannel = supabase.channel(`presence_sync:${roomId}`);

        presenceChannel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const pid = studentDataRef.current!.playerId;
            await presenceChannel!.track({ player_id: pid, ts: Date.now() });

            keepAliveInterval = window.setInterval(async () => {
              if (presenceChannel) {
                try {
                  await presenceChannel.track({ player_id: pid, ts: Date.now() });
                } catch (e) {
                  console.warn('KEEP-ALIVE: track() failed.');
                }
              }
            }, 10_000);
          }
        });
      }

      // Subscribe main channel and do an immediate re-fetch on success
      // FIX 4: Set channelSubscribed = true only once SUBSCRIBED to guard cleanup.
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelSubscribed = true;
          supabase.from('players').select('*').eq('room_id', roomId).then(({ data }) => {
            if (data) setPlayers(data);
          });
        }
      });
    };

    setupRoom();

    return () => {
      if (presenceCleanupInterval) window.clearInterval(presenceCleanupInterval);
      if (keepAliveInterval) window.clearInterval(keepAliveInterval);
      if (fallbackInterval) window.clearInterval(fallbackInterval);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
      // FIX 4: Only remove the main channel if it successfully opened.
      // Calling removeChannel on an un-SUBSCRIBED channel causes
      // "WebSocket is closed before connection" errors during rapid re-renders.
      if (channel && channelSubscribed) supabase.removeChannel(channel);
    };
  // ── studentData is intentionally NOT in deps — it's read via studentDataRef
  //    to avoid rebuilding channels (and wiping player state) on auth updates. ──
  }, [activeRoomId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GameContext.Provider value={{ room, players, gameState, loading, joinRoom, setActiveRoomId, refreshPlayers }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
