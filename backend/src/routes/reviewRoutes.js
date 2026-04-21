const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// Helper: recalculate averageRating + totalReviews for a partner
async function recalcPartnerRating(partnerId) {
    const agg = await prisma.review.aggregate({
        where: { partnerId, rating: { not: null } },
        _avg: { rating: true },
        _count: { rating: true },
    });
    await prisma.partnerProfile.update({
        where: { id: partnerId },
        data: {
            averageRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
            totalReviews: agg._count.rating,
        },
    });
}

// POST /api/reviews
// { bookingId, partnerId, rating, reviewText }
// Called by xalon customer app after a completed booking
router.post('/', async (req, res) => {
    try {
        const { bookingId, partnerId, rating, reviewText } = req.body;

        if (!bookingId || !partnerId) {
            return res.status(400).json({ error: 'bookingId and partnerId are required' });
        }
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ error: 'rating must be between 1 and 5' });
        }

        // Check booking exists and is Completed
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.status !== 'Completed') {
            return res.status(400).json({ error: 'Reviews can only be submitted for completed bookings' });
        }

        // Prevent duplicate (bookingId is @unique in schema)
        const existing = await prisma.review.findUnique({ where: { bookingId } });
        if (existing) {
            return res.status(409).json({ error: 'A review already exists for this booking' });
        }

        const review = await prisma.review.create({
            data: {
                bookingId,
                partnerId,
                rating: rating ?? null,
                reviewText: reviewText?.trim() || null,
            },
        });

        await recalcPartnerRating(partnerId);

        res.status(201).json(review);
    } catch (err) {
        console.error('POST /reviews', err);
        res.status(500).json({ error: 'Failed to create review' });
    }
});

// GET /api/reviews?partnerId=
// Called by xalonhub partner app to fetch all received reviews
router.get('/', async (req, res) => {
    try {
        const { partnerId } = req.query;
        if (!partnerId) {
            return res.status(400).json({ error: 'partnerId query parameter is required' });
        }

        const reviews = await prisma.review.findMany({
            where: { partnerId },
            include: {
                booking: {
                    include: {
                        customerProfile: true,
                        client: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Remap for compatibility with frontend which might expect specific names
        const mappedReviews = reviews.map(r => {
            const review = { ...r };
            if (review.booking) {
                if (review.booking.customerProfile) {
                    review.booking.customer = review.booking.customerProfile;
                }
                if (review.booking.client) {
                    review.booking.client = review.booking.client; // redundant but explicitly keeping the key
                }
            }
            return review;
        });

        res.json(mappedReviews);
    } catch (err) {
        console.error('GET /reviews', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// GET /api/reviews/booking/:bookingId
// Fetch a single booking's review (used to hydrate the rating sheet / note state)
router.get('/booking/:bookingId', async (req, res) => {
    try {
        const review = await prisma.review.findUnique({
            where: { bookingId: req.params.bookingId },
        });
        if (!review) return res.status(404).json({ error: 'No review found for this booking' });
        res.json(review);
    } catch (err) {
        console.error('GET /reviews/booking/:bookingId', err);
        res.status(500).json({ error: 'Failed to fetch review' });
    }
});

// PUT /api/reviews/:id/partner-note
// { partnerNote }
// Called by xalonhub partner app to write/edit a private client note
router.put('/:id/partner-note', async (req, res) => {
    try {
        const { partnerNote } = req.body;
        if (partnerNote === undefined) {
            return res.status(400).json({ error: 'partnerNote field is required' });
        }
        if (partnerNote && partnerNote.length > 500) {
            return res.status(400).json({ error: 'partnerNote must be 500 characters or fewer' });
        }

        const review = await prisma.review.findUnique({ where: { id: req.params.id } });
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const updated = await prisma.review.update({
            where: { id: req.params.id },
            data: {
                partnerNote: partnerNote?.trim() || null,
                partnerNoteAt: new Date(),
            },
        });

        res.json(updated);
    } catch (err) {
        console.error('PUT /reviews/:id/partner-note', err);
        res.status(500).json({ error: 'Failed to update partner note' });
    }
});

// PUT /api/reviews/booking/:bookingId
// { rating, reviewText }
// Called by xalon customer app to edit an existing review
router.put('/booking/:bookingId', async (req, res) => {
    try {
        const { rating, reviewText } = req.body;
        const { bookingId } = req.params;

        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ error: 'rating must be between 1 and 5' });
        }

        const review = await prisma.review.findUnique({ where: { bookingId } });
        if (!review) {
            return res.status(404).json({ error: 'Review not found for this booking' });
        }

        const updated = await prisma.review.update({
            where: { bookingId },
            data: {
                rating: rating !== undefined ? rating : review.rating,
                reviewText: reviewText !== undefined ? reviewText?.trim() : review.reviewText,
                updatedAt: new Date(),
            },
        });

        if (rating !== undefined && rating !== review.rating) {
            await recalcPartnerRating(review.partnerId);
        }

        res.json(updated);
    } catch (err) {
        console.error('PUT /reviews/booking/:bookingId', err);
        res.status(500).json({ error: 'Failed to update review' });
    }
});

module.exports = router;
