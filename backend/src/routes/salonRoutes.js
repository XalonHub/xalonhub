const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// ── Helpers ─────────────────────────────────────────────────────────────────

const SALON_TYPES = ['Male_Salon', 'Female_Salon', 'Unisex_Salon'];

/**
 * Computes distance between two points in km.
 */
function getDistanceKm(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Helper to get a field from an address object that might be flat or nested (currentAddress).
 */
function getAddrField(addr, field) {
    if (!addr) return null;
    // Check in the object itself
    if (addr[field]) return addr[field];
    // Check in currentAddress/permanentAddress
    if (addr.currentAddress?.[field]) return addr.currentAddress[field];
    if (addr.permanentAddress?.[field]) return addr.permanentAddress[field];

    // Fallback logic for city
    if (field === 'city') {
        return addr.district || addr.currentAddress?.district || addr.locality || addr.currentAddress?.locality || null;
    }
    return null;
}

/**
 * Helper to clean image URLs - strips hardcoded IP and returns relative path or same URL
 */
const cleanImageUrl = (url) => {
    if (!url) return null;
    // If it's a full URL with the legacy IP, strip it to make it relative
    return url.replace(/http:\/\/192\.168\.1\.10:5000/g, '');
};
const FACILITY_MAP = {
    'ac': 'ac',
    'air conditioning': 'ac',
    'air conditioner': 'ac',
    'a/c': 'ac',
    'wifi': 'wifi',
    'wi-fi': 'wifi',
    'internet': 'wifi',
    'parking': 'parking',
    'car parking': 'parking',
    'beverages': 'beverages',
    'drinking water': 'beverages',
    'coffee': 'beverages',
    'tv': 'tv',
    'entertainment': 'tv',
    'television': 'tv',
    'card_payment': 'card_payment',
    'card payment': 'card_payment',
    'credit card': 'card_payment',
    'wheelchair': 'wheelchair',
    'wheelchair accessible': 'wheelchair',
    'music': 'music',
};

/**
 * Map a PartnerProfile DB row to a clean Salon object for the customer app.
 */
function mapSalon(partner, userLat, userLng) {
    const basic = partner.basicInfo || {};
    const address = partner.address || {};
    const cover = partner.salonCover || {};
    const docs = partner.documents || {};
    const hours = partner.workingHours || [];

    // Extract address fields robustly
    const city = getAddrField(address, 'city') || '';
    const district = getAddrField(address, 'district') || '';
    const lat = getAddrField(address, 'lat');
    const lng = getAddrField(address, 'lng');
    const area = getAddrField(address, 'area') || getAddrField(address, 'locality') || city;

    // Derive gender preference
    let genderPreference = 'Unisex';
    if (partner.partnerType === 'Male_Salon') genderPreference = 'Male';
    else if (partner.partnerType === 'Female_Salon') genderPreference = 'Female';
    else if (partner.partnerType === 'Freelancer' && partner.workPreferences?.gender) {
        genderPreference = partner.workPreferences.gender;
    }

    // First working day to show open/close time
    const todayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    const todayHours = Array.isArray(hours) ? hours.find(h => h.dayName === todayName && h.isOpen) : null;

    // Banner should be the first placement if available
    const shopBanner = cleanImageUrl(cover.banner || docs.shopBanner || cover.logo || null);

    // Cover images from salonCover (outside/inside) or legacy coverImages field
    const coverImagesList = [
        shopBanner,
        ...(cover.outside || []),
        ...(cover.inside || []),
        ...(partner.coverImages || []),
        ...(docs.showcaseImages || []),
        basic.profileImg,
        docs.shopFrontImg,
    ].map(cleanImageUrl).filter(Boolean);

    // Remove duplicates while preserving order
    const uniqueCoverImages = [...new Set(coverImagesList)];

    let displayName = basic.businessName || basic.salonName || basic.shopName || partner.name || 'Unnamed';
    let logoImage = cleanImageUrl(cover.logo || docs.shopBanner || null);

    if (partner.partnerType === 'Freelancer') {
        const pName = basic.name || basic.ownerName || partner.name;
        if (pName) displayName = pName;
        if (!logoImage) logoImage = cleanImageUrl(basic.profileImg || null);
    }

    return {
        id: partner.id,
        name: displayName,
        businessName: displayName,
        ownerName: basic.ownerName || basic.name,
        genderPreference,
        partnerType: partner.partnerType,
        categories: partner.categories || [],
        rating: partner.averageRating ? parseFloat(partner.averageRating).toFixed(1) : null,
        reviews: partner.totalReviews || 0,
        isVerified: partner.kycStatus === 'approved',
        isFeatured: partner.isFeatured,
        // Address
        addressLine: getAddrField(address, 'address') || getAddrField(address, 'street') || '',
        city,
        district,
        area,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        pincode: getAddrField(address, 'pincode'),
        // Distance
        distance: getDistanceKm(userLat, userLng, lat, lng),
        // Images
        coverImage: shopBanner || cleanImageUrl(cover.outside?.[0] || cover.inside?.[0] || basic.profileImg || docs.shopFrontImg || partner.coverImages?.[0] || null),
        images: uniqueCoverImages,
        logoImage,
        // Hours
        openTime: todayHours?.openTime || null,
        closeTime: todayHours?.closeTime || null,
        workingHours: hours, // Full list for About tab
        district: getAddrField(address, 'district') || '',
        experience: basic.experience || partner.professionalDetails?.experienceYears || null,
        locationType: partner.workPreferences?.locationType || null,
        // Extra info
        about: basic.about || basic.description || null,
        facilities: [
            ...new Set(
                ((partner.facilities && partner.facilities.length > 0) ? partner.facilities : (basic.facilities || []))
                    .map(f => FACILITY_MAP[f.toLowerCase()] || null)
                    .filter(Boolean)
            )
        ],
        // Services count
        serviceCount: Array.isArray(partner.salonServices) ? partner.salonServices.length : 0,
    };
}

// ── GET /api/salons ─────────────────────────────────────────────────────────
// Query params: city, lat, lng, gender (Male|Female|Unisex), category, sort

router.get('/', async (req, res) => {
    try {
        const { city, gender, category, sort, lat, lng, partnerType } = req.query;
        console.log(`[SALON SEARCH] Query:`, { city, gender, category, lat, lng, partnerType });
        const userLat = lat ? parseFloat(lat) : null;
        const userLng = lng ? parseFloat(lng) : null;

        // Determine which partner types to include based on gender filter
        let partnerTypes = partnerType ? [partnerType] : SALON_TYPES;
        if (!partnerType) {
            if (gender === 'Male') partnerTypes = ['Male_Salon', 'Unisex_Salon'];
            if (gender === 'Female') partnerTypes = ['Female_Salon', 'Unisex_Salon'];
            if (gender === 'Unisex') partnerTypes = ['Unisex_Salon'];
        }

        const where = {
            partnerType: { in: partnerTypes },
            isOnboarded: true,
            kycStatus: 'approved',
        };

        // Fetch partners
        let partners = await prisma.partnerProfile.findMany({
            where,
            orderBy: [
                { isFeatured: 'desc' },
                { rankingWeight: 'desc' },
                { createdAt: 'desc' }
            ],
        });

        // 1. Map to clean salon objects with distance
        let salons = partners.map(p => mapSalon(p, userLat, userLng));

        // 2. Filter by distance (Nearby Search - default 50km as requested)
        if (userLat && userLng) {
            salons = salons.filter(s => {
                if (s.distance === null) return !city;
                return s.distance <= 50; // Reduced to 50km
            });
        }

        console.log(`[SALON SEARCH] After Distance Filter: ${salons.length} salons`);

        // 3. Filter by city (only if lat/lng are NOT provided)
        if (!userLat && !userLng && city && city !== 'Detecting location...') {
            salons = salons.filter(s =>
                (s.city || '').toLowerCase().includes(city.toLowerCase()) ||
                (s.district || '').toLowerCase().includes(city.toLowerCase()) ||
                (s.area || '').toLowerCase().includes(city.toLowerCase()) ||
                (s.addressLine || '').toLowerCase().includes(city.toLowerCase())
            );
        }

        console.log(`[SALON SEARCH] Final count after Filters: ${salons.length} salons`);

        // 4. Filter by category if provided
        if (category && category !== 'All') {
            salons = salons.filter(s =>
                Array.isArray(s.categories) &&
                s.categories.some(c => c.toLowerCase().includes(category.toLowerCase()))
            );
        }

        // 5. Final Sort
        if (sort === 'rating') {
            salons.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
        } else if (userLat && userLng) {
            // Default to distance sort if coordinates are present
            salons.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        }

        res.json(salons);
    } catch (err) {
        console.error('[GET /api/salons]', err);
        res.status(500).json({ error: 'Failed to load salons' });
    }
});

// ── GET /api/salons/:id ─────────────────────────────────────────────────────
// Returns full details for a single salon
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { lat, lng } = req.query;
        const userLat = lat ? parseFloat(lat) : null;
        const userLng = lng ? parseFloat(lng) : null;

        const partner = await prisma.partnerProfile.findUnique({
            where: { id },
        });

        if (!partner) return res.status(404).json({ error: 'Salon not found' });

        res.json(mapSalon(partner, userLat, userLng));
    } catch (err) {
        console.error('[GET /api/salons/:id]', err);
        res.status(500).json({ error: 'Failed to load salon details' });
    }
});

