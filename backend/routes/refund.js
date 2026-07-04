/**
 * 退款模块路由 - 申请退款/退款列表/提交退货物流
 */
const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);

// 生成退款编号
function generateRefundNo() {
    return 'RF' + Date.now() + Math.floor(1000 + Math.random() * 9000);
}

// POST /api/refund/apply - 申请退款
router.post('/apply', async (req, res) => {
    try {
        const { orderNo, reason, type, refundAmount, images } = req.body;
        // 验证订单
        const [orders] = await pool.query(
            'SELECT * FROM order_master WHERE order_no = ? AND user_id = ? AND status IN (1,2,3) AND deleted = 0',
            [orderNo, req.user.userId]
        );
        if (orders.length === 0) {
            return res.json({ code: 400, message: '订单不存在或无法申请退款', data: null });
        }
        const order = orders[0];
        const refundNo = generateRefundNo();
        await pool.query(
            'INSERT INTO refund (order_no, order_id, user_id, refund_no, refund_amount, reason, type, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [orderNo, order.id, req.user.userId, refundNo, refundAmount || order.real_amount, reason, type || 1, images ? images.join(',') : null]
        );
        // 更新订单状态为退款中
        await pool.query('UPDATE order_master SET status = 5 WHERE order_no = ?', [orderNo]);
        res.json({ code: 200, message: '退款申请已提交', data: { refundNo } });
    } catch (err) {
        console.error('申请退款失败:', err);
        res.json({ code: 500, message: '申请失败', data: null });
    }
});

// GET /api/refund/list - 退款列表
router.get('/list', async (req, res) => {
    try {
        const { page = 1, size = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(size);
        const [rows] = await pool.query(
            'SELECT * FROM refund WHERE user_id = ? AND deleted = 0 ORDER BY create_time DESC LIMIT ? OFFSET ?',
            [req.user.userId, parseInt(size), offset]
        );
        const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM refund WHERE user_id = ? AND deleted = 0', [req.user.userId]);
        res.json({
            code: 200, message: 'success',
            data: { total: countResult[0].total, page: parseInt(page), size: parseInt(size), records: rows }
        });
    } catch (err) {
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// PUT /api/refund/cancel/:id - 取消退款申请（仅待审核状态）
router.put('/cancel/:id', async (req, res) => {
    try {
        const [refunds] = await pool.query(
            'SELECT * FROM refund WHERE id = ? AND user_id = ? AND status = 0 AND deleted = 0',
            [req.params.id, req.user.userId]
        );
        if (refunds.length === 0) {
            return res.json({ code: 400, message: '退款申请不存在或无法取消', data: null });
        }
        const refund = refunds[0];
        // 恢复订单状态为退款前的状态（从已完成/待收货恢复）
        const [orders] = await pool.query('SELECT * FROM order_master WHERE order_no = ?', [refund.order_no]);
        if (orders.length > 0) {
            // 恢复到已完成状态（因为退款只能从 status 1/2/3 发起）
            await pool.query('UPDATE order_master SET status = 3 WHERE order_no = ?', [refund.order_no]);
        }
        // 标记退款申请为已删除
        await pool.query('UPDATE refund SET deleted = 1 WHERE id = ?', [req.params.id]);
        res.json({ code: 200, message: '退款申请已取消', data: null });
    } catch (err) {
        console.error('取消退款失败:', err);
        res.json({ code: 500, message: '取消失败', data: null });
    }
});

// PUT /api/refund/return-logistics - 提交退货物流（退货退款类型）
router.put('/return-logistics', async (req, res) => {
    try {
        const { refundId, company, logisticsNo } = req.body;
        await pool.query(
            'UPDATE refund SET return_logistics_company = ?, return_logistics_no = ? WHERE id = ? AND user_id = ?',
            [company, logisticsNo, refundId, req.user.userId]
        );
        res.json({ code: 200, message: '提交成功', data: null });
    } catch (err) {
        res.json({ code: 500, message: '提交失败', data: null });
    }
});

module.exports = router;
