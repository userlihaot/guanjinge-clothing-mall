/**
 * JWT认证中间件 - 验证用户身份
 * 从Authorization头中提取Bearer Token并验证
 */
const jwtUtil = require('../utils/jwt');

module.exports = function (req, res, next) {
    // 获取Authorization头
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ code: 401, message: '未登录，请先登录', data: null });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwtUtil.verifyToken(token);
        req.user = decoded;  // { userId, role } 存入请求对象
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: null });
        }
        return res.status(401).json({ code: 401, message: '无效的Token', data: null });
    }
};
