import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, ExternalLink, Play, Search, Eye, Calendar, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [newTitle, setNewTitle] = useState('');

    const fetchVideos = async () => {
        try {
            const response = await axios.get('/api/videos');
            setVideos(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch videos:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this video?')) return;
        try {
            await axios.delete(`/api/videos/${id}`);
            setVideos(videos.filter(v => v.id !== id));
        } catch (error) {
            alert('Failed to delete video');
        }
    };

    const startEdit = (video) => {
        setEditingId(video.id);
        setNewTitle(video.title);
    };

    const handleUpdate = async (id) => {
        try {
            await axios.patch(`/api/videos/${id}`, { title: newTitle });
            setVideos(videos.map(v => v.id === id ? { ...v, title: newTitle } : v));
            setEditingId(null);
        } catch (error) {
            alert('Failed to update title');
        }
    };

    const filteredVideos = videos.filter(v =>
        v.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto mt-12 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold mb-2">My <span className="gradient-text">Dashboard</span></h1>
                    <p className="text-gray-400">Manage and track your shared videos.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search videos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-12 py-3"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredVideos.map((video) => (
                            <motion.div
                                key={video.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="glass rounded-3xl overflow-hidden border-white/10 group group-hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
                            >
                                <div className="aspect-video bg-black relative">
                                    <video
                                        src={`/uploads/${video.fileName}`}
                                        className="w-full h-full object-cover opacity-60"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        <Link to={`/v/${video.id}`} className="p-4 bg-indigo-500 rounded-full text-white transform hover:scale-110 transition-transform">
                                            <Play fill="white" size={32} />
                                        </Link>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {editingId === video.id ? (
                                        <div className="flex gap-2 mb-4">
                                            <input
                                                type="text"
                                                value={newTitle}
                                                onChange={(e) => setNewTitle(e.target.value)}
                                                className="input-field flex-1"
                                            />
                                            <button onClick={() => handleUpdate(video.id)} className="p-2 bg-green-500/20 text-green-400 rounded-lg">Save</button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold truncate pr-4">{video.title}</h3>
                                            <button onClick={() => startEdit(video)} className="text-gray-500 hover:text-indigo-400">
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-6">
                                        <span className="flex items-center gap-1"><Eye size={14} /> {video.views}</span>
                                        <span className="flex items-center gap-1"><HardDrive size={14} /> {(video.size / (1024 * 1024)).toFixed(2)} MB</span>
                                        <span className="flex items-center gap-1 col-span-2"><Calendar size={14} /> {new Date(video.uploadDate).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link to={`/v/${video.id}`} className="flex-1 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all flex items-center justify-center gap-2">
                                            <ExternalLink size={16} /> View
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(video.id)}
                                            className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="glass p-20 rounded-3xl text-center border-dashed border-white/10">
                    <p className="text-2xl text-gray-500 font-medium">No videos found</p>
                    <Link to="/" className="btn-primary mt-6 inline-block">Upload Your First Video</Link>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
