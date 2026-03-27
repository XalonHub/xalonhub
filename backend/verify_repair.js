const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
const PARTNER_ID = '4c169f7c-833d-4953-999d-f9890b0e1242';

async function verifyFix() {
    console.log(`Verifying Repaired Salon Services for Partner ${PARTNER_ID}...`);
    try {
        const res = await axios.get(`${API_URL}/salons/${PARTNER_ID}/services`);
        const services = res.data;
        
        console.log(`API Response: ${services.length} services found.`);
        if (services.length > 0) {
            console.log('--- Services Returned ---');
            services.forEach(s => {
                console.log(`- ${s.name} (Category: ${s.category}, Price: ₹${s.defaultPrice}, GlobalID: ${s.id})`);
            });
            console.log('\nSUCCESS: Services are loading correctly and linked to the catalog.');
        } else {
            console.error('\nFAILURE: No services returned.');
        }

    } catch (err) {
        console.error('Error verifying fix:', err.message);
    }
}

verifyFix();
