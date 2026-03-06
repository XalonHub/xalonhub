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
    return addr[field] || addr.currentAddress?.[field] || null;
}

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
    const lat = getAddrField(address, 'lat');
    const lng = getAddrField(address, 'lng');

    // Derive gender preference from partnerType
    let genderPreference = 'Unisex';
    if (partner.partnerType === 'Male_Salon') genderPreference = 'Male';
    if (partner.partnerType === 'Female_Salon') genderPreference = 'Female';

    // First working day to show open/close time
    const todayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    const todayHours = Array.isArray(hours) ? hours.find(h => h.dayName === todayName && h.isOpen) : null;

    // Cover images from salonCover (outside/inside) or legacy coverImages field
    const coverImagesList = [
        ...(cover.outside || []),
        ...(cover.inside || []),
        ...(partner.coverImages || []),
        docs.shopFrontImg,
    ].filter(Boolean);

    return {
        id: partner.id,
        name: basic.salonName || basic.name || 'Unnamed Salon',
        businessName: basic.salonName || basic.name || 'Unnamed Salon',
        ownerName: basic.ownerName || basic.name,
        genderPreference,
        partnerType: partner.partnerType,
        categories: partner.categories || [],
        rating: partner.rankingWeight ? (partner.rankingWeight * 4 + 1).toFixed(1) : null,
        isVerified: partner.kycStatus === 'approved',
        isFeatured: partner.isFeatured,
        // Address
        addressLine: getAddrField(address, 'address') || getAddrField(address, 'street') || '',
        city,
        area: getAddrField(address, 'locality') || getAddrField(address, 'area') || city,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        pincode: getAddrField(address, 'pincode'),
        // Distance
        distance: getDistanceKm(userLat, userLng, lat, lng),
        // Images
        coverImage: cover.outside?.[0] || cover.inside?.[0] || docs.shopFrontImg || partner.coverImages?.[0] || null,
        images: coverImagesList,
        logoImage: cover.logo || docs.shopBanner || null,
        // Hours
        openTime: todayHours?.openTime || null,
        closeTime: todayHours?.closeTime || null,
        // Services count
        serviceCount: Array.isArray(partner.salonServices) ? partner.salonServices.length : 0,
    };
}

// ── GET /api/salons ─────────────────────────────────────────────────────────
// Query params: city, lat, lng, gender (Male|Female|Unisex), category, sort

router.get('/', async (req, res) => {
    try {
        const { city, gender, category, sort, lat, lng } = req.query;
        const userLat = lat ? parseFloat(lat) : null;
        const userLng = lng ? parseFloat(lng) : null;

        // Determine which partner types to include based on gender filter
        let partnerTypes = SALON_TYPES;
        if (gender === 'Male') partnerTypes = ['Male_Salon', 'Unisex_Salon'];
        if (gender === 'Female') partnerTypes = ['Female_Salon', 'Unisex_Salon'];
        if (gender === 'Unisex') partnerTypes = ['Unisex_Salon'];

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

        // 2. Filter by distance (Nearby Search - default 50km if no city provided)
        if (userLat && userLng) {
            salons = salons.filter(s => {
                if (s.distance === null) return !city; // If no city provided, hide those with no location. If city provided, let city filter handle it.
                return s.distance <= 50; // Show all within 50km
            });
        }

        // 3. Filter by city (if provided or if distance search didn't yield results)
        if (city) {
            salons = salons.filter(s =>
                (s.city || '').toLowerCase().includes(city.toLowerCase()) ||
                (s.addressLine || '').toLowerCase().includes(city.toLowerCase())
            );
        }

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

// ── GET /api/salons/:id/services ────────────────────────────────────────────
// Returns the service menu of a specific salon, using the salon's salonServices
// JSON override (custom price/duration) merged with the global ServiceCatalog.

router.get('/:id/services', async (req, res) => {
    try {
        const { id } = req.params;

        const partner = await prisma.partnerProfile.findUnique({ where: { id } });
        if (!partner) return res.status(404).json({ error: 'Salon not found' });

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

        // Fetch service catalog entries for the listed serviceIds
        const serviceIds = salonServices.map(ss => ss.serviceId).filter(Boolean);
        const catalogEntries = await prisma.serviceCatalog.findMany({
            where: { id: { in: serviceIds } },
        });
        const catalogMap = Object.fromEntries(catalogEntries.map(c => [c.id, c]));

        // Merge salon-specific overrides on top of catalog defaults
        const roleKey = partner.partnerType;
        const merged = salonServices
            .map(ss => {
                const base = catalogMap[ss.serviceId];
                if (!base) return null;
                const rolePrice = (base.pricingByRole && typeof base.pricingByRole === 'object')
                    ? base.pricingByRole[roleKey]
                    : null;
                return {
                    ...base,
                    // Tier 1: salon owner's price → Tier 2: admin role override → Tier 3: global
                    defaultPrice: ss.price || rolePrice?.defaultPrice || base.defaultPrice,
                    specialPrice: ss.specialPrice !== undefined && ss.specialPrice !== null
                        ? ss.specialPrice
                        : (rolePrice?.specialPrice ?? base.specialPrice ?? null),
                    duration: ss.duration || base.duration,
                };
            })
            .filter(Boolean);

        // Sort by category
        merged.sort((a, b) => (a.category || '').localeCompare(b.category || ''));

        res.json(merged);
    } catch (err) {
        console.error('[GET /api/salons/:id/services]', err);
        res.status(500).json({ error: 'Failed to load salon services' });
    }
});

module.exports = router;
