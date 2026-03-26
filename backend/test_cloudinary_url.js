const cloudinary = require('./src/config/cloudinary');
require('dotenv').config();

const publicId = 'xalon/categories/hair_styling';
const url = cloudinary.url(publicId, { secure: true });
console.log('Public ID:', publicId);
console.log('URL:', JSON.stringify(url));
