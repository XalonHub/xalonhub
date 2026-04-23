const { uploadServiceImage } = require('./src/scripts/process_service_images');
const path = require('path');

const MAPPINGS = [
    { id: 'c40a9e50-b9bd-4a40-a80c-b2bb15a9c2df', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/pedicure_spa_male_1776909785747.png' },
    { id: 'c3d36622-3e0c-432e-b7d4-33996eedf4c2', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/vlcc_gold_male_1776909802974.png' },
    { id: 'ba96a93a-61d4-4763-a0d2-4381623630a8', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/highlights_value_combo_female_v2_1776909818829.png' },
    { id: 'fe36d57d-c683-443d-b308-0b88d75342bf', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/women_underarms_waxing_v2_1776909838104.png' },
    { id: 'a476cf88-df14-4ad2-8985-7d51741ce25d', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/women_full_body_dtan_v2_1776909854035.png' },
    { id: '950aa927-202d-4e29-b963-2f3cea79d60b', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/mens_quick_cleanup_v2_1776909869095.png' },
    { id: 'd127b2f3-0a61-4f98-bda2-afdb2c51f833', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/mens_spa_mani_pedi_pack_v2_1776909887301.png' },
    { id: '923ab3bf-bd00-4f82-8111-687895ce6e6e', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/women_fruit_facial_v2_1776909906281.png' },
    { id: 'aef83894-b9a9-4815-8848-d50756d9c354', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/o3_plus_facial_male_v2_1776909925332.png' },
    { id: 'f20cec3e-0988-4a86-a78f-184ee0c53d15', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/vlcc_diamond_male_v2_1776909941624.png' },
    { id: 'bf2e73b9-fb7e-49c2-b6c9-a5e7d7ec64d9', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/fruit_facial_male_v2_1776909965642.png' },
    { id: 'b3cbadf0-8018-4731-af59-2b869c2dc5ab', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/women_keratin_treatment_v3_1776909993864.png' },
    { id: 'cf25a58c-adab-4f83-b384-e7a128bddca9', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/women_hair_smoothing_v3_1776910009249.png' },
    { id: 'd8927327-1a1f-4757-a3c3-3bfd744e696e', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/manicure_spa_male_v3_1776910026994.png' },
    { id: 'd88e5911-4e08-4c65-bed0-2f546cd5b63f', path: 'C:/Users/admin/.gemini/antigravity/brain/a21f60b2-da8e-4581-b942-e6bf03e34436/advance_pedicure_male_v3_1776910044499.png' }
];

async function runBatch() {
    console.log(`Starting batch upload of 15 images...`);
    for (const item of MAPPINGS) {
        console.log(`Uploading for ${item.id}...`);
        await uploadServiceImage(item.id, item.path);
    }
    console.log('Batch processing complete.');
}

runBatch();
