const express = require('express');
const router = express.Router();

/**
 * GET /api/branding
 * Returns the global branding configuration for the XalonHub platform.
 */
router.get('/', (req, res) => {
    // In a real-world scenario, this might be fetched from GlobalSettings in Prisma.
    // For now, we return the primary Cloudinary URL provided by the user/platform.
    res.json({
        logoUrl: "https://res.cloudinary.com/divyyczmu/image/upload/v1745255400/xalonhub/brand_logo.png",
        branding: {
            primaryColor: "#E11D48",
            secondaryColor: "#4C1D95",
            companyName: "XalonHub"
        }
    });
});

module.exports = router;
