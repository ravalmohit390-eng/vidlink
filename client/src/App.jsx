import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Sun, Moon, Video, LayoutDashboard, Upload } from 'lucide-react';
import Home from './pages/Home';
import VideoView from './pages/VideoView';
import Dashboard from './pages/Dashboard';

const Navbar = ({ isDark, setIsDark }) => {
  return (
    <nav className="glass sticky top-0 z-50 px-6 py-3 flex justify-between items-center mx-4 my-4 rounded-xl border-white/5">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold gradient-text">
        <Video className="w-6 h-6 text-indigo-500" />
        <span>Linkify Video</span>
      </Link>

      <div className="flex items-center gap-3 md:gap-4">
        <Link to="/" className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-indigo-400 transition-all" title="Upload">
          <Upload size={20} />
        </Link>
        <Link to="/dashboard" className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-indigo-400 transition-all" title="Dashboard">
          <LayoutDashboard size={20} />
        </Link>

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
    <Router>
      <div className="min-h-screen transition-colors duration-300">
        <Navbar isDark={isDark} setIsDark={setIsDark} />

        <main className="container mx-auto px-4 pb-12 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/v/:id" element={<VideoView />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
