/**
 * 浏览足迹模块路由
 */
const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/footprint/list
router.get('/list', async (req, res) => {
    try {
        const { page = 1, size = 12 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(size);
        const [rows] = await pool.query(
            `SELECT p.*, f.create_time AS footprint_time
             FROM footprint f JOIN product p ON f.product_id = p.id
             WHERE f.user_id = ? AND p.deleted = 0
             ORDER BY f.create_time DESC LIMIT ? OFFSET ?`,
            [req.user.userId, parseInt(size), offset]
        );
        const [[{total}]] = await pool.query('SELECT COUNT(*) AS total FROM footprint WHERE user_id = ?', [req.user.userId]);
        res.json({ code: 200, message: 'success', data: { total, page: parseInt(page), size: parseInt(size), records: rows } });
    } catch (err) {
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

module.exports = router;
