const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const catalogController = require('../controllers/catalogController');

// GET /api/catalog/categories – fetch all distinct categories
router.get('/categories', catalogController.getCategories);

// GET /api/catalog – filtered service catalog
// ?category=Hair&gender=Male
router.get('/', async (req, res) => {
    try {
        const { category, gender } = req.query;
        const where = {};
        if (category) where.category = category;
        if (gender) where.gender = { in: [gender, 'Unisex'] };

        const services = await prisma.serviceCatalog.findMany({
            where,
            orderBy: { category: 'asc' },
        });

        // Attach a fulfillmentType label for the customer app UI
        const enriched = services.map((s) => ({
            ...s,
            fulfillmentType:
                s.gender === 'Male' || s.gender === 'Female'
                    ? 'Salon & Freelancer'
                    : 'Salon & Freelancer',
        }));

        res.json(enriched);
    } catch (err) {
        console.error('GET /catalog', err);
        res.status(500).json({ error: 'Failed to fetch catalog' });
    }
});

module.exports = router;
