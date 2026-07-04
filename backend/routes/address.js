/**
 * 收货地址模块路由
 */
const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/address/list
router.get('/list', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM address WHERE user_id = ? AND deleted = 0 ORDER BY is_default DESC, create_time DESC',
            [req.user.userId]
        );
        res.json({ code: 200, message: 'success', data: rows });
    } catch (err) {
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// POST /api/address/add
router.post('/add', async (req, res) => {
    try {
        const { receiverName, receiverPhone, province, city, district, detail, zipCode, isDefault } = req.body;
        if (!receiverName || !receiverPhone || !province || !city || !district || !detail) {
            return res.json({ code: 400, message: '请填写完整的地址信息', data: null });
        }
        if (isDefault) {
            await pool.query('UPDATE address SET is_default = 0 WHERE user_id = ?', [req.user.userId]);
        }
        const [result] = await pool.query(
            'INSERT INTO address (user_id, receiver_name, receiver_phone, province, city, district, detail, zip_code, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.userId, receiverName, receiverPhone, province, city, district, detail, zipCode, isDefault ? 1 : 0]
        );
        res.json({ code: 200, message: '添加成功', data: { id: result.insertId } });
    } catch (err) {
        res.json({ code: 500, message: '添加失败', data: null });
    }
});

// PUT /api/address/update
router.put('/update', async (req, res) => {
    try {
        const { id, receiverName, receiverPhone, province, city, district, detail, zipCode, isDefault } = req.body;
        if (isDefault) {
            await pool.query('UPDATE address SET is_default = 0 WHERE user_id = ?', [req.user.userId]);
        }
        await pool.query(
            'UPDATE address SET receiver_name=?, receiver_phone=?, province=?, city=?, district=?, detail=?, zip_code=?, is_default=? WHERE id=? AND user_id=?',
            [receiverName, receiverPhone, province, city, district, detail, zipCode, isDefault ? 1 : 0, id, req.user.userId]
        );
        res.json({ code: 200, message: '修改成功', data: null });
    } catch (err) {
        res.json({ code: 500, message: '修改失败', data: null });
    }
});

// DELETE /api/address/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('UPDATE address SET deleted = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
        res.json({ code: 200, message: '删除成功', data: null });
    } catch (err) {
        res.json({ code: 500, message: '删除失败', data: null });
    }
});

// PUT /api/address/:id/default - 设为默认地址
router.put('/:id/default', async (req, res) => {
    try {
        await pool.query('UPDATE address SET is_default = 0 WHERE user_id = ?', [req.user.userId]);
        await pool.query('UPDATE address SET is_default = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
        res.json({ code: 200, message: '设置成功', data: null });
    } catch (err) {
        res.json({ code: 500, message: '设置失败', data: null });
    }
});

module.exports = router;
