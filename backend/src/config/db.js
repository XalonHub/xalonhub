// In-memory store for development (replace with PostgreSQL later)
const db = {
    users: [],
    salons: [],
    otps: {}, // phone -> { otp, expiresAt }
};

module.exports = db;
