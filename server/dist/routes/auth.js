var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const router = Router();
const prisma = new PrismaClient();
// Signup endpoint
router.post('/signup', [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().isLength({ min: 2, max: 50 }),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, name, password } = req.body;
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        // Hash password
        const hashedPassword = await hashPassword(password);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });
        // Generate JWT token
        const token = generateToken({ userId: user.id, email: user.email });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user,
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Login endpoint
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Verify password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Generate JWT token
        const token = generateToken({ userId: user.id, email: user.email });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get current user (protected route example)
router.get('/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const { verifyToken } = await Promise.resolve().then(() => __importStar(require('../utils/auth')));
        const payload = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
});
module.exports = router;
//# sourceMappingURL=auth.js.map