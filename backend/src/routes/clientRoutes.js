const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// 1. Fetch clients belonging to a specific partner
// Endpoint: GET /api/clients?partnerId=123
router.get('/', async (req, res) => {
    try {
        const { partnerId } = req.query;

        if (!partnerId) {
            return res.status(400).json({ error: "partnerId query parameter is required" });
        }

        const clients = await prisma.client.findMany({
            where: { partnerId },
            orderBy: { name: 'asc' }
        });

        res.json(clients);
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ error: "Failed to fetch clients" });
    }
});

// 2. Add a new Client (walk-in)
// Endpoint: POST /api/clients
router.post('/', async (req, res) => {
    try {
        const { partnerId, name, phone, email } = req.body;

        if (!partnerId || !name || !phone) {
            return res.status(400).json({ error: "partnerId, name, and phone are required" });
        }

        const newClient = await prisma.client.create({
            data: {
                partnerId,
                name,
                phone,
                email
            }
        });

        res.status(201).json(newClient);
    } catch (error) {
        console.error("Error creating client:", error);
        res.status(500).json({ error: "Failed to create client" });
    }
});

module.exports = router;
