import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Terminal, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-12 text-center text-whapigen-cyan">
        <Lock className="w-12 h-12 mx-auto mb-4 drop-shadow-neon-cyan" />
        <h1 className="font-jetbrains text-2xl tracking-[0.2em] uppercase">Teacher Access</h1>
      </div>

      <div className="glass-panel w-full max-w-md p-8 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-whapigen-cyan/50"></div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-whapigen-border font-jetbrains text-xs tracking-wider uppercase flex items-center gap-2">
              <Mail className="w-4 h-4" /> Valid Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-whapigen-border rounded-none p-3 text-white font-jetbrains focus:border-whapigen-cyan focus:shadow-neon-cyan outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-whapigen-border font-jetbrains text-xs tracking-wider uppercase flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Password Key
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-whapigen-border rounded-none p-3 text-white font-jetbrains focus:border-whapigen-cyan focus:shadow-neon-cyan outline-none transition-all"
              required
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
            disabled={loading}
            className="w-full h-12 bg-whapigen-cyan text-[#050505] font-jetbrains font-bold tracking-widest hover:bg-white hover:shadow-neon-cyan transition-all flex items-center justify-center clip-edges mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'AUTHENTICATE'}
          </button>
        </form>
      </div>
    </div>
  );
}
