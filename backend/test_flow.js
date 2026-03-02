require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        // 1. Manually create a user and token to bypass OTP
        const phone = '9998887771';
        let user = await prisma.user.upsert({
            where: { phone },
            update: {},
            create: { phone, role: 'Freelancer' }
        });

        const token = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET || 'xalon_super_secret_key_2026',
            { expiresIn: '30d' }
        );

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // 2. Init partner
        console.log("Init partner...");
        const res3 = await axios.post('http://localhost:5000/api/partners/init', { phone, partnerType: 'Freelancer' });
        const partnerId = res3.data.id;
        console.log("Partner ID:", partnerId);

        // 3. Update basic info
        console.log("Updating basic info...");
        const personalInfo = {
            name: 'Test Tester',
            dob: '01/01/1990',
            fatherName: 'Mr Tester',
            gender: 'Male',
            email: 'test@tester.com',
            travel: '2 Wheeler',
            experience: 5,
            aadharNumber: '',
            profileImg: null,
            agentCode: ''
        };
        const res4 = await axios.put(`http://localhost:5000/api/partners/${partnerId}/basic-info`, personalInfo);
        console.log("Basic info updated:", res4.data.basicInfo);

    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
