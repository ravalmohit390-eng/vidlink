import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, User, Lock } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            const status = err.response?.status;
            const url = err.config?.url;
            const msg = err.response?.data?.error || err.message;
            alert(`LOGIN FAILED\nStatus: ${status || 'Network Error'}\nURL: ${url}\nError: ${msg}\n\nTip: Make sure you deployed the ROOT of the repo to Vercel, not just the client folder.`);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-10 rounded-3xl border-white/10"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="p-4 bg-indigo-500/20 rounded-full mb-4">
                        <LogIn className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to manage your videos</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-2">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field pl-12"
                                placeholder="Your username"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pl-12"
                                placeholder="Your password"
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary w-full py-4 text-lg font-bold mt-4">
                        Login
                    </button>
                </form>

                <p className="text-center mt-8 text-gray-400">
                    Don't have an account? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">Register here</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