// ── GET /api/salons/:id/services ────────────────────────────────────────────
// Returns the service menu of a specific salon, using the salon's salonServices
// JSON override (custom price/duration) merged with the global ServiceCatalog.

router.get('/:id/services', async (req, res) => {
    try {
        const { id } = req.params;
        const partner = await prisma.partnerProfile.findUnique({ where: { id } });
        const salonServices = Array.isArray(partner.salonServices) ? partner.salonServices : [];

        if (salonServices.length === 0) {
            // Fallback: return global catalog filtered by the salon's categories and partner type
            const partnerCategories = partner.categories || [];
            const genderFilter = partner.partnerType === 'Male_Salon' ? 'Male'
                : partner.partnerType === 'Female_Salon' ? 'Female' : null;

            const where = {};
            if (partnerCategories.length > 0) where.category = { in: partnerCategories };
            if (genderFilter) where.gender = { in: [genderFilter, 'Unisex'] };

            const globalServices = await prisma.serviceCatalog.findMany({
                where,
                orderBy: { category: 'asc' },
            });

            // Apply role-based pricing if available
            return res.json(globalServices.map(s => {
                const roleKey = partner.partnerType; // e.g. 'Male_Salon'
                const rolePrice = s.pricingByRole?.[roleKey];
                return {
                    ...s,
                    defaultPrice: rolePrice?.defaultPrice || s.defaultPrice,
                    specialPrice: rolePrice?.specialPrice || s.specialPrice,
                };
            }));
        }

        const sServices = Array.isArray(partner.salonServices) ? partner.salonServices : [];
        const serviceIds = sServices.map(ss => ss.serviceId).filter(Boolean);
        
        const catalogEntries = await prisma.serviceCatalog.findMany({
            where: { id: { in: serviceIds } },
        });
        const catalogMap = Object.fromEntries(catalogEntries.map(c => [c.id, c]));

        const roleKey = partner.partnerType;
        const merged = sServices.map(ss => {
            const base = catalogMap[ss.serviceId] || {};
            const rolePrice = (base.pricingByRole && typeof base.pricingByRole === 'object')
                ? base.pricingByRole[roleKey]
                : null;
            
            return {
                ...base,
                ...ss,
                id: ss.id || ss.serviceId || base.id,
                defaultPrice: ss.price || ss.defaultPrice || rolePrice?.defaultPrice || base.defaultPrice,
                specialPrice: ss.specialPrice !== undefined && ss.specialPrice !== null
                    ? ss.specialPrice
                    : (rolePrice?.specialPrice ?? base.specialPrice ?? ss.specialPrice ?? null),
                duration: ss.duration || base.duration || ss.duration,
                category: ss.category || base.category || 'General',
                name: ss.name || base.name || 'Unnamed Service'
            };
        }).filter(Boolean);

        merged.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        res.json(merged);
    } catch (err) {
        console.error('[GET /api/salons/:id/services]', err);
        res.status(500).json({ error: 'Failed to load salon services' });
    }
});

module.exports = router;
