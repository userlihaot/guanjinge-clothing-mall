/**
 * 支付模块路由 - 模拟支付宝/微信支付
 */
const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// POST /api/pay/do-pay - 发起支付（需登录）
router.post('/do-pay', auth, async (req, res) => {
    try {
        const { orderNo, payMethod } = req.body; // payMethod: 'alipay' | 'wechat'
        if (!orderNo || !payMethod) {
            return res.json({ code: 400, message: '参数不完整', data: null });
        }
        // 验证订单
        const [orders] = await pool.query(
            'SELECT * FROM order_master WHERE order_no = ? AND user_id = ? AND status = 0 AND deleted = 0',
            [orderNo, req.user.userId]
        );
        if (orders.length === 0) {
            return res.json({ code: 400, message: '订单不存在或已支付', data: null });
        }
        const order = orders[0];
        // 检查是否超时
        if (new Date() > new Date(order.pay_deadline)) {
            // 自动取消
            await pool.query('UPDATE order_master SET status = 4, cancel_time = NOW(), cancel_reason = ? WHERE order_no = ?', ['支付超时自动取消', orderNo]);
            return res.json({ code: 400, message: '订单已超时取消', data: null });
        }
        // 模拟支付：生成支付链接
        const payNo = 'PAY' + Date.now() + Math.floor(Math.random() * 10000);
        const payUrl = payMethod === 'alipay'
            ? `/pay-page.html?orderNo=${orderNo}&amount=${order.real_amount}&method=alipay`
            : `/pay-page.html?orderNo=${orderNo}&amount=${order.real_amount}&method=wechat`;

        // 模拟支付成功（生产环境应为异步回调）
        // 这里直接标记支付成功
        await pool.query(
            'UPDATE order_master SET status = 1, pay_method = ?, pay_no = ?, pay_time = NOW() WHERE order_no = ?',
            [payMethod, payNo, orderNo]
        );

        res.json({
            code: 200, message: '支付成功',
            data: { orderNo, payNo, payMethod, amount: order.real_amount, payUrl }
        });
    } catch (err) {
        console.error('支付失败:', err);
        res.json({ code: 500, message: '支付失败', data: null });
    }
});

// GET /api/pay/result/:orderNo - 查询支付结果（需登录）
router.get('/result/:orderNo', auth, async (req, res) => {
    try {
        const [[order]] = await pool.query(
            'SELECT order_no, status, pay_method, pay_time, real_amount FROM order_master WHERE order_no = ? AND user_id = ?',
            [req.params.orderNo, req.user.userId]
        );
        if (!order) return res.json({ code: 400, message: '订单不存在', data: null });
        res.json({ code: 200, message: 'success', data: { paid: order.status !== 0, ...order } });
    } catch (err) {
        res.json({ code: 500, message: '查询失败', data: null });
    }
});

// POST /api/pay/callback - 支付回调（公开接口）
router.post('/callback', async (req, res) => {
    try {
        const { orderNo, payNo, status } = req.body;
        if (status === 'success') {
            await pool.query(
                'UPDATE order_master SET status = 1, pay_no = ?, pay_time = NOW() WHERE order_no = ? AND status = 0',
                [payNo, orderNo]
            );
        }
        res.json({ code: 200, message: 'success' });
    } catch (err) {
        res.json({ code: 500, message: 'fail' });
    }
});

module.exports = router;
