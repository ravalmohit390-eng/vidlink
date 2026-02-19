import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Eye, Calendar, HardDrive, Share2, Copy, ArrowLeft, AlertCircle, Lock } from 'lucide-react';

const VideoView = () => {
    const { id } = useParams();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchVideo();
    }, [id]);

    const fetchVideo = async () => {
        try {
            const response = await axios.get(`/api/videos/${id}`);
            setVideo(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Video not found');
            setLoading(false);
        }
    };

    const verifyPassword = async (e) => {
        e.preventDefault();
        setVerifying(true);
        try {
            const response = await axios.post(`/api/videos/${id}/verify`, { password });
            setVideo(response.data);
            setVerifying(false);
        } catch (err) {
            alert('Incorrect password');
            setVerifying(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: video.title,
                    url: window.location.href
                });
            } catch (err) {
                console.error('Sharing failed', err);
            }
        } else {
            copyLink();
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xl font-medium animate-pulse">Loading Video...</p>
        </div>
    );

    if (error) return (
        <div className="max-w-xl mx-auto mt-20 text-center">
            <div className="glass p-12 rounded-3xl border-red-500/20">
                <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Oops! {error}</h2>
                <p className="text-gray-400 mb-8">The link might be broken, expired, or the video was deleted.</p>
                <Link to="/" className="btn-primary inline-flex items-center gap-2">
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>
            </div>
        </div>
    );

    if (video.isProtected && !video.fileName) {
        return (
            <div className="max-w-xl mx-auto mt-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-12 rounded-3xl border-indigo-500/20"
                >
                    <div className="p-4 bg-indigo-500/20 rounded-full w-fit mx-auto mb-6">
                        <Lock className="w-12 h-12 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Password Protected</h2>
                    <p className="text-gray-400 mb-8">This video requires a password to view.</p>
                    <form onSubmit={verifyPassword} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="input-field text-center py-4"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={verifying}
                            className="btn-primary w-full py-4 text-lg"
                        >
                            {verifying ? 'Verifying...' : 'Unlock Video'}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto mt-8 px-4">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
                <ArrowLeft size={20} />
                Back to Home
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-3xl overflow-hidden border-white/10"
            >
                <div className="aspect-video bg-black relative group">
                    <video
                        src={`/uploads/${video.fileName}`}
                        controls
                        className="w-full h-full"
                        autoPlay
                    />
                </div>

                <div className="p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Eye size={16} />
                                    {video.views} views
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={16} />
                                    {new Date(video.uploadDate).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <HardDrive size={16} />
                                    {(video.size / (1024 * 1024)).toFixed(2)} MB
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={copyLink}
                                className={`flex items-center gap-2 border px-6 py-3 rounded-2xl transition-all font-semibold ${copied ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                            >
                                <Copy size={20} />
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button
                                onClick={handleShare}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Share2 size={20} />
                                Share
                            </button>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/10">
                        <h3 className="text-lg font-semibold mb-4">Video Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Format</p>
                                <p className="font-medium">{video.fileName.split('.').pop().toUpperCase()}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                <p className="font-medium text-green-400">Public/Sharable</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Link Expiry</p>
                                <p className="font-medium">{video.expiry ? new Date(video.expiry).toLocaleString() : 'Never'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VideoView;
