/**
 * 轮播图模块路由
 */
const router = require('express').Router();
const pool = require('../config/db');

// GET /api/banner/active - 获取启用的轮播图（公开）
router.get('/active', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM banner WHERE status = 1 AND deleted = 0 ORDER BY sort_order ASC'
        );
        res.json({ code: 200, message: 'success', data: rows });
    } catch (err) {
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

module.exports = router;
