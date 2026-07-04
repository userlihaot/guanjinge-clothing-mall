/**
 * 管理后台模块路由 - 管理员登录/数据统计/商品管理/订单管理/用户管理/优惠券/轮播图/评价审核/退款
 */
const router = require('express').Router();
const pool = require('../config/db');
const md5 = require('../utils/md5');
const jwtUtil = require('../utils/jwt');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// ==================== 管理员登录（公开） ====================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [admins] = await pool.query('SELECT * FROM admin WHERE username = ? AND deleted = 0', [username]);
        if (admins.length === 0) return res.json({ code: 400, message: '管理员不存在', data: null });
        const admin = admins[0];
        if (admin.status === 0) return res.json({ code: 400, message: '账号已被禁用', data: null });
        if (admin.password !== md5(password)) return res.json({ code: 400, message: '密码错误', data: null });
        await pool.query('UPDATE admin SET last_login_time = NOW() WHERE id = ?', [admin.id]);
        const token = jwtUtil.generateToken(admin.id, 'admin');
        res.json({ code: 200, message: '登录成功', data: { token, userId: admin.id, nickname: admin.nickname, role: admin.role } });
    } catch (err) { res.json({ code: 500, message: '登录失败', data: null }); }
});

// ==================== 数据统计 ====================
router.get('/dashboard', auth, adminAuth, async (req, res) => {
    try {
        const [[todayOrders]] = await pool.query("SELECT COUNT(*) AS count FROM order_master WHERE DATE(create_time) = CURDATE() AND deleted = 0");
        const [[todaySales]] = await pool.query("SELECT COALESCE(SUM(real_amount),0) AS amount FROM order_master WHERE DATE(create_time)=CURDATE() AND status IN (1,2,3) AND deleted=0");
        const [[totalUsers]] = await pool.query('SELECT COUNT(*) AS count FROM user WHERE deleted=0');
        const [[activeProducts]] = await pool.query('SELECT COUNT(*) AS count FROM product WHERE status=1 AND deleted=0');
        const [salesTrend] = await pool.query("SELECT DATE(create_time) AS date, COALESCE(SUM(real_amount),0) AS amount FROM order_master WHERE create_time>=DATE_SUB(CURDATE(),INTERVAL 6 DAY) AND status IN (1,2,3) AND deleted=0 GROUP BY DATE(create_time) ORDER BY date");
        const [orderStatus] = await pool.query("SELECT status, COUNT(*) AS count FROM order_master WHERE deleted=0 GROUP BY status");
        const [categorySales] = await pool.query("SELECT c.name, COALESCE(SUM(oi.quantity),0) AS count FROM order_item oi JOIN product p ON oi.product_id=p.id JOIN category c ON p.category_id=c.id JOIN order_master o ON oi.order_no=o.order_no WHERE o.status IN (1,2,3) AND o.deleted=0 GROUP BY c.name");
        const [recentOrders] = await pool.query('SELECT * FROM order_master WHERE deleted=0 ORDER BY create_time DESC LIMIT 10');
        for (const order of recentOrders) {
            const [items] = await pool.query('SELECT * FROM order_item WHERE order_no=?', [order.order_no]);
            order.itemList = items;
        }
        res.json({ code: 200, message: 'success', data: {
            todayOrders: todayOrders.count, todaySales: todaySales.amount,
            totalUsers: totalUsers.count, activeProducts: activeProducts.count,
            salesTrend, orderStatus, categorySales, recentOrders
        }});
    } catch (err) { console.error(err); res.json({ code: 500, message: '获取失败', data: null }); }
});

