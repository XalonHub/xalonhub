const { getCloudinaryUrl } = require('./src/utils/cloudinaryHelper');
require('dotenv').config();

const testCases = [
    "xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/logo",
    "dev/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/logo",
    "prod/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/logo",
    "https://res.cloudinary.com/divyyczmu/image/upload/v1/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/logo.jpg",
    "https://res.cloudinary.com/divyyczmu/image/upload/f_auto,q_auto/dev/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/logo",
    "categories/hair_treatments",
    null
];

console.log("Current CLOUDINARY_FOLDER_PREFIX:", process.env.CLOUDINARY_FOLDER_PREFIX || 'dev');

testCases.forEach(tc => {
    console.log(`Input: ${tc}`);
    console.log(`Output: ${getCloudinaryUrl(tc)}`);
    console.log('---');
});
