const axios = require('axios');

async function checkApi() {
    try {
        const res = await axios.get('http://localhost:5000/api/salons?partnerType=Freelancer');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('API Error:', err.message);
    }
}

checkApi();
