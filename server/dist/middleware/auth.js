const { verifyToken } = require('../utils/auth');
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}
module.exports = { authenticateToken };
//# sourceMappingURL=auth.js.map