const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Comprehensive Indian Service Catalog...');

    // Clear existing data
    await prisma.serviceCatalog.deleteMany({});
    await prisma.category.deleteMany({});

    console.log('Seeding Categories...');
    const categories = [
        { name: 'Hair & Styling', image: 'xalon/categories/hair_styling' },
        { name: 'Grooming Essentials', image: 'xalon/categories/grooming_essentials' },
        { name: 'Facial & Skin Care', image: 'xalon/categories/facial_skin_care' },
        { name: 'Waxing & Hair Removal', image: 'xalon/categories/waxing_hair_removal' },
        { name: 'Threading', image: 'xalon/categories/threading' },
        { name: 'Manicure & Pedicure', image: 'xalon/categories/manicure_pedicure' },
        { name: 'Hair Colouring', image: 'xalon/categories/hair_colouring' },
        { name: 'Hair Treatments', image: 'xalon/categories/hair_treatments' },
        { name: 'Advanced Skin', image: 'xalon/categories/advanced_skin' },
        { name: 'Massage & Wellness', image: 'xalon/categories/massage_wellness' },
        { name: 'Makeup & Bridal', image: 'xalon/categories/makeup_bridal' },
        { name: 'Premium Packages', image: 'xalon/categories/packages' }
    ];

    for (const cat of categories) {
        await prisma.category.create({ data: cat });
    }

    console.log('Seeding Services...');
    const services = [
        // --- Haircut & Styling (MEN) ---
        { name: 'Haircut', category: 'Hair & Styling', subCategory: 'Cuts', duration: 30, priceType: 'Fixed', defaultPrice: 150, gender: 'Male', description: 'Professional haircut', image: 'xalon/categories/hair_styling' },
        { name: 'Beard', category: 'Grooming Essentials', subCategory: 'Beard', duration: 20, priceType: 'Fixed', defaultPrice: 100, gender: 'Male', description: 'Beard grooming and shaping', image: 'xalon/categories/grooming_essentials' },
        { name: 'Hairwash', category: 'Hair & Styling', subCategory: 'Wash', duration: 15, priceType: 'Fixed', defaultPrice: 50, gender: 'Male', description: 'Deep cleansing hair wash', image: 'xalon/categories/hair_styling' },
        { name: 'Deep Conditioning', category: 'Hair & Styling', subCategory: 'Treatment', duration: 30, priceType: 'Fixed', defaultPrice: 150, gender: 'Male', description: 'Intense hair conditioning', image: 'xalon/categories/hair_styling' },
        { name: 'Baby Haircut', category: 'Hair & Styling', subCategory: 'Cuts', duration: 30, priceType: 'Fixed', defaultPrice: 100, gender: 'Male', description: 'Gentle haircut for kids', image: 'xalon/categories/hair_styling' },

        // --- Hair Spa (MEN) ---
        { name: 'Normal Hair Spa', category: 'Hair Treatments', subCategory: 'Spa', duration: 45, priceType: 'Fixed', defaultPrice: 500, gender: 'Male', description: 'Relaxing hair spa', image: 'xalon/categories/hair_treatments' },
        { name: 'Loreal Hair Spa', category: 'Hair Treatments', subCategory: 'Spa', duration: 60, priceType: 'Fixed', defaultPrice: 800, gender: 'Male', description: 'Premium Loreal hair spa', image: 'xalon/categories/hair_treatments' },
        { name: 'Anti Dandruff', category: 'Hair Treatments', subCategory: 'Treatment', duration: 45, priceType: 'Fixed', defaultPrice: 1500, gender: 'Male', description: 'Effective dandruff treatment', image: 'xalon/categories/hair_treatments' },
        { name: 'Hairfall Treatment', category: 'Hair Treatments', subCategory: 'Treatment', duration: 45, priceType: 'Fixed', defaultPrice: 1500, gender: 'Male', description: 'Specialized hairfall control', image: 'xalon/categories/hair_treatments' },
        { name: 'Keratine Spa', category: 'Hair Treatments', subCategory: 'Spa', duration: 60, priceType: 'Fixed', defaultPrice: 1000, gender: 'Male', description: 'Smoothing keratin spa', image: 'xalon/categories/hair_treatments' },

        // --- Massage (MEN) ---
        { name: 'Head Massage', category: 'Massage & Wellness', subCategory: 'Massage', duration: 20, priceType: 'Fixed', defaultPrice: 250, gender: 'Male', description: 'Tension-relieving head massage', image: 'xalon/categories/massage_wellness' },
        { name: 'Full Body Massage', category: 'Massage & Wellness', subCategory: 'Massage', duration: 60, priceType: 'Fixed', defaultPrice: 1250, gender: 'Male', description: 'Total body relaxation', image: 'xalon/categories/massage_wellness' },
        { name: 'Body Massage with Steam', category: 'Massage & Wellness', subCategory: 'Massage', duration: 75, priceType: 'Fixed', defaultPrice: 1500, gender: 'Male', description: 'Massage followed by steam bath', image: 'xalon/categories/massage_wellness' },
        { name: 'Body Spa', category: 'Massage & Wellness', subCategory: 'Spa', duration: 90, priceType: 'Fixed', defaultPrice: 2500, gender: 'Male', description: 'Luxurious body spa treatment', image: 'xalon/categories/massage_wellness' },
        { name: 'Body Polishing', category: 'Massage & Wellness', subCategory: 'Advanced', duration: 90, priceType: 'Fixed', defaultPrice: 3500, gender: 'Male', description: 'Skin smoothing body polish', image: 'xalon/categories/massage_wellness' },
        { name: 'Back Massage', category: 'Massage & Wellness', subCategory: 'Massage', duration: 30, priceType: 'Fixed', defaultPrice: 500, gender: 'Male', description: 'Focused back relaxation', image: 'xalon/categories/massage_wellness' },

        // --- Cleanup (MEN) ---
        { name: 'Normal Cleanup', category: 'Facial & Skin Care', subCategory: 'Clean-up', duration: 30, priceType: 'Starting at', defaultPrice: 500, gender: 'Male', description: 'Basic skin cleanup', image: 'xalon/categories/facial_skin_care' },

        // --- D-Tan (MEN) ---
        { name: 'Face D-Tan', category: 'Facial & Skin Care', subCategory: 'D-Tan', duration: 20, priceType: 'Fixed', defaultPrice: 499, gender: 'Male', description: 'Face tan removal', image: 'xalon/categories/facial_skin_care' },
        { name: 'Hydrafacial Express', category: 'Advanced Skin', subCategory: 'Facial', duration: 30, priceType: 'Fixed', defaultPrice: 2499, gender: 'Unisex', description: 'Quick hydrating facial', image: 'xalon/categories/advanced_skin' },
        { name: 'Vitamin C Brightening', category: 'Advanced Skin', subCategory: 'Facial', duration: 45, priceType: 'Fixed', defaultPrice: 3200, gender: 'Female', description: 'Brightening facial with Vitamin C', image: 'xalon/categories/advanced_skin' },
        { name: 'Skin Tightening', category: 'Advanced Skin', subCategory: 'Treatment', duration: 60, priceType: 'Fixed', defaultPrice: 4500, gender: 'Female', description: 'Advanced skin tightening treatment', image: 'xalon/categories/advanced_skin' },
        { name: 'Raaga D-Tan', category: 'Facial & Skin Care', subCategory: 'D-Tan', duration: 20, priceType: 'Fixed', defaultPrice: 400, gender: 'Male', description: 'Tan removal with Raaga products', image: 'xalon/categories/facial_skin_care' },
        { name: 'O3 D-Tan', category: 'Facial & Skin Care', subCategory: 'D-Tan', duration: 20, priceType: 'Fixed', defaultPrice: 500, gender: 'Male', description: 'Premium O3+ tan removal', image: 'xalon/categories/facial_skin_care' },

        // --- Colouring (MEN) ---
        { name: 'Full Hair Colour Loreal', category: 'Hair Colouring', subCategory: 'Global', duration: 60, priceType: 'Fixed', defaultPrice: 600, gender: 'Male', description: 'Loreal full hair color', image: 'xalon/categories/hair_colouring' },
        { name: 'Loreal Beard Colour', category: 'Hair Colouring', subCategory: 'Beard', duration: 30, priceType: 'Fixed', defaultPrice: 250, gender: 'Male', description: 'Loreal beard coloring', image: 'xalon/categories/hair_colouring' },
        { name: 'Highlights per strip', category: 'Hair Colouring', subCategory: 'Highlights', duration: 20, priceType: 'Fixed', defaultPrice: 150, gender: 'Male', description: 'Single strip hair highlights', image: 'xalon/categories/hair_colouring' },
        { name: 'Global Fashion Colour', category: 'Hair Colouring', subCategory: 'Global', duration: 60, priceType: 'Fixed', defaultPrice: 1500, gender: 'Male', description: 'Trendy fashion hair color', image: 'xalon/categories/hair_colouring' },

        // --- Pedicure & Manicure (MEN) ---
        { name: 'Normal Pedicure', category: 'Manicure & Pedicure', subCategory: 'Pedicure', duration: 45, priceType: 'Fixed', defaultPrice: 500, gender: 'Male', description: 'Basic foot care', image: 'xalon/categories/manicure_pedicure' },
        { name: 'Pedicure Spa', category: 'Manicure & Pedicure', subCategory: 'Pedicure', duration: 60, priceType: 'Fixed', defaultPrice: 700, gender: 'Male', description: 'Relaxing pedicure spa' },
        { name: 'D-Tan Pedicure', category: 'Manicure & Pedicure', subCategory: 'Pedicure', duration: 60, priceType: 'Fixed', defaultPrice: 900, gender: 'Male', description: 'Pedicure with tan removal' },
        { name: 'Advance Pedicure', category: 'Manicure & Pedicure', subCategory: 'Pedicure', duration: 75, priceType: 'Fixed', defaultPrice: 1500, gender: 'Male', description: 'Premium advanced pedicure' },
        { name: 'Normal Manicure', category: 'Manicure & Pedicure', subCategory: 'Manicure', duration: 45, priceType: 'Fixed', defaultPrice: 300, gender: 'Male', description: 'Basic hand care' },
        { name: 'Manicure Spa', category: 'Manicure & Pedicure', subCategory: 'Manicure', duration: 60, priceType: 'Fixed', defaultPrice: 500, gender: 'Male', description: 'Relaxing manicure spa' },
        { name: 'D-Tan Manicure', category: 'Manicure & Pedicure', subCategory: 'Manicure', duration: 60, priceType: 'Fixed', defaultPrice: 700, gender: 'Male', description: 'Manicure with tan removal' },

        // --- Facials (MEN) ---
        { name: 'Fruit Facial', category: 'Facial & Skin Care', subCategory: 'Facial', duration: 60, priceType: 'Starting at', defaultPrice: 700, gender: 'Male', description: 'Refreshing fruit facial' },
        { name: 'VLCC Instant Glow', category: 'Facial & Skin Care', subCategory: 'Facial', duration: 60, priceType: 'Fixed', defaultPrice: 1800, gender: 'Male', description: 'VLCC glow treatment' },
        { name: 'VLCC Diamond', category: 'Facial & Skin Care', subCategory: 'Facial', duration: 60, priceType: 'Fixed', defaultPrice: 1500, gender: 'Male', description: 'VLCC diamond facial' },
        { name: 'VLCC Pearl', category: 'Facial & Skin Care', subCategory: 'Facial', duration: 60, priceType: 'Fixed', defaultPrice: 1500, gender: 'Male', description: 'VLCC pearl facial' },
        { name: 'VLCC Gold', category: 'Facial & Skin Care', subCategory: 'Facial', duration: 60, priceType: 'Fixed', defaultPrice: 1000, gender: 'Male', description: 'VLCC gold facial' },
        { name: 'O3+ Facial', category: 'Facial & Skin Care', subCategory: 'Facial', duration: 60, priceType: 'Fixed', defaultPrice: 3000, gender: 'Male', description: 'Premium O3+ signature facial' },
        { name: 'O3+ Diamond', category: 'Facial & Skin Care', subCategory: 'Facial', duration: 60, priceType: 'Fixed', defaultPrice: 4000, gender: 'Male', description: 'Ultra-premium O3+ diamond facial' },

        // --- Women Specific ---
        { name: 'Women: Haircut', category: 'Hair & Styling', subCategory: 'Cuts', duration: 45, priceType: 'Starting at', defaultPrice: 400, gender: 'Female', description: 'Professional women haircut' },
        { name: 'Women: Blow Dry', category: 'Hair & Styling', subCategory: 'Styling', duration: 30, priceType: 'Fixed', defaultPrice: 300, gender: 'Female', description: 'Professional blow dry and styling' },
        { name: 'Women: Hair Smoothing', category: 'Hair Treatments', subCategory: 'Smoothing', duration: 180, priceType: 'Starting at', defaultPrice: 3000, gender: 'Female', description: 'Long-lasting hair smoothing' },
        { name: 'Women: Keratin Treatment', category: 'Hair Treatments', subCategory: 'Keratin', duration: 120, priceType: 'Starting at', defaultPrice: 4000, gender: 'Female', description: 'Protein treatment for smooth hair' },
        { name: 'Women: Botox Treatment', category: 'Hair Treatments', subCategory: 'Botox', duration: 120, priceType: 'Starting at', defaultPrice: 5000, gender: 'Female', description: 'Revitalizing Botox hair treatment' },
        { name: 'Women: Loreal Hair Spa', category: 'Hair Treatments', subCategory: 'Spa', duration: 60, priceType: 'Fixed', defaultPrice: 1200, gender: 'Female', description: 'Premium Loreal hair spa' },

        { name: 'Women: Global Hair Color', category: 'Hair Colouring', subCategory: 'Global', duration: 90, priceType: 'Starting at', defaultPrice: 1500, gender: 'Female', description: 'Full hair coloring for women' },
        { name: 'Women: Hair Highlights', category: 'Hair Colouring', subCategory: 'Highlights', duration: 120, priceType: 'Starting at', defaultPrice: 2500, gender: 'Female', description: 'Fashion hair highlights' },

        { name: 'Women: Face Cleanup', category: 'Facial & Skin Care', subCategory: 'Clean-up', duration: 30, priceType: 'Starting at', defaultPrice: 400, gender: 'Female', description: 'Refreshing face cleanup' },
        { name: 'Women: Fruit Facial', category: 'Facial & Skin Care', subCategory: 'Facial', duration: 60, priceType: 'Fixed', defaultPrice: 800, gender: 'Female', description: 'Natural fruit extract facial' },
        { name: 'Women: O3+ Whitening Facial', category: 'Facial & Skin Care', subCategory: 'Facial', duration: 75, priceType: 'Fixed', defaultPrice: 3500, gender: 'Female', description: 'Premium O3+ whitening treatment' },
        { name: 'Women: Full Body DTAN', category: 'Facial & Skin Care', subCategory: 'D-Tan', duration: 60, priceType: 'Fixed', defaultPrice: 999, gender: 'Female', description: 'Total body tan removal' },

        { name: 'Women: Eyebrows Threading', category: 'Threading', subCategory: 'Threading', duration: 10, priceType: 'Fixed', defaultPrice: 50, gender: 'Female', description: 'Eyebrow shaping', image: 'xalon/categories/threading' },
        { name: 'Women: Upper Lip Threading', category: 'Threading', subCategory: 'Threading', duration: 5, priceType: 'Fixed', defaultPrice: 30, gender: 'Female', description: 'Upper lip hair removal' },
        { name: 'Women: Full Face Threading', category: 'Threading', subCategory: 'Threading', duration: 25, priceType: 'Fixed', defaultPrice: 200, gender: 'Female', description: 'Entire face threading' },

        { name: 'Women: Full Arms Waxing', category: 'Waxing & Hair Removal', subCategory: 'Waxing', duration: 30, priceType: 'Fixed', defaultPrice: 400, gender: 'Female', description: 'Full arms hair removal', image: 'xalon/categories/waxing_hair_removal' },
        { name: 'Women: Full Legs Waxing', category: 'Waxing & Hair Removal', subCategory: 'Waxing', duration: 45, priceType: 'Fixed', defaultPrice: 600, gender: 'Female', description: 'Full legs hair removal' },
        { name: 'Women: Underarms Waxing', category: 'Waxing & Hair Removal', subCategory: 'Waxing', duration: 10, priceType: 'Fixed', defaultPrice: 100, gender: 'Female', description: 'Underarms hair removal' },
        { name: 'Women: Full Body Waxing', category: 'Waxing & Hair Removal', subCategory: 'Waxing', duration: 90, priceType: 'Fixed', defaultPrice: 1999, gender: 'Female', description: 'Full body waxing' },

        { name: 'Women: Classic Manicure', category: 'Manicure & Pedicure', subCategory: 'Manicure', duration: 45, priceType: 'Fixed', defaultPrice: 500, gender: 'Female', description: 'Basic hand grooming' },
        { name: 'Women: Classic Pedicure', category: 'Manicure & Pedicure', subCategory: 'Pedicure', duration: 60, priceType: 'Fixed', defaultPrice: 700, gender: 'Female', description: 'Basic feet grooming' },
        { name: 'Women: Spa Pedicure', category: 'Manicure & Pedicure', subCategory: 'Pedicure', duration: 75, priceType: 'Fixed', defaultPrice: 1200, gender: 'Female', description: 'Relaxing foot spa pedicure' },

        { name: 'Women: Party Makeup', category: 'Makeup & Bridal', subCategory: 'Makeup', duration: 90, priceType: 'Starting at', defaultPrice: 2500, gender: 'Female', description: 'Elegant party makeup' },
        { name: 'Women: Bridal Makeup', category: 'Makeup & Bridal', subCategory: 'Makeup', duration: 180, priceType: 'Starting at', defaultPrice: 15000, gender: 'Female', description: 'Complete bridal transformation', image: 'xalon/categories/makeup_bridal' },
        { name: 'Women: Saree Draping', category: 'Makeup & Bridal', subCategory: 'Draping', duration: 20, priceType: 'Fixed', defaultPrice: 500, gender: 'Female', description: 'Professional saree draping' },

        { name: 'Women: Head Massage', category: 'Massage & Wellness', subCategory: 'Massage', duration: 20, priceType: 'Fixed', defaultPrice: 300, gender: 'Female', description: 'Relaxing head massage' },
        { name: 'Women: Full Body Massage', category: 'Massage & Wellness', subCategory: 'Massage', duration: 60, priceType: 'Fixed', defaultPrice: 1500, gender: 'Female', description: 'Complete body relaxation' },

        // --- Hair & Skin Packages (WOMEN) ---
        { name: 'Smoothing Mega Combo', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 240, priceType: 'Fixed', defaultPrice: 4999, gender: 'Female', description: 'Hair Smoothing (Any Length), Haircut, Hair Wash, Normal Hair Spa', image: 'xalon/categories/packages' },
        { name: 'Keratin Deluxe Combo', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 180, priceType: 'Fixed', defaultPrice: 5999, gender: 'Female', description: 'Keratin (Any Length), Hair Spa, Hair Cut, Hair Wash' },
        { name: 'Botox Premium Combo', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 180, priceType: 'Fixed', defaultPrice: 6999, gender: 'Female', description: 'Botox Treatment (Any Length), Haircut, Hair Wash, Loreal Hair Spa' },
        { name: 'Basic Color Combo', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 120, priceType: 'Fixed', defaultPrice: 1999, gender: 'Female', description: 'Basic Hair Color Global, Hair Spa, Haircut, Hair Wash' },
        { name: 'Fashion Color Combo', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 120, priceType: 'Fixed', defaultPrice: 3499, gender: 'Female', description: 'Fashion Global Color (Any Length), Hair Spa, Haircut, Hair Wash' },
        { name: 'Highlights Value Combo', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 120, priceType: 'Fixed', defaultPrice: 3499, gender: 'Female', description: 'Global Color Highlights, Hair Spa, Haircut, Hair Wash' },
        { name: 'Essential Hair Pack', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 60, priceType: 'Fixed', defaultPrice: 999, gender: 'Female', description: 'Haircut, Hair Spa, Hair Wash' },
        { name: 'Quick Glow Pack', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 30, priceType: 'Fixed', defaultPrice: 499, gender: 'Female', description: 'D-Tan + Fruit Clean Up' },
        { name: 'Waxing & Cleanup Combo', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 90, priceType: 'Fixed', defaultPrice: 999, gender: 'Female', description: 'Full Hand/Legs Wax, Underarms, Cleanup' },
        { name: 'Relaxation Pack', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 120, priceType: 'Fixed', defaultPrice: 1999, gender: 'Female', description: 'Hair Spa, Head Massage, Haircut, D-Tan/Facial' },

        // --- Hair & Skin Packages (MEN) ---
        { name: 'Mens Grooming Essentials', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 60, priceType: 'Fixed', defaultPrice: 599, gender: 'Male', description: 'Haircut, Beard, Hair Wash, Head Massage, D-Tan' },
        { name: 'Mens Facial Combo', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 90, priceType: 'Fixed', defaultPrice: 999, gender: 'Male', description: 'Facial, Haircut, Beard, Hair Wash, Head Massage, D-Tan' },
        { name: 'Mens Quick Cleanup', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 45, priceType: 'Fixed', defaultPrice: 699, gender: 'Male', description: 'Cleanup, Face Neck Back D-Tan' },
        { name: 'Mens Relaxation Mini', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 60, priceType: 'Fixed', defaultPrice: 1499, gender: 'Male', description: 'Head Massage, Body Massage' },
        { name: 'Mens Loreal Premium', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 90, priceType: 'Fixed', defaultPrice: 1599, gender: 'Male', description: 'Loreal Hair Spa, Haircut, Beard, Hair Wash, Head Massage, Face Neck D-Tan' },
        { name: 'Mens Spa Mani/Pedi Pack', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 90, priceType: 'Fixed', defaultPrice: 1499, gender: 'Male', description: 'Manicure Spa, Pedicure Spa, D-Tan/Facial' },
        { name: 'Mens Advanced Facial Combo', category: 'Premium Packages', subCategory: 'Hair & Skin', duration: 120, priceType: 'Fixed', defaultPrice: 1999, gender: 'Male', description: 'Advance Facial, Face Neck Back D-Tan, Foot Massage, Hand Massage' },
    ];

    for (const s of services) {
        await prisma.serviceCatalog.create({ data: s });
    }

    console.log(`Seeding complete. Added ${services.length} services.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
