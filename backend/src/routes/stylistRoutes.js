const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

const { mapStylistDocs } = require('../utils/cloudinaryHelper');

// 1. Fetch all stylists for a salon
// GET /api/stylists/:partnerId
router.get('/:partnerId', async (req, res) => {
    try {
        const { partnerId } = req.params;
        const stylists = await prisma.stylist.findMany({
            where: { partnerId, isActive: true },
            orderBy: { createdAt: 'asc' }
        });
        
        res.json(stylists.map(mapStylistDocs));
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

        if (!partnerId) return res.status(400).json({ error: "partnerId is required" });
        
        const nameTrimmed = (name || "").trim();
        if (!nameTrimmed || nameTrimmed.length < 2) return res.status(400).json({ error: "Name must be at least 2 characters" });
        if (nameTrimmed.length > 50) return res.status(400).json({ error: "Name cannot exceed 50 characters" });
        if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) return res.status(400).json({ error: "Name should only contain letters and spaces" });

        const phoneTrimmed = (phone || "").trim();
        if (phoneTrimmed && !/^[6-9]\d{9}$/.test(phoneTrimmed)) return res.status(400).json({ error: "Invalid 10-digit mobile number" });

        if (!experience) return res.status(400).json({ error: "Experience is required" });
        const expNum = parseInt(experience);
        if (isNaN(expNum) || expNum < 0 || expNum > 99) return res.status(400).json({ error: "Experience must be between 0 and 99" });

        if (!Array.isArray(categories) || categories.length === 0) return res.status(400).json({ error: "At least one specialization is required" });

        if (!gender || !['Male', 'Female', 'Other'].includes(gender)) return res.status(400).json({ error: "Invalid gender selection" });

        const stylist = await prisma.stylist.create({
            data: {
                partnerId,
                name,
                phone,
                categories: Array.isArray(categories) ? categories.map(c => typeof c === 'string' ? c : (c.name || String(c))) : [],
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

        // Validation for Updates
        if (name !== undefined) {
            const nameTrimmed = name.trim();
            if (nameTrimmed.length < 2) return res.status(400).json({ error: "Name must be at least 2 characters" });
            if (nameTrimmed.length > 50) return res.status(400).json({ error: "Name cannot exceed 50 characters" });
            if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) return res.status(400).json({ error: "Name should only contain letters and spaces" });
        }

        if (phone) {
            const phoneTrimmed = phone.trim();
            if (!/^[6-9]\d{9}$/.test(phoneTrimmed)) return res.status(400).json({ error: "Invalid 10-digit mobile number" });
        }

        if (experience !== undefined) {
            const expNum = parseInt(experience);
            if (isNaN(expNum) || expNum < 0 || expNum > 99) return res.status(400).json({ error: "Experience must be between 0 and 99" });
        }

        if (categories !== undefined && (!Array.isArray(categories) || categories.length === 0)) {
            return res.status(400).json({ error: "At least one specialization is required" });
        }

        if (gender !== undefined && !['Male', 'Female', 'Other'].includes(gender)) {
            return res.status(400).json({ error: "Invalid gender selection" });
        }

        const stylist = await prisma.stylist.update({
            where: { id },
            data: {
                name,
                phone,
                categories: Array.isArray(categories) ? categories.map(c => typeof c === 'string' ? c : (c.name || String(c))) : undefined,
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
