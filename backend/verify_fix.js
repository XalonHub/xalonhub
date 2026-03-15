
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

async function main() {
    const p = await prisma.partnerProfile.findFirst({
        where: { partnerType: 'Freelancer', isOnboarded: true }
    });

    if (!p) {
        console.log("No freelancer found");
        return;
    }

    console.log(`Checking Partner: ${p.id}`);

    let addr = p.address;
    if (typeof addr === 'string') addr = JSON.parse(addr);
    console.log(`Parsed Address:`, addr);

    let workingHours = p.workingHours;
    if (typeof workingHours === 'string') workingHours = JSON.parse(workingHours);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = "2026-03-09"; // Monday
    const fullDayName = "Monday";

    const workDay = Array.isArray(workingHours) ? workingHours.find(d => d.dayName === fullDayName) : null;

    if (!workDay) {
        console.log(`No work day found for ${fullDayName}`);
        return;
    }

    console.log(`Work Day for ${fullDayName}:`, workDay);
    const openMin = parseTimeToMinutes(workDay.openTime);
    const closeMin = parseTimeToMinutes(workDay.closeTime);
    console.log(`Minutes: ${openMin} to ${closeMin}`);

    // Simulate slot check logic
    const duration = 30;
    const startMinutes = 600; // 10:00 AM
    const endMinutes = startMinutes + duration;

    if (startMinutes >= openMin && endMinutes <= closeMin) {
        console.log("SLOT 10:00 AM IS AVAILABLE");
    } else {
        console.log("SLOT 10:00 AM IS OUTSIDE HOURS");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
