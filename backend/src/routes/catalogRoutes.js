const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const catalogController = require('../controllers/catalogController');

// GET /api/catalog/categories – fetch all distinct categories
router.get('/categories', catalogController.getCategories);

// GET /api/catalog – filtered service catalog
// ?category=Hair&gender=Male&partnerType=Freelancer
router.get('/', catalogController.getCatalog);

module.exports = router;
