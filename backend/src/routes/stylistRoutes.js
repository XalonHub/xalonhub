const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// 1. Fetch all stylists for a salon
// GET /api/stylists/:partnerId
router.get('/:partnerId', async (req, res) => {
    try {
        const { partnerId } = req.params;
        const stylists = await prisma.stylist.findMany({
            where: { partnerId, isActive: true },
            orderBy: { createdAt: 'asc' }
        });
        res.json(stylists);
    } catch (error) {
        console.error("Error fetching stylists:", error);
        res.status(500).json({ error: "Failed to fetch stylists" });
    }
});

// 2. Add a new stylist
// POST /api/stylists
router.post('/', async (req, res) => {
    try {
        const { partnerId, name, phone, categories, gender, experience, bio, profileImage } = req.body;

        if (!partnerId || !name) {
            return res.status(400).json({ error: "partnerId and name are required" });
        }

        const stylist = await prisma.stylist.create({
            data: {
                partnerId,
                name,
                phone,
                categories: categories || [],
                gender,
                experience,
                bio,
                profileImage
            }
        });

        res.status(201).json(stylist);
    } catch (error) {
        console.error("Error creating stylist:", error);
        res.status(500).json({ error: "Failed to create stylist" });
    }
});

// 3. Update stylist details
// PUT /api/stylists/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, categories, gender, experience, bio, profileImage, isActive } = req.body;

        const stylist = await prisma.stylist.update({
            where: { id },
            data: {
                name,
                phone,
                categories,
                gender,
                experience,
                bio,
                profileImage,
                isActive
            }
        });

        res.json(stylist);
    } catch (error) {
        console.error("Error updating stylist:", error);
        res.status(500).json({ error: "Failed to update stylist" });
    }
});

// 4. Delete stylist (soft delete or hard delete?)
// For now, let's do hard delete as requested in plan "Remove a stylist"
// DELETE /api/stylists/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.stylist.delete({
            where: { id }
        });
        res.json({ success: true, message: "Stylist removed successfully" });
    } catch (error) {
        console.error("Error deleting stylist:", error);
        res.status(500).json({ error: "Failed to delete stylist" });
    }
});

module.exports = router;
