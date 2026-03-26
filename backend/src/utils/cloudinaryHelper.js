const cloudinary = require('../config/cloudinary');

// ── Resource Type Enum ──────────────────────────────────────────────────────
// All valid upload types. DO NOT accept any value outside this set.
const CloudinaryResourceType = Object.freeze({
    SALON_COVER: 'SALON_COVER',
    SALON_GALLERY: 'SALON_GALLERY',
    STYLIST_PROFILE: 'STYLIST_PROFILE',
    STYLIST_PORTFOLIO: 'STYLIST_PORTFOLIO',
    SERVICE_THUMBNAIL: 'SERVICE_THUMBNAIL',
    CATEGORY_THUMBNAIL: 'CATEGORY_THUMBNAIL',
    PARTNER_DOCUMENT: 'PARTNER_DOCUMENT',
    STATIC: 'STATIC', // Admin only
});

/**
 * Computes the deterministic Cloudinary public_id for a given resource.
 *
 * @param {string} resourceType - One of CloudinaryResourceType values
 * @param {string} resourceId   - The UUID of the entity (salon, stylist, service)
 * @param {object} options      - { index: number } for gallery/portfolio types
 * @returns {string} The public_id string (no file extension — Cloudinary handles that)
 * @throws {Error} If resourceType is invalid or required params are missing
 */
function getPublicId(resourceType, resourceId, options = {}) {
    if (!CloudinaryResourceType[resourceType]) {
        throw new Error(`Invalid resourceType: "${resourceType}". Allowed: ${Object.keys(CloudinaryResourceType).join(', ')}`);
    }

    switch (resourceType) {
        case CloudinaryResourceType.SALON_COVER:
            if (!resourceId) throw new Error('resourceId (salonId) is required for SALON_COVER');
            return `xalon/salons/${resourceId}/cover`;

        case CloudinaryResourceType.SALON_GALLERY: {
            if (!resourceId) throw new Error('resourceId (salonId) is required for SALON_GALLERY');
            const idx = parseInt(options.index, 10);
            if (isNaN(idx) || idx < 0) throw new Error('A non-negative integer "index" is required for SALON_GALLERY');
            return `xalon/salons/${resourceId}/gallery_${idx}`;
        }

        case CloudinaryResourceType.PARTNER_DOCUMENT: {
            if (!resourceId) throw new Error('resourceId (salonId) is required for PARTNER_DOCUMENT');
            const docType = options.docType || 'doc'; // e.g. 'aadhaar' or 'pan'
            return `xalon/salons/${resourceId}/document_${docType}`;
        }

        case CloudinaryResourceType.STYLIST_PROFILE:
            if (!resourceId) throw new Error('resourceId (stylistId) is required for STYLIST_PROFILE');
            return `xalon/stylists/${resourceId}/profile`;

        case CloudinaryResourceType.STYLIST_PORTFOLIO: {
            if (!resourceId) throw new Error('resourceId (stylistId) is required for STYLIST_PORTFOLIO');
            const idx = parseInt(options.index, 10);
            if (isNaN(idx) || idx < 0) throw new Error('A non-negative integer "index" is required for STYLIST_PORTFOLIO');
            return `xalon/stylists/${resourceId}/portfolio_${idx}`;
        }

        case CloudinaryResourceType.SERVICE_THUMBNAIL:
            if (!resourceId) throw new Error('resourceId (serviceId) is required for SERVICE_THUMBNAIL');
            return `xalon/services/${resourceId}/thumbnail`;

        case CloudinaryResourceType.CATEGORY_THUMBNAIL:
            if (!resourceId) throw new Error('resourceId (categoryId) is required for CATEGORY_THUMBNAIL');
            return `xalon/categories/${resourceId}`;

        case CloudinaryResourceType.STATIC:
            if (!resourceId) throw new Error('resourceId (filename) is required for STATIC');
            return `xalon/static/${resourceId}`;

        default:
            throw new Error(`Unhandled resourceType: ${resourceType}`);
    }
}

/**
 * Generates signed upload parameters for a direct client → Cloudinary upload.
 * The signature encodes the public_id so the client cannot upload to a different path.
 *
 * @param {string} resourceType - One of CloudinaryResourceType values
 * @param {string} resourceId   - Entity UUID
 * @param {object} options      - { index: number, transformation: string }
 * @returns {{ public_id, folder, timestamp, signature, api_key, cloud_name }}
 */
function generateUploadSignature(resourceType, resourceId, options = {}) {
    const publicId = getPublicId(resourceType, resourceId, options);
    // Extract folder from public_id (everything except the last segment)
    const folder = publicId.substring(0, publicId.lastIndexOf('/'));

    const timestamp = Math.round(Date.now() / 1000);

    // Parameters to sign — must match exactly what the client will send to Cloudinary
    const paramsToSign = {
        public_id: publicId,
        timestamp,
        overwrite: true,
    };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET
    );

    return {
        public_id: publicId,
        folder,
        timestamp,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        overwrite: true,
    };
}

/**
 * Deletes an asset from Cloudinary by its public_id.
 *
 * @param {string} publicId - The Cloudinary public_id to delete
 * @returns {Promise<object>} Cloudinary API response
 */
async function deleteAsset(publicId) {
    if (!publicId) throw new Error('publicId is required to delete an asset');
    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    return result;
}

/**
 * Extracts the Cloudinary public_id from a secure URL.
 * Strips the version segment and file extension.
 *
 * Example:
 *   "https://res.cloudinary.com/demo/image/upload/v1234567890/xalon/salons/abc/cover.jpg"
 *   → "xalon/salons/abc/cover"
 *
 * @param {string} url - Full Cloudinary URL
 * @returns {string|null}
 */
function extractPublicIdFromUrl(url) {
    if (!url) return null;
    try {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Generates a full Cloudinary delivery URL given a public_id.
 * If the input is already a full URL, it returns it as-is.
 * 
 * @param {string} publicId - Cloudinary public_id or existing URL
 * @returns {string|null} - Formatted secure URL
 */
function getCloudinaryUrl(publicId) {
    if (!publicId) return null;
    if (publicId.startsWith('http')) {
        // Hot-patch legacy local uploads to the new 5001 port so they don't break
        if (publicId.includes(':5000/uploads')) {
            return publicId.replace(':5000/uploads', ':5001/uploads');
        }
        return publicId;
    }
    return cloudinary.url(publicId, { secure: true });
}

module.exports = {
    CloudinaryResourceType,
    getPublicId,
    generateUploadSignature,
    deleteAsset,
    extractPublicIdFromUrl,
    getCloudinaryUrl,
};
