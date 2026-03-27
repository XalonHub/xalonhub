const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function verifyBackend() {
    console.log('Verifying Backend Gender Filter...');
    try {
        // Test Male gender
        const maleRes = await axios.get(`${API_URL}/catalog`, { params: { gender: 'Male' } });
        const maleServices = maleRes.data;
        const maleOnly = maleServices.filter(s => s.gender === 'Male');
        const unisexInMale = maleServices.filter(s => s.gender === 'Unisex');
        
        console.log(`Male Filter: Total=${maleServices.length}, MaleOnly=${maleOnly.length}, Unisex=${unisexInMale.length}`);

        // Test Female gender
        const femaleRes = await axios.get(`${API_URL}/catalog`, { params: { gender: 'Female' } });
        const femaleServices = femaleRes.data;
        const femaleOnly = femaleServices.filter(s => s.gender === 'Female');
        const unisexInFemale = femaleServices.filter(s => s.gender === 'Unisex');
        
        console.log(`Female Filter: Total=${femaleServices.length}, FemaleOnly=${femaleOnly.length}, Unisex=${unisexInFemale.length}`);

        if (unisexInMale.length > 0 && unisexInFemale.length > 0) {
            console.log('SUCCESS: Unisex services are included in both Male and Female filters.');
        } else {
            console.error('FAILURE: Unisex services missing from one or both filters.');
        }

    } catch (err) {
        console.error('Error verifying backend:', err.message);
    }
}

verifyBackend();
