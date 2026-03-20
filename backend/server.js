require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const originalExit = process.exit;
process.exit = function (code) {
    console.trace('PROCESS EXIT CALLED WITH CODE', code);
    return originalExit(code);
};

process.on('exit', (code) => console.log('PROCESS EXIT:', code));
process.on('uncaughtException', (err) => console.error('UNCAUGHT EXCEPTION:', err));
process.on('unhandledRejection', (reason, p) => console.error('UNHANDLED REJECTION:', reason, p));

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Routes
const partnerRoutes = require('./src/routes/partnerRoutes');
const catalogRoutes = require('./src/routes/catalogRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const slotRoutes = require('./src/routes/slotRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const authRoutes = require('./src/routes/auth');
const customerRoutes = require('./src/routes/customerRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const salonRoutes = require('./src/routes/salonRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/stylists', require('./src/routes/stylistRoutes'));
app.use('/api/reviews', reviewRoutes);

// Admin API + Static UI
app.use('/admin/api', adminRoutes);
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[INTERNAL ERROR] ${new Date().toISOString()} ${req.method} ${req.url}`);
    console.error('Error Stack:', err.stack);

    if (err.code && err.code.startsWith('P')) {
        console.error('[Prisma Error]:', err.message);
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: 'A temporary service interruption occurred. Our team has been notified.',
        code: 500
    });
});

// Health check
app.get('/', (req, res) => res.json({ message: 'XalonHub API is running 🚀', version: '1.0.0' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 XalonHub Backend running at http://localhost:${PORT}`);
    console.log(`📱 Mock OTP mode: ${process.env.MOCK_OTP === 'true' ? 'ON (use 0000)' : 'OFF'}\n`);
});

// Force event loop to stay alive
setInterval(() => { }, 10000);

