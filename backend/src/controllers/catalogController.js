const prisma = require('../prisma');

/**
 * Resolve the effective price for a service given a partner type.
 * Role-specific prices stored in pricingByRole take priority over the global price.
 *
 * @param {object} service - ServiceCatalog row from DB
 * @param {string|null} partnerType - e.g. 'Freelancer', 'Male_Salon', etc.
 * @returns {{ effectivePrice: number, effectiveSpecialPrice: number|null }}
 */
function resolveEffectivePrice(service, partnerType) {
    // Admin fixed pricing: exclusively use the global defaultPrice
    // (Role-specific pricing overlaps are being phased out per user request)
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
            where.gender = gender;
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
        const categories = await prisma.serviceCatalog.findMany({
            select: {
                category: true,
            },
            distinct: ['category'],
        });

        res.json(categories.map(c => c.category));
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

module.exports = {
    getCatalog,
    getCategories
};
