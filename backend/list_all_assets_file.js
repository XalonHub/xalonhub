require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
    api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
    secure: true,
});

async function listAssets() {
    try {
        let allAssets = [];
        let nextCursor = null;
        
        do {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'xalon/',
                max_results: 500,
                next_cursor: nextCursor
            });
            allAssets = allAssets.concat(result.resources);
            nextCursor = result.next_cursor;
        } while (nextCursor);
        
        fs.writeFileSync('all_cloudinary_assets.json', JSON.stringify(allAssets, null, 2));
        console.log(`Saved ${allAssets.length} assets to all_cloudinary_assets.json`);
    } catch (error) {
        console.error('Error listing assets:', error.message);
    }
}

listAssets();
