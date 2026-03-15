
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    console.log("Current Time (Local/Server):", now.toString());
    console.log("Current Time (ISO):", now.toISOString());

    const testDate = "2026-03-09"; // Tomorrow (Monday)
    const bookingDate = new Date(testDate);
    console.log(`Booking Date (${testDate}) toDateString:`, bookingDate.toDateString());
    console.log(`Now toDateString:`, now.toDateString());

    const isToday = bookingDate.toDateString() === now.toDateString();
    console.log(`Is Today? ${isToday}`);

    const p = await prisma.partnerProfile.findFirst({
        where: { partnerType: 'Freelancer', isOnboarded: true }
    });

    if (!p) {
        console.log("Partner not found");
        return;
    }

    let workingHours = p.workingHours;
    if (typeof workingHours === 'string') workingHours = JSON.parse(workingHours);

    const dayAbbrs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const abbrDayName = dayAbbrs[bookingDate.getDay()];
    console.log(`Looking for day: ${abbrDayName}`);

    const workDay = Array.isArray(workingHours) ? workingHours.find(d => d.dayName === abbrDayName) : null;
    console.log(`Work Day found:`, workDay);

    if (workDay && workDay.isOpen) {
        console.log(`Slots for tomorrow should be available!`);
    } else {
        console.log(`Partner is CLOSED tomorrow according to database.`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
