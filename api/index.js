const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Simple nanoid replacement for CommonJS
const nanoid = (size = 10) => {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
    let id = '';
    while (size--) {
        id += alphabet[Math.floor(Math.random() * 64)];
    }
    return id;
};
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Test Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        env: process.env.NODE_ENV,
        node: process.version
    });
});

// Middleware
app.use(cors());
app.use(express.json());
// Data storage helpers
const isProd = process.env.NODE_ENV === 'production';
const uploadDir = isProd ? '/tmp/uploads' : path.join(__dirname, '..', 'server', 'uploads');
const DB_FILE = isProd ? path.join('/tmp', 'videos.json') : path.join(__dirname, '..', 'server', 'videos.json');
const USERS_FILE = isProd ? path.join('/tmp', 'users.json') : path.join(__dirname, '..', 'server', 'users.json');

// Initialize files in /tmp if they don't exist (Vercel)
const initDB = () => {
    try {
        if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');
        if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {
        console.error('Storage init failed:', e);
    }
};
initDB();

// Serve uploads
app.use('/uploads', express.static(uploadDir));

const getVideos = () => {
    try {
        if (!fs.existsSync(DB_FILE)) return [];
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        console.error('Error reading videos:', e);
        return [];
    }
};

const saveVideos = (videos) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(videos, null, 2));
    } catch (e) {
        console.error('Error saving videos:', e);
    }
};

const getUsers = () => {
    try {
        if (!fs.existsSync(USERS_FILE)) return [];
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
        console.error('Error reading users:', e);
        return [];
    }
};

const saveUsers = (users) => {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error saving users:', e);
    }
};

// Auth Middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = `${nanoid(10)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const users = getUsers();
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: nanoid(), username, password: hashedPassword };
        users.push(newUser);
        saveUsers(users);

        const token = jwt.sign({ id: newUser.id, username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { username } });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const users = getUsers();
        const user = users.find(u => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { username } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// Video Routes
app.post('/api/upload', authenticate, upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });

    const { title, password, expiry } = req.body;
    const videoId = nanoid(8);
    const videoData = {
        id: videoId,
        userId: req.user.id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        title: title || req.file.originalname,
        uploadDate: new Date().toISOString(),
        views: 0,
        size: req.file.size,
        password: password || null,
        expiry: expiry ? new Date(Date.now() + parseInt(expiry) * 60 * 60 * 1000) : null
    };

    const videos = getVideos();
    videos.push(videoData);
    saveVideos(videos);
    res.json(videoData);
});

app.get('/api/videos', authenticate, (req, res) => {
    const videos = getVideos();
    const userVideos = videos.filter(v => v.userId === req.user.id);
    const now = new Date();
    const activeVideos = userVideos.filter(v => !v.expiry || new Date(v.expiry) > now);
    res.json(activeVideos);
});

app.get('/api/videos/:id', (req, res) => {
    const videos = getVideos();
    const video = videos.find(v => v.id === req.params.id);

    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (video.expiry && new Date(video.expiry) < new Date()) {
        return res.status(410).json({ error: 'Video link has expired' });
    }

    const { password, fileName, ...safeVideo } = video;
    if (password) return res.json({ ...safeVideo, isProtected: true });

    video.views += 1;
    saveVideos(videos);
    res.json({ ...safeVideo, fileName });
});

app.post('/api/videos/:id/verify', (req, res) => {
    const { password } = req.body;
    const videos = getVideos();
    const video = videos.find(v => v.id === req.params.id);

    if (!video || video.password !== password) {
        return res.status(401).json({ error: 'Incorrect password' });
    }

    video.views += 1;
    saveVideos(videos);
    const { password: _, ...safeVideo } = video;
    res.json(safeVideo);
});

app.delete('/api/videos/:id', authenticate, (req, res) => {
    const videos = getVideos();
    const videoIndex = videos.findIndex(v => v.id === req.params.id && v.userId === req.user.id);

    if (videoIndex === -1) return res.status(404).json({ error: 'Video not found or unauthorized' });

    const video = videos[videoIndex];
    const filePath = path.join(uploadDir, video.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    videos.splice(videoIndex, 1);
    saveVideos(videos);
    res.json({ message: 'Deleted' });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
