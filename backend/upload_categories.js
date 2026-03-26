require('dotenv').config({ path: '.env' });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
  api_key: process.env.CLOUDINARY_API_KEY.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET.trim()
});

const images = [
  { file: 'hair_styling_category_1774512415152.png', public_id: 'xalon/categories/hair_styling' },
  { file: 'facial_skin_care_category_1774512430580.png', public_id: 'xalon/categories/facial_skin_care' },
  { file: 'grooming_essentials_category_1774512450422.png', public_id: 'xalon/categories/grooming_essentials' },
  { file: 'hair_colouring_category_1774512468772.png', public_id: 'xalon/categories/hair_colouring' },
  { file: 'manicure_pedicure_category_1774512488503.png', public_id: 'xalon/categories/manicure_pedicure' },
  { file: 'massage_wellness_category_1774512504468.png', public_id: 'xalon/categories/massage_wellness' },
  { file: 'waxing_hair_removal_category_1774512529328.png', public_id: 'xalon/categories/waxing_hair_removal' },
  { file: 'threading_category_1774512547469.png', public_id: 'xalon/categories/threading' },
  { file: 'hair_treatments_category_1774512563815.png', public_id: 'xalon/categories/hair_treatments' },
  { file: 'advanced_skin_category_1774512582624.png', public_id: 'xalon/categories/advanced_skin' },
  { file: 'makeup_bridal_category_1774512600359.png', public_id: 'xalon/categories/makeup_bridal' },
  { file: 'premium_packages_category_1774512618274.png', public_id: 'xalon/categories/packages' }
];

async function uploadImages() {
  const artifactDir = 'C:/Users/admin/.gemini/antigravity/brain/aacc45ab-efb6-426b-b7fe-abaddad6ced5';
  
  for (const img of images) {
    const filePath = path.join(artifactDir, img.file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }

    try {
      console.log(`Uploading ${img.file} as ${img.public_id}...`);
      const result = await cloudinary.uploader.upload(filePath, {
        public_id: img.public_id,
        overwrite: true,
        invalidate: true
      });
      console.log(`Successfully uploaded: ${result.secure_url}`);
    } catch (error) {
      console.error(`Failed to upload ${img.file}:`, error);
    }
  }
}

uploadImages();
