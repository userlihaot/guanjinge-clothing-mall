/**
 * 管理员权限中间件 - 必须在auth中间件之后使用
 * 验证当前用户角色是否为管理员
 */
module.exports = function (req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ code: 403, message: '权限不足，需要管理员账号', data: null });
    }
    next();
};
