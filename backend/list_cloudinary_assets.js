require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
    api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
    secure: true,
});

async function listAssets() {
    try {
        console.log('Listing assets in xalon/categories...');
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'xalon/categories/',
            max_results: 100
        });
        
        console.log('--- ASSETS FOUND ---');
        result.resources.forEach(asset => {
            console.log(`Public ID: ${asset.public_id}`);
            console.log(`URL: ${asset.secure_url}`);
            console.log('---');
        });
        
        if (result.resources.length === 0) {
            console.log('No assets found with prefix "xalon/categories/".');
            
            console.log('Checking "categories/" prefix...');
            const result2 = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'categories/',
                max_results: 100
            });
            result2.resources.forEach(asset => {
                console.log(`Public ID: ${asset.public_id}`);
                console.log('---');
            });
        }
    } catch (error) {
        console.error('Error listing assets:', error.message);
    }
}

listAssets();
