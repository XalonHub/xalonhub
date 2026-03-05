const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const uploadsDir = path.join(__dirname, '../uploads');

async function main() {
    console.log('Starting data cleanup...');

    try {
        await prisma.$transaction(async (tx) => {
            // Delete bookings
            const deletedBookings = await tx.booking.deleteMany();
            console.log(`Deleted ${deletedBookings.count} bookings.`);

            // Delete clients
            const deletedClients = await tx.client.deleteMany();
            console.log(`Deleted ${deletedClients.count} clients.`);

            // Delete saved addresses
            const deletedAddresses = await tx.savedAddress.deleteMany();
            console.log(`Deleted ${deletedAddresses.count} saved addresses.`);

            // Delete customer profiles
            const deletedCustomers = await tx.customerProfile.deleteMany();
            console.log(`Deleted ${deletedCustomers.count} customer profiles.`);

            // Delete partner profiles
            const deletedPartners = await tx.partnerProfile.deleteMany();
            console.log(`Deleted ${deletedPartners.count} partner profiles.`);

            // Delete users (excluding Admin)
            const deletedUsers = await tx.user.deleteMany({
                where: {
                    role: {
                        not: 'Admin'
                    }
                }
            });
            console.log(`Deleted ${deletedUsers.count} users (non-admin).`);
        });

        console.log('Successfully completed database cleanup.');

        // Cleanup uploaded files
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            let deletedFilesCount = 0;
            for (const file of files) {
                // Prevent deleting directory components or anything not a standard file
                const filePath = path.join(uploadsDir, file);
                if (fs.lstatSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                    deletedFilesCount++;
                }
            }
            console.log(`Successfully deleted ${deletedFilesCount} uploaded files (KYC, covers, etc.) from ${uploadsDir}.`);
        } else {
            console.log(`Uploads directory not found at ${uploadsDir}. Skipping file deletion.`);
        }

    } catch (error) {
        console.error('Error during data cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
