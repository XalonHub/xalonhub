const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// ── Helpers ─────────────────────────────────────────────────────────────────

const SALON_TYPES = ['Male_Salon', 'Female_Salon', 'Unisex_Salon'];

/**
 * Computes distance between two points in km.
 */
function getDistanceKm(lat1, lng1, lat2, lng2) {
    if (lat1 === null || lng1 === null || lat2 === null || lng2 === null) return null;
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) return null;
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

const { getCloudinaryUrl } = require('../utils/cloudinaryHelper');

/**
 * Helper to clean image URLs - strips hardcoded IP and returns relative path or Cloudinary URL
 */
const cleanImageUrl = (url) => {
    if (!url) return null;
    
    // If it's a Cloudinary public_id or URL, get the secure URL
    if (url.startsWith('xalon/') || url.includes('cloudinary.com')) {
        return getCloudinaryUrl(url);
    }
    
    // Legacy support: If it's a full URL with legacy IP, strip it to make it relative
    return url.replace(/http:\/\/192\.168\.1\.10:5000/g, '');
};

const FACILITY_MAP = {
    'ac': 'ac',
    // ...
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

// ── GET /api/salons/cities ──────────────────────────────────────────────────
// Returns distinct cities from onboarded partner addresses
router.get('/cities', async (req, res) => {
    try {
        const partners = await prisma.partnerProfile.findMany({
            where: { isOnboarded: true },
            select: { address: true }
        });

        const cities = new Set();
        partners.forEach(p => {
            const addr = p.address || {};
            const city = addr.city || addr.currentAddress?.city || addr.district || null;
            if (city) cities.add(city);
        });

        res.json([...cities].sort());
    } catch (err) {
        console.error('[GET /api/salons/cities]', err);
        res.status(500).json({ error: 'Failed to fetch cities' });
    }
});

// ── GET /api/salons ─────────────────────────────────────────────────────────
// Query params: city, lat, lng, gender (Male|Female|Unisex), category, sort

router.get('/', async (req, res) => {
    try {
        const { city, gender, category, sort, lat, lng, partnerType } = req.query;
        console.log(`[SALON SEARCH] Query:`, { city, gender, category, lat, lng, partnerType });
        const userLat = (lat && !isNaN(parseFloat(lat))) ? parseFloat(lat) : null;
        const userLng = (lng && !isNaN(parseFloat(lng))) ? parseFloat(lng) : null;

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
        
        if (!partner) return res.status(404).json({ error: 'Partner not found' });

        // 1. FREELANCER LOGIC: Skill-based specialization from global catalog
        if (partner.partnerType === 'Freelancer') {
            const partnerCategories = partner.categories || [];
            if (partnerCategories.length === 0) {
                return res.json([]);
            }

            const where = {
                category: { in: partnerCategories }
            };

            const globalServices = await prisma.serviceCatalog.findMany({
                where,
                orderBy: { category: 'asc' },
            });

            // Freelancers use admin-fixed pricing (respecting role-based overrides)
            return res.json(globalServices.map(s => {
                const rolePricing = s.pricingByRole;
                let effectivePrice = s.defaultPrice;
                let effectiveSpecialPrice = s.specialPrice;

                if (rolePricing && typeof rolePricing === 'object' && rolePricing['Freelancer']) {
                    const roleEntry = rolePricing['Freelancer'];
                    effectivePrice = roleEntry.defaultPrice ?? s.defaultPrice;
                    effectiveSpecialPrice = roleEntry.specialPrice !== undefined ? roleEntry.specialPrice : s.specialPrice;
                }

                return {
                    ...s,
                    defaultPrice: effectivePrice,
                    specialPrice: effectiveSpecialPrice,
                    price: effectivePrice // Legacy support
                };
            }));
        }

        // 2. SALON LOGIC: Strict custom catalog (no fallback to global)
        const sServices = Array.isArray(partner.salonServices) ? partner.salonServices : [];
        if (sServices.length === 0) {
            return res.json([]);
        }

        const serviceIds = sServices.map(ss => ss.serviceId).filter(Boolean);
        const catalogEntries = await prisma.serviceCatalog.findMany({
            where: { id: { in: serviceIds } },
        });
        const catalogMap = Object.fromEntries(catalogEntries.map(c => [c.id, c]));

        const merged = sServices.map(ss => {
            const base = catalogMap[ss.serviceId];
            if (!base) return null; // Skip if catalog entry is missing
            
            return {
                ...base,
                ...ss,
                id: ss.id || ss.serviceId || base.id,
                // Salons MUST use their own price. If not set, it defaults to null/undefined (no fallback to global)
                defaultPrice: ss.price || null,
                specialPrice: ss.specialPrice !== undefined ? ss.specialPrice : null,
                duration: ss.duration || base.duration || ss.duration,
                category: ss.category || base.category || 'General',
                name: ss.name || base.name || 'Unnamed Service'
            };
        }).filter(s => s !== null && s.defaultPrice !== null); // Only show services with a price set

        merged.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        res.json(merged);
    } catch (err) {
        console.error('[GET /api/salons/:id/services]', err);
        res.status(500).json({ error: 'Failed to load services' });
    }
});

module.exports = router;
