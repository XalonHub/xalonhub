const jwt = require('jsonwebtoken');

/**
 * adminAuth middleware
 * Validates Authorization: Bearer <token> header.
 * Structured for future migration to cookie-based sessions:
 *   - Change `req.headers.authorization` to `req.cookies.admin_token` — zero UI changes needed.
 */
function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
        }

        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
    }
}

module.exports = adminAuth;
