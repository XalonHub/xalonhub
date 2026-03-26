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

// Logic for Fees & Commissions
// Logic for Fees & Commissions
async function getBookingEconomics(orderSource, partnerType, subtotal) {
    // Defaults (Hardcoded fallbacks)
    let customerFee = 10;
    let commRate = 0;

    try {
        const settings = await prisma.globalSettings.findUnique({ where: { id: 'global' } });
        if (settings) {
            customerFee = settings.platformFee;
            if (orderSource === 'CustomerApp') {
                commRate = (partnerType === 'Freelancer') ? settings.freelancerCommApp / 100 : settings.salonCommApp / 100;
            } else {
                commRate = (partnerType === 'Freelancer') ? settings.freelancerCommMan / 100 : settings.salonCommMan / 100;
            }
        } else {
            // Original hardcoded logic as fallback
            if (orderSource === 'CustomerApp') {
                customerFee = 10;
                commRate = (partnerType === 'Freelancer') ? 0.15 : 0;
            } else {
                customerFee = 0;
                commRate = (partnerType === 'Freelancer') ? 0.10 : 0;
            }
        }
    } catch (err) {
        console.error('[Economics] Error fetching dynamic settings, using fallbacks:', err);
        if (orderSource === 'CustomerApp') {
            customerFee = 10;
            commRate = (partnerType === 'Freelancer') ? 0.15 : 0;
        } else {
            customerFee = 0;
            commRate = (partnerType === 'Freelancer') ? 0.10 : 0;
        }
    }

    const platformCommission = Math.round(subtotal * commRate);
    const totalWithFee = subtotal + customerFee;
    const partnerEarnings = subtotal - platformCommission;

    return {
        platformFee: customerFee,
        platformCommission,
        partnerEarnings
    };
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
            stylistId,
            salonId // Added support for explicit professional selection
        } = req.body;

        console.log('[BACKEND] /auto-assign payload:', JSON.stringify(req.body, null, 2));

        if (!serviceIds?.length || !serviceMode || !bookingDate || !timeSlot) {
            return res.status(400).json({ error: 'serviceIds, serviceMode, bookingDate, and timeSlot are required' });
        }

        // --- AUTO-GUEST CREATION LOGIC ---
        let resolvedGuestId = guestId;
        if (!resolvedGuestId && customerId && beneficiaryName) {
            try {
                const customer = await prisma.customerProfile.findUnique({ where: { id: customerId } });
                if (customer && beneficiaryName.trim().toLowerCase() !== (customer.name || '').trim().toLowerCase()) {
                    const existingGuest = await prisma.userGuest.findFirst({
                        where: { customerId, name: { contains: beneficiaryName.trim(), mode: 'insensitive' } }
                    });
                    if (existingGuest) {
                        resolvedGuestId = existingGuest.id;
                    } else {
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
            } catch (guestErr) {
                console.error('[BACKEND] Guest resolution error:', guestErr);
                // Continue with booking even if guest creation fails
            }
        }
        // ---------------------------------

        // Resolve target gender early for both paths
        let targetGender = serviceGender;
        if (!targetGender && customerId) {
            const customer = await prisma.customerProfile.findUnique({ where: { id: customerId } });
            targetGender = customer?.gender;
        }

        let best;

        if (salonId) {
            // OPTION A: Specific professional selected by user
            console.log(`[BACKEND] Fetching specific professional: ${salonId}`);
            try {
                best = await prisma.partnerProfile.findUnique({
                    where: { id: salonId }
                });
                if (!best) {
                    console.error(`[BACKEND] Specific professional not found: ${salonId}`);
                    return res.status(404).json({ error: 'SELECTED_PROFESSIONAL_NOT_FOUND', message: 'The selected professional could not be found.' });
                }
            } catch (dbErr) {
                console.error(`[BACKEND] Error fetching professional ${salonId}:`, dbErr);
                return res.status(500).json({ error: 'DATABASE_ERROR', message: 'Failed to fetch the selected professional.' });
            }
        } else {
            // OPTION B: Auto-assignment logic
            const { declinedPartnerIds = [] } = req.body;
            const partnerTypes =
                serviceMode === 'AtHome'
                    ? ['Freelancer']
                    : ['Male_Salon', 'Female_Salon', 'Unisex_Salon'];

            let candidates = await prisma.partnerProfile.findMany({
                where: {
                    partnerType: { in: partnerTypes },
                    isOnboarded: true,
                    id: { notIn: declinedPartnerIds } // Filter out those who already declined
                }
            });

            // Filter candidates based on gender preference
            if (targetGender && targetGender !== 'Other') {
                candidates = candidates.filter(p => {
                    if (p.partnerType !== 'Freelancer') return true;

                    // If workPreferences or genderPreference is missing, default to compatible
                    const pref = p.workPreferences?.genderPreference;
                    if (!pref) return true;

                    if (targetGender === 'Female') {
                        return pref === 'Females Only' || pref === 'Everyone';
                    }
                    if (targetGender === 'Male') {
                        return pref === 'Males Only' || pref === 'Everyone';
                    }
                    return true;
                });
            }

            if (!candidates.length) {
                console.log('[BACKEND] No candidates found for targetGender:', targetGender, 'and partnerTypes:', partnerTypes);
                return res.status(422).json({ error: 'NO_PROVIDERS', message: 'No professionals available right now.' });
            }

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

            best = finalCandidates[0].partner;
        }

        // Fetch catalog items for services to get durations
        const catalogItems = await prisma.serviceCatalog.findMany({
            where: { id: { in: serviceIds } },
        });

        const services = catalogItems.map((item) => {
            let price = item.defaultPrice;
            
            if (best.partnerType === 'Freelancer') {
                // Freelancers: Use role-specific admin pricing if it exists
                const rolePricing = item.pricingByRole;
                if (rolePricing && typeof rolePricing === 'object' && rolePricing['Freelancer']) {
                    const roleEntry = rolePricing['Freelancer'];
                    price = roleEntry.defaultPrice ?? item.defaultPrice;
                }
            } else {
                // Salons: Use their custom salonServices mapping
                const sServices = Array.isArray(best.salonServices) ? best.salonServices : [];
                const customMapping = sServices.find(ss => ss.serviceId === item.id);
                
                if (customMapping && customMapping.price) {
                    price = customMapping.price;
                } else {
                    // NO FALLBACK for salons as per user request
                    console.error(`[Booking] Salon ${best.id} missing price for service ${item.id}`);
                    price = null; 
                }
            }

            return {
                catalogId: item.id,
                serviceName: item.name,
                quantity: 1,
                priceAtBooking: price,
                duration: item.duration
            };
        }).filter(s => s.priceAtBooking !== null); // Filter out services with no valid price

        const totalSubtotal = services.reduce((sum, s) => sum + s.priceAtBooking * s.quantity, 0);
        const { platformFee, platformCommission, partnerEarnings } = await getBookingEconomics('CustomerApp', best.partnerType, totalSubtotal);
        const totalAmount = totalSubtotal + platformFee;

        let stylistNameAtBooking = null;
        if (stylistId) {
            const stylist = await prisma.stylist.findUnique({ where: { id: stylistId } });
            if (stylist) stylistNameAtBooking = stylist.name;
        }

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
                platformFee,
                partnerEarnings,
                bookingCity: location?.city || null,
                bookingLat: location?.lat || null,
                bookingLng: location?.lng || null,
                serviceGender: targetGender || null,
                beneficiaryName: beneficiaryName || null,
                beneficiaryPhone: beneficiaryPhone || null,
                stylistId: stylistId || null,
                stylistNameAtBooking: stylistNameAtBooking,
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
                rating: best.averageRating ?? 0, // live from reviews
                whatsappPhone: providerPhone,
                coverImage: best.salonCover?.outside?.[0] || best.salonCover?.inside?.[0] || partnerInfo.profileImg || best.coverImages?.[0] || null,
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
        const { 
            partnerId, 
            clientId, 
            guestId, 
            guestName, 
            bookingDate, 
            timeSlot,
            services, 
            totalAmount, 
            discounts, 
            notes, 
            stylistId,
            beneficiaryName,
            beneficiaryPhone 
        } = req.body;

        if (!partnerId || !bookingDate || !services || totalAmount === undefined) {
            return res.status(400).json({ error: 'Missing required booking fields' });
        }

        const partner = await prisma.partnerProfile.findUnique({ where: { id: partnerId } });
        if (!partner) return res.status(404).json({ error: 'Partner not found' });

        let stylistNameAtBooking = null;
        if (stylistId) {
            const stylist = await prisma.stylist.findUnique({ where: { id: stylistId } });
            if (stylist) stylistNameAtBooking = stylist.name;
        }

        const { platformFee, platformCommission, partnerEarnings } = await getBookingEconomics('Manual', partner.partnerType, totalAmount);

        const newBooking = await prisma.booking.create({
            data: {
                partnerId,
                customerId: req.body.customerId || null,
                clientId: clientId || null,
                guestId: guestId || null,
                guestName: guestName || null,
                bookingDate: new Date(bookingDate),
                timeSlot: timeSlot || null,
                services,
                totalAmount: totalAmount + platformFee,
                platformFee,
                partnerEarnings,
                discounts: discounts || 0,
                notes: notes || null,
                status: 'Confirmed',
                stylistId: stylistId || null,
                stylistNameAtBooking: stylistNameAtBooking,
                beneficiaryName: beneficiaryName || guestName || null,
                beneficiaryPhone: beneficiaryPhone || null
            },
            include: { client: true, stylist: true, customer: true, guest: true },
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
        const { status, stylistId, paymentConfirmed } = req.body;
        const allowedStatuses = ['Requested', 'Confirmed', 'InProgress', 'Completed', 'Cancelled'];
        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (stylistId) {
            updateData.stylistId = stylistId;
            const stylist = await prisma.stylist.findUnique({ where: { id: stylistId } });
            if (stylist) updateData.stylistNameAtBooking = stylist.name;
        }

        if (status === 'Completed' && paymentConfirmed) {
            updateData.paymentStatus = 'Paid';
            updateData.partnerConfirmedReceipt = true;
        }

        const updated = await prisma.booking.update({
            where: { id: req.params.id },
            data: updateData,
        });
        res.json(updated);
    } catch (err) {
        console.error('PUT /bookings/:id/status', err);
        res.status(500).json({ error: 'Failed to update booking status' });
    }
});

// 15. Decline & Reassign
// Endpoint: PUT /api/bookings/:id/decline
router.put('/:id/decline', async (req, res) => {
    try {
        const { id } = req.params;
        const { partnerId } = req.body;

        const booking = await prisma.booking.findUnique({
            where: { id },
            // Removed invalid include for Json field 'services'
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.status !== 'Requested') return res.status(400).json({ error: 'Only requested bookings can be declined' });

        // Add current partner to declined list
        const updatedDeclined = [...new Set([...(booking.declinedPartnerIds || []), partnerId])];

        // --- RE-ASSIGNMENT LOGIC (Simplified call to auto-assign logic) ---
        // We reuse the candidate finding logic here or slightly differently
        const partnerTypes = booking.serviceMode === 'AtHome' ? ['Freelancer'] : ['Male_Salon', 'Female_Salon', 'Unisex_Salon'];

        let candidates = await prisma.partnerProfile.findMany({
            where: {
                partnerType: { in: partnerTypes },
                isOnboarded: true,
                id: { notIn: updatedDeclined }
            }
        });

        // Filter by gender if needed (similar to /auto-assign)
        // For brevity, we'll just check if we have anyone left.
        // In a perfect world, we'd refactor the scoring into a shared helper.

        if (!candidates.length) {
            // No one else available, cancel booking
            const cancelled = await prisma.booking.update({
                where: { id },
                data: {
                    status: 'Cancelled',
                    declinedPartnerIds: updatedDeclined
                }
            });
            return res.json({ status: 'Cancelled', message: 'No other professionals available.', booking: cancelled });
        }

        // Score and pick next best
        // (Re-using a simplified version of the scoring)
        const scored = candidates.map(p => {
            const partnerAddress = p.address || {};
            const dist = booking.bookingLat ? haversineKm(booking.bookingLat, booking.bookingLng, partnerAddress.lat || 0, partnerAddress.lng || 0) : 0;
            return { partner: p, dist };
        });

        scored.sort((a, b) => a.dist - b.dist);
        const nextBest = scored[0].partner;

        const reassigned = await prisma.booking.update({
            where: { id },
            data: {
                partnerId: nextBest.id,
                declinedPartnerIds: updatedDeclined,
                status: 'Requested' // Keep as requested for the new partner
            }
        });

        console.log(`[BACKEND] Booking ${id} reassigned from ${partnerId} to ${nextBest.id}`);
        res.json({ status: 'Requested', message: 'Booking reassigned to next best partner', booking: reassigned });
    } catch (error) {
        console.error('[BACKEND] Decline error:', error);
        res.status(500).json({ error: 'Failed to decline and reassign' });
    }
});

module.exports = router;
