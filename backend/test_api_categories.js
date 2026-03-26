const axios = require('axios');

async function testCategories() {
    try {
        const response = await axios.get('http://localhost:5001/api/catalog/categories');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error fetching categories:', error.message);
    }
}

testCategories();
