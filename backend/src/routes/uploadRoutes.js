const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const {
    CloudinaryResourceType,
    generateUploadSignature,
    deleteAsset,
    extractPublicIdFromUrl,
} = require('../utils/cloudinaryHelper');

// Configure multer to hold file in memory for streaming to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// ── POST /api/upload ────────────────────────────────────────────────────────
// Generic file upload endpoint acting as proxy to Cloudinary.
// Used by XalonHub and Customer Apps that don't support signed direct uploads natively.
router.post('/', auth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file received' });

    // Stream the buffer directly to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
        { folder: `xalon/uploads/${req.user.id}` },
        (error, result) => {
            if (error) {
                console.error('[Upload Stream Error]', error);
                return res.status(500).json({ error: 'Failed to upload file to Cloudinary' });
            }
            console.log(`[Upload] File uploaded by ${req.user.id}: ${result.secure_url}`);
            // Return full delivery URL as expected by frontend's `uploadService.js`
            res.json({ url: result.secure_url });
        }
    );

    stream.end(req.file.buffer);
});

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Verifies that the requesting user has permission to modify the given resource.
 * Rules:
 *   - SALON_COVER / SALON_GALLERY → user must own the PartnerProfile with that id
 *   - STYLIST_PROFILE / STYLIST_PORTFOLIO → user must own the Stylist's parent salon
 *   - SERVICE_THUMBNAIL → Admin only
 *   - STATIC → Admin only
 */
async function checkOwnership(resourceType, resourceId, user) {
    const isAdmin = user.role === 'Admin';
    const isPartner = ['Male_Salon', 'Female_Salon', 'Unisex_Salon', 'Freelancer'].includes(user.role);

    switch (resourceType) {
        case CloudinaryResourceType.SALON_COVER:
        case CloudinaryResourceType.SALON_GALLERY: {
            if (isAdmin) return true;
            if (!isPartner) return false;
            const profile = await prisma.partnerProfile.findFirst({
                where: { id: resourceId, user: { id: user.id } },
                select: { id: true }
            });
            return !!profile;
        }

        case CloudinaryResourceType.STYLIST_PROFILE:
        case CloudinaryResourceType.STYLIST_PORTFOLIO: {
            if (isAdmin) return true;
            if (!isPartner) return false;
            const stylist = await prisma.stylist.findFirst({
                where: { id: resourceId, partner: { user: { id: user.id } } },
                select: { id: true }
            });
            return !!stylist;
        }

        case CloudinaryResourceType.SERVICE_THUMBNAIL:
        case CloudinaryResourceType.CATEGORY_THUMBNAIL:
        case CloudinaryResourceType.STATIC:
            return isAdmin;

        default:
            return false;
    }
}

// ── POST /api/upload/sign ─────────────────────────────────────────────────
// Returns a signed upload signature for the client to upload directly to Cloudinary.
// Requires: Bearer JWT token
// Body: { resourceType, resourceId, index? }
router.post('/sign', auth, async (req, res) => {
    try {
        const { resourceType, resourceId, index } = req.body;

        // 1. Validate resource type
        if (!resourceType || !CloudinaryResourceType[resourceType]) {
            return res.status(400).json({
                error: 'Invalid resourceType',
                allowed: Object.keys(CloudinaryResourceType)
            });
        }

        // 2. Validate resourceId
        if (!resourceId) {
            return res.status(400).json({ error: 'resourceId is required' });
        }

        // 3. Authorization: verify ownership
        const authorized = await checkOwnership(resourceType, resourceId, req.user);
        if (!authorized) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to upload to this resource' });
        }

        // 4. Generate signed upload params
        const params = generateUploadSignature(resourceType, resourceId, { index });

        res.json({
            ...params,
            message: 'Upload signature generated successfully'
        });

    } catch (err) {
        console.error('[Upload Sign Error]', err.message);
        const msg = err.message.includes('Invalid') || err.message.includes('required')
            ? err.message
            : 'Failed to generate upload signature';
        res.status(400).json({ error: msg });
    }
});

// ── DELETE /api/upload ────────────────────────────────────────────────────
// Deletes an asset from Cloudinary.
// Requires: Bearer JWT token
// Body: { publicId } OR { url }
router.delete('/', auth, async (req, res) => {
    try {
        let { publicId, url } = req.body;

        // Derive publicId from URL if not directly provided
        if (!publicId && url) {
            publicId = extractPublicIdFromUrl(url);
        }

        if (!publicId) {
            return res.status(400).json({ error: 'publicId or url is required' });
        }

        // Security: ensure the publicId is within the allowed xalon/ namespace
        if (!publicId.startsWith('xalon/')) {
            return res.status(400).json({ error: 'Forbidden: Cannot delete assets outside the xalon/ namespace' });
        }

        // Authorization check by extracting resource info from the path
        // Path format: xalon/{type}/{id}/...
        const parts = publicId.split('/');
        // parts[0] = 'xalon', parts[1] = 'salons'|'stylists'|'services'|'static', parts[2] = id
        const sectionMap = {
            salons: (id) => checkOwnership(CloudinaryResourceType.SALON_COVER, id, req.user),
            stylists: (id) => checkOwnership(CloudinaryResourceType.STYLIST_PROFILE, id, req.user),
            services: () => checkOwnership(CloudinaryResourceType.SERVICE_THUMBNAIL, null, req.user),
            static: () => checkOwnership(CloudinaryResourceType.STATIC, null, req.user),
        };

        const section = parts[1];
        const entityId = parts[2];
        const checker = sectionMap[section];

        if (!checker) {
            return res.status(400).json({ error: 'Unrecognized Cloudinary path section' });
        }

        const authorized = await checker(entityId);
        if (!authorized) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this asset' });
        }

        const result = await deleteAsset(publicId);

        if (result.result === 'ok') {
            res.json({ success: true, message: 'Asset deleted successfully', publicId });
        } else if (result.result === 'not found') {
            res.json({ success: true, message: 'Asset not found (already deleted)', publicId });
        } else {
            res.status(500).json({ error: 'Cloudinary deletion failed', detail: result });
        }

    } catch (err) {
        console.error('[Upload Delete Error]', err);
        res.status(500).json({ error: 'Failed to delete asset' });
    }
});

module.exports = router;
