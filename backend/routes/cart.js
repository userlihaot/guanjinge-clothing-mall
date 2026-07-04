/**
 * 购物车模块路由 - 加购/修改数量/选中/删除
 */
const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// 所有购物车接口都需要登录
router.use(auth);

// GET /api/cart/list - 获取购物车列表
router.get('/list', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT c.id AS cartId, c.product_id, c.sku_id, c.quantity, c.selected,
                    p.name AS product_name, p.cover_image AS product_image,
                    s.sku_name, COALESCE(s.price, p.promotion_price, p.price) AS price,
                    COALESCE(s.stock, p.stock) AS stock
             FROM cart c
             JOIN product p ON c.product_id = p.id
             LEFT JOIN product_sku s ON c.sku_id = s.id
             WHERE c.user_id = ?
             ORDER BY c.create_time DESC`,
            [req.user.userId]
        );
        res.json({ code: 200, message: 'success', data: rows });
    } catch (err) {
        console.error('获取购物车失败:', err);
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// POST /api/cart/add - 加入购物车
router.post('/add', async (req, res) => {
    try {
        const { productId, skuId, quantity = 1 } = req.body;
        if (!productId) {
            return res.json({ code: 400, message: '商品ID不能为空', data: null });
        }
        // 检查库存
        if (skuId) {
            const [skus] = await pool.query('SELECT stock FROM product_sku WHERE id = ? AND deleted = 0', [skuId]);
            if (skus.length === 0 || skus[0].stock < quantity) {
                return res.json({ code: 400, message: '库存不足', data: null });
            }
        } else {
            const [products] = await pool.query('SELECT stock FROM product WHERE id = ?', [productId]);
            if (products.length === 0 || products[0].stock < quantity) {
                return res.json({ code: 400, message: '库存不足', data: null });
            }
        }
        // 检查购物车是否已有相同商品+规格
        const [exist] = await pool.query(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND (sku_id = ? OR (sku_id IS NULL AND ? IS NULL))',
            [req.user.userId, productId, skuId, skuId]
        );
        if (exist.length > 0) {
            // 已有则增加数量
            await pool.query('UPDATE cart SET quantity = quantity + ?, update_time = NOW() WHERE id = ?',
                [quantity, exist[0].id]);
        } else {
            await pool.query(
                'INSERT INTO cart (user_id, product_id, sku_id, quantity) VALUES (?, ?, ?, ?)',
                [req.user.userId, productId, skuId || null, quantity]
            );
        }
        res.json({ code: 200, message: '已加入购物车', data: null });
    } catch (err) {
        console.error('加入购物车失败:', err);
        res.json({ code: 500, message: '操作失败', data: null });
    }
});

// PUT /api/cart/quantity - 修改数量
router.put('/quantity', async (req, res) => {
    try {
        const { cartId, quantity } = req.body;
        if (quantity < 1) {
            return res.json({ code: 400, message: '数量不能小于1', data: null });
        }
        await pool.query('UPDATE cart SET quantity = ?, update_time = NOW() WHERE id = ? AND user_id = ?',
            [quantity, cartId, req.user.userId]);
        res.json({ code: 200, message: '修改成功', data: null });
    } catch (err) {
        console.error('修改数量失败:', err);
        res.json({ code: 500, message: '操作失败', data: null });
    }
});

// PUT /api/cart/update - 修改数量（前端调用此路径）
router.put('/update', async (req, res) => {
    try {
        const { id: cartId, quantity } = req.body;
        if (!cartId || quantity < 1) {
            return res.json({ code: 400, message: '参数错误', data: null });
        }
        await pool.query('UPDATE cart SET quantity = ?, update_time = NOW() WHERE id = ? AND user_id = ?',
            [quantity, cartId, req.user.userId]);
        res.json({ code: 200, message: '修改成功', data: null });
    } catch (err) {
        console.error('修改数量失败:', err);
        res.json({ code: 500, message: '操作失败', data: null });
    }
});

// PUT /api/cart/selected - 切换选中状态
router.put('/selected', async (req, res) => {
    try {
        const { cartId, selected } = req.body;
        await pool.query('UPDATE cart SET selected = ?, update_time = NOW() WHERE id = ? AND user_id = ?',
            [selected ? 1 : 0, cartId, req.user.userId]);
        res.json({ code: 200, message: '操作成功', data: null });
    } catch (err) {
        console.error('切换选中失败:', err);
        res.json({ code: 500, message: '操作失败', data: null });
    }
});

// DELETE /api/cart/batch - 批量删除（必须放在 /:ids 之前，否则 Express 会把 "batch" 匹配成 :ids）
router.delete('/batch', async (req, res) => {
    try {
        const ids = req.body;  // axios delete { data: ids } → req.body = ids数组
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.json({ code: 400, message: '参数错误', data: null });
        }
        await pool.query('DELETE FROM cart WHERE id IN (?) AND user_id = ?', [ids, req.user.userId]);
        res.json({ code: 200, message: '删除成功', data: null });
    } catch (err) {
        console.error('批量删除购物车失败:', err);
        res.json({ code: 500, message: '操作失败', data: null });
    }
});

// DELETE /api/cart/:ids - 删除购物车商品 (ids: 1,2,3)
router.delete('/:ids', async (req, res) => {
    try {
        const ids = req.params.ids.split(',').map(Number).filter(n => n > 0);
        if (ids.length === 0) return res.json({ code: 400, message: '参数错误', data: null });
        await pool.query('DELETE FROM cart WHERE id IN (?) AND user_id = ?', [ids, req.user.userId]);
        res.json({ code: 200, message: '删除成功', data: null });
    } catch (err) {
        console.error('删除购物车失败:', err);
        res.json({ code: 500, message: '操作失败', data: null });
    }
});

module.exports = router;
