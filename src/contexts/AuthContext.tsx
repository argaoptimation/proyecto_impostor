import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface StudentData {
  nickname: string;
  roomId: string; // The 4-digit code
  playerId: string; // The UUID generated in DB or locally
}

interface AuthContextType {
  user: User | null; // For Teacher Admin
  session: Session | null;
  loading: boolean;
  studentData: StudentData | null; // For Students
  setStudentData: (data: StudentData | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  studentData: null,
  setStudentData: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Persist student data in session storage so it survives reloads in the same tab
  const [studentData, setStudentDataState] = useState<StudentData | null>(() => {
    const stored = sessionStorage.getItem('impostor_student_auth');
    return stored ? JSON.parse(stored) : null;
  });

  const setStudentData = (data: StudentData | null) => {
    setStudentDataState(data);
    if (data) {
      sessionStorage.setItem('impostor_student_auth', JSON.stringify(data));
    } else {
      sessionStorage.removeItem('impostor_student_auth');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setStudentData(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, studentData, setStudentData, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
