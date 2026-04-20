const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const axios = require('axios');
const prisma = require('../prisma');

const router = express.Router();

// Helper to normalize phone numbers (strip all but last 10 digits)
const normalizePhone = (phone) => {
    if (!phone) return '';
    const raw = phone.toString().replace(/\D/g, '');
    return raw.length >= 10 ? raw.slice(-10) : raw;
};

// Generate 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Send OTP specifically via MSG91 WhatsApp (using dedicated WhatsApp Outbound API)
const sendWhatsAppOTP = async (phone, otp) => {
    const numericPhone = phone.toString().replace(/\D/g, '');
    const cleanPhone = numericPhone.length === 10 ? `91${numericPhone}` : numericPhone;

    const authkey = process.env.MSG91_AUTH_KEY;
    const whatsapp_number = process.env.MSG91_WHATSAPP_NUMBER || '918960046001';
    const namespace = process.env.MSG91_WHATSAPP_NAMESPACE || 'b0119f17_6a8f_460c_be81_833866a2d462';

    const url = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';

    const payload = {
        integrated_number: whatsapp_number,
        content_type: 'template',
        payload: {
            messaging_product: 'whatsapp',
            type: 'template',
            template: {
                name: 'partner_login',
                language: {
                    code: 'en',
                    policy: 'deterministic'
                },
                namespace: namespace,
                to_and_components: [
                    {
                        to: [cleanPhone],
                        components: {
                            body_1: {
                                type: 'text',
                                value: otp
                            },
                            button_1: {
                                subtype: 'url',
                                type: 'text',
                                value: otp
                            }
                        }
                    }
                ]
            }
        }
    };

    try {
        console.log(`[MSG91 WA] Sending OTP to ${cleanPhone} via WhatsApp Template...`);
        const response = await axios.post(url, payload, {
            headers: {
                'authkey': authkey,
                'Content-Type': 'application/json'
            }
        });

        console.log(`MSG91 WhatsApp result for ${cleanPhone}:`, JSON.stringify(response.data));

        if (response.data.status === 'success' || response.data.type === 'success' || response.status === 200) {
            return true;
        }
        return false;
    } catch (err) {
        console.error('MSG91 WhatsApp Error:', err?.response?.data || err.message);
        return false;
    }
};

// Send Verification Email via MSG91
const sendEmailVerification = async (email, token) => {
    if (false && process.env.MOCK_OTP === 'true') {
        console.log(`[MOCK EMAIL] Email: ${email} → Link: http://localhost:5000/api/auth/verify-email?token=${token}`);
        return true;
    }

    try {
        const response = await axios.post(
            'https://api.msg91.com/api/v5/email/send',
            {
                to: [{ email: email }],
                from: { email: process.env.MSG91_EMAIL_SENDER || 'no-reply@xalon.in' },
                template_id: 'xalonhub_email_verification',
                variables: {
                    verification_link: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`,
                    expiry_time: '24 hours'
                }
            },
            {
                headers: {
                    authkey: process.env.MSG91_AUTH_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`MSG91 Email Verification sent to ${email}:`, JSON.stringify(response.data));
        return response.status === 200;
    } catch (err) {
        console.error('MSG91 Email Error:', err?.response?.data || err.message);
        return false;
    }
};

// POST /auth/send-otp
router.post('/send-otp', async (req, res) => {
    try {
        let { phone } = req.body;
        console.log(`[AUTH] Raw phone received: "${phone}"`);

        // Unified normalization: ensure we always work with last 10 digits
        phone = normalizePhone(phone);
        if (phone.length !== 10) {
            return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required' });
        }
        console.log(`[AUTH] Normalized phone to: "${phone}"`);

        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        db.otps[phone] = { otp, expiresAt };

        const isMock = process.env.MOCK_OTP === 'true';
        if (isMock) {
            // No longer logging the OTP code for security, even in mock mode.
            // Documentation says use '0000' if mock is on.
            return res.json({ 
                success: true, 
                message: `[MOCK] OTP sent to ${phone}`,
                dev_otp: '****' // Hidden for security
            });
        }

        const sent = await sendWhatsAppOTP(phone, otp);
        if (!sent) {
            console.error(`[AUTH] Failed to send OTP to ${phone}`);
            return res.status(500).json({ success: false, message: 'Failed to send OTP. Try again.' });
        }

        console.log(`[AUTH] OTP sent successfully to ${phone}`);
        res.json({ success: true, message: `OTP sent to ${phone}` });
    } catch (error) {
        console.error(`[AUTH ERROR] Send OTP failed: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error while sending OTP', details: error.message });
    }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    let { phone, otp, role, name } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    }

    // Unified normalization: ensure we look up the same 10-digit string
    phone = normalizePhone(phone);
    console.log(`[AUTH] Normalized verify-otp phone to: "${phone}"`);

    const record = db.otps[phone];
    if (!record) {
        return res.status(400).json({ success: false, message: 'OTP not requested for this number' });
    }
    if (Date.now() > record.expiresAt) {
        delete db.otps[phone];
        return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }
    const isMock = process.env.MOCK_OTP === 'true' && process.env.NODE_ENV !== 'production';
    if (record.otp !== otp && !(isMock && otp === '0000')) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP valid — clean up
    delete db.otps[phone];

    try {
        // Find or create user in Postgres via Prisma
        let dbRole = 'Customer';
        if (role === 'partner') {
            // we default to Freelancer for now if partner type isn't specified, they'll pick it later
            dbRole = 'Freelancer';
        }

        let user = await prisma.user.findUnique({
            where: { phone },
            include: { PartnerProfile: true, CustomerProfile: true }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    phone,
                    role: dbRole
                },
                include: { PartnerProfile: true, CustomerProfile: true }
            });
        }

        // Auto-create CustomerProfile if this is a customer login
        if ((!role || role === 'customer') && !user.CustomerProfile) {
            // Attempt to infer name from existing Client records (walk-ins)
            let inferredName = name || null;
            if (!inferredName) {
                const existingClient = await prisma.client.findFirst({
                    where: { phone },
                    orderBy: { createdAt: 'desc' },
                    select: { name: true }
                });
                if (existingClient && existingClient.name) {
                    inferredName = existingClient.name;
                }
            }

            user.CustomerProfile = await prisma.customerProfile.create({
                data: { 
                    userId: user.id,
                    name: inferredName 
                },
                include: { SavedAddress: true }
            });
        }

        const token = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: { 
                ...user,
                id: user.id, 
                phone: user.phone, 
                role: user.role,
                partnerProfile: user.PartnerProfile || null,
                customerProfile: user.CustomerProfile || null
            }
        });
    } catch (error) {
        console.error("=========================================");
        console.error("[CRITICAL] Error verifying OTP and creating user:", error);
        console.error("Request Body:", req.body);
        console.error("Stack Trace:", error.stack);
        console.error("=========================================");
        res.status(500).json({ success: false, message: 'Internal server error while verifying OTP', details: error.message });
    }
});

