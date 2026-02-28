const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
    { id: 'test_admin', phone: '9999999999', role: 'Admin' },
    process.env.JWT_SECRET || 'xalon_admin_2026',
    { expiresIn: '30d' }
);

async function test() {
    const docId = '1772194921384-66211551.jpeg';
    try {
        const res = await fetch(`http://localhost:5000/admin/api/kyc/document/${docId}?token=${token}`);
        const text = await res.text();
        console.log('STATUS:', res.status);
        console.log('BODY:', text);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}
test();