// ==================== 商品管理 ====================
router.get('/products', auth, adminAuth, async (req, res) => {
    try {
        const { keyword, categoryId, status, page=1, size=10 } = req.query;
        let where = 'WHERE p.deleted=0', p=[];
        if(keyword){ where+=' AND p.name LIKE ?'; p.push(`%${keyword}%`); }
        if(categoryId){ where+=' AND p.category_id=?'; p.push(categoryId); }
        if(status!==undefined&&status!==''){ where+=' AND p.status=?'; p.push(parseInt(status)); }
        const [[{total}]] = await pool.query(`SELECT COUNT(*) AS total FROM product p ${where}`, p);
        const offset = (parseInt(page)-1)*parseInt(size);
        const [rows] = await pool.query(`SELECT p.*, c.name AS category_name FROM product p LEFT JOIN category c ON p.category_id=c.id ${where} ORDER BY p.create_time DESC LIMIT ? OFFSET ?`, [...p, parseInt(size), offset]);
        res.json({ code:200, message:'success', data:{ total, page:parseInt(page), size:parseInt(size), records:rows } });
    } catch (err) { console.error(err); res.json({ code:500, message:'获取失败', data:null }); }
});

// 商品详情
router.get('/products/:id', auth, adminAuth, async (req, res) => {
    try {
        const [[product]] = await pool.query('SELECT p.*, c.name AS category_name FROM product p LEFT JOIN category c ON p.category_id=c.id WHERE p.id=? AND p.deleted=0', [req.params.id]);
        if(!product) return res.json({ code:400, message:'商品不存在', data:null });
        const [images] = await pool.query('SELECT * FROM product_image WHERE product_id=? AND deleted=0', [req.params.id]);
        const [skus] = await pool.query('SELECT * FROM product_sku WHERE product_id=? AND deleted=0', [req.params.id]);
        product.imageList = images; product.skuList = skus;
        res.json({ code:200, message:'success', data:product });
    } catch (err) { res.json({ code:500, message:'获取失败', data:null }); }
});

// 新增商品
router.post('/products', auth, adminAuth, async (req, res) => {
    try {
        const { name, categoryId, price, promotionPrice, stock, description, dynasty, fabric, coverImage, status } = req.body;
        const [result] = await pool.query(
            'INSERT INTO product (name, category_id, price, promotion_price, stock, description, dynasty, fabric, cover_image, status) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [name, categoryId, price, promotionPrice, stock, description, dynasty, fabric, coverImage, status!==undefined?status:1]
        );
        res.json({ code:200, message:'创建成功', data:{ id:result.insertId } });
    } catch (err) { console.error(err); res.json({ code:500, message:'创建失败', data:null }); }
});

// 修改商品
router.put('/products/:id', auth, adminAuth, async (req, res) => {
    try {
        const { name, categoryId, price, promotionPrice, stock, description, dynasty, fabric, coverImage, status, isHot, isNew, isRecommend } = req.body;
        await pool.query(
            'UPDATE product SET name=?, category_id=?, price=?, promotion_price=?, stock=?, description=?, dynasty=?, fabric=?, cover_image=?, status=?, is_hot=?, is_new=?, is_recommend=? WHERE id=?',
            [name, categoryId, price, promotionPrice, stock, description, dynasty, fabric, coverImage, status, isHot?1:0, isNew?1:0, isRecommend?1:0, req.params.id]
        );
        res.json({ code:200, message:'修改成功', data:null });
    } catch (err) { console.error(err); res.json({ code:500, message:'修改失败', data:null }); }
});

// 修改库存
router.put('/products/:id/stock', auth, adminAuth, async (req, res) => {
    try {
        await pool.query('UPDATE product SET stock=? WHERE id=?', [req.body.stock, req.params.id]);
        res.json({ code:200, message:'库存已更新', data:null });
    } catch (err) { res.json({ code:500, message:'更新失败', data:null }); }
});

// 上架
router.put('/products/:id/shelve', auth, adminAuth, async (req, res) => {
    await pool.query('UPDATE product SET status=1 WHERE id=?', [req.params.id]);
    res.json({ code:200, message:'已上架', data:null });
});

// 下架
router.put('/products/:id/unshelve', auth, adminAuth, async (req, res) => {
    await pool.query('UPDATE product SET status=0 WHERE id=?', [req.params.id]);
    res.json({ code:200, message:'已下架', data:null });
});

