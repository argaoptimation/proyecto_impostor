import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import JoinScreen from './pages/JoinScreen';
import PlayRoom from './pages/PlayRoom';

// Teacher Protected Route
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#00F0FF] font-jetbrains text-xl">SYTEM LOADING...</div>;
  if (!user) return <Navigate to="/admin/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            {/* Student Routes */}
            <Route path="/" element={<Navigate to="/join" />} />
            <Route path="/join" element={<JoinScreen />} />
            <Route path="/game/:roomId" element={<PlayRoom />} />
            
            {/* Teacher Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
