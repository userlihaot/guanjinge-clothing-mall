/**
 * 商品模块路由 - 商品列表/详情/搜索/热销/新品
 */
const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/product/list - 商品列表（多条件筛选）
router.get('/list', async (req, res) => {
    try {
        const { categoryId, dynasty, minPrice, maxPrice, keyword, sortBy, page = 1, size = 12 } = req.query;
        let sql = 'SELECT p.*, c.name AS category_name FROM product p LEFT JOIN category c ON p.category_id = c.id WHERE p.deleted = 0 AND p.status = 1';
        let countSql = 'SELECT COUNT(*) AS total FROM product p WHERE p.deleted = 0 AND p.status = 1';
        const params = [];
        const countParams = [];

        // 分类筛选
        if (categoryId) {
            sql += ' AND p.category_id = ?';
            countSql += ' AND p.category_id = ?';
            params.push(categoryId);
            countParams.push(categoryId);
        }
        // 朝代筛选
        if (dynasty) {
            sql += ' AND p.dynasty = ?';
            countSql += ' AND p.dynasty = ?';
            params.push(dynasty);
            countParams.push(dynasty);
        }
        // 价格区间
        if (minPrice) {
            sql += ' AND p.promotion_price >= ?';
            countSql += ' AND (p.promotion_price IS NOT NULL AND p.promotion_price >= ? OR p.promotion_price IS NULL AND p.price >= ?)';
            params.push(minPrice);
            countParams.push(minPrice, minPrice);
        }
        if (maxPrice) {
            sql += ' AND p.promotion_price <= ?';
            countSql += ' AND (p.promotion_price IS NOT NULL AND p.promotion_price <= ? OR p.promotion_price IS NULL AND p.price <= ?)';
            params.push(maxPrice);
            countParams.push(maxPrice, maxPrice);
        }
        // 关键词搜索
        if (keyword) {
            sql += ' AND (p.name LIKE ? OR p.keyword LIKE ?)';
            countSql += ' AND (p.name LIKE ? OR p.keyword LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
            countParams.push(`%${keyword}%`, `%${keyword}%`);
        }
        // 排序
        switch (sortBy) {
            case 'sales': sql += ' ORDER BY p.sales_count DESC'; break;
            case 'price_asc': sql += ' ORDER BY COALESCE(p.promotion_price, p.price) ASC'; break;
            case 'price_desc': sql += ' ORDER BY COALESCE(p.promotion_price, p.price) DESC'; break;
            case 'newest': sql += ' ORDER BY p.create_time DESC'; break;
            default: sql += ' ORDER BY p.sales_count DESC, p.create_time DESC';
        }
        // 分页
        const offset = (parseInt(page) - 1) * parseInt(size);
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(size), offset);

        const [rows] = await pool.query(sql, params);
        const [countResult] = await pool.query(countSql, countParams);
        const total = countResult[0].total;

        res.json({
            code: 200, message: 'success',
            data: { total, page: parseInt(page), size: parseInt(size), records: rows }
        });
    } catch (err) {
        console.error('获取商品列表失败:', err);
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// GET /api/product/hot - 热销商品
router.get('/hot', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM product WHERE deleted = 0 AND status = 1 AND is_hot = 1 ORDER BY sales_count DESC LIMIT 10'
        );
        res.json({ code: 200, message: 'success', data: rows });
    } catch (err) {
        console.error('获取热销商品失败:', err);
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// GET /api/product/new - 新品商品
router.get('/new', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM product WHERE deleted = 0 AND status = 1 AND is_new = 1 ORDER BY create_time DESC LIMIT 10'
        );
        res.json({ code: 200, message: 'success', data: rows });
    } catch (err) {
        console.error('获取新品失败:', err);
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// GET /api/product/search - 搜索商品
router.get('/search', async (req, res) => {
    try {
        const { keyword, sortBy, page = 1, size = 12 } = req.query;
        if (!keyword) {
            return res.json({ code: 400, message: '搜索关键词不能为空', data: null });
        }
        const offset = (parseInt(page) - 1) * parseInt(size);

        // 排序
        let orderSql = 'ORDER BY sales_count DESC';
        switch (sortBy) {
            case 'sales': orderSql = 'ORDER BY sales_count DESC'; break;
            case 'price_asc': orderSql = 'ORDER BY COALESCE(promotion_price, price) ASC'; break;
            case 'price_desc': orderSql = 'ORDER BY COALESCE(promotion_price, price) DESC'; break;
            case 'new': orderSql = 'ORDER BY create_time DESC'; break;
        }

        const [rows] = await pool.query(
            `SELECT * FROM product WHERE deleted = 0 AND status = 1 AND (name LIKE ? OR keyword LIKE ? OR subtitle LIKE ? OR description LIKE ?) ${orderSql} LIMIT ? OFFSET ?`,
            [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, parseInt(size), offset]
        );
        const [countResult] = await pool.query(
            'SELECT COUNT(*) AS total FROM product WHERE deleted = 0 AND status = 1 AND (name LIKE ? OR keyword LIKE ? OR subtitle LIKE ? OR description LIKE ?)',
            [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
        );
        res.json({
            code: 200, message: 'success',
            data: { total: countResult[0].total, page: parseInt(page), size: parseInt(size), records: rows }
        });
    } catch (err) {
        console.error('搜索失败:', err);
        res.json({ code: 500, message: '搜索失败', data: null });
    }
});

// GET /api/product/categories - 获取所有分类
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM category WHERE deleted = 0 ORDER BY sort_order ASC');
        res.json({ code: 200, message: 'success', data: rows });
    } catch (err) {
        console.error('获取分类失败:', err);
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// GET /api/product/:id - 商品详情（必须放在所有命名路由之后，防止 /search、/hot 等被 :id 捕获）
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // 商品基本信息 + 分类名
        const [products] = await pool.query(
            'SELECT p.*, c.name AS category_name FROM product p LEFT JOIN category c ON p.category_id = c.id WHERE p.id = ? AND p.deleted = 0',
            [id]
        );
        if (products.length === 0) {
            return res.json({ code: 400, message: '商品不存在', data: null });
        }
        const product = products[0];
        // 商品图片
        const [images] = await pool.query(
            'SELECT image_url FROM product_image WHERE product_id = ? AND deleted = 0 ORDER BY sort_order',
            [id]
        );
        product.imageList = images.map(img => img.image_url);
        // 商品规格SKU
        const [skus] = await pool.query(
            'SELECT * FROM product_sku WHERE product_id = ? AND deleted = 0 AND status = 1',
            [id]
        );
        product.skuList = skus;
        // 平均评分和评价数
        const [reviewStats] = await pool.query(
            'SELECT AVG(star) AS avgStar, COUNT(*) AS reviewCount FROM review WHERE product_id = ? AND deleted = 0 AND is_audited = 1',
            [id]
        );
        product.avgStar = reviewStats[0].avgStar ? Math.round(reviewStats[0].avgStar * 10) / 10 : 0;
        product.reviewCount = reviewStats[0].reviewCount;

        // 如果有登录用户，记录足迹
        if (req.headers['authorization']) {
            try {
                const jwtUtil = require('../utils/jwt');
                const token = req.headers['authorization'].split(' ')[1];
                const decoded = jwtUtil.verifyToken(token);
                await pool.query(
                    'INSERT INTO footprint (user_id, product_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE create_time = NOW()',
                    [decoded.userId, id]
                );
            } catch (e) { /* 忽略token解析错误 */ }
        }

        res.json({ code: 200, message: 'success', data: product });
    } catch (err) {
        console.error('获取商品详情失败:', err);
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

module.exports = router;
