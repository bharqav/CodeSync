const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { generateRoomCode, calculateExpirationTime, isRoomExpired } = require('../utils/room');
const router = Router();
const prisma = new PrismaClient();
// Create a new room
router.post('/create', authenticateToken, [body('name').optional().trim().isLength({ max: 100 })], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userId = req.user.userId;
    const { name } = req.body;
    try {
        // Generate unique room code
        let code = generateRoomCode();
        let existingRoom = await prisma.room.findUnique({ where: { code } });
        // Ensure uniqueness
        while (existingRoom) {
            code = generateRoomCode();
            existingRoom = await prisma.room.findUnique({ where: { code } });
        }
        // Create room
        const room = await prisma.room.create({
            data: {
                code,
                name: name || null,
                ownerId: userId,
                isActive: true,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        // Add creator as participant
        await prisma.roomParticipant.create({
            data: {
                roomId: room.id,
                userId,
            },
        });
        res.status(201).json({
            message: 'Room created successfully',
            room: {
                id: room.id,
                code: room.code,
                name: room.name,
                owner: room.owner,
                createdAt: room.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});
// Join a room by code
router.post('/join/:code', authenticateToken, async (req, res) => {
    const { code } = req.params;
    const userId = req.user.userId;
    try {
        // Find room
        const room = await prisma.room.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        // Check if room expired
        const expirationMinutes = parseInt(process.env.ROOM_INACTIVITY_TIMEOUT || '30');
        if (room.expiresAt && new Date() > room.expiresAt) {
            return res.status(410).json({ error: 'Room has expired' });
        }
        // Check if already a participant
        const existingParticipant = await prisma.roomParticipant.findUnique({
            where: {
                roomId_userId: {
                    roomId: room.id,
                    userId,
                },
            },
        });
        if (!existingParticipant) {
            // Add user as participant
            await prisma.roomParticipant.create({
                data: {
                    roomId: room.id,
                    userId,
                },
            });
        }
        else {
            // Update last seen
            await prisma.roomParticipant.update({
                where: { id: existingParticipant.id },
                data: { lastSeen: new Date() },
            });
        }
        // Update room activity
        await prisma.room.update({
            where: { id: room.id },
            data: {
                lastActive: new Date(),
                expiresAt: null, // Reset expiration
                isActive: true,
            },
        });
        res.json({
            message: 'Joined room successfully',
            room: {
                id: room.id,
                code: room.code,
                name: room.name,
                owner: room.owner,
            },
        });
    }
    catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({ error: 'Failed to join room' });
    }
});
// Get user's rooms
router.get('/my-rooms', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const roomParticipants = await prisma.roomParticipant.findMany({
            where: { userId },
            include: {
                room: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        participants: {
                            select: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                lastSeen: 'desc',
            },
        });
        const rooms = roomParticipants.map((rp) => ({
            id: rp.room.id,
            code: rp.room.code,
            name: rp.room.name,
            owner: rp.room.owner,
            isActive: rp.room.isActive,
            lastActive: rp.room.lastActive,
            participantCount: rp.room.participants.length,
            joinedAt: rp.joinedAt,
            lastSeen: rp.lastSeen,
        }));
        res.json({ rooms });
    }
    catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});
// Delete a room (owner only)
router.delete('/:roomId', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.userId;
    try {
        const room = await prisma.room.findUnique({
            where: { id: roomId },
        });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        if (room.ownerId !== userId) {
            return res.status(403).json({ error: 'Only room owner can delete the room' });
        }
        await prisma.room.delete({
            where: { id: roomId },
        });
        res.json({ message: 'Room deleted successfully' });
    }
    catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});
module.exports = router;
//# sourceMappingURL=rooms.js.map