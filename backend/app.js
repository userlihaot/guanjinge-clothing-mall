/**
 * 观锦阁古装服饰商城 - 后端服务入口
 * 技术栈: Node.js + Express + MySQL + JWT
 * 端口: 8090
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入路由
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart');
const addressRoutes = require('./routes/address');
const orderRoutes = require('./routes/order');
const payRoutes = require('./routes/pay');
const reviewRoutes = require('./routes/review');
const favoriteRoutes = require('./routes/favorite');
const couponRoutes = require('./routes/coupon');
const bannerRoutes = require('./routes/banner');
const refundRoutes = require('./routes/refund');
const footprintRoutes = require('./routes/footprint');
const adminRoutes = require('./routes/admin');
const fileRoutes = require('./routes/file');

const app = express();
const PORT = 8090;

// ============ 中间件配置 ============
app.use(cors({
    origin: '*',                    // 允许所有来源(生产环境应限制)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());             // 解析JSON请求体
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 上传的图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 商品图片（用户手动添加的本地图片）
app.use('/image', express.static(path.join(__dirname, 'public/image')));
// 前端静态页面 - 用户商城 + 管理后台
app.use(express.static(path.join(__dirname, 'public')));

// ============ 路由挂载 ============
app.use('/api/user', userRoutes);           // 用户模块(注册/登录/个人中心)
app.use('/api/product', productRoutes);     // 商品模块(列表/详情/搜索)
app.use('/api/cart', cartRoutes);           // 购物车模块
app.use('/api/address', addressRoutes);     // 收货地址模块
app.use('/api/order', orderRoutes);         // 订单模块
app.use('/api/pay', payRoutes);             // 支付模块
app.use('/api/review', reviewRoutes);       // 评价模块
app.use('/api/favorite', favoriteRoutes);    // 收藏模块
app.use('/api/coupon', couponRoutes);       // 优惠券模块
app.use('/api/banner', bannerRoutes);       // 轮播图模块
app.use('/api/refund', refundRoutes);       // 退款模块
app.use('/api/footprint', footprintRoutes); // 浏览足迹模块
app.use('/api/admin', adminRoutes);         // 管理后台模块
app.use('/api/file', fileRoutes);           // 文件上传模块

// 管理后台路径重定向
app.get('/admin', (req, res) => res.redirect('/admin/index.html'));

// ============ 全局错误处理 ============
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        code: 500,
        message: '服务器内部错误',
        data: null
    });
});

// ============ 启动服务 ============
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  观锦阁后端服务启动成功!`);
    console.log(`  地址: http://localhost:${PORT}`);
    console.log(`  数据库: MySQL 8.0 (guanjinge)`);
    console.log(`========================================`);
});
