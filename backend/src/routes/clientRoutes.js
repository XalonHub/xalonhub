const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { findIdentity, normalizePhone } = require('../utils/identityHelper');

// 1. Lookup Identity by phone
// Endpoint: GET /api/clients/lookup?phone=9988776655
router.get('/lookup', async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) return res.status(400).json({ error: "phone query parameter is required" });

        const identity = await findIdentity(phone);
        if (!identity) {
            return res.status(404).json({ message: "No identity found for this phone number" });
        }

        // Return simplified identity for frontend
        // IMPORTANT: For 'User' types, we MUST return the customerProfile.id as that is what Booking.customerId expects.
        const finalId = identity.type === 'User' ? identity.data.customerProfile?.id : identity.data.id;

        res.json({
            id: finalId,
            name: identity.name,
            phone: phone,
            type: identity.type === 'User' ? 'Member' : (identity.type === 'Client' ? 'Walk-in' : 'Guest'),
            email: identity.data.email || null,
            profileImg: identity.type === 'User' ? identity.data.customerProfile?.profileImage : null
        });
    } catch (error) {
        console.error("Error in client lookup:", error);
        res.status(500).json({ error: "Internal server error during lookup" });
    }
});

// 2. Fetch clients belonging to a specific partner
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

// 3. Add a new Client (walk-in)
// Endpoint: POST /api/clients
router.post('/', async (req, res) => {
    try {
        const { partnerId, name, phone, email } = req.body;

        if (!partnerId || !phone) {
            return res.status(400).json({ error: "partnerId and phone are required" });
        }

        const { lookup, storage } = normalizePhone(phone);

        // 1. Check if this client ALREADY exists for THIS partner
        const existingLocal = await prisma.client.findFirst({
            where: { partnerId, phone: { endsWith: lookup } }
        });
        if (existingLocal) {
            return res.status(200).json(existingLocal); // Already exists here
        }

        // 2. Check for Global Identity (Smart Add)
        // If the user didn't provide a name, we MUST look it up
        const identity = await findIdentity(phone);
        
        if (identity && !name) {
            // Return found identity to the frontend for confirmation
            return res.status(200).json({
                message: "Identity found in Xalon network",
                suggestedData: {
                    name: identity.name,
                    email: identity.data.email || null,
                    type: identity.type
                }
            });
        }

        // 3. Create new Client record
        const finalName = name || (identity ? identity.name : 'New Client');
        const newClient = await prisma.client.create({
            data: {
                partnerId,
                name: finalName,
                phone: storage, // Store with country code
                email: email || (identity ? identity.data.email : null)
            }
        });

        res.status(201).json(newClient);
    } catch (error) {
        console.error("Error creating client:", error);
        res.status(500).json({ error: "Failed to create client" });
    }
});

module.exports = router;
