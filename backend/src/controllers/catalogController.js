const prisma = require('../prisma');
const { getCloudinaryUrl } = require('../utils/cloudinaryHelper');

/**
 * Resolve the effective price for a service given a partner type.
 * Role-specific prices stored in pricingByRole take priority over the global price.
 *
 * @param {object} service - ServiceCatalog row from DB
 * @param {string|null} partnerType - e.g. 'Freelancer', 'Male_Salon', etc.
 * @returns {{ effectivePrice: number, effectiveSpecialPrice: number|null }}
 */
function resolveEffectivePrice(service, partnerType) {
    // 1. FREELANCER: Use role-specific admin pricing if it exists in the catalog.
    if (partnerType === 'Freelancer') {
        const rolePricing = service.pricingByRole;
        if (rolePricing && typeof rolePricing === 'object' && rolePricing['Freelancer']) {
            const roleEntry = rolePricing['Freelancer'];
            return {
                effectivePrice: roleEntry.defaultPrice ?? service.defaultPrice,
                effectiveSpecialPrice: roleEntry.specialPrice !== undefined ? roleEntry.specialPrice : (service.specialPrice ?? null)
            };
        }
        return {
            effectivePrice: service.defaultPrice,
            effectiveSpecialPrice: service.specialPrice ?? null
        };
    }

    // 2. SALON: Salons set their own pricing in their profile (PartnerProfile.salonServices).
    // The Global ServiceCatalog pricing is ignored for salons as per user requirement (No Fallback).
    if (partnerType && ['Male_Salon', 'Female_Salon', 'Unisex_Salon'].includes(partnerType)) {
        return {
            effectivePrice: null,
            effectiveSpecialPrice: null
        };
    }

    // 3. DEFAULT: Return global defaults (for search views without a selected partner type)
    return {
        effectivePrice: service.defaultPrice,
        effectiveSpecialPrice: service.specialPrice ?? null
    };
}

