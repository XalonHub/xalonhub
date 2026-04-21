
const SERVICES = [
  // --- HAIR & STYLING (MEN) ---
  {
    name: "Premium Haircut",
    category: "Hair & Styling",
    gender: "Male",
    duration: 45,
    price: 500,
    steps: [
      { title: "Consultation", desc: "Expert stylist discusses your face shape and desired style." },
      { title: "Hair Wash", desc: "Refreshing shampoo and scalp cleanse." },
      { title: "Precision Cut", desc: "Careful scissor and clipper work tailored to your choice." },
      { title: "Styling", desc: "Finish with high-quality hair wax/pomade and blow-dry." }
    ],
    faqs: [
      { q: "Is a wash included?", a: "Yes, we include a refreshing shampoo wash." },
      { q: "Can I bring a reference photo?", a: "Definitely! It helps us understand your vision." }
    ]
  },
  {
    name: "Beard Sculpting",
    category: "Hair & Styling",
    gender: "Male",
    duration: 30,
    price: 300,
    steps: [
      { title: "Analysis", desc: "Checking beard growth pattern and skin type." },
      { title: "Length Tapering", desc: "Clippers and scissors used to uniform the length." },
      { title: "Straight Razor Edge", desc: "Sharp lines using a disposable razor on cheeks and neck." },
      { title: "Moisturizing", desc: "Finishing with beard oil for a soft, healthy shine." }
    ],
    faqs: [
      { q: "Do you use a straight razor?", a: "Yes, for precision edging on the neck and cheeks." }
    ]
  },

  // --- GROOMING ESSENTIALS (MEN) ---
  {
    name: "Classic Straight Razor Shave",
    category: "Grooming Essentials",
    gender: "Male",
    duration: 40,
    price: 450,
    steps: [
      { title: "Hot Towel", desc: "Warming the face to open pores and soften bristles." },
      { title: "Pre-shave Oil", desc: "Adding a layer of protection." },
      { title: "Lathering", desc: "Rich cream application with a professional brush." },
      { title: "The Shave", desc: "Traditional straight razor shave for extreme closeness." },
      { title: "Post-Shave Towel", desc: "Steam or cold towel to relax and close pores." }
    ],
    faqs: [
      { q: "Is it safe?", a: "Yes, our stylists use fresh, disposable blades for every client." }
    ]
  },

  // --- FACIAL & SKIN CARE (MEN) ---
  {
    name: "Charcoal Deep Clean-up",
    category: "Facial & Skin Care",
    gender: "Male",
    duration: 45,
    price: 800,
    steps: [
      { title: "Face Cleanse", desc: "Removing dirt and oil." },
      { title: "Steam & Exfoliate", desc: "Steam opens pores; charcoal scrub extracts deep toxins." },
      { title: "Blackhead Removal", desc: "Gentle manual extraction if needed." },
      { title: "Charcoal Face Pack", desc: "Absorbing excess oils and tightening pores." }
    ],
    faqs: [
      { q: "Is this for oily skin?", a: "Yes, charcoal is excellent for removing excess oil and impurities." }
    ]
  },

  // --- WAXING & HAIR REMOVAL (MEN) ---
  {
    name: "Complete Chest & Back Wax",
    category: "Waxing & Hair Removal",
    gender: "Male",
    duration: 60,
    price: 1500,
    steps: [
      { title: "Skin Prep", desc: "Cleansing the skin and applying pre-wax powder." },
      { title: "Wax Application", desc: "Applying warm wax in the direction of hair growth." },
      { title: "Hair Removal", desc: "Swift strip removal against hair growth." },
      { title: "Soothing Gel", desc: "Applying cooling aloe vera to calm the skin." }
    ],
    faqs: [
      { q: "Does it hurt?", a: "There is brief discomfort, but it reduces with regular waxing." }
    ]
  },

  // --- THREADING (MEN) ---
  {
    name: "Brow Clean-up (Men)",
    category: "Threading",
    gender: "Male",
    duration: 15,
    price: 100,
    steps: [
      { title: "Consultation", desc: "Determining the natural brow shape." },
      { title: "Threading", desc: "Precise hair removal to clean up the edges." },
      { title: "Finishing", desc: "Moisturizing with soothing gel." }
    ],
    faqs: [
      { q: "Will it change my brow shape?", a: "We focus on a natural cleanup rather than a feminine arch." }
    ]
  },

  // --- MANICURE & PEDICURE (MEN) ---
  {
    name: "Executive Gentleman's Pedicure",
    category: "Manicure & Pedicure",
    gender: "Male",
    duration: 60,
    price: 1200,
    steps: [
      { title: "Foot Soak", desc: "Warm water bath with sea salts." },
      { title: "Callus Removal", desc: "Buffing away dead skin from heels." },
      { title: "Nail Care", desc: "Trimming, filing, and cleaning cuticles." },
      { title: "Massage", desc: "Relaxing foot and calf massage." }
    ],
    faqs: [
      { q: "Do you use sterilized tools?", a: "Yes, all our tools are sanitized after every use." }
    ]
  },

  // --- HAIR COLOURING (MEN) ---
  {
    name: "Root Touch-up (Men)",
    category: "Hair Colouring",
    gender: "Male",
    duration: 60,
    price: 800,
    steps: [
      { title: "Color Match", desc: "Selecting the perfect shade for your natural hair." },
      { title: "Application", desc: "Careful application to the roots/white hair." },
      { title: "Rinse", desc: "Washing off the color after processing." }
    ],
    faqs: [
      { q: "Is the color ammonia-free?", a: "Yes, we use professional ammonia-free brands." }
    ]
  },

  // --- HAIR TREATMENTS (MEN) ---
  {
    name: "Intensive Anti-Dandruff Spa",
    category: "Hair Treatments",
    gender: "Male",
    duration: 60,
    price: 1200,
    steps: [
      { title: "Scalp Scrub", desc: "Exfoliating the scalp to loosen flakes." },
      { title: "Treatment Application", desc: "Applying specialized anti-dandruff vials." },
      { title: "Steam & Massage", desc: "Encouraging absorption and relaxation." },
      { title: "Wash", desc: "Cleaning with medicated shampoo." }
    ],
    faqs: [
      { q: "How many sessions do I need?", a: "A single session shows results, but 3-4 are recommended for severe issues." }
    ]
  },

  // --- ADVANCED SKIN (MEN) ---
  {
    name: "Professional HydraFacial",
    category: "Advanced Skin",
    gender: "Male",
    duration: 60,
    price: 5000,
    steps: [
      { title: "Cleansing", desc: "Step 1 of the machine - deep cleansing." },
      { title: "Exfoliation", desc: "Removing dead skin with the vortex tip." },
      { title: "Extraction", desc: "Painless suction to clear pores." },
      { title: "Hydration", desc: "Infusing skin with antioxidants and peptides." }
    ],
    faqs: [
      { q: "Is there any downtime?", a: "No, you can go about your day immediately with glowing skin." }
    ]
  },

  // --- MASSAGE & WELLNESS (MEN) ---
  {
    name: "Full Body Swedish Massage",
    category: "Massage & Wellness",
    gender: "Male",
    duration: 60,
    price: 2500,
    steps: [
      { title: "Prep", desc: "Client is comfortably positioned and draped." },
      { title: "Oil Massage", desc: "Long, sweeping strokes to relax muscles." },
      { title: "Targeted Relief", desc: "Focusing on the back, neck, and shoulders." }
    ],
    faqs: [
      { q: "What should I wear?", a: "Comfortable, loose clothing is best." }
    ]
  },

  // --- MAKEUP & BRIDAL (MEN) ---
  {
    name: "Groom's Special Makeup",
    category: "Makeup & Bridal",
    gender: "Male",
    duration: 60,
    price: 3500,
    steps: [
      { title: "Skin Prep", desc: "Moisturizing and priming the skin." },
      { title: "Natural Base", desc: "Lightweight coverage to even out skin tone." },
      { title: "Finishing", desc: "Setting the look for a matte, camera-ready finish." }
    ],
    faqs: [
      { q: "Will it look obvious?", a: "No, our technique focuses on a natural, 'no-makeup' look." }
    ]
  },

  // --- PREMIUM PACKAGES (MEN) ---
  {
    name: "The Executive Bundle",
    category: "Premium Packages",
    gender: "Male",
    duration: 120,
    price: 3000,
    steps: [
      { title: "Hair & Beard", desc: "Premium haircut and beard grooming." },
      { title: "Skin Glow", desc: "Insta-glow face cleanup." },
      { title: "Wellness", desc: "20 min relaxing head and shoulder massage." }
    ],
    faqs: [
      { q: "Can I customize the package?", a: "Yes, you can swap similar services within the bundle." }
    ]
  },

  // --- HAIR & STYLING (WOMEN) ---
  {
    name: "Advanced Layer Cut",
    category: "Hair & Styling",
    gender: "Female",
    duration: 75,
    price: 1500,
    steps: [
      { title: "Consultation", desc: "Analysis of hair texture and face shape." },
      { title: "Wash & Treat", desc: "Shampoo and deep conditioning." },
      { title: "The Cut", desc: "Layering technique to add volume and movement." },
      { title: "Blow Dry", desc: "Professional blow-dry finish." }
    ],
    faqs: [
       { q: "Will it make my hair look thinner?", a: "No, layering actually adds volume and bounce." }
    ]
  },

  // --- FACIAL & SKIN CARE (WOMEN) ---
  {
    name: "Korean Glass Skin Facial",
    category: "Facial & Skin Care",
    gender: "Female",
    duration: 90,
    price: 4500,
    steps: [
      { title: "Double Cleanse", desc: "Oil and water-based cleansing for purity." },
      { title: "Gentle Exfoliation", desc: "Polishing skin for a smooth surface." },
      { title: "Deep Hydration", desc: "Multi-layered serum and sheet mask infusion." },
      { title: "Moisturizing", desc: "Sealing with a moisture-lock cream." }
    ],
    faqs: [
      { q: "Is it suitable for all ages?", a: "Yes, it focuses on hydration which benefits all skin types." }
    ]
  },

  // --- WAXING & HAIR REMOVAL (WOMEN) ---
  {
    name: "Full Body Waxing (Rica)",
    category: "Waxing & Hair Removal",
    gender: "Female",
    duration: 120,
    price: 3500,
    steps: [
      { title: "Skin Prep", desc: "Cleansing and powdering the target areas." },
      { title: "Rica Application", desc: "Applying temperature-controlled wax." },
      { title: "Hair Removal", desc: "Swift removal for minimal discomfort." },
      { title: "Post Wax Oil", desc: "Removing wax residue and soothing skin." }
    ],
    faqs: [
      { q: "Is Rica wax better?", a: "Yes, it is less painful and removes even the shortest hair." }
    ]
  },

  // --- THREADING (WOMEN) ---
  {
    name: "Eyebrow & Upper Lip Threading",
    category: "Threading",
    gender: "Female",
    duration: 20,
    price: 150,
    steps: [
      { title: "Shaping", desc: "Marking the desired eyebrow arch." },
      { title: "Threading", desc: "Removing hair from brows and lip with precision." },
      { title: "Soothing", desc: "Aloe vera application to reduce redness." }
    ]
  },

  // --- MANICURE & PEDICURE (WOMEN) ---

  // --- MANICURE & PEDICURE (WOMEN) ---
  {
    name: "Luxury French Manicure",
    category: "Manicure & Pedicure",
    gender: "Female",
    duration: 60,
    price: 1000,
    steps: [
      { title: "Nail Care", desc: "Soaking, trimming, and shaping of nails." },
      { title: "Hand Massage", desc: "Relaxing massage with professional hydrating cream." },
      { title: "French Polish", desc: "Classical white tips with a sheer pink or nude base." }
    ],
    faqs: [
      { q: "How long does French polish last?", a: "Typically 5-7 days with normal activity." }
    ]
  },
  {
    name: "Spa Pedicure (Women)",
    category: "Manicure & Pedicure",
    gender: "Female",
    duration: 75,
    price: 1200,
    steps: [
      { title: "Aroma Soak", desc: "Feet soaked in warm water with essential oils." },
      { title: "Detailed Scrubbing", desc: "Removing dead skin and calluses." },
      { title: "Hydrating Mask", desc: "Foot mask applied for 15 minutes." },
      { title: "Massage & Polish", desc: "Relaxing massage followed by nail color of choice." }
    ]
  },

  // --- THREADING (WOMEN) ---
  {
    name: "Women: Full Face Threading",
    category: "Threading",
    gender: "Female",
    duration: 30,
    price: 350,
    steps: [
      { title: "Consultation", desc: "Discussing sensitive areas." },
      { title: "Threading", desc: "Removing hair from eyebrows, upper lip, chin, and forehead." },
      { title: "Post-care", desc: "Applying a cooling gel to calm the skin." }
    ]
  },

  // --- HAIR COLOURING (WOMEN) ---
  {
    name: "Women: Hair Highlights",
    category: "Hair Colouring",
    gender: "Female",
    duration: 150,
    price: 3000,
    steps: [
      { title: "Strand Selection", desc: "Choosing sections for highlights." },
      { title: "Bleaching/Coloring", desc: "Applying color wrap in foils." },
      { title: "Toning", desc: "Applying toner to achieve the desired shade." },
      { title: "Wash & Style", desc: "Color-protect wash and blow-dry." }
    ]
  },

  // --- HAIR TREATMENTS (WOMEN) ---
  {
    name: "Women: Botox Treatment",
    category: "Hair Treatments",
    gender: "Female",
    duration: 180,
    price: 6000,
    steps: [
      { title: "Prep Wash", desc: "Deep cleansing of hair." },
      { title: "Botox Application", desc: "Infusing hair with smoothing and repairing formula." },
      { title: "Heat Sealing", desc: "Flat ironing to seal the treatment." }
    ],
    faqs: [
      { q: "How is it different from Keratin?", a: "Botox is more about repair and hydration while Keratin focuses on straightening." }
    ]
  },
  {
    name: "Women: Loreal Hair Spa",
    category: "Hair Treatments",
    gender: "Female",
    duration: 60,
    price: 1500,
    steps: [
      { title: "Scalp Massage", desc: "Massaging with Loreal hair spa cream." },
      { title: "Steaming", desc: "Opening cuticles for better absorption." },
      { title: "Rinse & Finish", desc: "Washing and light blow-dry." }
    ]
  },

  // --- MASSAGE & WELLNESS (WOMEN) ---
  {
    name: "Women: Head Massage",
    category: "Massage & Wellness",
    gender: "Female",
    duration: 30,
    price: 500,
    steps: [
      { title: "Oiling", desc: "Application of warm hair oil." },
      { title: "Massage", desc: "Deep tissue scalp and neck massage." },
      { title: "Pressure Points", desc: "Focusing on relief from stress and headaches." }
    ]
  },

  // --- MAKEUP & BRIDAL (WOMEN) ---
  {
    name: "Women: Saree Draping",
    category: "Makeup & Bridal",
    gender: "Female",
    duration: 30,
    price: 800,
    steps: [
      { title: "Choice of Drape", desc: "Discussing style (Nivi, Bengali, etc.)." },
      { title: "Draping", desc: "Professional draping with pins and pleats." },
      { title: "Finishing", desc: "Final adjustments for comfort and look." }
    ]
  },

  // --- ADDITIONAL MEN SERVICES ---
  {
    name: "Head Shave (Smooth Razor)",
    category: "Grooming Essentials",
    gender: "Male",
    duration: 45,
    price: 600,
    steps: [
      { title: "Hot Towel", desc: "Preparing the scalp." },
      { title: "Lathering", desc: "Rich shave cream application." },
      { title: "The Shave", desc: "Precision smooth razor shave." },
      { title: "Hydration", desc: "Moisturizing aftercare." }
    ]
  },
  {
    name: "Anti-Tan Foot Spa",
    category: "Manicure & Pedicure",
    gender: "Male",
    duration: 45,
    price: 700,
    steps: [
      { title: "Soak", desc: "Relaxing foot soak." },
      { title: "Anti-Tan Pack", desc: "Removing sun tan from feet." },
      { title: "Moisturize", desc: "Final hydration." }
    ]
  }
];

module.exports = { SERVICES };
