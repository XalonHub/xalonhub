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
//   bookingDate, timeSlot, customerId, guestId, guestName, customerPhone,
//   serviceGender, beneficiaryName, beneficiaryPhone }
router.post('/auto-assign', async (req, res) => {
    try {
        const {
            serviceIds,
            serviceMode,
            location,
            bookingDate,
            timeSlot,
            customerId,
            guestId,
            guestName,
            customerPhone,
            serviceGender,
            beneficiaryName,
            beneficiaryPhone,
            stylistId
        } = req.body;

        if (!serviceIds?.length || !serviceMode || !bookingDate || !timeSlot) {
            return res.status(400).json({ error: 'serviceIds, serviceMode, bookingDate, and timeSlot are required' });
        }

        // --- AUTO-GUEST CREATION LOGIC ---
        let resolvedGuestId = guestId;
        if (!resolvedGuestId && customerId && beneficiaryName) {
            const customer = await prisma.customerProfile.findUnique({ where: { id: customerId } });
            // Only auto-create if it's NOT the customer's own name
            if (customer && beneficiaryName.trim().toLowerCase() !== (customer.name || '').trim().toLowerCase()) {
                // Check if this guest exists already for this customer
                const existingGuest = await prisma.userGuest.findFirst({
                    where: { customerId, name: { contains: beneficiaryName.trim(), mode: 'insensitive' } }
                });

                if (existingGuest) {
                    resolvedGuestId = existingGuest.id;
                } else {
                    // Create new guest profile automatically
                    const newGuest = await prisma.userGuest.create({
                        data: {
                            customerId,
                            name: beneficiaryName.trim(),
                            mobileNumber: beneficiaryPhone || null,
                            relationship: 'Other'
                        }
                    });
                    resolvedGuestId = newGuest.id;
                    console.log(`[BACKEND] Auto-created guest profile for ${beneficiaryName} (ID: ${resolvedGuestId})`);
                }
            }
        }
        // ---------------------------------

        // Determine which partner types qualify
        const partnerTypes =
            serviceMode === 'AtHome'
                ? ['Freelancer']
                : ['Male_Salon', 'Female_Salon', 'Unisex_Salon'];

        // Use serviceGender for assignment. Fallback to customer gender if not provided
        let targetGender = serviceGender;
        if (!targetGender && customerId) {
            const customer = await prisma.customerProfile.findUnique({ where: { id: customerId } });
            targetGender = customer?.gender;
        }

        // Fetch candidate partners
        let candidates = await prisma.partnerProfile.findMany({
            where: {
                partnerType: { in: partnerTypes },
                isOnboarded: true
            },
        });

        // Filter candidates based on gender preference
        if (targetGender && targetGender !== 'Other') {
            candidates = candidates.filter(p => {
                if (p.partnerType !== 'Freelancer') return true; // salons handled by type usually
                const pref = p.workPreferences?.genderPreference;

                if (targetGender === 'Female') {
                    return pref === 'Females Only' || pref === 'Everyone';
                }
                if (targetGender === 'Male') {
                    return pref === 'Males Only' || pref === 'Everyone';
                }
                if (targetGender === 'Unisex') {
                    return pref === 'Everyone';
                }
                return true;
            });
        }

        if (!candidates.length) {
            return res.status(422).json({ error: 'NO_PROVIDERS', message: 'No professionals available right now. Please try a different time or location.' });
        }

        // Rank candidates:
        // 1. Distance (already calculated)
        // 2. Load (number of Requested/Confirmed bookings today)
        // 3. (Future) Cancellation rate

        const scored = candidates.map(p => {
            const partnerAddress = p.address || {};
            const dist = location ? haversineKm(location.lat, location.lng, partnerAddress.lat || 0, partnerAddress.lng || 0) : 0;
            return { partner: p, dist };
        });

        let finalCandidates = await Promise.all(scored.map(async (s) => {
            const load = await prisma.booking.count({
                where: {
                    partnerId: s.partner.id,
                    bookingDate: {
                        gte: new Date(new Date(bookingDate).setHours(0, 0, 0, 0)),
                        lte: new Date(new Date(bookingDate).setHours(23, 59, 59, 999))
                    },
                    status: { in: ['Requested', 'Confirmed'] }
                }
            });
            return { ...s, load };
        }));

        finalCandidates.sort((a, b) => {
            if (a.dist !== b.dist) return a.dist - b.dist;
            return a.load - b.load;
        });

        const best = finalCandidates[0].partner;

        // Fetch catalog items for services to get durations
        const catalogItems = await prisma.serviceCatalog.findMany({
            where: { id: { in: serviceIds } },
        });

        const services = catalogItems.map((item) => ({
            catalogId: item.id,
            serviceName: item.name,
            quantity: 1,
            priceAtBooking: item.specialPrice || item.defaultPrice,
            duration: item.duration
        }));

        const totalAmount = services.reduce((sum, s) => sum + s.priceAtBooking * s.quantity, 0);

        // Create booking with SoftLocked status (5 min window)
        const booking = await prisma.booking.create({
            data: {
                partnerId: best.id,
                customerId: customerId || null,
                guestId: resolvedGuestId || null,
                guestName: guestName || null,
                serviceMode,
                status: 'Requested', // Keep as Requested but update partner soft-lock
                bookingDate: new Date(bookingDate),
                timeSlot,
                services,
                totalAmount,
                bookingCity: location?.city || null,
                bookingLat: location?.lat || null,
                bookingLng: location?.lng || null,
                serviceGender: targetGender || null,
                beneficiaryName: beneficiaryName || null,
                beneficiaryPhone: beneficiaryPhone || null,
                stylistId: stylistId || null,
            },
            include: { partner: true, customer: true, stylist: true },
        });

        // Set Soft Lock on Partner
        const softLockUntil = new Date(Date.now() + 5 * 60 * 1000);
        await prisma.partnerProfile.update({
            where: { id: best.id },
            data: {
                softLockUntil,
                softLockBookingId: booking.id
            }
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
            include: { client: true, partner: true, customer: true, guest: true, stylist: true },
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
            include: { partner: true, client: true, customer: true, guest: true, stylist: true },
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
        const { partnerId, clientId, guestId, guestName, bookingDate, services, totalAmount, discounts, notes } = req.body;

        if (!partnerId || !bookingDate || !services || totalAmount === undefined) {
            return res.status(400).json({ error: 'Missing required booking fields' });
        }

        const newBooking = await prisma.booking.create({
            data: {
                partnerId,
                clientId: clientId || null,
                guestId: guestId || null,
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
