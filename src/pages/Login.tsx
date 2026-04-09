import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowRight, Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CyberRain } from '../components/ui/CyberRain';
import { RainToggle } from '../components/ui/RainToggle';
import { GlitchLogo } from '../components/ui/GlitchLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  // If already logged in, redirect to dashboard
  if (user) {
    navigate('/admin/dashboard');
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message.toUpperCase());
      setLoading(false);
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#050505]">
      {/* Background Elements */}
      <CyberRain />
      <RainToggle />
      <div className="absolute inset-0 bg-digital-grid bg-[length:40px_40px] opacity-[0.02] pointer-events-none"></div>

      {/* Header / Brand */}
      <div className="mb-6 md:mb-12 text-center relative z-10 animate-in fade-in slide-in-from-top duration-700">
        <GlitchLogo size="md" isStatic={false} className="mb-6 mx-auto" />
        <h1 className="text-header-premium text-3xl md:text-4xl tracking-[0.1em]">
          TEACHER ACCESS
        </h1>
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-whapigen-cyan"></div>
          <p className="text-whapigen-cyan font-jetbrains tracking-[0.4em] font-black text-[10px] uppercase flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 animate-pulse" /> COMMAND CENTER
          </p>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-purple-600"></div>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md p-10 relative overflow-hidden group bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[30px] shadow-[0_20px_80px_rgba(0,0,0,0.5)] hover:shadow-neon-pulse-cyan transition-all duration-500 animate-in zoom-in-95 duration-700">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-whapigen-cyan via-purple-600 to-whapigen-cyan opacity-30 group-hover:opacity-100 transition-opacity"></div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          {/* Email Input */}
          <div className="space-y-3">
            <label className="text-whapigen-cyan font-jetbrains text-[10px] tracking-[0.3em] uppercase font-black flex items-center gap-2 ml-2">
              <Mail className="w-3.5 h-3.5 text-whapigen-cyan/50" /> ACCESS IDENTITY
            </label>
            <div className="relative group/input">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-jetbrains text-sm focus:outline-none focus:border-whapigen-cyan/50 focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all placeholder:text-white/10"
                placeholder="teacher@whapigen.com"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-3">
            <label className="text-whapigen-cyan font-jetbrains text-[10px] tracking-[0.3em] uppercase font-black flex items-center gap-2 ml-2">
              <Lock className="w-3.5 h-3.5 text-whapigen-cyan/50" /> PASSWORD
            </label>
            <div className="relative group/input">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 pr-14 text-white font-jetbrains text-sm focus:outline-none focus:border-whapigen-cyan/50 focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all placeholder:text-white/10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-whapigen-cyan/50 hover:text-whapigen-cyan transition-all duration-300"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 text-whapigen-red font-jetbrains text-[10px] bg-whapigen-red/5 border border-whapigen-red/20 p-4 rounded-2xl animate-in slide-in-from-left duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="tracking-widest font-black uppercase">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-whapigen-cyan to-purple-600 hover:from-white hover:to-white text-black font-sora font-black tracking-[0.1em] transition-all rounded-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group/btn hover:shadow-neon-cyan/50 active:scale-95 transition-all outline-none"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                AUTHENTICATE
                <ArrowRight className="w-7 h-7 group-hover/btn:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
      <div className="mt-1 flex flex-col items-center gap-16 relative z-10">
        <div className="flex items-center gap-3 text-[10px] font-jetbrains text-whapigen-green tracking-[0.4em] font-black uppercase bg-whapigen-green/5 px-6 py-2 rounded-full border border-whapigen-green/20">
          <span className="w-2 h-2 rounded-full bg-whapigen-green shadow-neon-green animate-pulse"></span>
          ACTIVE SYSTEM ACCESS
        </div>
      </div>

      {/* Footer Meta */}
      <footer className="mt-4 md:mt-12 text-center relative z-10 opacity-30">
        <p className="text-[9px] font-jetbrains text-whapigen-cyan tracking-[0.5em] uppercase font-black">
          SECURE CONNECTION ESTABLISHED
        </p>
      </footer>

      <div className="mt-20 flex flex-col items-center pb-0 relative z-2">
        <p className="text-[10px] text-center font-jetbrains text-white/70 tracking-[0.6em] uppercase font-black ml-[0.6em]">
          POWERED BY <span className="text-vivid-gradient italic">WHAPIGEN</span> // AI AUTOMATION SYSTEMS
        </p>
      </div>
    </div>
  );
}
