const prisma = require('../prisma');

/**
 * GET /api/slots/available
 * Query: ?serviceIds[]=...&serviceMode=AtHome&date=2026-03-02&lat=...&lng=...&city=...
 */
exports.getAvailableSlots = async (req, res) => {
    try {
        let { serviceIds, serviceMode, date, lat, lng, city, salonId } = req.query;

        console.log(`[getAvailableSlots] Query:`, { serviceMode, date, city, salonId });

        // Handle serviceIds[] format from URLSearchParams or common query styles
        if (!serviceIds && req.query['serviceIds[]']) {
            serviceIds = req.query['serviceIds[]'];
        }
        
        const ids = Array.isArray(serviceIds) ? serviceIds : (serviceIds ? [serviceIds] : []);

        console.log(`[getAvailableSlots] Request:`, { serviceMode, date, city, salonId, ids });

        if (ids.length === 0 || !serviceMode || !date) {
            console.warn(`[getAvailableSlots] Missing required fields:`, { ids, serviceMode, date });
            return res.status(400).json({ error: 'serviceIds, serviceMode, and date are required' });
        }
        const services = await prisma.serviceCatalog.findMany({
            where: { id: { in: ids } }
        });

        if (services.length === 0) {
            console.error(`[getAvailableSlots] Services not found in catalog for IDs:`, ids);
            // Instead of 404, we can return empty slots or a more descriptive error.
            // For now, let's keep it 404 but with a less alarming log if it's expected-ish.
            return res.status(404).json({ error: `Selected services not found in our catalog. Please refresh your selection.` });
        }

        if (services.length < ids.length) {
            console.warn(`[getAvailableSlots] Some services (${ids.length - services.length}) were not found in catalog.`);
        }

        const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
        console.log(`[getAvailableSlots] Total Duration: ${totalDuration}`);

        const bookingDate = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayAbbrs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayIndex = bookingDate.getDay();
        const fullDayName = dayNames[dayIndex];
        const abbrDayName = dayAbbrs[dayIndex];

        // 1. Find eligible partners
        const partnerTypes = serviceMode === 'AtHome'
            ? ['Freelancer']
            : ['Male_Salon', 'Female_Salon', 'Unisex_Salon'];

        // ... (find partners) ...
        const whereClause = {
            partnerType: { in: partnerTypes },
            isOnboarded: true,
        };

        if (salonId) {
            whereClause.id = salonId;
            console.log(`[getAvailableSlots] Filtering by salonId: ${salonId}`);
        }

        // Fix timezone issue by using start/end of day in a robust way
        const dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(date);
        dateEnd.setHours(23, 59, 59, 999);

        let candidates = await prisma.partnerProfile.findMany({
            where: whereClause,
            include: {
                bookings: {
                    where: {
                        bookingDate: {
                            gte: dateStart,
                            lte: dateEnd,
                        },
                        status: { in: ['Requested', 'Confirmed', 'InProgress'] } // Included InProgress
                    }
                }
            }
        });

        console.log(`[getAvailableSlots] Found ${candidates.length} candidates`);

        // 2. Filter by location (At Home only)
        if (serviceMode === 'AtHome' && lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            console.log(`[getAvailableSlots] Filtering candidates by distance from user: ${userLat}, ${userLng}`);

            candidates = candidates.filter(p => {
                let addr = p.address || {};
                // Handle cases where address is stored as a string in Postgres
                if (typeof addr === 'string') {
                    try {
                        addr = JSON.parse(addr);
                    } catch (e) {
                        console.error(`[getAvailableSlots] Error parsing address for partner ${p.id}:`, e);
                        return false;
                    }
                }

                // Prioritize flat structure, fallback to nested currentAddress
                const effectiveAddr = addr.lat && addr.lng ? addr : (addr.currentAddress || addr);

                if (!effectiveAddr || !effectiveAddr.lat || !effectiveAddr.lng) {
                    return false;
                }

                const dist = haversineKm(userLat, userLng, effectiveAddr.lat, effectiveAddr.lng);
                const isWithinRange = dist <= 25;
                if (!isWithinRange) {
                    // console.log(`[getAvailableSlots] Partner ${p.id} filtered out (Distance: ${dist.toFixed(2)} km from ${effectiveAddr.city || 'partner location'})`);
                }
                return isWithinRange;
            });
        }

        console.log(`[getAvailableSlots] ${candidates.length} candidates after location filtering`);

        // 3. Generate slots (9 AM - 8 PM, 30 min increments)
        const allSlots = [];
        for (let h = 9; h < 20; h++) {
            ['00', '30'].forEach(m => allSlots.push(`${String(h).padStart(2, '0')}:${m}`));
        }

        const availableSlots = [];

        for (const slotStart of allSlots) {
            const [sh, sm] = slotStart.split(':').map(Number);
            const startMinutes = sh * 60 + sm;
            const endMinutes = startMinutes + totalDuration;

            const hasProvider = candidates.some(p => {
                // Check working hours
                let workDay = null;
                let workingHoursData = p.workingHours;
                if (typeof workingHoursData === 'string') {
                    try {
                        workingHoursData = JSON.parse(workingHoursData);
                    } catch (e) {
                        return false;
                    }
                }

                if (Array.isArray(workingHoursData)) {
                    workDay = workingHoursData.find(d => d.dayName === fullDayName || d.dayName === abbrDayName);
                    if (!workDay || !workDay.isOpen || !workDay.openTime || !workDay.closeTime) return false;
                } else if (workingHoursData && typeof workingHoursData === 'object') {
                    // Handle Salon-style object: { days: [...], openTime: "08:00 am", ... }
                    const days = workingHoursData.days || [];
                    if (!days.includes(fullDayName) && !days.includes(abbrDayName)) return false;
                    workDay = workingHoursData;
                } else {
                    return false;
                }

                const openMin = parseTimeToMinutes(workDay.openTime);
                const closeMin = parseTimeToMinutes(workDay.closeTime);

                if (openMin === null || closeMin === null) return false;
                if (startMinutes < openMin || endMinutes > closeMin) return false;

                // Check salon break time - look at both workDay and root object
                const breakSource = workDay.breakEnabled !== undefined ? workDay : workingHoursData;
                const brEnabled = breakSource?.breakEnabled === true || breakSource?.breakEnabled === 'true';

                if (brEnabled) {
                    const bStartStr = breakSource.breakStart;
                    const bEndStr = breakSource.breakEnd;
                    const bStartMin = parseTimeToMinutes(bStartStr);
                    const bEndMin = parseTimeToMinutes(bEndStr);

                    if (bStartMin !== null && bEndMin !== null) {
                        if (startMinutes < bEndMin && endMinutes > bStartMin) {
                            return false;
                        }
                    }
                }

                // Check existing bookings
                const isBusy = p.bookings.some(b => {
                    const bStart = parseTimeToMinutes(b.timeSlot);
                    if (bStart === null) return false;

                    const servicesArray = Array.isArray(b.services) ? b.services : (b.services ? [b.services] : []);
                    const bDuration = servicesArray.reduce((s, x) => s + (x.duration || 30), 0) || 30;
                    const bEnd = bStart + bDuration;

                    return (startMinutes < bEnd && endMinutes > bStart);
                });

                if (isBusy) {
                    const providerName = p.basicInfo?.salonName || p.basicInfo?.name || p.id;
                    console.log(`[getAvailableSlots] Slot ${slotStart} BUSY for ${providerName} due to existing booking`);
                    return false;
                }

                const now = new Date();
                const isToday = bookingDate.toDateString() === now.toDateString();

                // Check if they are "effective offline" for today
                const lastUpdate = new Date(p.lastStatusUpdate || p.updatedAt);
                const isStatusFromToday = now.toDateString() === lastUpdate.toDateString();
                const effectiveOnline = p.isOnline || !isStatusFromToday;

                if (isToday) {
                    if (!effectiveOnline) return false; // Blocked for today because manually offline
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    if (startMinutes < currentMinutes + 60) return false; // At least 1 hour lead time
                }


                return true;
            });

            if (hasProvider) {
                availableSlots.push({
                    value: slotStart,
                    label: formatSlotLabel(slotStart)
                });
            }
        }

        res.json(availableSlots);

    } catch (err) {
        console.error('getAvailableSlots Error:', err);
        res.status(500).json({ error: 'Failed to calculate available slots' });
    }
};


function parseTimeToMinutes(timeStr) {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)\s*(am|pm)?/i);
    if (!match) return null;
    let [, h, m, ampm] = match;
    h = parseInt(h);
    m = parseInt(m);
    if (ampm) {
        if (ampm.toLowerCase() === 'pm' && h < 12) h += 12;
        if (ampm.toLowerCase() === 'am' && h === 12) h = 0;
    }
    return h * 60 + m;
}

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

function formatSlotLabel(slot) {
    const [h, m] = slot.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
}
