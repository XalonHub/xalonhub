const axios = require('axios');
const fs = require('fs');

async function testCategories() {
    try {
        const response = await axios.get('http://localhost:5001/api/catalog/categories');
        fs.writeFileSync('output_categories.json', JSON.stringify(response.data, null, 2));
        console.log('Saved output to output_categories.json');
    } catch (error) {
        console.error('Error fetching categories:', error.message);
    }
}

testCategories();
