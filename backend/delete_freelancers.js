const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Starting deletion of Freelancer data...");

    // First delete dependent records.
    // Assuming Bookings and Clients might be tied to the Freelancer PartnerProfile
    const freelancers = await prisma.partnerProfile.findMany({
        where: { partnerType: 'Freelancer' },
        select: { id: true, userId: true }
    });

    const partnerIds = freelancers.map(f => f.id);
    const userIds = freelancers.map(f => f.userId);

    if (partnerIds.length === 0) {
        console.log("No freelancers found to delete.");
        return;
    }

    // Delete Bookings associated with these partners
    await prisma.booking.deleteMany({
        where: { partnerId: { in: partnerIds } }
    });
    console.log(`Deleted bookings for freelancers.`);

    // Delete Clients associated with these partners
    await prisma.client.deleteMany({
        where: { partnerId: { in: partnerIds } }
    });
    console.log(`Deleted clients for freelancers.`);

    // Delete the Partner Profiles
    await prisma.partnerProfile.deleteMany({
        where: { id: { in: partnerIds } }
    });
    console.log(`Deleted ${partnerIds.length} Freelancer PartnerProfiles.`);

    // Delete the underlying Users who were completely just Freelancers.
    // We optionally delete them if they don't have other roles or we just delete them.
    await prisma.user.deleteMany({
        where: { id: { in: userIds } }
    });
    console.log(`Deleted ${userIds.length} Users associated with Freelancers.`);

    console.log("Successfully wiped Freelancer data.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
