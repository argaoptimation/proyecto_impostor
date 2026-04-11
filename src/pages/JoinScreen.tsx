import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase'; // <--- DEJÁ SOLO ESTA
import { useGame } from '../contexts/GameContext';
import { GlitchLogo } from '../components/ui/GlitchLogo';
import { CyberRain } from '../components/ui/CyberRain';
import { RainToggle } from '../components/ui/RainToggle';

export default function JoinScreen() {
  const queryParams = new URLSearchParams(window.location.search);
  const initialCode = queryParams.get('code') || '';

  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState(initialCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // <-- LO VOLVEMOS A USAR
  const { joinRoom } = useGame(); // <-- TAMBIÉN LO NECESITAMOS

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const cleanNickname = nickname.trim().toUpperCase();
      const cleanRoomCode = roomCode.trim().toUpperCase();

      // 1. Buscamos la sala usando el nombre real de la columna: 'code'
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('code', cleanRoomCode)
        .single();

      if (roomError || !roomData) {
        console.error("Error de Supabase:", roomError);
        throw new Error('CÓDIGO DE SALA INVÁLIDO');
      }

      // 1.5. Consultamos el estado de la partida para saber si ya empezó
      const { data: stateData } = await supabase
        .from('game_state')
        .select('phase')
        .eq('room_id', roomData.id)
        .single();

      const isGameInProgress = stateData?.phase !== 'LOBBY';

      // 2. RESTRICCIÓN: Límite de 16 jugadores
      const { count, error: countError } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomData.id)
        .eq('is_host', false);

      if (countError) throw countError;
      if (count !== null && count >= 16) throw new Error('LA SALA ESTÁ LLENA (16/16)');

      // 3. CANDADO ANTI-CLONES
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('room_id', roomData.id)
        .eq('nickname', cleanNickname)
        .maybeSingle();

      if (existingPlayer) {
        throw new Error('⚠️ DUPLICATE IDENTITY: PLAYER ALREADY IN THE ROOM');
      }

      console.log("🔍 DATOS ANTES DE INSERTAR JUGADOR:", {
        faseLeida: stateData?.phase,
        juegoEnCurso: isGameInProgress
      });

      // 4. Insertar Jugador (Asignando modo espectador si el juego ya empezó)
      const { error: joinError } = await supabase.from('players').insert({
        room_id: roomData.id,
        nickname: cleanNickname,
        is_host: false,
        is_spectator: isGameInProgress // <-- ACÁ APLICAMOS EL MODO
      });

      if (joinError) {
        // INTERCEPTAMOS EL ERROR FEO DE LA BASE DE DATOS
        if (joinError.message.includes('duplicate') || joinError.code === '23505') {
          // ACÁ PONEMOS EL MENSAJE LLAMATIVO 2 (El mismo para mantener coherencia)
          throw new Error('⚠️ DUPLICATE IDENTITY: PLAYER ALREADY IN THE ROOM');
        }
        // Si es otro tipo de error, lo dejamos pasar
        throw joinError;
      }

      if (joinError) throw joinError;

      // 5. Redirigir (CON EL AWAIT QUE FALTABA PARA EVITAR EL BUG DEL PARPADEO)
      await joinRoom(roomData.id, cleanNickname);
      navigate(`/game/${roomData.id}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center relative overflow-x-hidden bg-[#050505]">

      {/* NEW: Cyber-Rain Background */}
      <CyberRain />
      <RainToggle />



      {/* Background Cyberpunk Elements */}

      <div className="absolute inset-0 bg-digital-grid bg-[length:40px_40px] opacity-[0.02] pointer-events-none"></div>
      <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-[0.05]"></div>

      {/* Whapigen Target Branding */}
      <div className="mb-10 text-center relative z-10 w-full max-w-md pt-4 flex flex-col items-center">

        {/* New Reusable Glitch Logo */}
        <GlitchLogo size="md" className="mb-1" />

        <h1 className="text-3xl md:text-6xl font-sora font-black tracking-tighter text-white drop-shadow-md uppercase mt-2 md:mt-4 group transition-all duration-300 px-12 overflow-visible w-full inline-block">
          THE <span className="text-vivid-gradient italic inline-block pr-4">IMPOSTOR</span>
        </h1>
        <div className="mt-2 flex items-center justify-center gap-5">
          <div className="h-[2px] w-20 bg-gradient-to-r from-transparent to-whapigen-cyan"></div>
          <p className="text-whapigen-cyan font-jetbrains tracking-[0.6em] font-black text-[10px] uppercase">
            Speaking Edition
          </p>
          <div className="h-[2px] w-20 bg-gradient-to-l from-transparent to-purple-600"></div>
        </div>
      </div>

      {/* Main Join Panel - Organic High Contrast Card */}
      <div className="w-full max-w-md pt-2 pl-11 pr-11 pb-2 md:pl-20 md:pr-20 relative overflow-x-hidden group bg-black/90 shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 backdrop-blur-xl rounded-[40px] animate-in zoom-in-95 duration-700">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-600/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2 md:space-y-4">
            <label className="text-whapigen-cyan font-jetbrains text-xs tracking-wider uppercase font-bold drop-shadow-neon-cyan">
              NICKNAME
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.toUpperCase())}
              placeholder="ENTER NICKNAME"
              maxLength={12}
              className="w-full bg-[#0a0a0a] border border-purple-500/20 rounded-full py-2 md:py-3 px-6 text-lg text-whapigen-cyan font-jetbrains font-black focus:outline-none focus:border-purple-500 focus:shadow-neon-violet transition-all placeholder:text-whapigen-cyan/10 uppercase tracking-widest text-center"
              disabled={isSubmitting}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <div className="space-y-2 md:space-y-4">
            <label className="text-whapigen-cyan font-jetbrains text-xs tracking-wider uppercase font-bold drop-shadow-neon-cyan">
              Access Coordinate
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="0000"
              maxLength={4}
              className="w-full bg-[#0a0a0a] border border-purple-500/20 rounded-full py-2 text-center text-3xl tracking-[0.5em] text-whapigen-cyan font-jetbrains font-black focus:outline-none focus:border-purple-500 focus:shadow-neon-violet transition-all placeholder:text-whapigen-cyan/5"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-whapigen-red font-jetbrains text-xs bg-whapigen-red/10 p-3 clip-edges border-l-2 border-whapigen-red">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !nickname || roomCode.length !== 4}
            className="w-full relative group/btn h-14 bg-gradient-to-r from-purple-600 to-whapigen-cyan hover:from-white hover:to-white text-black font-sora tracking-[0.2em] font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-full mt-8 uppercase shadow-neon-cyan hover:shadow-neon-violet"
          >
            <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity rounded-full"></div>
            <span className="relative flex items-center justify-center gap-4 z-10 text-xs md:text-sm font-black">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  CONNECTING...
                </>
              ) : (
                <>
                  ENTER ROOM <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-3 transition-transform" />
                </>
              )}
            </span>

          </button>
        </form>
      </div>

      <div className="mt-1 md:mt-8 flex flex-col items-center gap-12 md:gap-40 relative z-10">
        <div className="flex items-center gap-3 text-[10px] font-jetbrains text-whapigen-green tracking-[0.4em] font-black uppercase bg-whapigen-green/5 px-6 py-2 rounded-full border border-whapigen-green/20">
          <span className="w-2 h-2 rounded-full bg-whapigen-green shadow-neon-green animate-pulse"></span>
          ACTIVE SYSTEM ACCESS
        </div>

        <p className="text-[10px] mb-2 text-center pt-30 md:pt-26 font-jetbrains text-white/70 tracking-[0.6em] uppercase font-black ml-[0.6em]">
          POWERED BY <span className="text-vivid-gradient italic">WHAPIGEN</span> // AI AUTOMATION SYSTEMS
        </p>
      </div>
    </div>
  );
}
