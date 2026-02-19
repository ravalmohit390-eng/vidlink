import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileVideo, CheckCircle, Copy, Share2, QrCode as QrIcon } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadedVideo, setUploadedVideo] = useState(null);
    const [title, setTitle] = useState('');
    const [password, setPassword] = useState('');
    const [expiry, setExpiry] = useState('');

    const onDrop = useCallback((acceptedFiles) => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile && selectedFile.type.startsWith('video/')) {
            setFile(selectedFile);
            setTitle(selectedFile.name);
        } else {
            alert('Please upload a valid video file.');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv'] },
        multiple: false
    });

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);
        if (password) formData.append('password', password);
        if (expiry) formData.append('expiry', expiry);

        setUploading(true);
        setProgress(0);

        try {
            const response = await axios.post('/api/upload', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            setUploadedVideo(response.data);
            setUploading(false);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Automatically redirect after 2 seconds so user can see success state
            setTimeout(() => {
                navigate(`/v/${response.data.id}`);
            }, 2000);

        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
            setUploading(false);
        }
    };

    const shareUrl = uploadedVideo ? `${window.location.origin}/v/${uploadedVideo.id}` : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="max-w-4xl mx-auto mt-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="text-5xl font-extrabold mb-4">
                    Share Videos <span className="gradient-text">Instantly</span>
                </h1>
                <p className="text-gray-400 text-lg">
                    Upload your video and get a sharable link in seconds. Fast, secure, and beautiful.
                </p>
            </motion.div>

            {!uploadedVideo ? (
                <motion.div
                    className="glass card border-indigo-500/20"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'border-indigo-400 bg-indigo-500/10' : ''}`}>
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-indigo-500/15 rounded-full">
                                <Upload className="w-10 h-10 text-indigo-400" />
                            </div>
                            {file ? (
                                <div className="text-center">
                                    <p className="text-lg font-semibold mb-0.5">{file.name}</p>
                                    <p className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-lg font-medium">Drag & drop your video here</p>
                                    <p className="text-xs text-gray-400">or click to browse files (MP4, MOV, AVI, MKV)</p>
                                </>
                            )}
                        </div>
                    </div>

                    {file && !uploading && (
                        <div className="mt-8 space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Video Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="input-field"
                                        placeholder="Enter video title"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Password (Optional)</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-field"
                                        placeholder="Set protection"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Expiry (Hours)</label>
                                    <input
                                        type="number"
                                        value={expiry}
                                        onChange={(e) => setExpiry(e.target.value)}
                                        className="input-field"
                                        placeholder="e.g. 24"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleUpload}
                                className="btn-primary w-full py-4 text-lg flex justify-center items-center gap-3"
                            >
                                <FileVideo size={24} />
                                Generate Sharable Link
                            </button>
                        </div>
                    )}

                    {uploading && (
                        <div className="mt-8 space-y-4">
                            <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/10">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-center font-medium">Uploading... {progress}%</p>
                        </div>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    className="glass card border-green-500/20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="p-4 bg-green-500/20 rounded-full">
                            <CheckCircle className="w-16 h-16 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Video Linked Successfully!</h2>
                            <p className="text-gray-400">Your video is ready to be shared.</p>
                        </div>

                        <div className="w-full flex flex-col md:flex-row gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="bg-transparent border-none focus:ring-0 text-indigo-400 font-mono flex-1 overflow-hidden text-ellipsis px-2"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-4 py-2 rounded-xl transition-all"
                                >
                                    <Copy size={18} />
                                    <span>Copy</span>
                                </button>
                                <button
                                    onClick={async () => {
                                        if (navigator.share) {
                                            await navigator.share({ title: uploadedVideo.title, url: shareUrl });
                                        } else {
                                            copyToClipboard();
                                        }
                                    }}
                                    className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-xl transition-all"
                                >
                                    <Share2 size={18} />
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 text-center px-4">
                            Tip: Large videos are automatically optimized for web playback.
                            For fastest sharing, try to keep files under 50MB.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-4">
                            <div className="flex flex-col items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
                                <p className="font-semibold flex items-center gap-2">
                                    <QrIcon size={20} className="text-indigo-400" />
                                    QR Code
                                </p>
                                <div className="bg-white p-2 rounded-xl">
                                    <QRCodeSVG value={shareUrl} size={150} />
                                </div>
                            </div>

                            <div className="flex flex-col justify-center gap-4">
                                <Link to={`/v/${uploadedVideo.id}`} className="btn-primary flex flex-col items-center justify-center gap-1 group">
                                    <span className="flex items-center gap-2">
                                        <FileVideo size={20} />
                                        View Video
                                    </span>
                                    <span className="text-[10px] opacity-60 font-normal">Redirecting you now...</span>
                                </Link>
                                <button
                                    onClick={() => setUploadedVideo(null)}
                                    className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-semibold"
                                >
                                    Upload Another
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Home;
