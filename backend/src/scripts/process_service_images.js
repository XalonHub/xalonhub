require('dotenv').config({ path: '.env' });
const prisma = require('../prisma');
const cloudinary = require('../config/cloudinary');
const path = require('path');

async function uploadServiceImage(serviceId, localPath) {
    try {
        console.log(`Processing service ${serviceId} with image ${localPath}`);
        
        // 1. Upload to Cloudinary with deterministic Public ID
        const prefix = process.env.CLOUDINARY_FOLDER_PREFIX || 'dev';
        const publicId = `${prefix}/xalon/services/${serviceId}/thumbnail`;
        
        const result = await cloudinary.uploader.upload(localPath, {
            public_id: publicId,
            overwrite: true,
            invalidate: true,
            resource_type: 'image'
        });

        console.log(`Successfully uploaded to Cloudinary: ${result.secure_url}`);

        // 2. Update Database with the Public ID (not the URL, the controller handles resolution)
        await prisma.serviceCatalog.update({
            where: { id: serviceId },
            data: { image: publicId }
        });

        console.log(`Successfully updated database for service ${serviceId}`);
        return true;
    } catch (error) {
        console.error(`Error processing service ${serviceId}:`, error);
        return false;
    }
}

// Command line usage: node process_service_images.js <serviceId> <localPath>
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: node process_service_images.js <serviceId> <localPath>");
        process.exit(1);
    }

    const [serviceId, localPath] = args;
    uploadServiceImage(serviceId, localPath)
        .then(success => process.exit(success ? 0 : 1))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = { uploadServiceImage };