const getCatalog = async (req, res) => {
    try {
        const { gender, category, partnerType } = req.query;

        const where = {};
        if (gender && gender !== 'Everyone' && gender !== 'Both') {
            where.gender = { in: [gender, 'Unisex'] };
        }
        if (category) where.category = category;

        const services = await prisma.serviceCatalog.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        

        // Attach resolved pricing fields so callers never need to interpret pricingByRole themselves.
        const resolved = services.map(s => {
            const { effectivePrice, effectiveSpecialPrice } = resolveEffectivePrice(s, partnerType || null);
            return {
                ...s,
                effectivePrice,
                effectiveSpecialPrice,
                image: s.image && (s.image.startsWith('xalon/') || s.image.includes('cloudinary.com'))
                    ? getCloudinaryUrl(s.image)
                    : s.image
            };
        });

        res.json(resolved);
    } catch (error) {
        console.error('Error fetching catalog:', error);
        res.status(500).json({ error: 'Failed to fetch service catalog' });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        // Add correct image URLs
        const mapped = categories.map(c => ({
            id: c.id,
            name: c.name,
            image: c.image ? getCloudinaryUrl(c.image) : null,
            description: c.description
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

const getSettings = async (req, res) => {
    try {
        let settings = await prisma.globalSettings.findUnique({ where: { id: 'global' } });
        if (!settings) {
            settings = {
                platformFee: 10,
                freelancerCommApp: 15,
                freelancerCommMan: 10,
                salonCommApp: 0,
                salonCommMan: 0
            };
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching global settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

const getHomeLayout = async (req, res) => {
    try {
        // 1. Fetch Stats & Achievements
        const [totalPartners, avgPlatformRating, totalBookings] = await Promise.all([
            prisma.partnerProfile.count({ where: { isOnboarded: true } }),
            prisma.partnerProfile.aggregate({
                _avg: { averageRating: true },
                where: { isOnboarded: true, totalReviews: { gt: 0 } }
            }),
            prisma.booking.count()
        ]);

        // 2. Most Booked Services (with real photos if available)
        const mostBooked = await prisma.serviceCatalog.findMany({
            take: 10,
            orderBy: { updatedAt: 'desc' }
        });

        // 3. Featured Salons & Freelancers
        const featuredPartners = await prisma.partnerProfile.findMany({
            where: { 
                isOnboarded: true,
                kycStatus: 'approved',
                averageRating: { gte: 4.5 }
            },
            take: 24,
            orderBy: { averageRating: 'desc' }
        });

        const mapPartner = (p) => ({
            id: p.id,
            name: p.basicInfo?.businessName || p.name,
            rating: p.averageRating?.toFixed(1) || "5.0",
            reviews: p.totalReviews || 0,
            image: p.basicInfo?.profileImg || "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=200",
            specialty: p.categories?.[0] || "Stylist",
            type: p.partnerType
        });

        let salons = featuredPartners.filter(p => ['Male_Salon', 'Female_Salon', 'Unisex_Salon'].includes(p.partnerType)).map(mapPartner);
        let freelancers = featuredPartners.filter(p => p.partnerType === 'Freelancer').map(mapPartner);

        // Fill with premium mocks if sparse
        if (salons.length < 4) {
            salons = [...salons, 
                { id: 'ms1', name: 'Elite Salon & Spa', rating: '4.9', reviews: 1240, specialty: 'Premium Hair Care', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200', type: 'Unisex_Salon' },
                { id: 'ms2', name: 'Groom & Glow', rating: '4.8', reviews: 850, specialty: 'Men\'s Grooming', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200', type: 'Male_Salon' }
            ];
        }
        if (freelancers.length < 4) {
            freelancers = [...freelancers,
                { id: 'mf1', name: 'Alina Rose', rating: '5.0', reviews: 420, specialty: 'Makeup Artist', image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200', type: 'Freelancer' },
                { id: 'mf2', name: 'David Chen', rating: '4.9', reviews: 310, specialty: 'Expert Stylist', image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=200', type: 'Freelancer' }
            ];
        }

        // 4. Gender-specific Categories
        const [femaleCategories, maleCategories] = await Promise.all([
            prisma.serviceCatalog.findMany({
                where: { gender: { in: ['Female', 'Unisex'] } },
                select: { category: true },
                distinct: ['category']
            }),
            prisma.serviceCatalog.findMany({
                where: { gender: { in: ['Male', 'Unisex'] } },
                select: { category: true },
                distinct: ['category']
            })
        ]);

        res.json({
            hero: {
                title: "Bringing Salon Expertise to Your Doorstep",
                subtitle: "Book verified professionals from top-rated salons in 30 seconds.",
                bgImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200"
            },
            achievements: [
                { label: "Service Rating", value: avgPlatformRating?._avg?.averageRating?.toFixed(1) || "4.8", icon: "⭐" },
                { label: "Verified Stylists", value: `${totalPartners}+`, icon: "👤" },
                { label: "Happy Customers", value: totalBookings > 1000 ? `${(totalBookings/1000).toFixed(1)}k+` : "1k+", icon: "❤️" },
                { label: "Cities", value: "22+", icon: "📍" }
            ],
            banners: [
                { id: 1, title: "Summer Glow-up", subtitle: "Flat 20% off on Facials", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800", color: "#f3e8ff" },
                { id: 2, title: "Spa at Home", subtitle: "Heal your body and soul", image: "https://images.unsplash.com/photo-1583417267826-aebc4d1542e1?auto=format&fit=crop&q=80&w=800", color: "#e0f2fe" }
            ],
            mostBooked: mostBooked.map(s => ({
                ...s,
                rating: (4.5 + Math.random() * 0.4).toFixed(1), 
                reviews: Math.floor(Math.random() * 500) + 50,
                image: s.image || "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400"
            })),
            featuredSalons: salons,
            featuredFreelancers: freelancers,
            sections: [
                {
                    title: "Salon for Women",
                    gender: "Female",
                    categories: femaleCategories.map(c => c.category)
                },
                {
                    title: "Salon for Men",
                    gender: "Male",
                    categories: maleCategories.map(c => c.category)
                }
            ]
        });
    } catch (error) {
        console.error('Error fetching home layout:', error);
        res.status(500).json({ error: 'Failed to fetch home layout' });
    }
};

module.exports = {
    getCatalog,
    getCategories,
    getSettings,
    getHomeLayout
};
