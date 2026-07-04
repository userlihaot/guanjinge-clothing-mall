/**
 * 优惠券模块路由
 */
const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/coupon/available - 可领取的优惠券（公开）
router.get('/available', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM coupon WHERE status = 1 AND deleted = 0 AND start_time <= NOW() AND end_time >= NOW() AND received_count < total_count ORDER BY create_time DESC'
        );
        res.json({ code: 200, message: 'success', data: rows });
    } catch (err) {
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// GET /api/coupon/my - 我的优惠券（需登录）
router.get('/my', auth, async (req, res) => {
    try {
        const { status } = req.query; // 1-未使用 2-已使用 3-已过期
        let sql = `SELECT uc.*, c.name, c.type, c.full_amount, c.reduce_amount, c.start_time, c.end_time, c.description
                   FROM user_coupon uc JOIN coupon c ON uc.coupon_id = c.id
                   WHERE uc.user_id = ?`;
        const params = [req.user.userId];
        if (status) {
            sql += ' AND uc.status = ?';
            params.push(parseInt(status));
        }
        // 自动更新已过期的优惠券
        await pool.query(
            "UPDATE user_coupon SET status = 3 WHERE user_id = ? AND status = 1 AND coupon_id IN (SELECT id FROM coupon WHERE end_time < NOW())",
            [req.user.userId]
        );
        sql += ' ORDER BY uc.create_time DESC';
        const [rows] = await pool.query(sql, params);
        res.json({ code: 200, message: 'success', data: rows });
    } catch (err) {
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// POST /api/coupon/receive/:couponId - 领取优惠券（需登录）
router.post('/receive/:couponId', auth, async (req, res) => {
    try {
        const couponId = req.params.couponId;
        // 检查优惠券是否存在且有效
        const [coupons] = await pool.query(
            'SELECT * FROM coupon WHERE id = ? AND status = 1 AND deleted = 0 AND start_time <= NOW() AND end_time >= NOW()',
            [couponId]
        );
        if (coupons.length === 0) return res.json({ code: 400, message: '优惠券不存在或已过期', data: null });
        const coupon = coupons[0];
        if (coupon.received_count >= coupon.total_count) {
            return res.json({ code: 400, message: '优惠券已被领完', data: null });
        }
        // 检查是否已领取
        const [received] = await pool.query(
            'SELECT COUNT(*) AS cnt FROM user_coupon WHERE user_id = ? AND coupon_id = ?',
            [req.user.userId, couponId]
        );
        if (received[0].cnt >= coupon.per_limit) {
            return res.json({ code: 400, message: '您已领取过该优惠券', data: null });
        }
        // 领取
        await pool.query('INSERT INTO user_coupon (user_id, coupon_id) VALUES (?, ?)', [req.user.userId, couponId]);
        await pool.query('UPDATE coupon SET received_count = received_count + 1 WHERE id = ?', [couponId]);
        res.json({ code: 200, message: '领取成功', data: null });
    } catch (err) {
        res.json({ code: 500, message: '领取失败', data: null });
    }
});

// GET /api/coupon/order-available - 订单可用的优惠券（需登录）
router.get('/order-available', auth, async (req, res) => {
    try {
        const { amount } = req.query;
        // 未使用且未过期的优惠券 + 满足满减条件
        await pool.query(
            "UPDATE user_coupon SET status = 3 WHERE user_id = ? AND status = 1 AND coupon_id IN (SELECT id FROM coupon WHERE end_time < NOW())",
            [req.user.userId]
        );
        const [rows] = await pool.query(
            `SELECT uc.*, c.name, c.type, c.full_amount, c.reduce_amount, c.end_time, c.description
             FROM user_coupon uc JOIN coupon c ON uc.coupon_id = c.id
             WHERE uc.user_id = ? AND uc.status = 1 AND c.end_time >= NOW() AND (c.full_amount <= ? OR c.full_amount = 0)
             ORDER BY c.reduce_amount DESC`,
            [req.user.userId, amount || 0]
        );
        res.json({ code: 200, message: 'success', data: rows });
    } catch (err) {
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

module.exports = router;
