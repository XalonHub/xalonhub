const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// 1. Fetch all partners/salons (for Customer App home/search)
// Endpoint: GET /api/partners
router.get('/', async (req, res) => {
    try {
        const { type, customerGender } = req.query; // e.g. 'Male_Salon', 'Freelancer'

        const whereClause = type ? { partnerType: type } : {};

        const profiles = await prisma.partnerProfile.findMany({
            where: whereClause,
            include: { user: true }
            // In a real scenario we'd do geolocation, but for now we fetch all
        });

        // The filtering logic for "unreachable partners (offline today)" has been removed.
        // All partners will remain visible so customers can book for future dates.
        let filteredProfiles = profiles;

        if (customerGender && customerGender !== 'Other') { // Only filter if we know the customer is strictly Male or Female
            filteredProfiles = filteredProfiles.filter(profile => {
                // If they are not a freelancer, don't filter them out based on this preference
                if (profile.partnerType !== 'Freelancer') return true;

                const workPrefs = profile.workPreferences || {};
                const pref = workPrefs.genderPreference;

                // If freelancer prefers Females Only, but customer is Male -> hide them
                if (pref === 'Female Only' && customerGender === 'Male') return false;
                // If freelancer prefers Males Only, but customer is Female -> hide them
                if (pref === 'Male Only' && customerGender === 'Female') return false;

                // Otherwise, they are a match (or preference is Anyone/undefined)
                return true;
            });
        }

        res.json(filteredProfiles);
    } catch (error) {
        console.error("Error fetching partners:", error);
        res.status(500).json({ error: "Failed to fetch partners" });
    }
});

// 2. Fetch complete partner dashboard profile
// Endpoint: GET /api/partners/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        let profile = await prisma.partnerProfile.findUnique({
            where: { id },
            include: { user: true, stylists: true }
        });

        if (!profile) {
            return res.status(404).json({ error: "Partner profile not found" });
        }

        // Midnight Reset Logic: If status is offline but it's a new day, reset to online
        const now = new Date();
        const lastUpdate = new Date(profile.lastStatusUpdate || profile.updatedAt);
        const isSameDay = now.toDateString() === lastUpdate.toDateString();

        if (!profile.isOnline && !isSameDay) {
            profile = await prisma.partnerProfile.update({
                where: { id },
                data: { isOnline: true, lastStatusUpdate: now },
                include: { user: true, stylists: true }
            });
        }

        res.json(profile);
    } catch (error) {
        console.error("Error fetching partner profile:", error);
        res.status(500).json({ error: "Failed to fetch partner profile" });
    }
});

// 2. Update Basic Info (Minimal Write allowed by user)
// Endpoint: PUT /api/partners/:id/basic-info
router.put('/:id/basic-info', async (req, res) => {
    try {
        const { id } = req.params;
        const basicInfo = req.body;

        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: { basicInfo }
        });

        res.json(profile);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Failed to update basic info" });
    }
});

// 3. Update KYC Documents
// Endpoint: PUT /api/partners/:id/documents
router.put('/:id/documents', async (req, res) => {
    try {
        const { id } = req.params;
        const newDocs = req.body; // { kycStatus, submittedAt, policeCertDocId, ... }

        const existing = await prisma.partnerProfile.findUnique({
            where: { id },
            select: { documents: true }
        });
        if (!existing) return res.status(404).json({ error: 'Partner not found' });

        // Merge: preserve existing doc fields, overwrite what's provided
        const mergedDocs = {
            ...(existing.documents || {}),
            ...newDocs,
            kycStatus: newDocs.kycStatus || 'pending',
        };

        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: { documents: mergedDocs }
        });

        console.log(`[KYC] partner:${id} submitted documents at ${new Date().toISOString()}`);
        res.json({ success: true, documents: profile.documents });
    } catch (error) {
        console.error('Error updating documents:', error);
        res.status(500).json({ error: 'Failed to update documents' });
    }
});

async function getOrCreateUser(phone) {
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
        user = await prisma.user.create({ data: { phone } });
    }
    return user;
}

