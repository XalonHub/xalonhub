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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Routes
const partnerRoutes = require('./src/routes/partnerRoutes');
const catalogRoutes = require('./src/routes/catalogRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const authRoutes = require('./src/routes/auth');
const customerRoutes = require('./src/routes/customerRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/upload', uploadRoutes);

// Admin API + Static UI
app.use('/admin/api', adminRoutes);
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Health check
app.get('/', (req, res) => res.json({ message: 'XalonHub API is running 🚀', version: '1.0.0' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 XalonHub Backend running at http://localhost:${PORT}`);
    console.log(`📱 Mock OTP mode: ${process.env.MOCK_OTP === 'true' ? 'ON (use 000000)' : 'OFF'}\n`);
});

// Force event loop to stay alive
setInterval(() => { }, 10000);

