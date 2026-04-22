const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const router = express.Router();

// Get User Communication Preferences
router.get('/preferences', auth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                whatsappTransactional: true,
                whatsappMarketing: true,
                pushNotifications: true,
                hasSetPreferences: true,
                preferencesUpdatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, preferences: user });
    } catch (error) {
        console.error('[UserRoutes] Error fetching preferences:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update User Communication Preferences
router.patch('/preferences', auth, async (req, res) => {
    const { whatsappTransactional, whatsappMarketing, pushNotifications } = req.body;
    
    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(whatsappTransactional !== undefined && { whatsappTransactional }),
                ...(whatsappMarketing !== undefined && { whatsappMarketing }),
                ...(pushNotifications !== undefined && { pushNotifications }),
                hasSetPreferences: true, // Mark as set whenever they update
                preferencesUpdatedAt: new Date()
            }
        });

        res.json({ 
            success: true, 
            message: 'Preferences updated successfully',
            preferences: {
                whatsappTransactional: updatedUser.whatsappTransactional,
                whatsappMarketing: updatedUser.whatsappMarketing,
                pushNotifications: updatedUser.pushNotifications,
                hasSetPreferences: updatedUser.hasSetPreferences,
                preferencesUpdatedAt: updatedUser.preferencesUpdatedAt
            }
        });
    } catch (error) {
        console.error('[UserRoutes] Error updating preferences:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
