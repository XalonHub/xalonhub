require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
    api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
    secure: true,
});

const config = cloudinary.config();
console.log('--- CLOUDINARY CONFIG ---');
console.log(JSON.stringify(config, null, 2));

const publicId = 'xalon/categories/hair_styling';
const url = cloudinary.url(publicId, { secure: true });
console.log('--- TEST ---');
console.log('Public ID:', JSON.stringify(publicId));
console.log('URL:', JSON.stringify(url));
console.log('URL Hex:', Buffer.from(url).toString('hex'));
