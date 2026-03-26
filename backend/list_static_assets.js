require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
    api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
    secure: true,
});

async function listStatic() {
    try {
        console.log('Listing assets in xalon/static/ namespace...');
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'xalon/static/',
            max_results: 100
        });
        
        console.log(`Total assets found: ${result.resources.length}`);
        result.resources.forEach(asset => {
            console.log(`Public ID: ${asset.public_id}`);
            console.log(`URL: ${asset.secure_url}`);
            console.log('---');
        });
    } catch (error) {
        console.error('Error listing assets:', error.message);
    }
}

listStatic();
