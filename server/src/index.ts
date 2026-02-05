import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

dotenv.config();


const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const app = express();
app.set('trust proxy', 1); // Trust Render's load balancer
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow WebSocket connections
}));

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 100 requests per windowMs (Higher limit for sockets/api)
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
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
app.use(passport.initialize());
app.use(passport.session());

// --- Passport Strategies ---

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    },
        async (accessToken, refreshToken, profile, done) => {
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
                } else if (!user.googleId) {
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
            } catch (error) {
                return done(error as Error, undefined);
            }
        }));
}

// Local Strategy
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !user.password) {
            return done(null, false, { message: 'Incorrect username or password.' });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return done(null, false, { message: 'Incorrect username or password.' });
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Serialize/Deserialize
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// --- Routes ---

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes
const authRouter = express.Router();

// Google Auth
authRouter.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

authRouter.get('/google/callback',
    passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173/login?error=auth_failed' }),
    (req: Request, res: Response) => {
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173/dashboard');
    }
);

// Local Auth: Signup
authRouter.post('/signup', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!username || !password || password.length < 6) {
            return res.status(400).json({ error: 'Invalid input' });
        }
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return res.status(409).json({ error: 'Username taken' });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { username, password: hashedPassword, name: username },
        });

        // Auto-login after signup
        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: 'Login failed after signup' });
            return res.json({ user });
        });
    } catch (error) {
        res.status(500).json({ error: 'Signup failed' });
    }
});

// Local Auth: Login
authRouter.post('/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        req.login(user, (err) => {
            if (err) return next(err);
            return res.json({ user });
        });
    })(req, res, next);
});

authRouter.get('/me', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

authRouter.post('/logout', (req: Request, res: Response) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ message: 'Logged out successfully' });
    });
});

app.use('/api/auth', authRouter);

// Room Routes
const roomRouter = express.Router();

// Middleware to ensure auth
const ensureAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Unauthorized' });
};

roomRouter.use(ensureAuth);

roomRouter.post('/create', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const user = req.user as any;
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
    } catch (err) {
        res.status(500).json({ error: 'Failed to create room' });
    }
});

roomRouter.post('/join/:code', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const roomCode = String(code);
        const user = req.user as any;

        const room = await prisma.room.findUnique({ where: { code: roomCode } });
        if (!room) return res.status(404).json({ error: 'Room not found' });

        await prisma.roomParticipant.upsert({
            where: { roomId_userId: { roomId: room.id, userId: user.id } },
            update: {},
            create: { roomId: room.id, userId: user.id },
        });

        res.json({ room });
    } catch (err) {
        res.status(500).json({ error: 'Failed to join room' });
    }
});

roomRouter.get('/my-rooms', async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
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
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

app.use('/api/rooms', roomRouter);

// --- WebSockets ---

const wrapMiddlewareForSocket = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next);
io.use(wrapMiddlewareForSocket(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
})));
io.use(wrapMiddlewareForSocket(passport.initialize()));
io.use(wrapMiddlewareForSocket(passport.session()));

io.use((socket: any, next) => {
    if (socket.request.user) {
        socket.userId = socket.request.user.id;
        socket.username = socket.request.user.username || socket.request.user.name;
        next();
    } else {
        next(new Error('Unauthorized'));
    }
});

io.on('connection', (socket: any) => {
    console.log(`User connected: ${socket.userId}`);

    socket.on('join-room', (roomCode: string) => {
        socket.join(roomCode);
        console.log(`User ${socket.userId} joined room ${roomCode}`);
    });

    socket.on('code-change', (data: { roomCode: string; code: string }) => {
        socket.to(data.roomCode).emit('code-update', data.code);
    });

    socket.on('chat-message', (data: { roomCode: string; message: string; user: any }) => {
        io.to(data.roomCode).emit('new-message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
    });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    // Return actual error message for debugging purposes
    res.status(500).json({ error: err.message || 'Internal Server Error', details: err.stack });
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
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        process.exit(1);
    }
};

startServer();
