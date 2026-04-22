const prisma = require('../prisma');

/**
 * Normalizes a phone number to the last 10 digits for comparison.
 * Also returns a storage-safe version with country code.
 */
const normalizePhone = (phone) => {
    if (!phone) return { lookup: '', storage: '' };
    const raw = phone.toString().replace(/\D/g, '');
    const lookup = raw.length >= 10 ? raw.slice(-10) : raw;
    const storage = lookup.length === 10 ? `+91${lookup}` : `+${raw}`;
    return { lookup, storage };
};

/**
 * Finds an identity (User, Guest, or Client) across the system by phone.
 * Uses 10-digit matching logic.
 */
const findIdentity = async (phone) => {
    const { lookup } = normalizePhone(phone);
    if (!lookup) return null;

    // 1. Check Users (Hard match on phone)
    // Prisma check using contains/endsWidth since we store with country code
    const user = await prisma.user.findFirst({
        where: { phone: { endsWith: lookup } },
        include: { customerProfile: true }
    });
    if (user) return { type: 'User', data: user, name: user.customerProfile?.name || 'User' };

    // 2. Check UserGuests
    const guest = await prisma.userGuest.findFirst({
        where: { mobileNumber: { endsWith: lookup } }
    });
    if (guest) return { type: 'Guest', data: guest, name: guest.name };

    // 3. Check Clients (Salons)
    const client = await prisma.client.findFirst({
        where: { phone: { endsWith: lookup } }
    });
    if (client) return { type: 'Client', data: client, name: client.name };

    return null;
};

module.exports = {
    normalizePhone,
    findIdentity
};
