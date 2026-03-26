const http = require('http');

http.get('http://localhost:5001/api/catalog?category=Advanced%20Skin', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log(data);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
