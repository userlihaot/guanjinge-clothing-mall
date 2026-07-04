-- ============================================================
-- 观锦阁古装服饰商城 - 数据库初始化脚本
-- 数据库: MySQL 8.0+
-- 字符集: utf8mb4
-- ============================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS guanjinge DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE guanjinge;

-- ============================================================
-- 1. 用户表
-- ============================================================
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `password` VARCHAR(128) NOT NULL COMMENT '密码(MD5加密)',
    `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `gender` TINYINT DEFAULT 0 COMMENT '性别 0-未知 1-男 2-女',
    `birthday` DATE DEFAULT NULL COMMENT '生日',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `status` TINYINT DEFAULT 1 COMMENT '状态 0-禁用 1-正常',
    `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除 0-未删除 1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_phone` (`phone`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================================
-- 2. 管理员表
-- ============================================================
DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
    `username` VARCHAR(50) NOT NULL COMMENT '管理员用户名',
    `password` VARCHAR(128) NOT NULL COMMENT '密码(MD5加密)',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `role` VARCHAR(20) DEFAULT 'admin' COMMENT '角色 super_admin/admin',
    `status` TINYINT DEFAULT 1 COMMENT '状态 0-禁用 1-正常',
    `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- ============================================================
-- 3. 商品分类表
-- ============================================================
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
    `parent_id` BIGINT DEFAULT 0 COMMENT '父分类ID 0为顶级',
    `level` INT DEFAULT 1 COMMENT '分类层级 1/2/3',
    `icon` VARCHAR(255) DEFAULT NULL COMMENT '分类图标',
    `banner_url` VARCHAR(255) DEFAULT NULL COMMENT '分类横幅图',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `status` TINYINT DEFAULT 1 COMMENT '状态 0-禁用 1-正常',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品分类表';

-- ============================================================
-- 4. 商品表
-- ============================================================
DROP TABLE IF EXISTS `product`;
CREATE TABLE `product` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '商品ID',
    `name` VARCHAR(200) NOT NULL COMMENT '商品名称',
    `subtitle` VARCHAR(200) DEFAULT NULL COMMENT '商品副标题',
    `category_id` BIGINT NOT NULL COMMENT '分类ID',
    `brand` VARCHAR(50) DEFAULT '观锦阁' COMMENT '品牌',
    `description` TEXT COMMENT '商品描述(富文本)',
    `price` DECIMAL(10,2) NOT NULL COMMENT '原价',
    `promotion_price` DECIMAL(10,2) DEFAULT NULL COMMENT '促销价',
    `stock` INT DEFAULT 0 COMMENT '库存',
    `sales_count` INT DEFAULT 0 COMMENT '销量',
    `cover_image` VARCHAR(255) DEFAULT NULL COMMENT '封面图',
    `dynasty` VARCHAR(20) DEFAULT NULL COMMENT '朝代/形制 唐/宋/明/改良/婚服/演出服',
    `fabric` VARCHAR(100) DEFAULT NULL COMMENT '面料',
    `craft` VARCHAR(100) DEFAULT NULL COMMENT '工艺',
    `color` VARCHAR(50) DEFAULT NULL COMMENT '颜色',
    `size_info` TEXT COMMENT '尺码信息JSON格式',
    `keyword` VARCHAR(500) DEFAULT NULL COMMENT '关键词(搜索用)',
    `is_hot` TINYINT DEFAULT 0 COMMENT '是否热销 0-否 1-是',
    `is_new` TINYINT DEFAULT 0 COMMENT '是否新品 0-否 1-是',
    `is_recommend` TINYINT DEFAULT 0 COMMENT '是否推荐 0-否 1-是',
    `status` TINYINT DEFAULT 1 COMMENT '状态 0-下架 1-上架',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_dynasty` (`dynasty`),
    KEY `idx_price` (`price`),
    KEY `idx_status` (`status`),
    FULLTEXT KEY `ft_keyword` (`keyword`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- ============================================================
-- 5. 商品规格表 (SKU)
-- ============================================================
DROP TABLE IF EXISTS `product_sku`;
CREATE TABLE `product_sku` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '规格ID',
    `product_id` BIGINT NOT NULL COMMENT '商品ID',
    `sku_name` VARCHAR(100) NOT NULL COMMENT '规格名称 如:S-红色/M-蓝色',
    `spec_json` VARCHAR(500) DEFAULT NULL COMMENT '规格JSON 如{"size":"S","color":"红色"}',
    `price` DECIMAL(10,2) NOT NULL COMMENT '规格价格',
    `stock` INT DEFAULT 0 COMMENT '规格库存',
    `image` VARCHAR(255) DEFAULT NULL COMMENT '规格图片',
    `status` TINYINT DEFAULT 1 COMMENT '状态 0-禁用 1-正常',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`),
    KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品规格表';

