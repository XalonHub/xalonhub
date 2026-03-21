const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateManualBookings() {
    try {
        const settings = await prisma.globalSettings.findUnique({ where: { id: 'global' } });
        if (!settings) {
            console.log('No global settings found. Please set them in admin panel first.');
            return;
        }

        const bookings = await prisma.booking.findMany({
            where: {
                platformFee: 0,
                partnerId: { not: null }
            },
            include: {
                partner: true
            }
        });

        console.log(`Found ${bookings.length} potential manual bookings to update.`);

        for (const b of bookings) {
            // Check if it's really manual (no customerId or customerPhone in some context, 
            // but for now we assume platformFee: 0 means manual because auto-assign always sets platformFee: 10)
            
            const subtotal = b.totalAmount; // In manual bookings, totalAmount was just the subtotal
            const partnerType = b.partner.partnerType;
            
            let customerFee = settings.platformFee;
            let commRate = (partnerType === 'Freelancer') ? settings.freelancerCommMan / 100 : settings.salonCommMan / 100;

            // Note: For manual bookings, we usually keep customerFee as 0 as per business logic in bookingRoutes.js fallback, 
            // but the user asked "update the bookings manually done with the above changes".
            // In getBookingEconomics for 'Manual':
            // customerFee = 0;
            // commRate = ...
            
            // Let's stick to the getBookingEconomics logic for 'Manual'
            const platformFee = 0; // Manual bookings don't charge customer fee
            const commission = Math.round(subtotal * commRate);
            const partnerEarnings = subtotal - commission;
            const finalTotalAmount = subtotal + platformFee;

            await prisma.booking.update({
                where: { id: b.id },
                data: {
                    platformFee: platformFee,
                    partnerEarnings: partnerEarnings,
                    totalAmount: finalTotalAmount
                }
            });
            console.log(`Updated booking ${b.id}: Earnings=${partnerEarnings}, Commission=${commission}`);
        }
        console.log('Update complete.');
    } catch (error) {
        console.error('Error updating bookings:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateManualBookings();
