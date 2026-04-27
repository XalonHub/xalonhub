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

    const prefix = process.env.CLOUDINARY_FOLDER_PREFIX || 'dev';
    let path = '';

    switch (resourceType) {
        case CloudinaryResourceType.SALON_COVER: {
            if (!resourceId) throw new Error('resourceId (partnerId) is required for SALON_COVER');
            const type = options.type || 'logo'; // 'logo' or 'banner'
            path = `partners/${resourceId}/${type}`;
            break;
        }

        case CloudinaryResourceType.SALON_GALLERY: {
            if (!resourceId) throw new Error('resourceId (partnerId) is required for SALON_GALLERY');
            const idx = options.index !== undefined ? options.index : Date.now();
            path = `partners/${resourceId}/gallery/img_${idx}`;
            break;
        }

        case CloudinaryResourceType.PARTNER_DOCUMENT: {
            if (!resourceId) throw new Error('resourceId (partnerId) is required for PARTNER_DOCUMENT');
            const docType = options.docType || 'id_proof';
            path = `partners/${resourceId}/documents/${docType}`;
            break;
        }

        case CloudinaryResourceType.STYLIST_PROFILE:
            if (!resourceId) throw new Error('resourceId (stylistId) is required for STYLIST_PROFILE');
            // Check if we have a partnerId to nest it
            if (options.partnerId) {
                path = `partners/${options.partnerId}/stylists/${resourceId}/profile`;
            } else {
                path = `stylists/${resourceId}/profile`;
            }
            break;

        case CloudinaryResourceType.STYLIST_PORTFOLIO: {
            if (!resourceId) throw new Error('resourceId (stylistId) is required for STYLIST_PORTFOLIO');
            const idx = options.index !== undefined ? options.index : Date.now();
            if (options.partnerId) {
                path = `partners/${options.partnerId}/stylists/${resourceId}/portfolio/img_${idx}`;
            } else {
                path = `stylists/${resourceId}/portfolio/img_${idx}`;
            }
            break;
        }

        case CloudinaryResourceType.SERVICE_THUMBNAIL:
            if (!resourceId) throw new Error('resourceId (serviceId) is required for SERVICE_THUMBNAIL');
            path = `services/${resourceId}/thumbnail`;
            break;

        case CloudinaryResourceType.CATEGORY_THUMBNAIL:
            if (!resourceId) throw new Error('resourceId (categoryId) is required for CATEGORY_THUMBNAIL');
            path = `categories/${resourceId}`;
            break;

        case CloudinaryResourceType.STATIC:
            if (!resourceId) throw new Error('resourceId (filename) is required for STATIC');
            path = `static/${resourceId}`;
            break;

        default:
            throw new Error(`Unhandled resourceType: ${resourceType}`);
    }

    return `${prefix}/xalon/${path}`;
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
 * Extracts a public_id from a potentially corrupted or full Cloudinary URL.
 * Handles double-nesting and removes file extensions.
 * 
 * @param {string} urlOrId - The input URL or ID
 * @returns {string|null} - Cleaned public_id
 */
