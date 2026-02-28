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
                name: p.basicInfo?.salonName || p.basicInfo?.name || 'N/A',
                phone: p.user?.phone || 'N/A',
                email: p.user?.email || null,
                kycStatus: p.kycStatus || 'pending', // Pull from new top-level field
                kycRejectedReason: p.kycRejectedReason || null,
                documents: {
                    aadhaarDocId: docs.aadhaarDocId || null,
                    panDocId: docs.panDocId || null,
                    policeCertDocId: docs.policeCertDocId || null,
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
        res.json({
            success: true,
            partner: {
                partnerId: partner.id,
                partnerType: partner.partnerType,
                name: partner.basicInfo?.salonName || partner.basicInfo?.name || 'N/A',
                phone: partner.user?.phone,
                email: partner.user?.email,
                address: partner.address,
                kycStatus: partner.kycStatus || 'pending', // Top-level
                kycRejectedReason: partner.kycRejectedReason || null, // Top-level
                documents: docs, // Send full docs object for admin review
                submittedAt: docs.submittedAt || null,
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
        const { name, category, subCategory, description, duration, priceType, defaultPrice, specialPrice, maxQuantity, gender } = req.body;
        if (!name || !category || !defaultPrice) {
            return res.status(400).json({ success: false, message: 'name, category and defaultPrice are required' });
        }
        const service = await prisma.serviceCatalog.create({
            data: { name, category, subCategory, description, duration: duration || 30, priceType: priceType || 'Fixed', defaultPrice: Number(defaultPrice), specialPrice: specialPrice ? Number(specialPrice) : null, maxQuantity: maxQuantity || 3, gender: gender || null }
        });
        console.log(`[Catalogue] Created service: ${service.id} – ${service.name}`);
        res.json({ success: true, service });
    } catch (err) {
        console.error('[Admin] Catalogue create error:', err);
        res.status(500).json({ success: false, message: 'Failed to create service' });
    }
});

// ─── PUT /admin/catalogue/:id ─────────────────────────────────────────────────
router.put('/catalogue/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, subCategory, description, duration, priceType, defaultPrice, specialPrice, maxQuantity, gender } = req.body;
        const service = await prisma.serviceCatalog.update({
            where: { id },
            data: { name, category, subCategory, description, duration: duration ? Number(duration) : undefined, priceType, defaultPrice: defaultPrice ? Number(defaultPrice) : undefined, specialPrice: specialPrice ? Number(specialPrice) : null, maxQuantity: maxQuantity ? Number(maxQuantity) : undefined, gender }
        });
        console.log(`[Catalogue] Updated service: ${id}`);
        res.json({ success: true, service });
    } catch (err) {
        console.error('[Admin] Catalogue update error:', err);
        res.status(500).json({ success: false, message: 'Failed to update service' });
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

module.exports = router;
