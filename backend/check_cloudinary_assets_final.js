require('dotenv').config({ path: '.env' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
  api_key: process.env.CLOUDINARY_API_KEY.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET.trim()
});

const ids = [
    'xalon/categories/hair_styling',
    'xalon/categories/facial_skin_care',
    'xalon/categories/grooming_essentials',
    'xalon/categories/hair_colouring',
    'xalon/categories/manicure_pedicure',
    'xalon/categories/massage_wellness',
    'xalon/categories/waxing_hair_removal',
    'xalon/categories/threading',
    'xalon/categories/hair_treatments',
    'xalon/categories/advanced_skin',
    'xalon/categories/makeup_bridal',
    'xalon/categories/packages'
];

async function checkResources() {
    for (const id of ids) {
        try {
            const res = await cloudinary.api.resource(id);
            console.log(`[OK] ${id} exists. URL: ${res.secure_url}`);
        } catch (e) {
            console.log(`[FAIL] ${id} NOT FOUND! Error: ${e.message}`);
        }
    }
}

checkResources();
