const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// Helper: Haversine distance in km
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/bookings/auto-assign
// { serviceIds, serviceMode, location: { city, lat, lng },
//   bookingDate, timeSlot, customerId, guestName, customerPhone }
router.post('/auto-assign', async (req, res) => {
    try {
        const { serviceIds, serviceMode, location, bookingDate, timeSlot, customerId, guestName, customerPhone } = req.body;

        if (!serviceIds?.length || !serviceMode || !bookingDate || !timeSlot) {
            return res.status(400).json({ error: 'serviceIds, serviceMode, bookingDate, and timeSlot are required' });
        }

        // Determine which partner types qualify
        const partnerTypes =
            serviceMode === 'AtHome'
                ? ['Freelancer']
                : ['Male_Salon', 'Female_Salon', 'Unisex_Salon'];

        // Get customer gender if we have a customerId
        let customerGender = null;
        if (customerId) {
            const customer = await prisma.customerProfile.findUnique({ where: { id: customerId } });
            customerGender = customer?.gender;
        }

        // Fetch candidate partners
        let candidates = await prisma.partnerProfile.findMany({
            where: { partnerType: { in: partnerTypes } },
        });

        // Filter candidates based on gender preference
        if (customerGender && customerGender !== 'Other') {
            candidates = candidates.filter(p => {
                if (p.partnerType !== 'Freelancer') return true; // salons don't have this pref limit yet
                const pref = p.workPreferences?.genderPreference;
                if (pref === 'Female Only' && customerGender === 'Male') return false;
                if (pref === 'Male Only' && customerGender === 'Female') return false;
                return true;
            });
        }

        if (!candidates.length) {
            return res.status(422).json({ error: 'NO_PROVIDERS', message: 'No professionals available right now. Please try a different time or location.' });
        }

        // Score by distance (if lat/lng provided) – lower = better
        let scored = candidates.map((p) => {
            const addr = p.address || {};
            const pLat = addr.lat;
            const pLng = addr.lng;
            let dist = 9999;
            if (location?.lat && location?.lng && pLat && pLng) {
                dist = haversineKm(location.lat, location.lng, pLat, pLng);
            }
            return { partner: p, dist };
        });

        scored.sort((a, b) => a.dist - b.dist);
        const best = scored[0].partner;

        // Fetch catalog items for services
        const catalogItems = await prisma.serviceCatalog.findMany({
            where: { id: { in: serviceIds } },
        });

        const services = catalogItems.map((item) => ({
            catalogId: item.id,
            serviceName: item.name,
            quantity: 1,
            priceAtBooking: item.specialPrice || item.defaultPrice,
        }));

        const totalAmount = services.reduce((sum, s) => sum + s.priceAtBooking * s.quantity, 0);

        const booking = await prisma.booking.create({
            data: {
                partnerId: best.id,
                customerId: customerId || null,
                guestName: guestName || null,
                serviceMode,
                status: 'Requested',
                bookingDate: new Date(bookingDate),
                timeSlot,
                services,
                totalAmount,
                bookingCity: location?.city || null,
                bookingLat: location?.lat || null,
                bookingLng: location?.lng || null,
            },
            include: { partner: true, customer: true },
        });

        // WhatsApp confirmation stub – V0: log intent; open via deep-link on client
        const partnerInfo = best.basicInfo || {};
        const providerPhone = partnerInfo.phone || partnerInfo.ownerPhone || null;
        console.log(`[WhatsApp Stub] Booking ${booking.id} – notify customer ${customerPhone} & provider ${providerPhone}`);

        res.status(201).json({
            booking,
            assignedProvider: {
                id: best.id,
                name: partnerInfo.salonName || partnerInfo.name || 'Professional',
                type: best.partnerType,
                area: (best.address || {}).city || '',
                rating: 4.5, // placeholder – will come from reviews in V1
                whatsappPhone: providerPhone,
            },
        });
    } catch (err) {
        console.error('POST /bookings/auto-assign', err);
        res.status(500).json({ error: 'Auto-assignment failed' });
    }
});

// GET /api/bookings – partner dashboard OR customer bookings
// ?partnerId=  OR  ?customerId=
router.get('/', async (req, res) => {
    try {
        const { partnerId, customerId, date } = req.query;

        if (!partnerId && !customerId) {
            return res.status(400).json({ error: 'partnerId or customerId query parameter is required' });
        }

        const whereClause = {};
        if (partnerId) whereClause.partnerId = partnerId;
        if (customerId) whereClause.customerId = customerId;

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            whereClause.bookingDate = { gte: startDate, lte: endDate };
        }

        const bookings = await prisma.booking.findMany({
            where: whereClause,
            include: { client: true, partner: true, customer: true },
            orderBy: { bookingDate: 'asc' },
        });

        res.json(bookings);
    } catch (err) {
        console.error('GET /bookings', err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// GET /api/bookings/:id
router.get('/:id', async (req, res) => {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: req.params.id },
            include: { partner: true, client: true, customer: true },
        });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        console.error('GET /bookings/:id', err);
        res.status(500).json({ error: 'Failed to fetch booking details' });
    }
});

// POST /api/bookings – partner walk-in / manual
router.post('/', async (req, res) => {
    try {
        const { partnerId, clientId, guestName, bookingDate, services, totalAmount, discounts, notes } = req.body;

        if (!partnerId || !bookingDate || !services || totalAmount === undefined) {
            return res.status(400).json({ error: 'Missing required booking fields' });
        }

        const newBooking = await prisma.booking.create({
            data: {
                partnerId,
                clientId: clientId || null,
                guestName: guestName || null,
                bookingDate: new Date(bookingDate),
                services,
                totalAmount,
                discounts: discounts || 0,
                notes: notes || null,
                status: 'Requested',
            },
            include: { client: true },
        });

        res.status(201).json(newBooking);
    } catch (err) {
        console.error('POST /bookings', err);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// PUT /api/bookings/:id/status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['Requested', 'Confirmed', 'Completed', 'Cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const updated = await prisma.booking.update({
            where: { id: req.params.id },
            data: { status },
        });
        res.json(updated);
    } catch (err) {
        console.error('PUT /bookings/:id/status', err);
        res.status(500).json({ error: 'Failed to update booking status' });
    }
});

module.exports = router;
