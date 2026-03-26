const jwt = require('jsonwebtoken');

/**
 * Generic JWT auth middleware for user-facing routes.
 * Populates req.user with the decoded token payload: { id, phone, role }
 */
function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, phone, role }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
    }
}

module.exports = auth;
