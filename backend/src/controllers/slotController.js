const prisma = require('../prisma');

/**
 * GET /api/slots/available
 * Query: ?serviceIds[]=...&serviceMode=AtHome&date=2026-03-02&lat=...&lng=...&city=...
 */
exports.getAvailableSlots = async (req, res) => {
    try {
        let { serviceIds, serviceMode, date, lat, lng, city } = req.query;

        // Handle serviceIds[] format from URLSearchParams
        if (!serviceIds && req.query['serviceIds[]']) {
            serviceIds = req.query['serviceIds[]'];
        }

        if (!serviceIds || !serviceMode || !date) {
            return res.status(400).json({ error: 'serviceIds, serviceMode, and date are required' });
        }

        const ids = Array.isArray(serviceIds) ? serviceIds : [serviceIds];
        const services = await prisma.serviceCatalog.findMany({
            where: { id: { in: ids } }
        });

        if (services.length === 0) {
            return res.status(404).json({ error: 'Services not found' });
        }

        const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
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

        let candidates = await prisma.partnerProfile.findMany({
            where: {
                partnerType: { in: partnerTypes },
                isOnboarded: true,
            },
            include: {
                bookings: {
                    where: {
                        bookingDate: {
                            gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                            lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
                        },
                        status: { in: ['Requested', 'Confirmed'] }
                    }
                }
            }
        });

        // 2. Filter by location (At Home only)
        if (serviceMode === 'AtHome' && lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            candidates = candidates.filter(p => {
                const addr = p.address || {};
                if (!addr.lat || !addr.lng) return false;
                const dist = haversineKm(userLat, userLng, addr.lat, addr.lng);
                return dist <= 25; // increased to 25km for better visibility in V0
            });
        }

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
                if (Array.isArray(p.workingHours)) {
                    workDay = p.workingHours.find(d => d.dayName === fullDayName || d.dayName === abbrDayName);
                    if (!workDay || !workDay.isOpen || !workDay.openTime || !workDay.closeTime) return false;
                } else if (p.workingHours && typeof p.workingHours === 'object') {
                    // Handle Salon-style object: { days: [...], openTime: "08:00 am", ... }
                    const days = p.workingHours.days || [];
                    if (!days.includes(fullDayName) && !days.includes(abbrDayName)) return false;
                    workDay = p.workingHours;
                } else {
                    return false;
                }

                const openMin = parseTimeToMinutes(workDay.openTime);
                const closeMin = parseTimeToMinutes(workDay.closeTime);

                if (openMin === null || closeMin === null) return false;
                if (startMinutes < openMin || endMinutes > closeMin) return false;

                // Check existing bookings
                const isBusy = p.bookings.some(b => {
                    const bStart = parseTimeToMinutes(b.timeSlot);
                    if (bStart === null) return false;
                    const bDuration = (b.services || []).reduce((s, x) => s + (x.duration || 30), 0);
                    const bEnd = bStart + bDuration;
                    return (startMinutes < bEnd && endMinutes > bStart);
                });

                if (isBusy) return false;

                const now = new Date();
                const isToday = bookingDate.toDateString() === now.toDateString();
                if (isToday) {
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    if (startMinutes < currentMinutes + 60) return false; // At least 1 hour lead time
                }

                if (p.softLockUntil && new Date(p.softLockUntil) > now) {
                    // coarse check: if locked, skip this partner
                    return false;
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
