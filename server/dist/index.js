"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_local_1 = require("passport-local");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const app = (0, express_1.default)();
app.set('trust proxy', 1); // Trust Render's load balancer
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
});
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3001;
// --- Middlewares ---
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Allow WebSocket connections
}));
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 100 requests per windowMs (Higher limit for sockets/api)
});
app.use('/api/', limiter);
// Body parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Session configuration
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
}));
// Passport initialization
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// --- Passport Strategies ---
// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Find or create user
            let user = await prisma.user.findFirst({
                where: { OR: [{ googleId: profile.id }, { email: profile.emails?.[0]?.value }] },
            });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        googleId: profile.id,
                        email: profile.emails?.[0]?.value || '',
                        name: profile.displayName,
                        avatarUrl: profile.photos?.[0]?.value,
                        // Generate a random username if needed, or leave null if schema allows
                        username: profile.emails?.[0]?.value.split('@')[0] + Math.floor(Math.random() * 1000),
                    },
                });
            }
            else if (!user.googleId) {
                // Link Google account to existing email user
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: profile.id,
                        avatarUrl: user.avatarUrl || profile.photos?.[0]?.value
                    },
                });
            }
            return done(null, user);
        }
        catch (error) {
            return done(error, undefined);
        }
    }));
}
// Local Strategy
passport_1.default.use(new passport_local_1.Strategy(async (username, password, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !user.password) {
            return done(null, false, { message: 'Incorrect username or password.' });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            return done(null, false, { message: 'Incorrect username or password.' });
        }
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
}));
// Serialize/Deserialize
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
const signToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
};
// --- Routes ---
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Auth Routes
const authRouter = express_1.default.Router();
// Google Auth
authRouter.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
authRouter.get('/google/callback', passport_1.default.authenticate('google', { failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173/login?error=auth_failed' }), (req, res) => {
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173/dashboard');
});
// Local Auth: Signup
authRouter.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password || password.length < 6) {
            return res.status(400).json({ error: 'Invalid input' });
        }
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return res.status(409).json({ error: 'Username taken' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma.user.create({
            data: { username, password: hashedPassword, name: username },
        });
        // Auto-login after signup
        req.login(user, (err) => {
            if (err)
                return res.status(500).json({ error: 'Login failed after signup' });
            const token = signToken(user);
            return res.json({ user, token });
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Signup failed' });
    }
});
// Local Auth: Login
authRouter.post('/login', (req, res, next) => {
    passport_1.default.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        req.login(user, (err) => {
            if (err)
                return next(err);
            const token = signToken(user);
            return res.json({ user, token });
        });
    })(req, res, next);
});
authRouter.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ user: req.user });
    }
    else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});
authRouter.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err)
            return res.status(500).json({ error: 'Logout failed' });
        res.json({ message: 'Logged out successfully' });
    });
});
app.use('/api/auth', authRouter);
// Room Routes
const roomRouter = express_1.default.Router();
// Middleware to ensure auth
const ensureAuth = async (req, res, next) => {
    if (req.isAuthenticated())
        return next();
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            const user = await prisma.user.findUnique({ where: { id: decoded.id } });
            if (user) {
                req.user = user;
                return next();
            }
        }
        catch (err) {
            console.error('JWT Verification failed:', err);
        }
    }
    res.status(401).json({ error: 'Unauthorized' });
};
roomRouter.use(ensureAuth);
roomRouter.post('/create', async (req, res) => {
    try {
        const { name } = req.body;
        const user = req.user;
        const code = Array.from({ length: 6 }, () => '0123456789'[Math.floor(Math.random() * 10)]).join('');
        const room = await prisma.room.create({
            data: {
                code,
                name: name || null,
                ownerId: user.id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });
        res.json({ room });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create room' });
    }
});
roomRouter.post('/join/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const roomCode = String(code);
        const user = req.user;
        const room = await prisma.room.findUnique({ where: { code: roomCode } });
        if (!room)
            return res.status(404).json({ error: 'Room not found' });
        await prisma.roomParticipant.upsert({
            where: { roomId_userId: { roomId: room.id, userId: user.id } },
            update: {},
            create: { roomId: room.id, userId: user.id },
        });
        res.json({ room });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to join room' });
    }
});
roomRouter.get('/my-rooms', async (req, res) => {
    try {
        const user = req.user;
        const rooms = await prisma.room.findMany({
            where: {
                OR: [
                    { ownerId: user.id },
                    { participants: { some: { userId: user.id } } },
                ],
            },
            include: {
                owner: { select: { id: true, username: true, name: true, avatarUrl: true } },
                participants: true,
            },
            orderBy: { lastActive: 'desc' },
        });
        res.json({ rooms });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});
roomRouter.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const room = await prisma.room.findUnique({ where: { id } });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        if (room.ownerId !== user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this room' });
        }
        await prisma.room.delete({ where: { id } });
        res.json({ message: 'Room deleted successfully' });
    }
    catch (err) {
        console.error('Delete room error:', err);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});
