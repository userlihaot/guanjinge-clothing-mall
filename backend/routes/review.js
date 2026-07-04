/**
 * 评价模块路由 - 发表评价/追评/查看评价
 */
const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// POST /api/review/create - 发表评价（需登录，仅已收货订单可评价）
router.post('/create', auth, async (req, res) => {
    try {
        const { orderId, productId, skuName, star, content, images, isAnonymous } = req.body;
        if (!orderId || !productId || !star) {
            return res.json({ code: 400, message: '参数不完整', data: null });
        }
        // 校验订单是否已完成/待评价且属于当前用户
        const [orders] = await pool.query(
            'SELECT * FROM order_master WHERE id = ? AND user_id = ? AND status IN (3, 7) AND deleted = 0',
            [orderId, req.user.userId]
        );
        if (orders.length === 0) {
            return res.json({ code: 400, message: '订单未完成，暂不能评价', data: null });
        }
        // 检查是否已评价过
        const [exist] = await pool.query(
            'SELECT id FROM review WHERE order_id = ? AND product_id = ? AND user_id = ? AND deleted = 0',
            [orderId, productId, req.user.userId]
        );
        if (exist.length > 0) {
            return res.json({ code: 400, message: '您已评价过该商品', data: null });
        }
        const [result] = await pool.query(
            'INSERT INTO review (user_id, order_id, product_id, sku_name, star, content, images, is_anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.userId, orderId, productId, skuName, star, content, images ? images.join(',') : null, isAnonymous ? 1 : 0]
        );
        // 若订单状态为待评价(7)，评价后自动变为已完成(3)
        if (orders[0].status === 7) {
            await pool.query('UPDATE order_master SET status = 3 WHERE id = ?', [orderId]);
        }
        res.json({ code: 200, message: '评价发表成功', data: { id: result.insertId } });
    } catch (err) {
        console.error('发表评价失败:', err);
        res.json({ code: 500, message: '评价失败', data: null });
    }
});

// GET /api/review/product/:productId - 获取商品评价（公开）
router.get('/product/:productId', async (req, res) => {
    try {
        const { page = 1, size = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(size);
        const [rows] = await pool.query(
            `SELECT r.*, u.nickname, u.avatar
             FROM review r LEFT JOIN user u ON r.user_id = u.id
             WHERE r.product_id = ? AND r.deleted = 0 AND r.is_audited = 1
             ORDER BY r.create_time DESC LIMIT ? OFFSET ?`,
            [req.params.productId, parseInt(size), offset]
        );
        // 获取每个评价的追评
        for (const review of rows) {
            const [appends] = await pool.query(
                'SELECT * FROM review_append WHERE review_id = ? AND deleted = 0 ORDER BY create_time DESC',
                [review.id]
            );
            review.appends = appends;
            if (review.is_anonymous) {
                review.nickname = '匿名用户';
                review.avatar = null;
            }
        }
        const [countResult] = await pool.query(
            'SELECT COUNT(*) AS total FROM review WHERE product_id = ? AND deleted = 0 AND is_audited = 1',
            [req.params.productId]
        );
        res.json({
            code: 200, message: 'success',
            data: { total: countResult[0].total, page: parseInt(page), size: parseInt(size), records: rows }
        });
    } catch (err) {
        console.error('获取评价失败:', err);
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// POST /api/review/append/:reviewId - 追评（需登录）
router.post('/append/:reviewId', auth, async (req, res) => {
    try {
        const { content, images } = req.body;
        // 验证评价属于当前用户
        const [reviews] = await pool.query('SELECT * FROM review WHERE id = ? AND user_id = ? AND deleted = 0', [req.params.reviewId, req.user.userId]);
        if (reviews.length === 0) {
            return res.json({ code: 400, message: '评价不存在', data: null });
        }
        await pool.query(
            'INSERT INTO review_append (review_id, content, images) VALUES (?, ?, ?)',
            [req.params.reviewId, content, images ? images.join(',') : null]
        );
        res.json({ code: 200, message: '追评成功', data: null });
    } catch (err) {
        console.error('追评失败:', err);
        res.json({ code: 500, message: '追评失败', data: null });
    }
});

module.exports = router;
