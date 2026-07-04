/**
 * JWT工具 - Token生成与验证
 */
const jwt = require('jsonwebtoken');

const SECRET = 'guanjinge-secret-key-2025';  // JWT签名密钥
const EXPIRATION = '7d';                      // Token有效期7天

/**
 * 生成JWT Token
 * @param {number} userId - 用户ID
 * @param {string} role - 角色 'user' 或 'admin'
 */
function generateToken(userId, role) {
    return jwt.sign({ userId, role }, SECRET, { expiresIn: EXPIRATION });
}

/**
 * 验证JWT Token
 * @param {string} token
 * @returns {object} { userId, role }
 */
function verifyToken(token) {
    return jwt.verify(token, SECRET);
}

module.exports = { generateToken, verifyToken };