// 4. Initialize Onboarding Profile
router.post('/init', async (req, res) => {
    try {
        const { phone, partnerType } = req.body;
        if (!phone || !partnerType) return res.status(400).json({ error: "phone and partnerType required" });

        const user = await getOrCreateUser(phone);

        let profile = await prisma.partnerProfile.findUnique({ where: { userId: user.id } });
        if (profile) return res.status(400).json({ error: "Profile already exists", profile });

        profile = await prisma.partnerProfile.create({
            data: {
                userId: user.id,
                partnerType
            }
        });

        // Sync the base User.role with the selected partnerType
        await prisma.user.update({
            where: { id: user.id },
            data: { role: partnerType }
        });

        res.status(201).json(profile);
    } catch (error) {
        console.error("Init Error:", error);
        res.status(500).json({ error: "Failed to init profile" });
    }
});

// 5. Update Address
router.put('/:id/address', async (req, res) => {
    try {
        const { id } = req.params;
        const address = req.body;

        if (!address || Object.keys(address).length === 0) {
            return res.status(400).json({ error: 'Address data is empty' });
        }

        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: { address }
        });

        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to update address" });
    }
});

// 5.1 Update Contract Acceptance
router.put('/:id/contract', async (req, res) => {
    try {
        const { id } = req.params;
        const { contractAccepted } = req.body;

        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: {
                contractAccepted: !!contractAccepted,
                contractAcceptedAt: contractAccepted ? new Date() : null
            }
        });

        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to update contract status" });
    }
});

// 6. Update Preferences & Categories
router.put('/:id/preferences', async (req, res) => {
    try {
        const { id } = req.params;
        const { workPreferences, categories } = req.body;

        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: { workPreferences, categories: categories || [] }
        });

        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to update preferences" });
    }
});

// 7. Update Working Hours
router.put('/:id/hours', async (req, res) => {
    try {
        const { id } = req.params;
        const workingHours = req.body.workingHours;

        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: { workingHours }
        });

        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to update hours" });
    }
});

// 8. Update Documents / KYC (Already handled above at route #3)

// 9. Update Professional Details (Social links)
router.put('/:id/professional', async (req, res) => {
    try {
        const { id } = req.params;
        const professionalDetails = req.body;

        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: { professionalDetails }
        });

        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to update professional details" });
    }
});

// 10. Map Services (SalonServiceSetupScreen)
router.put('/:id/services', async (req, res) => {
    try {
        const { id } = req.params;
        const salonServices = req.body.salonServices; // array of mappings

        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: { salonServices }
        });

        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to update services" });
    }
});

// 11. Update Cover Images
router.put('/:id/cover-images', async (req, res) => {
    try {
        const { id } = req.params;
        const { coverImages } = req.body;

        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: { coverImages }
        });

        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to update cover images" });
    }
});

// 12. Update Structured Salon Cover (Inside/Outside arrays)
router.put('/:id/salon-cover', async (req, res) => {
    try {
        const { id } = req.params;
        const salonCover = req.body; // { inside: [], outside: [] }

        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: { salonCover }
        });

        res.json(profile);
    } catch (error) {
        console.error("Salon cover update error:", error);
        res.status(500).json({ error: "Failed to update salon cover" });
    }
});

// 13. Mark Onboarding as Complete
router.put('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: { isOnboarded: true }
        });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to complete onboarding" });
    }
});

// 14. Accept Contract
router.put('/:id/contract', async (req, res) => {
    try {
        const { id } = req.params;
        const { contractAccepted } = req.body;
        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: {
                contractAccepted,
                contractAcceptedAt: contractAccepted ? new Date() : null
            }
        });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to update contract status" });
    }
});

// 15. Get My Profile (using current user phone)
router.get('/me/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const profile = await prisma.partnerProfile.findFirst({
            where: { user: { phone } },
            include: { user: true }
        });

        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// 16. Update Online/Offline Status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { isOnline } = req.body;

        const profile = await prisma.partnerProfile.update({
            where: { id },
            data: {
                isOnline: !!isOnline,
                lastStatusUpdate: new Date()
            }
        });

        res.json({ success: true, isOnline: profile.isOnline });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ error: "Failed to update status" });
    }
});

module.exports = router;
