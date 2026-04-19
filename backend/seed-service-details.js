/**
 * seed-service-details.js
 * Populates `steps` and `faqs` for all existing ServiceCatalog entries.
 * Run: node seed-service-details.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Service detail map ────────────────────────────────────────────────────────
// Keys match service names (case-insensitive contains match).
// If no specific match, category-level fallback is used.

const SERVICE_DETAILS = {

    // ── HAIR & STYLING ──────────────────────────────────────────────────────
    'haircut': {
        steps: [
            { title: 'Consultation', desc: 'Artist discusses your desired style, hair type, and face shape.' },
            { title: 'Wash & Prep', desc: 'Hair is shampooed and towel-dried to prep for the cut.' },
            { title: 'Cut & Shape', desc: 'Precision cutting using scissors and comb techniques for your chosen style.' },
            { title: 'Blow Dry & Style', desc: 'Hair is blow-dried and finished to perfection.' },
        ],
        faqs: [
            { q: 'Do I need to wash my hair before the appointment?', a: 'No need — we include a wash as part of the service.' },
            { q: 'Can I bring a reference photo?', a: 'Absolutely! Reference photos help us understand your vision better.' },
            { q: 'How often should I get a haircut?', a: 'Every 4–6 weeks for short styles and 6–8 weeks for longer hair is recommended.' },
        ],
    },

    'beard trim': {
        steps: [
            { title: 'Face Analysis', desc: 'Artist assesses your face shape and beard growth pattern.' },
            { title: 'Trim & Shape', desc: 'Beard is trimmed to your desired length and shape using trimmers and scissors.' },
            { title: 'Razor Line Up', desc: 'Clean lines are carved along neck, cheeks, and mustache edges.' },
            { title: 'Moisturize', desc: 'Beard oil or balm is applied to nourish and tame the beard.' },
        ],
        faqs: [
            { q: 'Will the stylist use a straight razor?', a: 'Yes, for the clean line-up we use a fresh disposable straight razor.' },
            { q: 'How long should my beard be before trim?', a: 'Any length works — we shape it to suit your style.' },
        ],
    },

    'blow dry': {
        steps: [
            { title: 'Shampoo & Condition', desc: 'Hair is washed with products suited to your hair type.' },
            { title: 'Heat protection', desc: 'A protective serum is applied before any heat styling.' },
            { title: 'Section & Dry', desc: 'Hair is sectioned and blow-dried using a round brush for volume and smoothness.' },
            { title: 'Finish', desc: 'A light serum or spray is applied to lock in the style.' },
        ],
        faqs: [
            { q: 'Is a blow dry suitable for all hair types?', a: 'Yes — we adjust technique and products for straight, wavy, and curly hair.' },
            { q: 'How long does it last?', a: 'A professional blow dry typically lasts 2–3 days with proper care.' },
        ],
    },

    'hair color': {
        steps: [
            { title: 'Consultation', desc: 'Shade selection, strand test, and scalp assessment.' },
            { title: 'Application', desc: 'Color is applied evenly from root to tip using professional techniques.' },
            { title: 'Processing Time', desc: 'Color develops for 20–45 minutes depending on the shade and technique.' },
            { title: 'Rinse & Tone', desc: 'Hair is rinsed and a toner may be applied for the perfect finish.' },
            { title: 'Style', desc: 'After a conditioning treatment, hair is blow-dried and styled.' },
        ],
        faqs: [
            { q: 'Does hair coloring damage hair?', a: 'Professional-grade products cause minimal damage. We use conditioning treatments to protect your hair.' },
            { q: 'How often should I color my hair?', a: 'Root touch-ups every 4–6 weeks and full color every 2–3 months is typical.' },
            { q: 'Can I color recently treated hair?', a: 'We recommend waiting 2 weeks after chemical treatments before coloring.' },
        ],
    },

    'keratin': {
        steps: [
            { title: 'Wash', desc: 'Hair is cleansed with a clarifying shampoo to remove buildup.' },
            { title: 'Keratin Application', desc: 'Keratin treatment is applied section by section from root to tip.' },
            { title: 'Blow Dry', desc: 'Hair is blow-dried to seal the keratin into the cuticle.' },
            { title: 'Flat Iron Seal', desc: 'A flat iron at high heat is passed over each section to bond the treatment.' },
            { title: 'Final Finish', desc: 'Hair is styled smooth and sleek for a polished look.' },
        ],
        faqs: [
            { q: 'How long does a keratin treatment last?', a: 'Results last 3–5 months depending on your hair type and aftercare.' },
            { q: 'Can I wash my hair after keratin?', a: 'Wait at least 72 hours after treatment before washing your hair.' },
            { q: 'Is keratin safe for colored hair?', a: 'Yes, but we recommend waiting 2 weeks after coloring before applying keratin.' },
        ],
    },

    'hair spa': {
        steps: [
            { title: 'Scalp Analysis', desc: 'Your scalp type is assessed to choose the right treatment.' },
            { title: 'Oil Massage', desc: 'A nourishing oil massage boosts circulation and relaxes tension.' },
            { title: 'Steam Treatment', desc: 'Steam opens the cuticle to let the mask penetrate deeply.' },
            { title: 'Deep Conditioning Mask', desc: 'A protein/moisture mask is applied for 20 minutes.' },
            { title: 'Rinse & Style', desc: 'Hair is rinsed, blow-dried, and styled to a shine.' },
        ],
        faqs: [
            { q: 'How often should I get a hair spa?', a: 'Once a month for best results, or every 6–8 weeks for maintenance.' },
            { q: 'Is hair spa suitable for damaged hair?', a: 'Yes — it\'s especially beneficial for dry, frizzy, or chemically treated hair.' },
        ],
    },

    // ── SKIN CARE / FACIAL ───────────────────────────────────────────────────────
    'facial': {
        steps: [
            { title: 'Cleansing', desc: 'Deep cleanse to remove makeup, oil, and impurities.' },
            { title: 'Exfoliation', desc: 'Gentle scrubbing to remove dead skin cells and brighten skin.' },
            { title: 'Steam', desc: 'Facial steam opens pores and softens skin for better product absorption.' },
            { title: 'Masking', desc: 'A targeted mask is applied for hydration, brightening, or anti-aging.' },
            { title: 'Moisturize & SPF', desc: 'Session concludes with a moisturizer and sun protection.' },
        ],
        faqs: [
            { q: 'How often should I get a facial?', a: 'Once every 4 weeks aligns with your skin\'s natural renewal cycle.' },
            { q: 'Can I wear makeup after a facial?', a: 'We recommend waiting at least 6 hours to let your pores settle.' },
            { q: 'Is a facial suitable for sensitive skin?', a: 'Yes — we tailor products to your skin type, including sensitive options.' },
        ],
    },

    'cleanup': {
        steps: [
            { title: 'Cleanse', desc: 'Face is cleansed to remove surface oil and dirt.' },
            { title: 'Scrub', desc: 'A mild exfoliant buffs away dead skin for a fresher look.' },
            { title: 'Mask', desc: 'A quick-setting mask targets clogged pores.' },
            { title: 'Tone & Moisturize', desc: 'Toner balances skin pH, followed by a lightweight moisturizer.' },
        ],
        faqs: [
            { q: 'What is the difference between a cleanup and a facial?', a: 'A cleanup is a lighter, shorter version of a facial — great for regular maintenance.' },
            { q: 'How long does a cleanup take?', a: 'Typically 30–45 minutes.' },
        ],
    },

    'detan': {
        steps: [
            { title: 'Cleanse', desc: 'Gentle cleansing of the face, neck, and arms.' },
            { title: 'De-tan Pack Application', desc: 'A specialized DE-tan pack is applied to targeted areas.' },
            { title: 'Rest', desc: 'Pack sits for 15–20 minutes to lift pigmentation.' },
            { title: 'Wash off & Moisturize', desc: 'Pack is removed and a soothing moisturizer is applied.' },
        ],
        faqs: [
            { q: 'How many sessions do I need to see results?', a: '1–2 sessions for mild tanning; 3–4 for deeper tan lines.' },
            { q: 'Is de-tan safe for all skin tones?', a: 'Yes — our products are formulated to be safe for all skin tones.' },
        ],
    },

    // ── NAIL CARE ────────────────────────────────────────────────────────────────
    'manicure': {
        steps: [
            { title: 'Soak', desc: 'Hands are soaked in warm water to soften skin and cuticles.' },
            { title: 'Cuticle Care', desc: 'Cuticles are gently pushed back and excess trimmed.' },
            { title: 'File & Shape', desc: 'Nails are filed to your preferred shape — square, oval, or almond.' },
            { title: 'Exfoliate', desc: 'A scrub is applied to hands for smooth, soft skin.' },
            { title: 'Massage', desc: 'A nourishing hand cream is massaged in for hydration.' },
            { title: 'Polish', desc: 'Base coat, color of choice, and top coat are applied for a lasting finish.' },
        ],
        faqs: [
            { q: 'How long does a manicure last?', a: 'Regular polish lasts 5–7 days; gel lasts 2–3 weeks.' },
            { q: 'Can I choose my nail color?', a: 'Yes — we carry a wide range of shades. Ask about our gel options too.' },
        ],
    },

    'pedicure': {
        steps: [
            { title: 'Foot Soak', desc: 'Feet are soaked in warm, scented water to relax and soften skin.' },
            { title: 'Callus Removal', desc: 'A scraper or pumice stone removes dead skin from heels and soles.' },
            { title: 'Nail Trim & Shape', desc: 'Toe nails are trimmed, filed, and shaped.' },
            { title: 'Cuticle Care', desc: 'Cuticles are cleaned and moisturized.' },
            { title: 'Scrub & Massage', desc: 'Foot scrub is applied followed by a relaxing massage with a rich cream.' },
            { title: 'Polish', desc: 'Base coat, color, and top coat applied for a perfect finish.' },
        ],
        faqs: [
            { q: 'How often should I get a pedicure?', a: 'Every 3–4 weeks is ideal for maintaining healthy, soft feet.' },
            { q: 'Is it safe if I have cracked heels?', a: 'Absolutely — our pedicure is specifically designed to treat cracked heels.' },
        ],
    },

    // ── WAXING ───────────────────────────────────────────────────────────────────
    'waxing': {
        steps: [
            { title: 'Skin Prep', desc: 'Area is cleansed and a light pre-wax powder is applied to protect skin.' },
            { title: 'Wax Application', desc: 'Warm wax is applied in the direction of hair growth.' },
            { title: 'Strip Removal', desc: 'Wax strip is swiftly removed against the direction of hair growth.' },
            { title: 'Soothing', desc: 'A calming lotion or aloe gel is applied to reduce redness.' },
        ],
        faqs: [
            { q: 'How long should my hair be before waxing?', a: 'At least 1/4 inch (about 2–3 weeks of growth) for best results.' },
            { q: 'Will it hurt?', a: 'There is a brief sensation during strip removal, which reduces with regular sessions.' },
            { q: 'How long do results last?', a: 'Typically 3–4 weeks before regrowth appears.' },
        ],
    },

    // ── THREADING ────────────────────────────────────────────────────────────────
    'threading': {
        steps: [
            { title: 'Consultation', desc: 'Discuss desired brow shape or area to be threaded.' },
            { title: 'Thread Technique', desc: 'A doubled-up thread is twisted and rolled over hair, pulling from follicles precisely.' },
            { title: 'Soothing', desc: 'Post-threading, an ice pack or soothing lotion is applied to calm the skin.' },
        ],
        faqs: [
            { q: 'Is threading better than waxing?', a: 'Threading is more precise and gentler on sensitive skin — ideal for eyebrows and upper lip.' },
            { q: 'How long does threading last?', a: 'Results last 2–4 weeks depending on hair growth rate.' },
        ],
    },

    // ── MASSAGE / SPA ────────────────────────────────────────────────────────────
    'massage': {
        steps: [
            { title: 'Consultation', desc: 'Your areas of tension and pressure preference (light, medium, deep) are discussed.' },
            { title: 'Oil Selection', desc: 'Massage oil is chosen based on your needs — relaxing, energizing, or therapeutic.' },
            { title: 'Massage', desc: 'Therapist works through targeted areas using appropriate techniques.' },
            { title: 'Cool Down', desc: 'Session concludes gently to allow your body to absorb the benefits.' },
        ],
        faqs: [
            { q: 'Should I eat before a massage?', a: 'Avoid heavy meals 1 hour before your session.' },
            { q: 'What should I wear?', a: 'Comfortable, loose clothing. You\'ll be appropriately draped during the session.' },
            { q: 'How often can I get a massage?', a: 'Once a week for wellness or as recommended for specific muscle issues.' },
        ],
    },

    // ── BRIDAL / MAKEUP ──────────────────────────────────────────────────────────
    'bridal': {
        steps: [
            { title: 'Trial Session', desc: 'A pre-event trial run to finalize the look.' },
            { title: 'Skin Prep', desc: 'Primer and moisturizer are applied for a smooth base.' },
            { title: 'Foundation & Contouring', desc: 'Full coverage base is built and face is contoured and highlighted.' },
            { title: 'Eye Makeup', desc: 'Detailed eye work — eyeshadow, liner, lashes.' },
            { title: 'Lip & Setting', desc: 'Lips are perfected and the full look is sealed with a setting spray for longevity.' },
        ],
        faqs: [
            { q: 'How far in advance should I book bridal makeup?', a: 'At least 1–2 months in advance, especially for peak wedding seasons.' },
            { q: 'Is a trial session included?', a: 'A trial session is recommended and may be included or available as an add-on.' },
            { q: 'How long does bridal makeup last?', a: 'With proper setting products, it lasts 8–12 hours.' },
        ],
    },

    'makeup': {
        steps: [
            { title: 'Skin Prep', desc: 'Face is cleansed and moisturizer and primer are applied.' },
            { title: 'Base Application', desc: 'Foundation, concealer, and setting powder for an even complexion.' },
            { title: 'Eye & Brow Work', desc: 'Shadow, liner, mascara, or lashes applied to define the eyes.' },
            { title: 'Cheeks & Lips', desc: 'Blush, highlight, and lip color complete the look.' },
            { title: 'Set & Finish', desc: 'Setting spray locks the look in place.' },
        ],
        faqs: [
            { q: 'Should I come with a clean face?', a: 'Yes — a clean, moisturized face gives the best makeup results.' },
            { q: 'Do you use hypoallergenic products?', a: 'We work with premium brands. Please mention any known allergies before your session.' },
        ],
    },
};

// ── Category-level fallback ───────────────────────────────────────────────────
const CATEGORY_FALLBACK = {
    'Hair & Styling': {
        steps: [
            { title: 'Consultation', desc: 'Discuss your desired look and hair condition.' },
            { title: 'Preparation', desc: 'Hair is washed and prepped for the service.' },
            { title: 'Treatment / Style', desc: 'The chosen service is performed with professional products.' },
            { title: 'Finish', desc: 'Hair is styled and finished for a polished result.' },
        ],
        faqs: [
            { q: 'What products are used?', a: 'We use professional-grade salon products suited to your hair type.' },
            { q: 'How long will it take?', a: 'Duration varies by service — check the listed time for this service.' },
        ],
    },
    'Skin Care': {
        steps: [
            { title: 'Consultation', desc: 'Your skin type and concerns are assessed.' },
            { title: 'Cleansing', desc: 'Thorough cleansing removes impurities and prepares skin.' },
            { title: 'Treatment', desc: 'The chosen treatment is applied for maximum effect.' },
            { title: 'Hydration & Finish', desc: 'Skin is moisturized and protected.' },
        ],
        faqs: [
            { q: 'Is the treatment suitable for sensitive skin?', a: 'Yes — we tailor products based on your skin type.' },
            { q: 'How soon will I see results?', a: 'Some services show immediate results; deeper treatments may take 1–2 sessions.' },
        ],
    },
    'Nail Care': {
        steps: [
            { title: 'Soak & Prep', desc: 'Hands/feet are soaked and nails prepped.' },
            { title: 'Shape & Clean', desc: 'Nails are filed, shaped, and cuticles are tended to.' },
            { title: 'Treatment', desc: 'The chosen nail treatment is applied.' },
            { title: 'Polish & Finish', desc: 'Color and topcoat are applied for a lasting result.' },
        ],
        faqs: [
            { q: 'Do you use sterilized tools?', a: 'Yes — all tools are sanitized between clients for hygiene and safety.' },
        ],
    },
    'default': {
        steps: [
            { title: 'Consultation', desc: 'Your needs and preferences are discussed before we begin.' },
            { title: 'Preparation', desc: 'The area is prepped with appropriate products and techniques.' },
            { title: 'Service', desc: 'The treatment is performed by a trained professional.' },
            { title: 'Finish & Aftercare', desc: 'Any finishing touches are applied and aftercare tips are shared.' },
        ],
        faqs: [
            { q: 'Is this service suitable for all skin/hair types?', a: 'Yes — our professionals adapt the service to your specific needs.' },
            { q: 'What should I do to prepare?', a: 'Arrive with clean skin/hair. Avoid heavy products before your appointment.' },
        ],
    },
};

// ── Matching logic ────────────────────────────────────────────────────────────
function getDetails(service) {
    const nameLower = (service.name || '').toLowerCase();

    for (const [key, details] of Object.entries(SERVICE_DETAILS)) {
        if (nameLower.includes(key)) return details;
    }

    // Category fallback
    const catDetails = CATEGORY_FALLBACK[service.category];
    if (catDetails) return catDetails;

    return CATEGORY_FALLBACK['default'];
}

// ── Main ────────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🌱 Starting service detail seed...\n');

    const services = await prisma.serviceCatalog.findMany({
        orderBy: { category: 'asc' },
    });

    console.log(`Found ${services.length} services in catalog.\n`);

    let updated = 0;
    let skipped = 0;

    for (const service of services) {
        // Skip if already populated
        if (service.steps || service.faqs) {
            console.log(`⏭  SKIP  [${service.category}] ${service.name} — already has data`);
            skipped++;
            continue;
        }

        const { steps, faqs } = getDetails(service);

        await prisma.serviceCatalog.update({
            where: { id: service.id },
            data: { steps, faqs },
        });

        console.log(`✅  OK    [${service.category}] ${service.name}`);
        updated++;
    }

    console.log(`\n🎉 Done! Updated: ${updated}  |  Skipped (already set): ${skipped}\n`);
}

main()
    .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
