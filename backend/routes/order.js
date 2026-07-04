/**
 * 订单模块路由 - 创建订单/订单列表/订单详情/取消/确认收货
 * 核心业务：库存扣减、优惠券使用、运费计算、支付超时
 */
const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);

// 生成订单编号（时间戳+随机数）
function generateOrderNo() {
    const now = new Date();
    const ts = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return ts + rand;
}

// POST /api/order/create - 创建订单
router.post('/create', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { addressId, cartItemIds, couponId, buyerMessage, invoiceType, invoiceTitle, invoiceTaxNo } = req.body;
        const userId = req.user.userId;

        // 1. 获取收货地址
        const [addresses] = await conn.query('SELECT * FROM address WHERE id = ? AND user_id = ? AND deleted = 0', [addressId, userId]);
        if (addresses.length === 0) throw new Error('收货地址不存在');
        const addr = addresses[0];

        // 2. 获取选中的购物车商品
        let cartQuery = 'SELECT c.*, p.name, p.cover_image, p.stock AS product_stock, COALESCE(s.price, p.promotion_price, p.price) AS unit_price, s.stock AS sku_stock, s.sku_name FROM cart c JOIN product p ON c.product_id = p.id LEFT JOIN product_sku s ON c.sku_id = s.id WHERE c.user_id = ?';
        if (cartItemIds && cartItemIds.length > 0) {
            cartQuery += ' AND c.id IN (' + cartItemIds.join(',') + ')';
        } else {
            cartQuery += ' AND c.selected = 1';
        }
        const [cartItems] = await conn.query(cartQuery, [userId]);
        if (cartItems.length === 0) throw new Error('请选择要购买的商品');

        // 3. 计算金额 + 校验库存
        let totalAmount = 0;
        const orderItems = [];
        for (const item of cartItems) {
            const availableStock = item.sku_id ? item.sku_stock : item.product_stock;
            if (availableStock < item.quantity) throw new Error(`商品"${item.name}"库存不足`);
            const itemTotal = parseFloat(item.unit_price) * item.quantity;
            totalAmount += itemTotal;
            orderItems.push({
                product_id: item.product_id,
                sku_id: item.sku_id,
                product_name: item.name,
                product_image: item.cover_image,
                sku_name: item.sku_name,
                price: parseFloat(item.unit_price),
                quantity: item.quantity,
                total_price: itemTotal
            });
            // 扣减库存
            if (item.sku_id) {
                await conn.query('UPDATE product_sku SET stock = stock - ? WHERE id = ? AND stock >= ?', [item.quantity, item.sku_id, item.quantity]);
            } else {
                await conn.query('UPDATE product SET stock = stock - ? WHERE id = ? AND stock >= ?', [item.quantity, item.product_id, item.quantity]);
            }
            // 增加销量
            await conn.query('UPDATE product SET sales_count = sales_count + ? WHERE id = ?', [item.quantity, item.product_id]);
        }

        // 4. 优惠券抵扣
        let couponDiscount = 0;
        if (couponId) {
            const [coupons] = await conn.query('SELECT uc.*, c.type, c.full_amount, c.reduce_amount FROM user_coupon uc JOIN coupon c ON uc.coupon_id = c.id WHERE uc.id = ? AND uc.user_id = ? AND uc.status = 1 AND c.start_time <= NOW() AND c.end_time >= NOW()', [couponId, userId]);
            if (coupons.length > 0) {
                const c = coupons[0];
                if (totalAmount >= parseFloat(c.full_amount)) {
                    if (c.type === 2) { // 折扣券
                        couponDiscount = totalAmount * (1 - parseFloat(c.reduce_amount) / 100);
                    } else { // 满减券/无门槛券
                        couponDiscount = parseFloat(c.reduce_amount);
                    }
                    couponDiscount = Math.min(couponDiscount, totalAmount); // 不超过总金额
                }
            }
        }

        // 5. 运费计算（满299免运费）
        const [configs] = await conn.query("SELECT config_value FROM sys_config WHERE config_key = 'freight_free_threshold'");
        const freeThreshold = configs.length > 0 ? parseFloat(configs[0].config_value) : 299;
        const [freightConfig] = await conn.query("SELECT config_value FROM sys_config WHERE config_key = 'freight_fee'");
        const freightFee = freightConfig.length > 0 ? parseFloat(freightConfig[0].config_value) : 15;
        const freight = totalAmount >= freeThreshold ? 0 : freightFee;

        // 6. 实付金额
        const realAmount = totalAmount - couponDiscount + freight;
        const orderNo = generateOrderNo();

        // 7. 创建订单主表
        const payDeadline = new Date(Date.now() + 30 * 60 * 1000); // 30分钟支付超时
        await conn.query(
            `INSERT INTO order_master (order_no, user_id, total_amount, freight, coupon_discount, real_amount, status,
             receiver_name, receiver_phone, receiver_address, invoice_type, invoice_title, invoice_tax_no,
             buyer_message, pay_deadline)
             VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderNo, userId, totalAmount, freight, couponDiscount, realAmount,
             addr.receiver_name, addr.receiver_phone, `${addr.province}${addr.city}${addr.district}${addr.detail}`,
             invoiceType || 0, invoiceTitle, invoiceTaxNo, buyerMessage, payDeadline]
        );
        const [orderResult] = await conn.query('SELECT id FROM order_master WHERE order_no = ?', [orderNo]);
        const orderId = orderResult[0].id;

        // 8. 创建订单明细
        for (const item of orderItems) {
            await conn.query(
                'INSERT INTO order_item (order_id, order_no, product_id, sku_id, product_name, product_image, sku_name, price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [orderId, orderNo, item.product_id, item.sku_id, item.product_name, item.product_image, item.sku_name, item.price, item.quantity, item.total_price]
            );
        }

        // 9. 标记优惠券已使用
        if (couponId && couponDiscount > 0) {
            await conn.query('UPDATE user_coupon SET status = 2, use_time = NOW(), order_no = ? WHERE id = ?', [orderNo, couponId]);
        }

        // 10. 清除已下单的购物车商品
        const cartIdsToRemove = cartItems.map(i => i.id);
        await conn.query('DELETE FROM cart WHERE id IN (?)', [cartIdsToRemove]);

        await conn.commit();
        res.json({
            code: 200, message: '下单成功',
            data: { orderNo, orderId, realAmount, payDeadline }
        });
    } catch (err) {
        await conn.rollback();
        console.error('创建订单失败:', err);
        res.json({ code: 400, message: err.message || '下单失败', data: null });
    } finally {
        conn.release();
    }
});

// GET /api/order/list - 订单列表（支持状态筛选）
router.get('/list', async (req, res) => {
    try {
        const { status, page = 1, size = 10 } = req.query;
        let sql = 'SELECT * FROM order_master WHERE user_id = ? AND deleted = 0';
        const params = [req.user.userId];
        if (status !== undefined && status !== '') {
            sql += ' AND status = ?';
            params.push(parseInt(status));
        }
        sql += ' ORDER BY create_time DESC';
        const offset = (parseInt(page) - 1) * parseInt(size);
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(size), offset);

        const [rows] = await pool.query(sql, params);
        // 获取每个订单的商品明细
        for (const order of rows) {
            const [items] = await pool.query('SELECT * FROM order_item WHERE order_no = ?', [order.order_no]);
            order.itemList = items;
        }

        let countSql = 'SELECT COUNT(*) AS total FROM order_master WHERE user_id = ? AND deleted = 0';
        const countParams = [req.user.userId];
        if (status !== undefined && status !== '') {
            countSql += ' AND status = ?';
            countParams.push(parseInt(status));
        }
        const [countResult] = await pool.query(countSql, countParams);

        res.json({
            code: 200, message: 'success',
            data: { total: countResult[0].total, page: parseInt(page), size: parseInt(size), records: rows }
        });
    } catch (err) {
        console.error('获取订单列表失败:', err);
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// GET /api/order/detail/:orderNo - 订单详情
router.get('/detail/:orderNo', async (req, res) => {
    try {
        const [orders] = await pool.query(
            'SELECT * FROM order_master WHERE order_no = ? AND user_id = ? AND deleted = 0',
            [req.params.orderNo, req.user.userId]
        );
        if (orders.length === 0) {
            return res.json({ code: 400, message: '订单不存在', data: null });
        }
        const order = orders[0];
        const [items] = await pool.query('SELECT * FROM order_item WHERE order_no = ?', [order.order_no]);
        order.itemList = items;
        res.json({ code: 200, message: 'success', data: order });
    } catch (err) {
        console.error('获取订单详情失败:', err);
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// PUT /api/order/cancel/:orderNo - 取消订单（仅待付款状态）
router.put('/cancel/:orderNo', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [orders] = await conn.query(
            'SELECT * FROM order_master WHERE order_no = ? AND user_id = ? AND status = 0 AND deleted = 0',
            [req.params.orderNo, req.user.userId]
        );
        if (orders.length === 0) throw new Error('订单不存在或无法取消');
        const order = orders[0];

        // 恢复库存
        const [items] = await conn.query('SELECT * FROM order_item WHERE order_no = ?', [order.order_no]);
        for (const item of items) {
            if (item.sku_id) {
                await conn.query('UPDATE product_sku SET stock = stock + ? WHERE id = ?', [item.quantity, item.sku_id]);
            } else {
                await conn.query('UPDATE product SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
            }
            await conn.query('UPDATE product SET sales_count = GREATEST(sales_count - ?, 0) WHERE id = ?', [item.quantity, item.product_id]);
        }
        await conn.query('UPDATE order_master SET status = 4, cancel_time = NOW(), cancel_reason = ? WHERE order_no = ?', ['用户取消', order.order_no]);
        await conn.commit();
        res.json({ code: 200, message: '订单已取消', data: null });
    } catch (err) {
        await conn.rollback();
        res.json({ code: 400, message: err.message, data: null });
    } finally {
        conn.release();
    }
});

// PUT /api/order/confirm/:orderNo - 确认收货（待收货→待评价）
router.put('/confirm/:orderNo', async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE order_master SET status = 7, finish_time = NOW() WHERE order_no = ? AND user_id = ? AND status = 2',
            [req.params.orderNo, req.user.userId]
        );
        if (result.affectedRows === 0) {
            return res.json({ code: 400, message: '订单状态不正确，无法确认收货', data: null });
        }
        res.json({ code: 200, message: '已确认收货，请评价', data: null });
    } catch (err) {
        res.json({ code: 500, message: '操作失败', data: null });
    }
});

module.exports = router;