// ==================== 订单管理 ====================
router.get('/orders', auth, adminAuth, async (req, res) => {
    try {
        const { orderNo, status, page=1, size=10 } = req.query;
        let where='WHERE deleted=0', p=[];
        if(orderNo){ where+=' AND order_no LIKE ?'; p.push(`%${orderNo}%`); }
        if(status!==undefined&&status!==''){ where+=' AND status=?'; p.push(parseInt(status)); }
        const [[{total}]] = await pool.query(`SELECT COUNT(*) AS total FROM order_master ${where}`, p);
        const offset = (parseInt(page)-1)*parseInt(size);
        const [rows] = await pool.query(`SELECT * FROM order_master ${where} ORDER BY create_time DESC LIMIT ? OFFSET ?`, [...p, parseInt(size), offset]);
        for (const order of rows) {
            const [items] = await pool.query('SELECT * FROM order_item WHERE order_no=?', [order.order_no]);
            order.itemList = items;
        }
        res.json({ code:200, message:'success', data:{ total, page:parseInt(page), size:parseInt(size), records:rows } });
    } catch (err) { res.json({ code:500, message:'获取失败', data:null }); }
});

// 订单统计
router.get('/orders/stats', auth, adminAuth, async (req, res) => {
    try {
        const [[pending]] = await pool.query("SELECT COUNT(*) AS count FROM order_master WHERE status=0 AND deleted=0");
        const [[shipping]] = await pool.query("SELECT COUNT(*) AS count FROM order_master WHERE status=1 AND deleted=0");
        const [[delivered]] = await pool.query("SELECT COUNT(*) AS count FROM order_master WHERE status=2 AND deleted=0");
        const [[completed]] = await pool.query("SELECT COUNT(*) AS count FROM order_master WHERE status=3 AND deleted=0");
        const [[pendingReview]] = await pool.query("SELECT COUNT(*) AS count FROM order_master WHERE status=7 AND deleted=0");
        res.json({ code:200, message:'success', data:{ pending:pending.count, shipping:shipping.count, delivered:delivered.count, completed:completed.count, pendingReview:pendingReview.count } });
    } catch (err) { res.json({ code:500, message:'获取失败', data:null }); }
});

router.get('/orders/:orderNo', auth, adminAuth, async (req, res) => {
    try {
        const [[order]] = await pool.query('SELECT * FROM order_master WHERE order_no=? AND deleted=0', [req.params.orderNo]);
        if(!order) return res.json({ code:400, message:'订单不存在', data:null });
        const [items] = await pool.query('SELECT * FROM order_item WHERE order_no=?', [order.order_no]);
        order.itemList = items;
        res.json({ code:200, message:'success', data:order });
    } catch (err) { res.json({ code:500, message:'获取失败', data:null }); }
});

// 发货
router.put('/orders/:orderNo/deliver', auth, adminAuth, async (req, res) => {
    try {
        const { company, logisticsNo } = req.body;
        const [r] = await pool.query('UPDATE order_master SET status=2, logistics_company=?, logistics_no=? WHERE order_no=? AND status=1', [company, logisticsNo, req.params.orderNo]);
        if(r.affectedRows===0) return res.json({ code:400, message:'订单状态不正确', data:null });
        res.json({ code:200, message:'发货成功', data:null });
    } catch (err) { res.json({ code:500, message:'发货失败', data:null }); }
});

// 备注
router.put('/orders/:orderNo/remark', auth, adminAuth, async (req, res) => {
    try {
        await pool.query('UPDATE order_master SET admin_note=? WHERE order_no=?', [req.body.remark, req.params.orderNo]);
        res.json({ code:200, message:'备注成功', data:null });
    } catch (err) { res.json({ code:500, message:'备注失败', data:null }); }
});

// 删除订单（软删除，已完成/已取消/退款中/已退款状态可删除）
router.delete('/orders/:orderNo', auth, adminAuth, async (req, res) => {
    try {
        const [r] = await pool.query(
            'UPDATE order_master SET deleted=1 WHERE order_no=? AND status IN (3,4,5,6,7)',
            [req.params.orderNo]
        );
        if (r.affectedRows === 0) {
            return res.json({ code:400, message:'仅已完成、已取消或已退款的订单可删除', data:null });
        }
        res.json({ code:200, message:'删除成功', data:null });
    } catch (err) { res.json({ code:500, message:'删除失败', data:null }); }
});

