const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-DO-NOT-USE-IN-PROD';
// JWTPayload interface removed for CommonJS
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
}
async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '7d',
    });
}
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken
};
//# sourceMappingURL=auth.js.map