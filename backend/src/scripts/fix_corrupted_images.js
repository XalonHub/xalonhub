const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function extractPublicId(url) {
    if (!url) return null;
    if (!url.startsWith('http')) return url;
    try {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        return match ? match[1] : url;
    } catch {
        return url;
    }
}

function cleanPublicId(id) {
    if (!id) return null;
    
    // 1. Remove double nesting of segments (e.g., xalon/partners/ID/xalon/partners/ID/banner)
    let parts = id.split('/');
    let cleanParts = [];
    for (let i = 0; i < parts.length; i++) {
        // If the current part is the same as the next sequence, skip it
        // This is a bit tricky, but for xalon/partners/ID, we can check if parts[i...i+2] repeats
        if (i + 3 < parts.length && 
            parts[i] === parts[i+3] && 
            parts[i+1] === parts[i+4] && 
            parts[i+2] === parts[i+5]) {
            // Found a 3-part repeat, skip the first occurrence or just continue?
            // Actually, if we see 'xalon', 'partners', 'ID' twice, we only want it once.
        }
        
        // Simpler approach: if we see 'xalon' twice, and it's not the start, it's likely a repeat
        if (parts[i] === 'xalon' && cleanParts.includes('xalon')) {
            continue; 
        }
        if (parts[i] === 'partners' && cleanParts.includes('partners')) {
             // Check if it's the same partner ID following
             if (i + 1 < parts.length && cleanParts[cleanParts.indexOf('partners') + 1] === parts[i+1]) {
                 i++; // Skip 'partners' and the ID
                 continue;
             }
        }
        
        cleanParts.push(parts[i]);
    }
    
    let clean = cleanParts.join('/');

    // 2. Ensure it has the correct prefix
    const prefix = process.env.CLOUDINARY_FOLDER_PREFIX || 'dev';
    if (clean.startsWith('xalon/') && !clean.startsWith(`${prefix}/`)) {
        clean = `${prefix}/${clean}`;
    }
    
    // 3. Remove version segments if any (e.g., v123456789)
    clean = clean.replace(/\/v\d+\//, '/');
    if (clean.startsWith('v') && /v\d+/.test(clean.split('/')[0])) {
        clean = clean.split('/').slice(1).join('/');
    }

    return clean;
}

async function fixImages() {
    console.log('--- Starting Database Image Fix ---');

    // 1. Categories
    const categories = await prisma.category.findMany();
    for (const cat of categories) {
        if (cat.image) {
            const newId = cleanPublicId(extractPublicId(cat.image));
            if (newId !== cat.image) {
                console.log(`  Category ${cat.name}: ${cat.image} -> ${newId}`);
                await prisma.category.update({ where: { id: cat.id }, data: { image: newId } });
            }
        }
    }

    // 2. Services
    const services = await prisma.serviceCatalog.findMany();
    for (const s of services) {
        if (s.image) {
            const newId = cleanPublicId(extractPublicId(s.image));
            if (newId !== s.image) {
                console.log(`  Service ${s.name}: ${s.image} -> ${newId}`);
                await prisma.serviceCatalog.update({ where: { id: s.id }, data: { image: newId } });
            }
        }
    }

    // 3. Partners
    const partners = await prisma.partnerProfile.findMany();
    for (const p of partners) {
        let updatedData = {};
        
        if (p.salonCover) {
            const sc = { ...p.salonCover };
            let changed = false;
            if (sc.logo) {
                const newId = cleanPublicId(extractPublicId(sc.logo));
                if (newId !== sc.logo) {
                    sc.logo = newId;
                    changed = true;
                }
            }
            if (sc.banner) {
                const newId = cleanPublicId(extractPublicId(sc.banner));
                if (newId !== sc.banner) {
                    sc.banner = newId;
                    changed = true;
                }
            }
            if (changed) updatedData.salonCover = sc;
        }

        if (p.coverImages && Array.isArray(p.coverImages)) {
            const newImages = p.coverImages.map(img => cleanPublicId(extractPublicId(img)));
            if (JSON.stringify(newImages) !== JSON.stringify(p.coverImages)) {
                updatedData.coverImages = newImages;
            }
        }

        if (p.basicInfo?.profileImg) {
            const newId = cleanPublicId(extractPublicId(p.basicInfo.profileImg));
            if (newId !== p.basicInfo.profileImg) {
                updatedData.basicInfo = { ...p.basicInfo, profileImg: newId };
            }
        }

        if (Object.keys(updatedData).length > 0) {
            console.log(`  Updated Partner ${p.id}`);
            await prisma.partnerProfile.update({ where: { id: p.id }, data: updatedData });
        }
    }

    console.log('--- Cleanup Complete ---');
    await prisma.$disconnect();
}

fixImages();
