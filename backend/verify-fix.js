const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogin(phone) {
    console.log(`Testing login for phone: ${phone}`);
    try {
        const user = await prisma.user.findUnique({
            where: { phone },
            include: { 
                partnerProfile: true, 
                customerProfile: true 
            }
        });

        if (!user) {
            console.log("User not found.");
            return;
        }

        console.log("User found:", {
            id: user.id,
            phone: user.phone,
            role: user.role
        });

        if (user.partnerProfile) {
            console.log("Partner Profile found:", {
                id: user.partnerProfile.id,
                partnerType: user.partnerProfile.partnerType,
                isOnboarded: user.partnerProfile.isOnboarded
            });
        } else {
            console.log("Partner Profile NOT found (This was the bug).");
        }

        if (user.customerProfile) {
            console.log("Customer Profile found.");
        }
    } catch (error) {
        console.error("Error during test:", error);
    } finally {
        await prisma.$disconnect();
    }
}

const phoneToTest = process.argv[2] || '8960046001';
testLogin(phoneToTest);
