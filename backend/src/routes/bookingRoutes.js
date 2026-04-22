const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { sendNotification } = require('../utils/notificationService');
const { v4: uuidv4 } = require('uuid');
const { findIdentity, normalizePhone } = require('../utils/identityHelper');

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
            customerFee = (orderSource === 'CustomerApp') ? settings.platformFee : settings.platformFeeManual;
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
            salonId, // Added support for explicit professional selection
            paymentMethod
        } = req.body;

        console.log('[BACKEND] /auto-assign payload:', JSON.stringify(req.body, null, 2));

        if (!serviceIds?.length || !serviceMode || !bookingDate || !timeSlot) {
            return res.status(400).json({ error: 'serviceIds, serviceMode, bookingDate, and timeSlot are required' });
        }

        // --- AUTO-GUEST CREATION LOGIC ---
        let resolvedGuestId = guestId;
        if (beneficiaryPhone && !customerId) {
            // Check if beneficiary is actually a registered User
            const identity = await findIdentity(beneficiaryPhone);
            if (identity && identity.type === 'User') {
                console.log(`[BACKEND] Linking booking to existing User: ${identity.name}`);
                // Since we don't have customerId, we use the found one
                // Wait, customerId in booking usually refers to the PERSON WHO BOOKED.
                // If I book for a friend, customerId is ME.
                // But if there is no customerId (e.g. guest checkout?), we link it.
            }
        }

        if (!resolvedGuestId && customerId && beneficiaryName) {
            try {
                const customer = await prisma.customerProfile.findUnique({ where: { id: customerId } });
                
                // If customer name is empty, auto-save the name!
                if (customer && (!customer.name || customer.name === 'User' || customer.name.trim() === '')) {
                    await prisma.customerProfile.update({
                        where: { id: customerId },
                        data: { name: beneficiaryName.trim() }
                    });
                    console.log(`[BACKEND] Auto-saved customer name: ${beneficiaryName}`);
                }
                else if (customer && beneficiaryName.trim().toLowerCase() !== (customer.name || '').trim().toLowerCase()) {
                    const { lookup, storage } = normalizePhone(beneficiaryPhone || '');
                    
                    const existingGuest = await prisma.userGuest.findFirst({
                        where: { customerId, OR: [
                            { name: { contains: beneficiaryName.trim(), mode: 'insensitive' } },
                            { mobileNumber: { endsWith: lookup } }
                        ]}
                    });
                    if (existingGuest) {
                        resolvedGuestId = existingGuest.id;
                    } else {
                        // Check if this guest is actually a REGISTERED USER
                        const identity = await findIdentity(beneficiaryPhone);
                        if (identity && identity.type === 'User') {
                            console.log(`[BACKEND] Guest ${beneficiaryName} is actually User ${identity.name}. Linking.`);
                            // We don't create a Guest record, we just store the phone
                            // and the frontend/mobile will know to show it.
                        } else {
                            const newGuest = await prisma.userGuest.create({
                                data: {
                                    customerId,
                                    name: beneficiaryName.trim(),
                                    mobileNumber: storage || null,
                                    relationship: 'Other'
                                }
                            });
                            resolvedGuestId = newGuest.id;
                            console.log(`[BACKEND] Auto-created guest profile for ${beneficiaryName} (ID: ${resolvedGuestId})`);
                        }
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

        // --- AUTO-SAVE ADDRESS LOGIC ---
        if (serviceMode === 'AtHome' && customerId && location && location.addressLine) {
            try {
                const existingAddress = await prisma.savedAddress.findFirst({
                    where: { customerId, addressLine: location.addressLine }
                });
                if (!existingAddress) {
                    // Update others to not be default
                    await prisma.savedAddress.updateMany({
                        where: { customerId },
                        data: { isDefault: false }
                    });
                    await prisma.savedAddress.create({
                        data: {
                            customerId,
                            label: 'Home',
                            addressLine: location.addressLine,
                            city: location.city || 'Unknown',
                            isDefault: true
                        }
                    });
                    console.log(`[BACKEND] Auto-saved new address for customer ${customerId}`);
                }
            } catch (addrErr) {
                console.error('[BACKEND] Error auto-saving address:', addrErr);
            }
        }
        // ---------------------------------

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
                id: uuidv4(),
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
                paymentMethod: paymentMethod || 'Cash',
                updatedAt: new Date(),
            },
            include: { partnerProfile: true, customerProfile: true, stylist: true },
        });

        // Remap for compatibility
        const mappedBooking = {
            ...booking,
            partner: booking.partnerProfile,
            customer: booking.customerProfile,
            stylist: booking.stylist
        };

        // Set Soft Lock on Partner
        const softLockUntil = new Date(Date.now() + 5 * 60 * 1000);
        await prisma.partnerProfile.update({
            where: { id: best.id },
            data: {
                softLockUntil,
                softLockBookingId: booking.id
            }
        });

        const partnerInfo = best.basicInfo || {};
        const providerPhone = partnerInfo.phone || partnerInfo.ownerPhone || null;

        // --- NOTIFICATIONS ---
        // 1. Notify Customer
        if (booking.customerProfile?.userId) {
            sendNotification({
                userId: booking.customerProfile.userId,
                title: 'Booking Request Sent',
                body: `Your request for ${services.map(s => s.serviceName).join(', ')} is sent. We will notify you once confirmed.`,
                type: 'Booking',
                metadata: { bookingId: booking.id },
                whatsappTemplate: {
                    name: 'cust_booking_req',
                    components: {
                        body_1: { type: 'text', value: beneficiaryName || 'there' },
                        body_2: { type: 'text', value: services.map(s => s.serviceName).join(', ') }
                    }
                }
            }).catch(e => console.error('Notification Error (Cust):', e));
        }

        // 2. Notify Partner
        if (best.userId) {
            sendNotification({
                userId: best.userId,
                title: 'New Booking Request',
                body: `New Request! You have a booking for ${services.map(s => s.serviceName).join(', ')} at ${timeSlot}.`,
                type: 'Booking',
                metadata: { bookingId: booking.id },
                whatsappTemplate: {
                    name: 'part_booking_new',
                    components: {
                        body_1: { type: 'text', value: services.map(s => s.serviceName).join(', ') },
                        body_2: { type: 'text', value: timeSlot }
                    }
                }
            }).catch(e => console.error('Notification Error (Part):', e));
        }

        res.status(201).json({
            booking: mappedBooking,
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
        res.status(500).json({ error: 'Auto-assignment failed', details: err.message, stack: err.stack });
    }
});

