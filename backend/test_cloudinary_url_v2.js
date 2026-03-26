require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const publicId = 'xalon/categories/hair_styling';
const url = cloudinary.url(publicId);
console.log('Public ID:', publicId);
console.log('URL:', JSON.stringify(url));
console.log('Cloud Name:', JSON.stringify(process.env.CLOUDINARY_CLOUD_NAME));