app.use('/api/rooms', roomRouter);
// --- WebSockets ---
const wrapMiddlewareForSocket = (middleware) => (socket, next) => middleware(socket.request, {}, next);
io.use(wrapMiddlewareForSocket((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
})));
io.use(wrapMiddlewareForSocket(passport_1.default.initialize()));
io.use(wrapMiddlewareForSocket(passport_1.default.session()));
io.use((socket, next) => {
    // 1. Try Session Auth (from passport.session middleware)
    if (socket.request.user) {
        socket.userId = socket.request.user.id;
        socket.username = socket.request.user.username || socket.request.user.name;
        return next();
    }
    // 2. Try JWT Auth (from handshake)
    const token = socket.handshake.auth?.token;
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            socket.userId = decoded.id;
            socket.username = decoded.username;
            return next();
        }
        catch (err) {
            console.error('Socket JWT Error:', err);
            return next(new Error('Authentication error'));
        }
    }
    next(new Error('Unauthorized'));
});
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    socket.on('join-room', async (roomCode) => {
        socket.join(roomCode);
        console.log(`User ${socket.userId} joined room ${roomCode}`);
        try {
            // Load saved content
            const room = await prisma.room.findUnique({
                where: { code: roomCode },
                include: { messages: { include: { user: true }, orderBy: { createdAt: 'asc' } } }
            });
            if (room) {
                // Send saved code
                if (room.content) {
                    socket.emit('code-update', room.content);
                }
                // Send saved messages
                const history = room.messages.map((msg) => ({
                    id: msg.id,
                    user: msg.user.username || msg.user.name,
                    text: msg.text,
                    timestamp: msg.createdAt
                }));
                socket.emit('load-messages', history);
            }
            // Update user list
            const sockets = await io.in(roomCode).fetchSockets();
            const users = sockets.map((s) => ({
                id: s.userId,
                username: s.username
            }));
            io.to(roomCode).emit('room-users', users);
        }
        catch (err) {
            console.error('Error joining room:', err);
        }
    });
    socket.on('code-change', async (data) => {
        socket.to(data.roomCode).emit('code-update', data.code);
        // Debounce or save periodically could be better, but for now we save on change
        // to ensure persistence. In production, use Redis or debounce.
        try {
            await prisma.room.update({
                where: { code: data.roomCode },
                data: { content: data.code }
            });
        }
        catch (err) {
            console.error('Failed to save code:', err);
        }
    });
    socket.on('chat-message', async (data) => {
        io.to(data.roomCode).emit('new-message', data);
        try {
            await prisma.message.create({
                data: {
                    text: data.message,
                    userId: socket.userId,
                    roomId: (await prisma.room.findUnique({ where: { code: data.roomCode }, select: { id: true } }))?.id
                }
            });
        }
        catch (err) {
            console.error('Failed to save message:', err);
        }
    });
    socket.on('whiteboard-draw', (data) => {
        socket.to(data.roomCode).emit('whiteboard-draw', data);
    });
    socket.on('whiteboard-clear', (data) => {
        socket.to(data.roomCode).emit('whiteboard-clear', data);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
        // We can't easily know which room they were in without tracking it on the socket object
        // For accurate 'room-users' updates on disconnect, we would need to map socket.id to rooms.
        // A simpler approach for now is to let the client handle reconnection or poll.
        // However, to fix the user list not updating on disconnect:
        // iterate all rooms this socket was in (Socket.IO tracks this automatically *before* full disconnect, 
        // but 'disconnecting' event is better for that).
        // For 'disconnect', they are already gone from rooms.
        // Let's use 'disconnecting' to notify rooms.
    });
    socket.on('disconnecting', () => {
        const rooms = socket.rooms;
        rooms.forEach((roomCode) => {
            // socket.rooms contains the socket ID itself too, skip it
            if (roomCode !== socket.id) {
                // Get remaining users (excluding this one roughly, but fetchSockets might still include it depending on timing)
                // Actually fetchSockets in disconnecting *might* still see it.
                // Better to filter manually or wait a tick. 
                // Simple hack: Emit event, client filter? No.
                // Let's just emit 'user-left' or re-emit list excluding self.
                // Since fetchSockets is async, by the time it runs, this socket might be gone or not.
                // Let's explicitly filter out current user from the list we broadcast.
                const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
                const remainingUsers = usersInRoom
                    .filter((sid) => sid !== socket.id)
                    .map((sid) => {
                    const s = io.sockets.sockets.get(sid);
                    return { id: s?.userId, username: s?.username };
                })
                    .filter(u => u.id); // Valid users only
                io.to(roomCode).emit('room-users', remainingUsers);
            }
        });
    });
});
// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    // Return generic error message for security
    res.status(500).json({ error: 'Internal Server Error' });
});
// Start
const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to connect to database:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map