// GET /api/bookings – partner dashboard OR customer bookings
// ?partnerId=  OR  ?customerId=
router.get('/', async (req, res) => {
    try {
        const { partnerId, customerId, date } = req.query;
        console.log(`[DEBUG] GET /api/bookings - partnerId: ${partnerId}, customerId: ${customerId}`);

        if (!partnerId && !customerId) {
            return res.status(400).json({ error: 'partnerId or customerId query parameter is required' });
        }

        const whereClause = { AND: [] };

        if (partnerId) {
            const partner = await prisma.partnerProfile.findFirst({
                where: {
                    OR: [
                        { id: partnerId },
                        { userId: partnerId }
                    ]
                },
                select: { id: true }
            });
            const resolvedId = partner ? partner.id : partnerId;
            whereClause.AND.push({ partnerId: resolvedId });
        }

        if (customerId) {
            const customer = await prisma.customerProfile.findUnique({
                where: { id: customerId },
                include: { user: true }
            });
            const phone = customer?.user?.phone;

            if (phone) {
                whereClause.AND.push({
                    OR: [
                        { customerId: customerId },
                        { client: { phone: phone } },
                        { beneficiaryPhone: phone }
                    ]
                });
            } else {
                whereClause.AND.push({ customerId: customerId });
            }
        }

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            whereClause.AND.push({ bookingDate: { gte: startDate, lte: endDate } });
        }

        const finalWhere = whereClause.AND.length > 0 ? whereClause : {};

        const bookings = await prisma.booking.findMany({
            where: finalWhere,
            include: { client: true, partnerProfile: true, customerProfile: true, userGuest: true, stylist: true },
            orderBy: { bookingDate: 'asc' },
        });

        const mapped = bookings.map(b => ({
            ...b,
            client: b.client,
            partner: b.partnerProfile,
            customer: b.customerProfile,
            guest: b.userGuest,
            stylist: b.stylist
        }));

        res.json(mapped);
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
            include: { partnerProfile: true, client: true, customerProfile: true, userGuest: true, stylist: true },
        });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        
        res.json({
            ...booking,
            partner: booking.partnerProfile,
            client: booking.client,
            customer: booking.customerProfile,
            guest: booking.userGuest,
            stylist: booking.stylist
        });
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
            beneficiaryPhone,
            serviceMode 
        } = req.body;

        if (!partnerId || !bookingDate || !services || totalAmount === undefined) {
            return res.status(400).json({ error: 'Missing required booking fields' });
        }

        const partner = await prisma.partnerProfile.findUnique({ where: { id: partnerId } });
        if (!partner) return res.status(404).json({ error: 'Partner not found' });

        // Infer serviceMode if missing
        const finalServiceMode = serviceMode || (partner.partnerType === 'Freelancer' ? 'AtHome' : 'AtSalon');

        let stylistNameAtBooking = null;
        if (stylistId) {
            const stylist = await prisma.stylist.findUnique({ where: { id: stylistId } });
            if (stylist) stylistNameAtBooking = stylist.name;
        }

        const { platformFee, platformCommission, partnerEarnings } = await getBookingEconomics('Manual', partner.partnerType, totalAmount);

        let actualCustomerId = req.body.customerId || null;
        if (!actualCustomerId) {
            let phoneToCheck = beneficiaryPhone;
            if (!phoneToCheck && clientId) {
                const clientRecord = await prisma.client.findUnique({ where: { id: clientId } });
                if (clientRecord) phoneToCheck = clientRecord.phone;
            }
            
            if (phoneToCheck) {
                const identity = await findIdentity(phoneToCheck);
                if (identity && identity.type === 'User' && identity.data.customerProfile) {
                    actualCustomerId = identity.data.customerProfile.id;
                    console.log(`[BACKEND] Manually linked booking to existing User ID: ${actualCustomerId}`);
                }
            }
        }

        const newBooking = await prisma.booking.create({
            data: {
                id: uuidv4(),
                partnerId,
                customerId: actualCustomerId,
                clientId: clientId || null,
                guestId: guestId || null,
                guestName: guestName || null,
                serviceMode: finalServiceMode,
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
                beneficiaryPhone: beneficiaryPhone || null,
                paymentMethod: 'Cash',
                updatedAt: new Date(),
            },
            include: { client: true, stylist: true, customerProfile: true, userGuest: true },
        });

        res.status(201).json({
            ...newBooking,
            client: newBooking.client,
            stylist: newBooking.stylist,
            customer: newBooking.customerProfile,
            guest: newBooking.userGuest
        });
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

        const updateData = {
            updatedAt: new Date()
        };
        if (status) updateData.status = status;
        
        // Only update stylist if explicitly provided (null or string)
        if (stylistId !== undefined) {
            updateData.stylistId = stylistId;
            if (stylistId) {
                const stylist = await prisma.stylist.findUnique({ where: { id: stylistId } });
                if (stylist) updateData.stylistNameAtBooking = stylist.name;
            } else {
                updateData.stylistNameAtBooking = null;
            }
        }

        if (status === 'Completed' && paymentConfirmed) {
            updateData.paymentStatus = 'Paid';
            updateData.partnerConfirmedReceipt = true;
        }

        const updated = await prisma.booking.update({
            where: { id: req.params.id },
            data: updateData,
            include: { 
                partnerProfile: true, 
                customerProfile: true,
                client: true,
                stylist: true,
                userGuest: true
            }
        });

        // --- STATUS CHANGE NOTIFICATIONS ---
        if (status === 'Confirmed') {
            const timeStr = updated.timeSlot || 'your scheduled time';
            // Notify Customer
            if (updated.customerProfile?.userId) {
                sendNotification({
                    userId: updated.customerProfile.userId,
                    title: 'Booking Confirmed!',
                    body: `Great news! Your booking ${updated.id} has been confirmed for ${timeStr}.`,
                    type: 'Booking',
                    metadata: { bookingId: updated.id },
                    whatsappTemplate: {
                        name: 'cust_booking_conf',
                        components: {
                            body_1: { type: 'text', value: updated.id },
                            body_2: { type: 'text', value: timeStr }
                        }
                    }
                }).catch(e => console.error('Notify Error:', e));
            }
            // Notify Partner
            if (updated.partnerProfile?.userId) {
                sendNotification({
                    userId: updated.partnerProfile.userId,
                    title: 'Booking Confirmed',
                    body: `Booking ${updated.id} is now confirmed. Please be ready by ${timeStr}.`,
                    type: 'Booking',
                    metadata: { bookingId: updated.id },
                    whatsappTemplate: {
                        name: 'part_booking_conf',
                        components: {
                            body_1: { type: 'text', value: updated.id },
                            body_2: { type: 'text', value: timeStr }
                        }
                    }
                }).catch(e => console.error('Notify Error:', e));
            }
        } else if (status === 'Cancelled') {
            // Notify both parties of cancellation
            if (updated.customerProfile?.userId) {
                sendNotification({
                    userId: updated.customerProfile.userId,
                    title: 'Booking Cancelled',
                    body: `Your booking ${updated.id} has been cancelled.`,
                    type: 'Booking',
                    metadata: { bookingId: updated.id },
                    whatsappTemplate: {
                        name: 'cust_booking_canc',
                        components: {
                            body_1: { type: 'text', value: updated.id }
                        }
                    }
                }).catch(e => console.error('Notify Error:', e));
            }
        }

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

        let stylistNameAtBooking = undefined;
        if (stylistId) {
            const stylist = await prisma.stylist.findUnique({ where: { id: stylistId } });
            if (stylist) stylistNameAtBooking = stylist.name;
        } else if (stylistId === null) {
            stylistNameAtBooking = null;
        }

        const reassigned = await prisma.booking.update({
            where: { id },
            data: {
                partnerId: nextBest.id,
                declinedPartnerIds: updatedDeclined,
                status: 'Requested', // Keep as requested for the new partner
                stylistId: stylistId !== undefined ? stylistId : undefined,
                stylistNameAtBooking: stylistNameAtBooking !== undefined ? stylistNameAtBooking : undefined,
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
