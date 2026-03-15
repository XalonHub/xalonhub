
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Debugging Slots for 'Threading' At Home ---");

    const threading = await prisma.serviceCatalog.findFirst({
        where: { name: { contains: 'threading', mode: 'insensitive' } }
    });

    if (!threading) {
        console.log("Service 'threading' not found in catalog!");
        return;
    }
    console.log(`Found Service: ${threading.name} (ID: ${threading.id}, Duration: ${threading.duration}m)`);

    const freelancers = await prisma.partnerProfile.findMany({
        where: { partnerType: 'Freelancer', isOnboarded: true }
    });

    console.log(`Found ${freelancers.length} onboarded Freelancers.`);

    if (freelancers.length === 0) {
        console.log("No onboarded freelancers found to provide at-home services.");
        return;
    }

    const p = freelancers[0];
    console.log(`Checking Partner: ${p.id} (${p.basicInfo?.salonName || 'N/A'})`);
    console.log(`Address: ${JSON.stringify(p.address)}`);
    console.log(`Working Hours: ${JSON.stringify(p.workingHours)}`);
    console.log(`Is Online: ${p.isOnline}`);

    // Simulation logic from slotController.js
    const date = "2026-03-09"; // Tomorrow (Monday)
    const bookingDate = new Date(date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const fullDayName = dayNames[bookingDate.getDay()];

    console.log(`\nSimulating for Date: ${date} (${fullDayName})`);

    let workDay = null;
    if (Array.isArray(p.workingHours)) {
        workDay = p.workingHours.find(d => d.dayName === fullDayName);
    } else if (p.workingHours && typeof p.workingHours === 'object') {
        const days = p.workingHours.days || [];
        if (days.includes(fullDayName)) {
            workDay = p.workingHours;
        }
    }

    if (!workDay) {
        console.log(`Partner is not working on ${fullDayName}`);
        return;
    }

    const openMin = parseTimeToMinutes(workDay.openTime);
    const closeMin = parseTimeToMinutes(workDay.closeTime);
    console.log(`Working Hours: ${workDay.openTime} to ${workDay.closeTime} (${openMin} - ${closeMin} mins)`);

    // Check slots
    const allSlots = [];
    for (let h = 9; h < 20; h++) {
        ['00', '30'].forEach(m => allSlots.push(`${String(h).padStart(2, '0')}:${m}`));
    }

    const available = [];
    for (const slotStart of allSlots) {
        const [sh, sm] = slotStart.split(':').map(Number);
        const startMinutes = sh * 60 + sm;
        const endMinutes = startMinutes + threading.duration;

        if (startMinutes >= openMin && endMinutes <= closeMin) {
            available.push(slotStart);
        }
    }

    console.log(`Generated ${available.length} possible slots.`);
    if (available.length > 0) {
        console.log(`Sample slots: ${available.slice(0, 5).join(', ')}`);
    } else {
        console.log("No slots generated within working hours.");
    }
}

function parseTimeToMinutes(timeStr) {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)\s*(am|pm)?/i);
    if (!match) return null;
    let [, h, m, ampm] = match;
    h = parseInt(h);
    m = parseInt(m);
    if (ampm) {
        if (ampm.toLowerCase() === 'pm' && h < 12) h += 12;
        if (ampm.toLowerCase() === 'am' && h === 12) h = 0;
    }
    return h * 60 + m;
}

main().catch(console.error).finally(() => prisma.$disconnect());