-- ============================================================
-- 6. 商品图片表
-- ============================================================
DROP TABLE IF EXISTS `product_image`;
CREATE TABLE `product_image` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '图片ID',
    `product_id` BIGINT NOT NULL COMMENT '商品ID',
    `image_url` VARCHAR(255) NOT NULL COMMENT '图片URL',
    `type` TINYINT DEFAULT 1 COMMENT '类型 1-主图 2-详情图 3-买家秀',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`),
    KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品图片表';

-- ============================================================
-- 7. 购物车表
-- ============================================================
DROP TABLE IF EXISTS `cart`;
CREATE TABLE `cart` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '购物车ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `product_id` BIGINT NOT NULL COMMENT '商品ID',
    `sku_id` BIGINT DEFAULT NULL COMMENT '规格ID',
    `quantity` INT DEFAULT 1 COMMENT '数量',
    `selected` TINYINT DEFAULT 1 COMMENT '是否选中 0-否 1-是',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_product_sku` (`user_id`,`product_id`,`sku_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车表';

-- ============================================================
-- 8. 收货地址表
-- ============================================================
DROP TABLE IF EXISTS `address`;
CREATE TABLE `address` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '地址ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `receiver_name` VARCHAR(50) NOT NULL COMMENT '收货人姓名',
    `receiver_phone` VARCHAR(20) NOT NULL COMMENT '收货人电话',
    `province` VARCHAR(50) NOT NULL COMMENT '省',
    `city` VARCHAR(50) NOT NULL COMMENT '市',
    `district` VARCHAR(50) NOT NULL COMMENT '区/县',
    `detail` VARCHAR(255) NOT NULL COMMENT '详细地址',
    `zip_code` VARCHAR(10) DEFAULT NULL COMMENT '邮编',
    `is_default` TINYINT DEFAULT 0 COMMENT '是否默认 0-否 1-是',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收货地址表';

-- ============================================================
-- 9. 订单主表
-- ============================================================
DROP TABLE IF EXISTS `order_master`;
CREATE TABLE `order_master` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '订单ID',
    `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `total_amount` DECIMAL(10,2) NOT NULL COMMENT '商品总金额',
    `freight` DECIMAL(10,2) DEFAULT 0.00 COMMENT '运费',
    `coupon_discount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '优惠券抵扣',
    `real_amount` DECIMAL(10,2) NOT NULL COMMENT '实付金额',
    `pay_method` VARCHAR(20) DEFAULT NULL COMMENT '支付方式 alipay/wechat',
    `pay_no` VARCHAR(64) DEFAULT NULL COMMENT '支付流水号',
    `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
    `pay_deadline` DATETIME DEFAULT NULL COMMENT '支付截止时间(超时取消)',
    `status` TINYINT DEFAULT 0 COMMENT '订单状态 0-待付款 1-待发货 2-待收货 3-已完成 4-已取消 5-退款中 6-已退款',
    `receiver_name` VARCHAR(50) DEFAULT NULL COMMENT '收货人',
    `receiver_phone` VARCHAR(20) DEFAULT NULL COMMENT '收货电话',
    `receiver_address` VARCHAR(500) DEFAULT NULL COMMENT '收货地址(快照)',
    `invoice_type` TINYINT DEFAULT 0 COMMENT '发票类型 0-不开发票 1-个人 2-企业',
    `invoice_title` VARCHAR(200) DEFAULT NULL COMMENT '发票抬头',
    `invoice_tax_no` VARCHAR(50) DEFAULT NULL COMMENT '税号',
    `logistics_company` VARCHAR(50) DEFAULT NULL COMMENT '快递公司',
    `logistics_no` VARCHAR(50) DEFAULT NULL COMMENT '快递单号',
    `buyer_message` VARCHAR(500) DEFAULT NULL COMMENT '买家留言',
    `admin_note` VARCHAR(500) DEFAULT NULL COMMENT '管理员备注',
    `finish_time` DATETIME DEFAULT NULL COMMENT '完成时间',
    `cancel_time` DATETIME DEFAULT NULL COMMENT '取消时间',
    `cancel_reason` VARCHAR(500) DEFAULT NULL COMMENT '取消原因',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_pay_deadline` (`pay_deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单主表';

-- ============================================================
-- 10. 订单明细表
-- ============================================================
DROP TABLE IF EXISTS `order_item`;
CREATE TABLE `order_item` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '明细ID',
    `order_id` BIGINT NOT NULL COMMENT '订单ID',
    `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
    `product_id` BIGINT NOT NULL COMMENT '商品ID',
    `sku_id` BIGINT DEFAULT NULL COMMENT '规格ID',
    `product_name` VARCHAR(200) NOT NULL COMMENT '商品名称(快照)',
    `product_image` VARCHAR(255) DEFAULT NULL COMMENT '商品图片(快照)',
    `sku_name` VARCHAR(100) DEFAULT NULL COMMENT '规格名称(快照)',
    `price` DECIMAL(10,2) NOT NULL COMMENT '单价',
    `quantity` INT NOT NULL COMMENT '数量',
    `total_price` DECIMAL(10,2) NOT NULL COMMENT '小计',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';

-- ============================================================
-- 11. 优惠券表
-- ============================================================
DROP TABLE IF EXISTS `coupon`;
CREATE TABLE `coupon` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '优惠券ID',
    `name` VARCHAR(100) NOT NULL COMMENT '优惠券名称',
    `type` TINYINT DEFAULT 1 COMMENT '类型 1-满减券 2-折扣券 3-无门槛券',
    `full_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '满多少可用',
    `reduce_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '减多少/折扣率',
    `total_count` INT DEFAULT 0 COMMENT '发放总量',
    `received_count` INT DEFAULT 0 COMMENT '已领取量',
    `used_count` INT DEFAULT 0 COMMENT '已使用量',
    `per_limit` INT DEFAULT 1 COMMENT '每人限领',
    `start_time` DATETIME NOT NULL COMMENT '有效期开始',
    `end_time` DATETIME NOT NULL COMMENT '有效期结束',
    `status` TINYINT DEFAULT 1 COMMENT '状态 0-停用 1-启用',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '使用说明',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠券表';

-- ============================================================
-- 12. 用户优惠券表 (用户领取的优惠券)
-- ============================================================
DROP TABLE IF EXISTS `user_coupon`;
CREATE TABLE `user_coupon` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `coupon_id` BIGINT NOT NULL COMMENT '优惠券ID',
    `status` TINYINT DEFAULT 1 COMMENT '状态 1-未使用 2-已使用 3-已过期',
    `use_time` DATETIME DEFAULT NULL COMMENT '使用时间',
    `order_no` VARCHAR(32) DEFAULT NULL COMMENT '使用的订单号',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_coupon_id` (`coupon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户优惠券表';

-- ============================================================
-- 13. 商品评价表
-- ============================================================
DROP TABLE IF EXISTS `review`;
CREATE TABLE `review` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '评价ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `order_id` BIGINT NOT NULL COMMENT '订单ID',
    `product_id` BIGINT NOT NULL COMMENT '商品ID',
    `sku_name` VARCHAR(100) DEFAULT NULL COMMENT '购买规格',
    `star` TINYINT NOT NULL COMMENT '评分 1-5星',
    `content` TEXT COMMENT '评价内容',
    `images` VARCHAR(1000) DEFAULT NULL COMMENT '评价图片(逗号分隔)',
    `is_anonymous` TINYINT DEFAULT 0 COMMENT '是否匿名 0-否 1-是',
    `is_audited` TINYINT DEFAULT 0 COMMENT '是否审核 0-待审核 1-通过 2-驳回',
    `seller_reply` TEXT COMMENT '商家回复',
    `reply_time` DATETIME DEFAULT NULL COMMENT '回复时间',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`),
    KEY `idx_product_id` (`product_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品评价表';

-- ============================================================
-- 14. 评价追评表
-- ============================================================
DROP TABLE IF EXISTS `review_append`;
CREATE TABLE `review_append` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '追评ID',
    `review_id` BIGINT NOT NULL COMMENT '评价ID',
    `content` TEXT NOT NULL COMMENT '追评内容',
    `images` VARCHAR(1000) DEFAULT NULL COMMENT '追评图片',
    `is_audited` TINYINT DEFAULT 0 COMMENT '是否审核',
    `seller_reply` TEXT COMMENT '商家回复追评',
    `reply_time` DATETIME DEFAULT NULL COMMENT '回复时间',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '追评时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`),
    KEY `idx_review_id` (`review_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价追评表';

-- ============================================================
-- 15. 轮播图表
-- ============================================================
DROP TABLE IF EXISTS `banner`;
CREATE TABLE `banner` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '轮播图ID',
    `title` VARCHAR(100) DEFAULT NULL COMMENT '标题',
    `image_url` VARCHAR(255) NOT NULL COMMENT '图片URL',
    `link_url` VARCHAR(255) DEFAULT NULL COMMENT '跳转链接',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `status` TINYINT DEFAULT 1 COMMENT '状态 0-禁用 1-启用',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轮播图表';

-- ============================================================
-- 16. 退款申请表
-- ============================================================
DROP TABLE IF EXISTS `refund`;
CREATE TABLE `refund` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '退款ID',
    `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
    `order_id` BIGINT NOT NULL COMMENT '订单ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `refund_no` VARCHAR(32) NOT NULL COMMENT '退款编号',
    `refund_amount` DECIMAL(10,2) NOT NULL COMMENT '退款金额',
    `reason` VARCHAR(500) NOT NULL COMMENT '退款原因',
    `type` TINYINT DEFAULT 1 COMMENT '类型 1-仅退款 2-退货退款',
    `images` VARCHAR(1000) DEFAULT NULL COMMENT '凭证图片',
    `status` TINYINT DEFAULT 0 COMMENT '状态 0-待审核 1-同意 2-拒绝 3-完成',
    `refuse_reason` VARCHAR(500) DEFAULT NULL COMMENT '拒绝原因',
    `return_logistics_company` VARCHAR(50) DEFAULT NULL COMMENT '退货快递公司',
    `return_logistics_no` VARCHAR(50) DEFAULT NULL COMMENT '退货快递单号',
    `handle_time` DATETIME DEFAULT NULL COMMENT '处理时间',
    `finish_time` DATETIME DEFAULT NULL COMMENT '完成时间',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '软删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_refund_no` (`refund_no`),
    KEY `idx_order_no` (`order_no`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='退款申请表';

-- ============================================================
-- 17. 用户收藏表
-- ============================================================
DROP TABLE IF EXISTS `favorite`;
CREATE TABLE `favorite` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `product_id` BIGINT NOT NULL COMMENT '商品ID',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_product` (`user_id`,`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

-- ============================================================
-- 18. 用户足迹表
-- ============================================================
DROP TABLE IF EXISTS `footprint`;
CREATE TABLE `footprint` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '足迹ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `product_id` BIGINT NOT NULL COMMENT '商品ID',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '浏览时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户足迹表';

-- ============================================================
-- 19. 短信验证码表
-- ============================================================
DROP TABLE IF EXISTS `sms_code`;
CREATE TABLE `sms_code` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
    `code` VARCHAR(10) NOT NULL COMMENT '验证码',
    `type` VARCHAR(20) DEFAULT 'login' COMMENT '类型 login/register/reset_password',
    `used` TINYINT DEFAULT 0 COMMENT '是否已使用',
    `expire_time` DATETIME NOT NULL COMMENT '过期时间',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_phone_type` (`phone`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短信验证码表';

-- ============================================================
-- 20. 系统配置表
-- ============================================================
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
    `config_value` TEXT COMMENT '配置值',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '说明',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================================
-- 插入测试演示数据
-- ============================================================

-- 管理员数据 (密码: admin123 的MD5加密值)
INSERT INTO `admin` (`username`, `password`, `nickname`, `role`, `phone`) VALUES
('admin', '0192023a7bbd73250516f069df18b500', '观锦阁管理员', 'super_admin', '13800000000');

-- 用户数据 (密码: 123456 的MD5加密值)
INSERT INTO `user` (`username`, `password`, `phone`, `nickname`, `gender`) VALUES
('zhangsan', 'e10adc3949ba59abbe56e057f20f883e', '13800000001', '古风爱好者张三', 2),
('lisi', 'e10adc3949ba59abbe56e057f20f883e', '13800000002', '汉服小李', 1);

-- 商品分类数据
INSERT INTO `category` (`id`, `name`, `parent_id`, `level`, `icon`, `sort_order`) VALUES
(1, '唐制汉服', 0, 1, 'https://picsum.photos/seed/cat-tang.png', 1),
(2, '宋制汉服', 0, 1, 'https://picsum.photos/seed/cat-song.png', 2),
(3, '明制汉服', 0, 1, 'https://picsum.photos/seed/cat-ming.png', 3),
(4, '古风婚服', 0, 1, 'https://picsum.photos/seed/cat-wedding.png', 4),
(5, '古风配饰', 0, 1, 'https://picsum.photos/seed/cat-accessory.png', 5),
(6, '改良古装', 0, 1, 'https://picsum.photos/seed/cat-modern.png', 6),
(7, '古风演出服', 0, 1, 'https://picsum.photos/seed/cat-stage.png', 7);

-- 商品测试数据 (观锦阁古装样品)
INSERT INTO `product` (`name`, `subtitle`, `category_id`, `brand`, `description`, `price`, `promotion_price`, `stock`, `sales_count`, `cover_image`, `dynasty`, `fabric`, `color`, `is_hot`, `is_new`, `is_recommend`, `keyword`) VALUES
('云裳霓裳齐胸襦裙', '盛唐气韵 华丽飘逸 观锦阁匠心之作', 1, '观锦阁', '<p>采用高品质丝绸与雪纺面料精心制作。上身为对襟短衫搭配齐胸裙，裙身采用渐变染色工艺，色彩如云霞般绚丽。</p><p>面料：真丝雪纺<br/>工艺：手工渐变染色、金银线刺绣<br/>尺码：S/M/L/XL<br/>适用场景：日常出行、古风聚会、摄影写真</p>', 899.00, 699.00, 200, 1860, '/image/云裳霓裳齐胸襦裙.jpg', '唐', '真丝雪纺', '渐变红', 1, 0, 1, '唐制 齐胸襦裙 汉服 渐变 刺绣'),
('清平调宋制长褙子', '清雅婉约 宋风雅韵 日常通勤汉服', 2, '观锦阁', '<p>以宋代清雅风格为设计灵感，选用优质天丝面料，轻薄透气。</p><p>面料：天丝混纺<br/>工艺：线条绣花<br/>尺码：S/M/L/XL<br/>适用场景：日常通勤、茶会雅集</p>', 599.00, 459.00, 150, 1200, '/image/清平调宋制长褙子.png', '宋', '天丝混纺', '淡蓝色', 1, 0, 1, '宋制 长褙子 汉服 日常 清雅'),
('凤冠霞帔明制婚服', '明制大婚盛装 龙凤呈祥 十里红妆', 4, '观锦阁', '<p>还原明代皇家婚礼形制。包含：霞帔、大衫、马面裙、云肩四件套。</p><p>面料：织锦缎<br/>工艺：盘金绣、珠绣<br/>尺码：定制<br/>适用场景：汉服婚礼</p>', 8999.00, 6999.00, 20, 56, '/image/凤冠霞帔明制婚服.png', '明', '织锦缎', '正红色', 1, 1, 1, '明制 婚服 凤冠霞帔 婚礼 定制'),
('蝶恋花明制马面裙', '端庄典雅 明制经典 织金妆花', 3, '观锦阁', '<p>采用妆花织金工艺，蝴蝶与花卉图案栩栩如生。</p><p>面料：织锦缎<br/>工艺：妆花织金<br/>尺码：S/M/L/XL<br/>适用场景：正式场合、节日庆典</p>', 1299.00, 999.00, 80, 650, '/image/蝶恋花明制马面裙.jpg', '明', '织锦缎', '藏蓝色', 1, 0, 1, '明制 马面裙 妆花 织金 蝴蝶'),
('碧落星辰唐制大袖衫', '仙气飘飘 唐风大袖 星河璀璨', 1, '观锦阁', '<p>采用轻薄真丝面料，袖口与衣摆点缀星辰刺绣，飘逸灵动。</p><p>面料：真丝<br/>工艺：珠片绣<br/>尺码：均码<br/>适用场景：演出、写真、古风走秀</p>', 1599.00, 1299.00, 60, 420, '/image/碧落星辰唐制大袖衫.webp', '唐', '真丝', '星空蓝', 1, 0, 1, '唐制 大袖衫 真丝 刺绣 仙气'),
('墨竹宋制圆领袍', '文人雅士 宋风儒雅 办公通勤', 2, '观锦阁', '<p>以宋代文人服饰为蓝本，融入现代改良设计，适合日常穿着。</p><p>面料：棉麻混纺<br/>工艺：竹叶印花<br/>尺码：S/M/L/XL<br/>适用场景：日常、茶道、书法</p>', 799.00, 599.00, 120, 890, '/image/墨竹宋制圆领袍.webp', '宋', '棉麻混纺', '墨色', 0, 1, 1, '宋制 圆领袍 文人 日常 改良'),
('璎珞锦绣发簪套装', '古风发饰 手工缠花 精美头饰', 5, '观锦阁', '<p>纯手工缠花工艺，包含主簪一支、辅簪两支、发梳一把。</p><p>材质：铜镀金、淡水珍珠、玛瑙<br/>工艺：手工缠花<br/>适用：汉服搭配、古风造型</p>', 299.00, 199.00, 300, 2300, '/image/璎珞锦绣发簪套装.jpeg', '配饰', '铜镀金', '金色', 1, 0, 1, '发簪 配饰 手工 缠花 头饰'),
('步步生莲绣花鞋', '古风绣鞋 手工苏绣 莲步轻移', 5, '观锦阁', '<p>鞋面手工苏绣莲花图案，软底舒适，古风日常两相宜。</p><p>材质：绸缎鞋面、牛皮鞋底<br/>工艺：苏绣<br/>尺码：35-40</p>', 399.00, 299.00, 200, 1500, '/image/步步生莲绣花鞋.webp', '配饰', '绸缎', '粉色', 1, 0, 1, '绣花鞋 苏绣 古风鞋 舒适 手工'),
('霓裳羽衣改良旗袍', '现代改良 优雅古韵 日常时尚', 6, '观锦阁', '<p>将传统旗袍与现代时尚结合，立领盘扣设计搭配A字裙摆。</p><p>面料：丝绒<br/>工艺：盘扣、滚边<br/>尺码：S/M/L/XL</p>', 699.00, 499.00, 100, 780, '/image/霓裳羽衣改良旗袍.webp', '改良', '丝绒', '酒红色', 0, 1, 1, '改良 旗袍 现代 日常 优雅'),
('兰陵王入阵曲演出服', '舞台风采 华丽复原 将军战袍', 7, '观锦阁', '<p>参考北齐兰陵王传说设计，华丽战袍风格舞台装。</p><p>面料：锦缎<br/>工艺：烫金印花<br/>尺码：定制</p>', 2599.00, 1999.00, 30, 120, '/image/兰陵王入阵曲演出服.webp', '演出服', '锦缎', '金色', 0, 0, 1, '演出服 舞台 兰陵王 战袍 华丽'),
-- === 以下为扩充商品（每个分类3-5款） ===
-- 唐制 (category_id=1)
('花间集唐风齐腰襦裙', '唐风雅韵 花间美人 日常可穿', 1, '观锦阁', '<p>齐腰设计更显腰身，轻便适合日常出行。</p><p>面料：雪纺<br/>工艺：数码印花<br/>尺码：S/M/L/XL</p>', 599.00, 459.00, 180, 1100, '/image/花间集唐风齐腰襦裙.jpg', '唐', '雪纺', '鹅黄色', 1, 0, 1, '唐制 齐腰 襦裙 印花 日常'),
('飞天敦煌唐制披帛套装', '敦煌飞天 异域风情 华丽披帛', 1, '观锦阁', '<p>敦煌飞天壁画灵感，搭配长披帛飘逸动人。</p><p>面料：真丝 chiffon<br/>工艺：手工渐变染色<br/>尺码：S/M/L</p>', 1299.00, 999.00, 70, 680, '/image/飞天敦煌唐制披帛套装.jpg', '唐', '真丝', '渐变橙', 1, 1, 1, '唐制 敦煌 披帛 异域 华丽'),
('长安十二时辰唐制圆领袍', '盛唐男装 英武不凡 还原考究', 1, '观锦阁', '<p>参考唐代壁画圆领袍形制，男女皆可穿。</p><p>面料：棉麻<br/>工艺：手工盘扣<br/>尺码：S/M/L/XL</p>', 899.00, 699.00, 90, 550, '/image/长安十二时辰唐制圆领袍.webp', '唐', '棉麻', '深红色', 0, 1, 1, '唐制 圆领袍 男装 英武'),
-- 宋制 (category_id=2)
('如梦令宋制百迭裙', '清雅百迭 层层叠叠 宋风雅韵', 2, '观锦阁', '<p>百迭裙设计，层叠飘逸，搭配飞机袖短衫。</p><p>面料：天丝<br/>工艺：手工打褶<br/>尺码：S/M/L</p>', 459.00, 359.00, 200, 980, '/image/如梦令宋制百迭裙.webp', '宋', '天丝', '浅青色', 1, 0, 1, '宋制 百迭裙 天丝 雅致'),
('点绛唇宋制对襟衫', '轻纱曼妙 婉约动人 宋制经典', 2, '观锦阁', '<p>对襟设计，搭配抹胸内搭，宋制经典三件套。</p><p>面料：真丝纱<br/>工艺：手工包边<br/>尺码：S/M/L/XL</p>', 699.00, 529.00, 130, 720, '/image/点绛唇宋制对襟衫.jpg', '宋', '真丝纱', '粉白色', 0, 0, 1, '宋制 对襟衫 真丝 婉约'),
-- 明制 (category_id=3)
('金缕衣明制立领长衫', '端庄大方 立领斜襟 大家闺秀', 3, '观锦阁', '<p>明制立领长衫，搭配马面裙，尽显端庄气质。</p><p>面料：织锦缎<br/>工艺：盘金绣<br/>尺码：S/M/L/XL</p>', 1599.00, 1299.00, 60, 430, '/image/金缕衣明制立领长衫.jpg', '明', '织锦缎', '宝蓝色', 1, 0, 1, '明制 立领 长衫 端庄 织金'),
('牡丹亭明制比甲', '比甲马面 明制经典 牡丹纹样', 3, '观锦阁', '<p>比甲搭配马面裙，牡丹纹样妆花工艺。</p><p>面料：织锦<br/>工艺：妆花<br/>尺码：S/M/L</p>', 1099.00, 899.00, 75, 380, '/image/牡丹亭明制比甲.jpg', '明', '织锦', '正红色', 0, 1, 1, '明制 比甲 牡丹 妆花'),
-- 婚服 (category_id=4)
('鸳鸯织锦宋制婚服', '宋制婚礼 鸳鸯比翼 简约典雅', 4, '观锦阁', '<p>宋制婚服套装，含褙子、百迭裙、盖头。</p><p>面料：真丝缎<br/>工艺：苏绣鸳鸯<br/>尺码：定制</p>', 5999.00, 4999.00, 15, 35, '/image/鸳鸯织锦宋制婚服.png', '宋', '真丝缎', '大红色', 1, 0, 1, '婚服 宋制 鸳鸯 苏绣'),
-- 配饰 (category_id=5)
('流云百福发冠', '仿点翠工艺 古典发冠 百福纹样', 5, '观锦阁', '<p>仿点翠工艺发冠，百福纹样寓意吉祥。</p><p>材质：铜镀金、珐琅<br/>工艺：仿点翠<br/>适用：汉服婚礼、重要场合</p>', 599.00, 459.00, 80, 620, '/image/流云百福发冠.webp', '配饰', '铜镀金', '翠蓝色', 1, 0, 1, '发冠 点翠 配饰 华丽'),
('如意云肩披帛', '双层绣花 云肩设计 如意纹样', 5, '观锦阁', '<p>双层绣花云肩，如意纹样，可搭配各类汉服。</p><p>材质：丝绸<br/>工艺：双面绣<br/>适用：唐制/明制汉服搭配</p>', 259.00, 199.00, 250, 1800, '/image/如意云肩披帛.jpg', '配饰', '丝绸', '金色', 0, 1, 1, '云肩 披帛 配饰 绣花'),
('宫灯耳坠', '古风耳饰 宫灯造型 精致玲珑', 5, '观锦阁', '<p>宫灯造型耳坠，小巧精致，日常汉服皆宜。</p><p>材质：银镀金、玛瑙<br/>工艺：手工錾刻<br/>适用：日常搭配</p>', 169.00, 129.00, 400, 3200, '/image/宫灯耳坠.jpg', '配饰', '银镀金', '红色', 1, 0, 1, '耳坠 宫灯 精致 日常'),
-- 改良 (category_id=6)
('竹韵改良汉元素连衣裙', '汉元素日常 舒适实穿 职场可穿', 6, '观锦阁', '<p>汉元素改良连衣裙，保留交领右衽设计，A字裙摆。</p><p>面料：棉麻混纺<br/>尺码：S/M/L/XL</p>', 499.00, 399.00, 150, 850, '/image/竹韵改良汉元素连衣裙.webp', '改良', '棉麻', '竹青色', 1, 0, 1, '改良 连衣裙 日常 汉元素'),
('清风改良阔腿裤套装', '新中式套装 阔腿裤 通勤百搭', 6, '观锦阁', '<p>立领盘扣上衣搭配阔腿裤，新中式风格。</p><p>面料：天丝亚麻<br/>尺码：S/M/L/XL</p>', 599.00, 459.00, 120, 680, '/image/清风改良阔腿裤套装.webp', '改良', '天丝亚麻', '米白色', 0, 0, 1, '改良 阔腿裤 新中式 通勤'),
-- 演出服 (category_id=7)
('贵妃醉酒京剧戏服', '京剧风格 贵妃华服 舞台精品', 7, '观锦阁', '<p>京剧贵妃醉酒风格戏服，重工刺绣。</p><p>面料：重磅真丝<br/>工艺：盘金满绣<br/>尺码：定制</p>', 3999.00, 2999.00, 15, 80, '/image/贵妃醉酒京剧戏服.jpg', '演出服', '重磅真丝', '明黄色', 0, 0, 1, '演出服 京剧 戏服 贵妃'),
('剑舞江湖武侠演出服', '武侠风格 剑客长衫 潇洒飘逸', 7, '观锦阁', '<p>武侠影视演出服，剑客长衫风格。</p><p>面料：厚缎<br/>尺码：定制</p>', 1899.00, 1499.00, 25, 95, '/image/剑舞江湖武侠演出服.webp', '演出服', '厚缎', '白色', 0, 1, 1, '演出服 武侠 剑客 飘逸'),
('敦煌飞天舞蹈服', '飞天舞蹈 飘带设计 舞台首选', 7, '观锦阁', '<p>敦煌飞天舞蹈服装，多层飘带设计。</p><p>面料：弹力雪纺<br/>尺码：定制</p>', 2199.00, 1799.00, 20, 110, '/image/敦煌飞天舞蹈服.webp', '演出服', '弹力雪纺', '渐变彩色', 1, 0, 1, '演出服 舞蹈 飞天 飘带');

-- 商品规格数据
INSERT INTO `product_sku` (`product_id`, `sku_name`, `spec_json`, `price`, `stock`) VALUES
(1, 'S-渐变红', '{"size":"S","color":"渐变红"}', 699.00, 50),
(1, 'M-渐变红', '{"size":"M","color":"渐变红"}', 699.00, 60),
(1, 'L-渐变红', '{"size":"L","color":"渐变红"}', 699.00, 40),
(2, 'S-淡蓝色', '{"size":"S","color":"淡蓝色"}', 459.00, 35),
(2, 'M-淡蓝色', '{"size":"M","color":"淡蓝色"}', 459.00, 50),
(2, 'L-淡蓝色', '{"size":"L","color":"淡蓝色"}', 459.00, 30),
(4, 'S-藏蓝色', '{"size":"S","color":"藏蓝色"}', 999.00, 25),
(4, 'M-藏蓝色', '{"size":"M","color":"藏蓝色"}', 999.00, 30),
(4, 'L-藏蓝色', '{"size":"L","color":"藏蓝色"}', 999.00, 20);

-- 商品图片数据
INSERT INTO `product_image` (`product_id`, `image_url`, `type`, `sort_order`) VALUES
(1, 'https://picsum.photos/seed/hanfu-tang-a/400/500', 1, 1),
(1, 'https://picsum.photos/seed/hanfu-tang-b/400/500', 1, 2),
(1, 'https://picsum.photos/seed/hanfu-tang-c/400/500', 1, 3),
(1, 'https://picsum.photos/seed/hanfu-tang-d/800/1000', 2, 1),
(2, 'https://picsum.photos/seed/hanfu-song-a/400/500', 1, 1),
(2, 'https://picsum.photos/seed/hanfu-song-b/400/500', 1, 2),
(2, 'https://picsum.photos/seed/hanfu-song-d/800/1000', 2, 1);

-- 轮播图数据
INSERT INTO `banner` (`title`, `image_url`, `link_url`, `sort_order`) VALUES
('新品上市 唐风齐胸襦裙', 'https://picsum.photos/seed/banner-tang/1200/400', '/product/1', 1),
('宋制汉服 清雅上新', 'https://picsum.photos/seed/banner-song/1200/400', '/category/2', 2),
('明制婚服 凤冠霞帔', 'https://picsum.photos/seed/banner-ming/1200/400', '/product/3', 3);

-- 优惠券数据
INSERT INTO `coupon` (`name`, `type`, `full_amount`, `reduce_amount`, `total_count`, `start_time`, `end_time`, `description`) VALUES
('新人大礼包', 2, 0.00, 8.50, 1000, '2025-01-01 00:00:00', '2027-12-31 23:59:59', '新用户专享85折，不限品类'),
('满减券-满200减30', 1, 200.00, 30.00, 500, '2025-01-01 00:00:00', '2027-12-31 23:59:59', '全场通用，满200减30'),
('唐风专场-满500减80', 1, 500.00, 80.00, 300, '2025-01-01 00:00:00', '2027-12-31 23:59:59', '唐制汉服专享，满500减80');

-- 系统配置数据
INSERT INTO `sys_config` (`config_key`, `config_value`, `description`) VALUES
('freight_free_threshold', '299', '免运费门槛(元)'),
('freight_fee', '15', '基础运费(元)'),
('order_pay_timeout', '30', '订单支付超时(分钟)'),
('site_name', '观锦阁', '网站名称');

-- 收货地址测试数据
INSERT INTO `address` (`user_id`, `receiver_name`, `receiver_phone`, `province`, `city`, `district`, `detail`, `is_default`) VALUES
(1, '张三', '13800000001', '浙江省', '杭州市', '西湖区', '古墩路888号汉服大厦1201室', 1);
