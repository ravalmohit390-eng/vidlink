import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Sun, Moon, Video, LayoutDashboard, Upload, LogOut, User as UserIcon } from 'lucide-react';
import Home from './pages/Home';
import VideoView from './pages/VideoView';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';

const Navbar = ({ isDark, setIsDark }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-3 flex justify-between items-center mx-4 my-4 rounded-xl border-white/5">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold gradient-text">
        <Video className="w-6 h-6 text-indigo-500" />
        <span>Linkify Video</span>
      </Link>

      <div className="flex items-center gap-3 md:gap-4">
        {user ? (
          <>
            <Link to="/" className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-indigo-400 transition-all" title="Upload">
              <Upload size={20} />
            </Link>
            <Link to="/dashboard" className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-indigo-400 transition-all" title="Dashboard">
              <LayoutDashboard size={20} />
            </Link>
            <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
              <UserIcon size={14} className="text-indigo-400" />
              <span className="text-xs font-semibold">{user.username}</span>
              <button
                onClick={logout}
                className="ml-1 text-gray-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex gap-4 items-center">
            <Link to="/login" className="text-sm font-semibold hover:text-indigo-400 transition-colors">Login</Link>
            <Link to="/register" className="btn-primary py-1.5 px-4 text-xs">Sign Up</Link>
          </div>
        )}

        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
        >
          {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-600" />}
        </button>
      </div>
    </nav>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen transition-colors duration-300">
          <Navbar isDark={isDark} setIsDark={setIsDark} />

          <main className="container mx-auto px-4 pb-12 overflow-hidden">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/v/:id" element={<VideoView />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
