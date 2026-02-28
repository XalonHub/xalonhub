const prisma = require('../prisma');

const getCatalog = async (req, res) => {
    try {
        const { gender, category } = req.query;

        const where = {};
        if (gender) where.gender = gender;
        if (category) where.category = category;

        const services = await prisma.serviceCatalog.findMany({
            where: where,
            orderBy: { name: 'asc' }
        });

        res.json(services);
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
