const express = require('express');
const app = express();
const router = express.Router();

router.get('/kyc/:partnerId', (req, res) => {
    console.log('Matched /kyc/:partnerId with', req.params);
    res.send('Partner');
});

router.get('/kyc/document/:docId', (req, res) => {
    console.log('Matched /kyc/document/:docId with', req.params);
    res.send('Document');
});

app.use('/admin/api', router);

const request = require('http').request;
app.listen(9999, () => {
    console.log('Server running');
    const req = request('http://localhost:9999/admin/api/kyc/document/123.jpg', (res) => {
        console.log('Status code:', res.statusCode);
        process.exit(0);
    });
    req.end();
});