// ==================== 用户管理 ====================
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const { keyword, page=1, size=10 } = req.query;
        let where='WHERE deleted=0', p=[];
        if(keyword){ where+=' AND (username LIKE ? OR phone LIKE ?)'; p.push(`%${keyword}%`,`%${keyword}%`); }
        const [[{total}]] = await pool.query(`SELECT COUNT(*) AS total FROM user ${where}`, p);
        const offset = (parseInt(page)-1)*parseInt(size);
        const [rows] = await pool.query(`SELECT id,username,phone,nickname,avatar,gender,status,create_time,last_login_time FROM user ${where} ORDER BY create_time DESC LIMIT ? OFFSET ?`, [...p, parseInt(size), offset]);
        res.json({ code:200, message:'success', data:{ total, page:parseInt(page), size:parseInt(size), records:rows } });
    } catch (err) { res.json({ code:500, message:'获取失败', data:null }); }
});

router.put('/users/:id/status', auth, adminAuth, async (req, res) => {
    try {
        await pool.query('UPDATE user SET status=CASE WHEN status=1 THEN 0 ELSE 1 END WHERE id=?', [req.params.id]);
        res.json({ code:200, message:'状态已更新', data:null });
    } catch (err) { res.json({ code:500, message:'操作失败', data:null }); }
});

router.get('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const [[user]] = await pool.query('SELECT id,username,phone,nickname,avatar,gender,status,create_time FROM user WHERE id=?', [req.params.id]);
        if(!user) return res.json({ code:400, message:'用户不存在', data:null });
        const [[{count:orderCount}]] = await pool.query('SELECT COUNT(*) AS count FROM order_master WHERE user_id=?', [user.id]);
        const [[{amount:totalSpent}]] = await pool.query('SELECT COALESCE(SUM(real_amount),0) AS amount FROM order_master WHERE user_id=? AND status IN (1,2,3)', [user.id]);
        const [addresses] = await pool.query('SELECT * FROM address WHERE user_id=? AND deleted=0', [user.id]);
        user.orderCount = orderCount; user.totalSpent = totalSpent; user.addresses = addresses;
        res.json({ code:200, message:'success', data:user });
    } catch (err) { res.json({ code:500, message:'获取失败', data:null }); }
});

// ==================== 优惠券管理 ====================
router.get('/coupons', auth, adminAuth, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM coupon WHERE deleted=0 ORDER BY create_time DESC');
    res.json({ code:200, message:'success', data:rows });
});

router.get('/coupons/:id/stats', auth, adminAuth, async (req, res) => {
    const [[stats]] = await pool.query('SELECT received_count, used_count FROM coupon WHERE id=?', [req.params.id]);
    res.json({ code:200, message:'success', data:stats||{received_count:0,used_count:0} });
});

router.post('/coupons', auth, adminAuth, async (req, res) => {
    try {
        const { name, type, fullAmount, reduceAmount, totalCount, startTime, endTime, description } = req.body;
        await pool.query('INSERT INTO coupon (name,type,full_amount,reduce_amount,total_count,start_time,end_time,description) VALUES (?,?,?,?,?,?,?,?)',
            [name, type, fullAmount, reduceAmount, totalCount, startTime, endTime, description]);
        res.json({ code:200, message:'创建成功', data:null });
    } catch (err) { res.json({ code:500, message:'创建失败', data:null }); }
});

router.put('/coupons/:id', auth, adminAuth, async (req, res) => {
    try {
        const { name, type, fullAmount, reduceAmount, totalCount, startTime, endTime, status, description } = req.body;
        await pool.query('UPDATE coupon SET name=?,type=?,full_amount=?,reduce_amount=?,total_count=?,start_time=?,end_time=?,status=?,description=? WHERE id=?',
            [name, type, fullAmount, reduceAmount, totalCount, startTime, endTime, status, description, req.params.id]);
        res.json({ code:200, message:'更新成功', data:null });
    } catch (err) { res.json({ code:500, message:'更新失败', data:null }); }
});

