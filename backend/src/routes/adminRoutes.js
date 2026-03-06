const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const prisma = require('../prisma');
const adminAuth = require('../middleware/adminAuth');

// ─── POST /admin/login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ success: false, message: 'Phone and password required' });
    }

    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'xalon_admin_2026';

    if (password !== ADMIN_SECRET) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    try {
        let user = await prisma.user.findUnique({ where: { phone } });

        if (!user) {
            user = await prisma.user.create({ data: { phone, role: 'Admin' } });
        } else if (user.role !== 'Admin') {
            user = await prisma.user.update({ where: { id: user.id }, data: { role: 'Admin' } });
        }

        const token = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ success: true, token, user: { id: user.id, phone: user.phone, role: user.role } });
    } catch (error) {
        console.error('[Admin] Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during admin login' });
    }
});

// ─── POST /admin/logout ────────────────────────────────────────────────────────
// Client clears localStorage token. Server-side no-op for now (future: cookie invalidation).
router.post('/logout', adminAuth, (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// ─── GET /admin/dashboard/stats ───────────────────────────────────────────────
router.get('/dashboard/stats', adminAuth, async (req, res) => {
    try {
        const [totalPartners, totalCustomers, totalBookings, allPartners] = await Promise.all([
            prisma.partnerProfile.count(),
            prisma.customerProfile.count(),
            prisma.booking.count(),
            prisma.partnerProfile.findMany({ select: { documents: true } })
        ]);

        const pendingKyc = allPartners.filter(p => {
            const docs = p.documents;
            if (!docs) return false;
            const kycStatus = docs.kycStatus;
            return !kycStatus || kycStatus === 'pending';
        }).length;

        res.json({
            success: true,
            stats: { totalPartners, pendingKyc, totalCustomers, totalBookings }
        });
    } catch (error) {
        console.error('[Admin] Stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

// ─── GET /admin/kyc ───────────────────────────────────────────────────────────
router.get('/kyc', adminAuth, async (req, res) => {
    try {
        const partners = await prisma.partnerProfile.findMany({
            include: { user: { select: { phone: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const kycList = partners.map(p => {
            const docs = p.documents || {};
            return {
                partnerId: p.id,
                partnerType: p.partnerType,
                name: p.basicInfo?.salonName || p.basicInfo?.shopName || p.basicInfo?.ownerName || p.basicInfo?.name || 'N/A',
                phone: p.user?.phone || 'N/A',
                email: p.user?.email || null,
                kycStatus: p.kycStatus || 'pending', // Pull from new top-level field
                kycRejectedReason: p.kycRejectedReason || null,
                documents: {
                    aadhaarDocId: docs.aadhaarDocId || null,
                    panDocId: docs.panDocId || null,
                    policeCertDocId: docs.policeCertDocId || null,
                    regCertificateDocId: docs.regCertificate || docs.regCertificateImg || null,
                }
            };
        });

        res.json({ success: true, kycList });
    } catch (error) {
        console.error('[Admin] KYC list error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch KYC list' });
    }
});

// ─── GET /admin/kyc/:partnerId ────────────────────────────────────────────────
router.get('/kyc/:partnerId', adminAuth, async (req, res) => {
    const { partnerId } = req.params;
    try {
        const partner = await prisma.partnerProfile.findUnique({
            where: { id: partnerId },
            include: { user: { select: { phone: true, email: true } } }
        });

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        const docs = partner.documents || {};
        const basicInfo = partner.basicInfo || {};
        res.json({
            success: true,
            partner: {
                ...partner,
                partnerId: partner.id,
                name: basicInfo.salonName || basicInfo.ownerName || basicInfo.name || 'N/A',
                phone: partner.user?.phone,
                email: partner.user?.email || basicInfo.email,
                kycStatus: partner.kycStatus || 'pending',
                kycRejectedReason: partner.kycRejectedReason || null,
                documents: docs,
                submittedAt: docs.submittedAt || partner.createdAt || null,
            }
        });
    } catch (error) {
        console.error('[Admin] KYC detail error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch partner KYC' });
    }
});

// ─── POST /admin/kyc/:partnerId/status ────────────────────────────────────────
router.post('/kyc/:partnerId/status', adminAuth, async (req, res) => {
    const { partnerId } = req.params;
    const { status, reason } = req.body; // Add reason

    const VALID_STATUSES = ['pending', 'under_review', 'approved', 'rejected'];
    if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    try {
        const partner = await prisma.partnerProfile.findUnique({ where: { id: partnerId } });
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        await prisma.partnerProfile.update({
            where: { id: partnerId },
            data: {
                kycStatus: status,
                kycRejectedReason: status === 'rejected' ? (reason || 'Documents missing or invalid') : null
            }
        });

        // Basic server-side logging
        console.log(`[KYC] partner:${partnerId} → ${status} at ${new Date().toISOString()} by admin:${req.admin.id}`);

        res.json({ success: true, message: `KYC status updated to '${status}'`, partnerId, status });
    } catch (error) {
        console.error('[Admin] KYC status update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update KYC status' });
    }
});

// ─── GET /admin/kyc/document/:docId ───────────────────────────────────────────
// Storage-agnostic document serving. Currently serves from local uploads/.
// To migrate to S3: replace res.sendFile with a signed URL redirect — zero UI change.
router.get('/kyc/document/:docId', adminAuth, (req, res) => {
    const { docId } = req.params;

    // Sanitize: prevent path traversal
    const safeDocId = path.basename(docId);
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, safeDocId);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.sendFile(safeDocId, { root: uploadsDir }, (err) => {
        if (err) {
            console.error('[Admin] sendFile error:', err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Error serving file', error: err.message });
            }
        }
    });
});

// ─── GET /admin/catalogue ─────────────────────────────────────────────────────
// ?category=Haircut&gender=Male
router.get('/catalogue', adminAuth, async (req, res) => {
    try {
        const { category, gender } = req.query;
        const where = {};
        if (category) where.category = category;
        if (gender) where.gender = gender;

        const services = await prisma.serviceCatalog.findMany({
            where,
            orderBy: [{ category: 'asc' }, { name: 'asc' }]
        });
        res.json({ success: true, services });
    } catch (err) {
        console.error('[Admin] Catalogue list error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch catalogue' });
    }
});

// ─── POST /admin/catalogue ────────────────────────────────────────────────────
router.post('/catalogue', adminAuth, async (req, res) => {
    try {
        const { name, category, subCategory, description, duration, priceType, defaultPrice, specialPrice, pricingByRole, maxQuantity, gender } = req.body;
        if (!name || !category || !defaultPrice) {
            return res.status(400).json({ success: false, message: 'name, category and defaultPrice are required' });
        }
        const service = await prisma.serviceCatalog.create({
            data: {
                name, category, subCategory, description,
                duration: duration || 30,
                priceType: priceType || 'Fixed',
                defaultPrice: Number(defaultPrice),
                specialPrice: specialPrice ? Number(specialPrice) : null,
                pricingByRole: pricingByRole || {},
                maxQuantity: maxQuantity || 3,
                gender: gender || null
            }
        });
        console.log(`[Catalogue] Created service: ${service.id} – ${service.name}`);
        res.json({ success: true, service });
    } catch (err) {
        console.error('[Admin] Catalogue create error:', err);
        res.status(500).json({ success: false, message: 'Failed to create service' });
    }
});

// ─── PUT /admin/catalogue/:id ─────────────────────────────────────────────────
// General update (name, category, duration, gender, etc.).
// To update pricing for a SPECIFIC partner role use PUT /admin/catalogue/:id/pricing instead.
router.put('/catalogue/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, subCategory, description, duration, priceType, defaultPrice, specialPrice, maxQuantity, gender } = req.body;
        const service = await prisma.serviceCatalog.update({
            where: { id },
            data: {
                name, category, subCategory, description,
                duration: duration ? Number(duration) : undefined,
                priceType,
                // Only update global prices if no partnerType is specified.
                // Prefer PUT /catalogue/:id/pricing for role-scoped edits.
                defaultPrice: defaultPrice ? Number(defaultPrice) : undefined,
                specialPrice: specialPrice !== undefined ? (specialPrice ? Number(specialPrice) : null) : undefined,
                maxQuantity: maxQuantity ? Number(maxQuantity) : undefined,
                gender
            }
        });
        console.log(`[Catalogue] Updated service: ${id}`);
        res.json({ success: true, service });
    } catch (err) {
        console.error('[Admin] Catalogue update error:', err);
        res.status(500).json({ success: false, message: 'Failed to update service' });
    }
});

// ─── PUT /admin/catalogue/:id/pricing ─────────────────────────────────────────
// Update pricing for a SPECIFIC partner role without affecting other roles.
// Body: { partnerType: "Freelancer" | "Male_Salon" | "Female_Salon" | "Unisex_Salon",
//         defaultPrice: number, specialPrice?: number | null }
const VALID_PARTNER_TYPES = ['Freelancer', 'Male_Salon', 'Female_Salon', 'Unisex_Salon'];
router.put('/catalogue/:id/pricing', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { partnerType, defaultPrice, specialPrice } = req.body;

        if (!partnerType || !VALID_PARTNER_TYPES.includes(partnerType)) {
            return res.status(400).json({
                success: false,
                message: `partnerType must be one of: ${VALID_PARTNER_TYPES.join(', ')}`
            });
        }
        if (defaultPrice === undefined || defaultPrice === null || Number(defaultPrice) <= 0) {
            return res.status(400).json({ success: false, message: 'defaultPrice must be a positive number' });
        }

        // Fetch current pricingByRole so we can merge instead of overwrite
        const current = await prisma.serviceCatalog.findUnique({ where: { id }, select: { pricingByRole: true } });
        if (!current) return res.status(404).json({ success: false, message: 'Service not found' });

        const existingPricing = (current.pricingByRole && typeof current.pricingByRole === 'object')
            ? current.pricingByRole
            : {};

        const updatedPricing = {
            ...existingPricing,
            [partnerType]: {
                defaultPrice: Number(defaultPrice),
                specialPrice: specialPrice !== undefined ? (specialPrice ? Number(specialPrice) : null) : null
            }
        };

        const service = await prisma.serviceCatalog.update({
            where: { id },
            data: { pricingByRole: updatedPricing }
        });

        console.log(`[Catalogue] Updated ${partnerType} pricing for service: ${id}`);
        res.json({ success: true, service, updatedPricing });
    } catch (err) {
        console.error('[Admin] Catalogue role-pricing update error:', err);
        res.status(500).json({ success: false, message: 'Failed to update role-scoped pricing' });
    }
});

// ─── DELETE /admin/catalogue/:id/pricing/:partnerType ─────────────────────────
// Remove the role-specific price override for a partner type (reverts to global defaultPrice).
router.delete('/catalogue/:id/pricing/:partnerType', adminAuth, async (req, res) => {
    try {
        const { id, partnerType } = req.params;
        if (!VALID_PARTNER_TYPES.includes(partnerType)) {
            return res.status(400).json({ success: false, message: `Invalid partnerType: ${partnerType}` });
        }

        const current = await prisma.serviceCatalog.findUnique({ where: { id }, select: { pricingByRole: true } });
        if (!current) return res.status(404).json({ success: false, message: 'Service not found' });

        const existingPricing = (current.pricingByRole && typeof current.pricingByRole === 'object')
            ? { ...current.pricingByRole }
            : {};
        delete existingPricing[partnerType];

        const service = await prisma.serviceCatalog.update({
            where: { id },
            data: { pricingByRole: existingPricing }
        });

        console.log(`[Catalogue] Removed ${partnerType} pricing override for service: ${id}`);
        res.json({ success: true, message: `${partnerType} pricing override removed`, service });
    } catch (err) {
        console.error('[Admin] Catalogue role-pricing delete error:', err);
        res.status(500).json({ success: false, message: 'Failed to remove role-scoped pricing' });
    }
});

// ─── DELETE /admin/catalogue/:id ──────────────────────────────────────────────
router.delete('/catalogue/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.serviceCatalog.delete({ where: { id } });
        console.log(`[Catalogue] Deleted service: ${id}`);
        res.json({ success: true, message: 'Service deleted' });
    } catch (err) {
        console.error('[Admin] Catalogue delete error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete service' });
    }
});