function extractPublicId(urlOrId) {
    if (!urlOrId || typeof urlOrId !== 'string') return null;

    let id = urlOrId;

    // 1. If it's a full URL, extract the part after /upload/
    if (id.startsWith('http')) {
        const uploadIndex = id.indexOf('/upload/');
        if (uploadIndex !== -1) {
            let afterUpload = id.substring(uploadIndex + 8);
            const segments = afterUpload.split('/');

            // Skip segments that are transformations (contain , or =) or versioning (v + digits)
            let publicIdStartIdx = 0;
            while (publicIdStartIdx < segments.length) {
                const seg = segments[publicIdStartIdx];
                const isVersion = /^v\d+$/.test(seg);
                const isTransformation = seg.includes(',') || seg.includes('=') || /^[a-z]_(?:auto|[\w,]+)$/.test(seg);

                if (isVersion || isTransformation) {
                    publicIdStartIdx++;
                } else {
                    break;
                }
            }
            id = segments.slice(publicIdStartIdx).join('/');
        }
    }

    // 2. Remove file extension if present (.jpg, .png, etc.)
    id = id.replace(/\.[^/.]+$/, "");

    // 3. De-duplicate nested paths (e.g., xalon/partners/ID/xalon/partners/ID/logo)
    // Common pattern: some/path/some/path/filename -> some/path/filename
    const segments = id.split('/');
    const cleanedSegments = [];
    for (let i = 0; i < segments.length; i++) {
        // If the next few segments match the current ones, skip them
        let duplicateFound = false;
        for (let len = 1; len <= (segments.length - i) / 2; len++) {
            const currentPart = segments.slice(i, i + len).join('/');
            const nextPart = segments.slice(i + len, i + 2 * len).join('/');
            if (currentPart === nextPart) {
                // Found a duplication, skip the first occurrence and continue with the next
                // Wait, it's usually better to keep one.
                duplicateFound = true;
                break;
            }
        }
        if (!duplicateFound) {
            cleanedSegments.push(segments[i]);
        }
    }

    let cleanedId = cleanedSegments.join('/');

    // 4. Ensure it doesn't start with /
    if (cleanedId.startsWith('/')) cleanedId = cleanedId.substring(1);

    return cleanedId;
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

    // 1. Handle full URLs
    if (publicId.startsWith('http')) {
        // Hot-patch legacy local uploads
        if (publicId.includes(':5000/uploads')) {
            return publicId.replace(':5000/uploads', ':5001/uploads');
        }

        // 2. If it's already a Cloudinary URL, extract the ID and continue to standardize it
        if (publicId.includes('res.cloudinary.com')) {
            const extracted = extractPublicId(publicId);
            if (extracted) {
                publicId = extracted;
            } else {
                return publicId; // Fallback if extraction fails
            }
        } else {
            // Not a Cloudinary URL and not local, return as-is
            return publicId;
        }
    }

    // 2. Clean up ID
    let cleanId = extractPublicId(publicId);

    // 3. Ensure prefix (standardize to prefix/xalon/...)
    const prefix = process.env.CLOUDINARY_FOLDER_PREFIX || 'dev';

    // Remove any existing environment prefix
    if (cleanId.startsWith('dev/')) cleanId = cleanId.substring(4);
    else if (cleanId.startsWith('prod/')) cleanId = cleanId.substring(5);

    // Ensure it starts with xalon/
    if (!cleanId.startsWith('xalon/')) {
        cleanId = `xalon/${cleanId}`;
    }

    // Prepend current environment prefix
    cleanId = `${prefix}/${cleanId}`;

    // 4. Handle public_ids by prefixing with Cloudinary delivery URL
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'divyyczmu';
    const timestamp = Math.floor(Date.now() / 1000);
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/v${timestamp}/`;

    return `${baseUrl}${cleanId}`;
}

/**
 * Helper to map an object's URL property to a full Cloudinary delivery URL.
 */
function mapUrl(obj, key) {
    if (obj && obj[key]) obj[key] = getCloudinaryUrl(obj[key]);
}

/**
 * Maps all image fields in a PartnerProfile object.
 */
function mapPartnerDocs(p) {
    if (!p) return p;

    // 1. Basic Info
    if (p.basicInfo) mapUrl(p.basicInfo, 'profileImg');

    // 2. Documents (KYC / Registration / Police)
    if (p.documents) {
        const fields = [
            'aadhaarUrl', 'panUrl', 'shopFrontImg', 'regCertificate', 'regCertificateImg',
            'regCertificateDocId', 'shopRegistration', 'policeCertDocId', 'policeImg',
            'aadhaarFront', 'aadhaarBack', 'licenseImg', 'shopBanner'
        ];

        // Map root document fields
        fields.forEach(f => mapUrl(p.documents, f));

        // Map nested KYC fields if they exist
        if (p.documents.kyc) {
            fields.forEach(f => mapUrl(p.documents.kyc, f));
        }

        if (Array.isArray(p.documents.showcaseImages)) {
            p.documents.showcaseImages = p.documents.showcaseImages.map(getCloudinaryUrl);
        }
    }

    // 3. Salon Cover (Inside/Outside/Banner/Logo)
    if (p.salonCover) {
        mapUrl(p.salonCover, 'banner');
        mapUrl(p.salonCover, 'logo');
        if (Array.isArray(p.salonCover.inside)) {
            p.salonCover.inside = p.salonCover.inside.map(getCloudinaryUrl);
        }
        if (Array.isArray(p.salonCover.outside)) {
            p.salonCover.outside = p.salonCover.outside.map(getCloudinaryUrl);
        }
    }

    // 4. coverImages array
    if (Array.isArray(p.coverImages)) {
        p.coverImages = p.coverImages.map(getCloudinaryUrl);
    }

    // 5. Nested Stylists if included
    if (Array.isArray(p.stylists)) {
        p.stylists = p.stylists.map(mapStylistDocs);
    }

    return p;
}

/**
 * Maps all image fields in a CustomerProfile object.
 */
function mapCustomerDocs(c) {
    if (!c) return c;
    mapUrl(c, 'profileImage');
    return c;
}

/**
 * Maps all image fields in a Stylist object.
 */
function mapStylistDocs(s) {
    if (!s) return s;
    mapUrl(s, 'profileImage');
    return s;
}

/**
 * Maps all image fields in a ServiceCatalog object.
 */
function mapServiceDocs(s) {
    if (!s) return s;
    mapUrl(s, 'image');
    return s;
}

/**
 * Maps all image fields in a Category object.
 */
function mapCategoryDocs(c) {
    if (!c) return c;
    mapUrl(c, 'image');
    return c;
}

module.exports = {
    CloudinaryResourceType,
    getPublicId,
    generateUploadSignature,
    deleteAsset,
    extractPublicIdFromUrl,
    extractPublicId,
    getCloudinaryUrl,
    mapPartnerDocs,
    mapCustomerDocs,
    mapStylistDocs,
    mapCategoryDocs,
    mapServiceDocs,
};
