/**
 * Generate a unique room code in format: ABC-DEF-1234
 * Total: 12 characters (3-3-4)
 */
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [3, 3, 4];
    return segments
        .map(length => {
        let segment = '';
        for (let i = 0; i < length; i++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return segment;
    })
        .join('-');
}
/**
 * Calculate room expiration time
 * @param inactivityMinutes Minutes of inactivity before expiration
 */
function calculateExpirationTime(timeoutMinutes = 30) {
    return new Date(Date.now() + timeoutMinutes * 60 * 1000);
}
/**
 * Check if a room has expired
 */
function isRoomExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
}
function isRoomActive(lastActive, timeoutMinutes = 30) {
    const expirationTime = new Date(lastActive.getTime() + timeoutMinutes * 60 * 1000);
    return new Date() < expirationTime;
}
module.exports = {
    generateRoomCode,
    calculateExpirationTime,
    isRoomExpired,
    isRoomActive
};
//# sourceMappingURL=room.js.map