// ─── GET /admin/api/customers ────────────────────────────────────────────────
router.get('/customers', adminAuth, async (req, res) => {
    try {
        const customers = await prisma.customerProfile.findMany({
            include: {
                user: { select: { phone: true, email: true, createdAt: true } },
                _count: { select: { bookings: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, customers });
    } catch (error) {
        console.error('[Admin] Customers list error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customers' });
    }
});

// ─── GET /admin/api/bookings ──────────────────────────────────────────────────
router.get('/bookings', adminAuth, async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                customer: { select: { name: true, user: { select: { phone: true } } } },
                partner: { select: { basicInfo: true, partnerType: true } }
            },
            orderBy: { bookingDate: 'desc' }
        });
        res.json({ success: true, bookings });
    } catch (error) {
        console.error('[Admin] Bookings list error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
});

// ─── GET /admin/api/partners ──────────────────────────────────────────────────
router.get('/partners', adminAuth, async (req, res) => {
    try {
        const partners = await prisma.partnerProfile.findMany({
            include: {
                user: { select: { phone: true, email: true, createdAt: true } },
                _count: { select: { bookings: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const list = partners.map(p => {
            const bi = p.basicInfo || {};
            return {
                id: p.id,
                partnerType: p.partnerType,
                name: bi.salonName || bi.shopName || bi.ownerName || bi.name || 'Anonymous Partner',
                phone: p.user?.phone,
                email: p.user?.email || bi.email || 'No email',
                kycStatus: p.kycStatus,
                isOnboarded: p.isOnboarded,
                bookingCount: p._count.bookings,
                createdAt: p.createdAt
            };
        });

        res.json({ success: true, partners: list });
    } catch (error) {
        console.error('[Admin] Partners list error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch partners' });
    }
});

// ─── GET /admin/deals ─────────────────────────────────────────────────────────
// V0: Skeleton only – returns all deals (no business logic yet)
router.get('/deals', adminAuth, async (req, res) => {
    try {
        const deals = await prisma.deal.findMany({
            include: { service: { select: { id: true, name: true, category: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, deals });
    } catch (err) {
        console.error('[Admin] Deals list error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch deals' });
    }
});

// ─── POST /admin/deals ────────────────────────────────────────────────────────
// V0: Skeleton only – create a deal record with applicableTo roles
router.post('/deals', adminAuth, async (req, res) => {
    try {
        const { serviceId, title, description, discountPct, dealPrice, applicableTo, validFrom, validUntil } = req.body;
        if (!serviceId || !title || !dealPrice || !applicableTo || !applicableTo.length) {
            return res.status(400).json({ success: false, message: 'serviceId, title, dealPrice, and applicableTo[] are required' });
        }
        const invalidRoles = applicableTo.filter(r => !VALID_PARTNER_TYPES.includes(r));
        if (invalidRoles.length) {
            return res.status(400).json({ success: false, message: `Invalid roles in applicableTo: ${invalidRoles.join(', ')}` });
        }
        const deal = await prisma.deal.create({
            data: {
                serviceId,
                title,
                description: description || null,
                discountPct: discountPct ? Number(discountPct) : null,
                dealPrice: Number(dealPrice),
                applicableTo,
                validFrom: validFrom ? new Date(validFrom) : new Date(),
                validUntil: validUntil ? new Date(validUntil) : null,
                isActive: true
            }
        });
        console.log(`[Deals] Created deal: ${deal.id} for service: ${serviceId}`);
        res.json({ success: true, deal });
    } catch (err) {
        console.error('[Admin] Deals create error:', err);
        res.status(500).json({ success: false, message: 'Failed to create deal' });
    }
});

module.exports = router;
