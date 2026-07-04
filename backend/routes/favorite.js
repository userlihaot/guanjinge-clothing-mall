/**
 * 收藏模块路由
 */
const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);

// POST /api/favorite/toggle - 切换收藏状态
router.post('/toggle', async (req, res) => {
    try {
        const { productId } = req.body;
        const [exist] = await pool.query('SELECT id FROM favorite WHERE user_id = ? AND product_id = ?', [req.user.userId, productId]);
        if (exist.length > 0) {
            await pool.query('DELETE FROM favorite WHERE id = ?', [exist[0].id]);
            return res.json({ code: 200, message: '已取消收藏', data: { favorited: false } });
        }
        await pool.query('INSERT INTO favorite (user_id, product_id) VALUES (?, ?)', [req.user.userId, productId]);
        res.json({ code: 200, message: '收藏成功', data: { favorited: true } });
    } catch (err) {
        res.json({ code: 500, message: '操作失败', data: null });
    }
});

// GET /api/favorite/check/:productId - 检查是否已收藏
router.get('/check/:productId', async (req, res) => {
    try {
        const [exist] = await pool.query('SELECT id FROM favorite WHERE user_id = ? AND product_id = ?', [req.user.userId, req.params.productId]);
        res.json({ code: 200, message: 'success', data: { favorited: exist.length > 0 } });
    } catch (err) {
        res.json({ code: 500, message: '查询失败', data: null });
    }
});

// GET /api/favorite/list - 收藏列表
router.get('/list', async (req, res) => {
    try {
        const { page = 1, size = 12 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(size);
        const [rows] = await pool.query(
            'SELECT p.*, f.create_time AS favorite_time FROM favorite f JOIN product p ON f.product_id = p.id WHERE f.user_id = ? ORDER BY f.create_time DESC LIMIT ? OFFSET ?',
            [req.user.userId, parseInt(size), offset]
        );
        const [countResult] = await pool.query('SELECT COUNT(*) AS total FROM favorite WHERE user_id = ?', [req.user.userId]);
        res.json({
            code: 200, message: 'success',
            data: { total: countResult[0].total, page: parseInt(page), size: parseInt(size), records: rows }
        });
    } catch (err) {
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

module.exports = router;
