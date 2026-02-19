const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Simple nanoid replacement for CommonJS
const nanoid = (size = 10) => {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
    let id = '';
    while (size--) {
        id += alphabet[Math.floor(Math.random() * 64)];
    }
    return id;
};

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('MongoDB connection error:', err));
}

// Schema
const videoSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    title: { type: String },
    uploadDate: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
    size: { type: Number },
    password: { type: String, default: null },
    expiry: { type: Date, default: null }
});

const Video = mongoose.model('Video', videoSchema);

// Middleware
app.use(cors());
app.use(express.json());

const isProd = process.env.NODE_ENV === 'production';
const uploadDir = isProd ? '/tmp/uploads' : path.join(__dirname, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploads
app.use('/uploads', express.static(uploadDir));

// Test Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        time: new Date().toISOString()
    });
});

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = `${nanoid(10)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// Video Routes
app.post('/api/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });

        const { title, password, expiry } = req.body;
        const videoId = nanoid(8);

        const videoData = new Video({
            id: videoId,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            title: title || req.file.originalname,
            size: req.file.size,
            password: password || null,
            expiry: expiry ? new Date(Date.now() + parseInt(expiry) * 60 * 60 * 1000) : null
        });

        await videoData.save();
        res.json(videoData);
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.get('/api/videos', async (req, res) => {
    try {
        const now = new Date();
        const videos = await Video.find({
            $or: [{ expiry: null }, { expiry: { $gt: now } }]
        }).sort({ uploadDate: -1 });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

app.get('/api/videos/:id', async (req, res) => {
    try {
        const video = await Video.findOne({ id: req.params.id });

        if (!video) return res.status(404).json({ error: 'Video not found' });
        if (video.expiry && video.expiry < new Date()) {
            return res.status(410).json({ error: 'Video link has expired' });
        }

        if (video.password) {
            const { password, fileName, ...safeVideo } = video.toObject();
            return res.json({ ...safeVideo, isProtected: true });
        }

        video.views += 1;
        await video.save();
        res.json(video);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/videos/:id/verify', async (req, res) => {
    try {
        const { password } = req.body;
        const video = await Video.findOne({ id: req.params.id });

        if (!video || video.password !== password) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        video.views += 1;
        await video.save();
        res.json(video);
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.delete('/api/videos/:id', async (req, res) => {
    try {
        const video = await Video.findOne({ id: req.params.id });
        if (!video) return res.status(404).json({ error: 'Video not found' });

        const filePath = path.join(uploadDir, video.fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await Video.deleteOne({ id: req.params.id });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

const isMain = require.main === module;
if (isMain || process.env.RAILWAY_STATIC_URL || process.env.PORT) {
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