router.delete('/coupons/:id', auth, adminAuth, async (req, res) => {
    await pool.query('UPDATE coupon SET deleted=1 WHERE id=?', [req.params.id]);
    res.json({ code:200, message:'删除成功', data:null });
});

// ==================== 轮播图管理 ====================
router.get('/banners', auth, adminAuth, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM banner WHERE deleted=0 ORDER BY sort_order ASC');
    res.json({ code:200, message:'success', data:rows });
});

router.post('/banners', auth, adminAuth, async (req, res) => {
    try {
        const { title, imageUrl, linkUrl, sortOrder, status } = req.body;
        await pool.query('INSERT INTO banner (title,image_url,link_url,sort_order,status) VALUES (?,?,?,?,?)',
            [title, imageUrl, linkUrl, sortOrder||0, status!==undefined?status:1]);
        res.json({ code:200, message:'创建成功', data:null });
    } catch (err) { res.json({ code:500, message:'创建失败', data:null }); }
});

router.put('/banners/:id', auth, adminAuth, async (req, res) => {
    try {
        const { title, imageUrl, linkUrl, sortOrder, status } = req.body;
        await pool.query('UPDATE banner SET title=?,image_url=?,link_url=?,sort_order=?,status=? WHERE id=?',
            [title, imageUrl, linkUrl, sortOrder, status, req.params.id]);
        res.json({ code:200, message:'更新成功', data:null });
    } catch (err) { res.json({ code:500, message:'更新失败', data:null }); }
});

router.delete('/banners/:id', auth, adminAuth, async (req, res) => {
    await pool.query('UPDATE banner SET deleted=1 WHERE id=?', [req.params.id]);
    res.json({ code:200, message:'删除成功', data:null });
});

// ==================== 评价审核 ====================
router.get('/reviews', auth, adminAuth, async (req, res) => {
    try {
        const { isAudited, keyword, page=1, size=10 } = req.query;
        let where='WHERE r.deleted=0', p=[];
        if(isAudited!==undefined&&isAudited!==''){ where+=' AND r.is_audited=?'; p.push(parseInt(isAudited)); }
        if(keyword){ where+=' AND p.name LIKE ?'; p.push(`%${keyword}%`); }
        const [[{total}]] = await pool.query(`SELECT COUNT(*) AS total FROM review r JOIN product p ON r.product_id=p.id ${where}`, p);
        const offset = (parseInt(page)-1)*parseInt(size);
        const [rows] = await pool.query(`SELECT r.*, u.nickname, p.name AS product_name FROM review r LEFT JOIN user u ON r.user_id=u.id JOIN product p ON r.product_id=p.id ${where} ORDER BY r.create_time DESC LIMIT ? OFFSET ?`, [...p, parseInt(size), offset]);
        res.json({ code:200, message:'success', data:{ total, page:parseInt(page), size:parseInt(size), records:rows } });
    } catch (err) { console.error(err); res.json({ code:500, message:'获取失败', data:null }); }
});

// 审核
router.put('/reviews/:id/audit', auth, adminAuth, async (req, res) => {
    try {
        await pool.query('UPDATE review SET is_audited=? WHERE id=?', [req.body.isAudited, req.params.id]);
        res.json({ code:200, message:'审核完成', data:null });
    } catch (err) { res.json({ code:500, message:'审核失败', data:null }); }
});

// 商家回复
router.put('/reviews/:id/reply', auth, adminAuth, async (req, res) => {
    try {
        await pool.query('UPDATE review SET seller_reply=?, reply_time=NOW() WHERE id=?', [req.body.reply, req.params.id]);
        res.json({ code:200, message:'回复成功', data:null });
    } catch (err) { res.json({ code:500, message:'回复失败', data:null }); }
});

// ==================== 退款处理 ====================
router.get('/refunds', auth, adminAuth, async (req, res) => {
    try {
        const { status, page=1, size=10 } = req.query;
        let where='WHERE deleted=0', p=[];
        if(status!==undefined&&status!==''){ where+=' AND status=?'; p.push(parseInt(status)); }
        const [[{total}]] = await pool.query(`SELECT COUNT(*) AS total FROM refund ${where}`, p);
        const offset = (parseInt(page)-1)*parseInt(size);
        const [rows] = await pool.query(`SELECT * FROM refund ${where} ORDER BY create_time DESC LIMIT ? OFFSET ?`, [...p, parseInt(size), offset]);
        res.json({ code:200, message:'success', data:{ total, page:parseInt(page), size:parseInt(size), records:rows } });
    } catch (err) { res.json({ code:500, message:'获取失败', data:null }); }
});

