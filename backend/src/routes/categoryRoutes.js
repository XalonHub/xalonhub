const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');

// Note: Ensure admin authorization is applied appropriately depending on your app's security model.
// For now we protect POST, PUT, DELETE with `auth` and expect `req.user.role === 'Admin'` if necessary.

// Public read access for customers
router.get('/', categoryController.getCategories);

// Admin-only write access
const adminAuth = (req, res, next) => {
    // Basic wrapper to ensure req.user exists and has Admin role
    auth(req, res, () => {
        if (req.user && req.user.role === 'Admin') {
            next();
        } else {
            res.status(403).json({ error: 'Admin access required to modify categories.' });
        }
    });
};

router.post('/', adminAuth, categoryController.createCategory);
router.put('/:id', adminAuth, categoryController.updateCategory);
router.delete('/:id', adminAuth, categoryController.deleteCategory);

module.exports = router;
