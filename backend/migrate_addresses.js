
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const profiles = await prisma.partnerProfile.findMany();
    console.log(`Checking ${profiles.length} profiles...`);

    for (const p of profiles) {
        let addr = p.address;
        if (typeof addr === 'string') {
            try {
                addr = JSON.parse(addr);
            } catch (e) {
                console.log(`Skipping profile ${p.id} - invalid JSON`);
                continue;
            }
        }

        if (addr && (addr.currentAddress || addr.permanentAddress)) {
            console.log(`Flattening address for profile ${p.id} (${p.basicInfo?.name || 'N/A'})`);
            // Flatten: prioritize currentAddress, then permanentAddress
            const flatAddr = addr.currentAddress || addr.permanentAddress || addr;

            await prisma.partnerProfile.update({
                where: { id: p.id },
                data: { address: flatAddr }
            });
            console.log(`-> Flattened.`);
        } else {
            console.log(`Profile ${p.id} already has flat or empty address.`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