// POST /auth/admin-login
router.post('/admin-login', async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ success: false, message: 'Phone and password required' });
    }

    try {
        let user = await prisma.user.findUnique({
            where: { phone }
        });

        // Auth using ADMIN_SECRET from environment
        const ADMIN_SECRET = process.env.ADMIN_SECRET;

        if (!ADMIN_SECRET || password !== ADMIN_SECRET) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }

        if (!user) {
            // Auto-create admin if it doesn't exist (first time)
            user = await prisma.user.create({
                data: {
                    phone,
                    role: 'Admin'
                }
            });
        } else if (user.role !== 'Admin') {
            // Upgrade user to admin if they have the secret
            user = await prisma.user.update({
                where: { id: user.id },
                data: { role: 'Admin' }
            });
        }

        const token = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, phone: user.phone, role: user.role }
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ success: false, message: 'Internal server error during admin login' });
    }
});

// POST /auth/send-verification-email
router.post('/send-verification-email', async (req, res) => {
    const { email, userId } = req.body;
    if (!email || !userId) {
        return res.status(400).json({ success: false, message: 'Email and UserID required' });
    }

    // Generate short token valid for 24h
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { emailVerificationToken: token, emailVerificationExpires: expires }
        });

        const sent = await sendEmailVerification(email, token);
        if (!sent) {
            return res.status(500).json({ success: false, message: 'Failed to send verification email' });
        }

        res.json({ success: true, message: 'Verification email sent successfully' });
    } catch (e) {
        console.error('Email preparation error:', e);
        res.status(500).json({ success: false, message: 'Internal server error while preparing email' });
    }
});

// GET /auth/verify-email
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send('<h1>Invalid Link</h1><p>Missing verification token.</p>');
    }

    try {
        const user = await prisma.user.findFirst({
            where: { emailVerificationToken: token }
        });

        if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
            return res.status(400).send('<h1>Verification Failed</h1><p>The link may be expired or invalid.</p>');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                // We don't have the new email passed directly in the link anymore since it's just a token.
                // But the user profile already has an email in formData, or we can assume it's verifying the one on file.
                // Assuming Xalonhub updates the profile email separately, we just mark verified.
                emailVerificationToken: null,
                emailVerificationExpires: null
            }
        });

        res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                <h1 style="color: #4CAF50;">Email Verified Successfully!</h1>
                <p>You can now return to the XalonHub app.</p>
                <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Close Window</button>
            </div>
        `);
    } catch (err) {
        console.error('Email verification error:', err);
        res.status(400).send('<h1>Verification Failed</h1><p>The link may be expired or invalid.</p>');
    }
});

// PUT /auth/language
router.put('/language', (req, res) => {
    // ... same
});

module.exports = router;