router.put('/refunds/:id/handle', auth, adminAuth, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { status, refuseReason } = req.body; // status: 1-同意 2-拒绝
        const [[refund]] = await conn.query('SELECT * FROM refund WHERE id=? AND deleted=0', [req.params.id]);
        if(!refund) throw new Error('退款申请不存在');
        if(status===1){
            await conn.query('UPDATE refund SET status=1, handle_time=NOW() WHERE id=?', [req.params.id]);
            await conn.query('UPDATE refund SET status=3, finish_time=NOW() WHERE id=?', [req.params.id]);
            await conn.query('UPDATE order_master SET status=6 WHERE order_no=?', [refund.order_no]);
        } else {
            await conn.query('UPDATE refund SET status=2, refuse_reason=?, handle_time=NOW() WHERE id=?', [refuseReason, req.params.id]);
            await conn.query('UPDATE order_master SET status=3 WHERE order_no=?', [refund.order_no]);
        }
        await conn.commit();
        res.json({ code:200, message:'处理完成', data:null });
    } catch (err) {
        await conn.rollback();
        res.json({ code:500, message:err.message, data:null });
    } finally { conn.release(); }
});

// 删除退款申请（软删除，仅已处理的可删除）
router.delete('/refunds/:id', auth, adminAuth, async (req, res) => {
    try {
        const [r] = await pool.query('UPDATE refund SET deleted=1 WHERE id=? AND status IN (1,2)', [req.params.id]);
        if(r.affectedRows===0) return res.json({ code:400, message:'仅已处理的退款可删除', data:null });
        res.json({ code:200, message:'删除成功', data:null });
    } catch (err) { res.json({ code:500, message:'删除失败', data:null }); }
});

// ==================== 分类管理 ====================
router.get('/categories', auth, adminAuth, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM category WHERE deleted = 0 ORDER BY sort_order ASC');
    res.json({ code: 200, message: 'success', data: rows });
});

router.post('/categories', auth, adminAuth, async (req, res) => {
    try {
        const { name, icon, sortOrder } = req.body;
        if (!name) return res.json({ code: 400, message: '分类名称不能为空', data: null });
        await pool.query('INSERT INTO category (name, icon, sort_order) VALUES (?, ?, ?)', [name, icon || '', sortOrder || 0]);
        res.json({ code: 200, message: '创建成功', data: null });
    } catch (err) { res.json({ code: 500, message: '创建失败', data: null }); }
});

router.put('/categories/:id', auth, adminAuth, async (req, res) => {
    try {
        const { name, icon, sortOrder } = req.body;
        await pool.query('UPDATE category SET name=?, icon=?, sort_order=? WHERE id=?', [name, icon, sortOrder, req.params.id]);
        res.json({ code: 200, message: '更新成功', data: null });
    } catch (err) { res.json({ code: 500, message: '更新失败', data: null }); }
});

router.delete('/categories/:id', auth, adminAuth, async (req, res) => {
    await pool.query('UPDATE category SET deleted=1 WHERE id=?', [req.params.id]);
    res.json({ code: 200, message: '删除成功', data: null });
});

// ==================== 系统设置 ====================
router.get('/settings', auth, adminAuth, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM sys_config');
    res.json({ code:200, message:'success', data:rows });
});

router.put('/settings', auth, adminAuth, async (req, res) => {
    try {
        const configs = req.body;
        for(const [key, value] of Object.entries(configs)){
            await pool.query('UPDATE sys_config SET config_value=? WHERE config_key=?', [value, key]);
        }
        res.json({ code:200, message:'保存成功', data:null });
    } catch (err) { res.json({ code:500, message:'保存失败', data:null }); }
});

module.exports = router;
