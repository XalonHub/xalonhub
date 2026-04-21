const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const router = express.Router();

// Register or Update Push Token
router.post('/register-push-token', auth, async (req, res) => {
    const { token, deviceId } = req.body;
    const userId = req.user.id;

    if (!token) {
        return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    try {
        const pushToken = await prisma.pushToken.upsert({
            where: { token },
            update: {
                userId,
                deviceId,
                updatedAt: new Date()
            },
            create: {
                userId,
                token,
                deviceId
            }
        });

        res.json({ success: true, pushToken });
    } catch (error) {
        console.error('[NotificationRoutes] Error registering token:', error);
        res.status(500).json({ success: false, message: 'Failed to register push token' });
    }
});

// Get User Notifications (for the Bell List)
router.get('/', auth, async (req, res) => {
    const userId = req.user.id;

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50 for performance
        });

        res.json({ success: true, notifications });
    } catch (error) {
        console.error('[NotificationRoutes] Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});

// Mark Notification as Read
router.patch('/:id/read', auth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const notification = await prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true }
        });

        res.json({ success: true, updated: notification.count > 0 });
    } catch (error) {
        console.error('[NotificationRoutes] Error marking as read:', error);
        res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
});

// Clear All Notifications
router.delete('/all', auth, async (req, res) => {
    const userId = req.user.id;

    try {
        await prisma.notification.deleteMany({
            where: { userId }
        });

        res.json({ success: true, message: 'Notifications cleared' });
    } catch (error) {
        console.error('[NotificationRoutes] Error clearing notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to clear notifications' });
    }
});

module.exports = router;
