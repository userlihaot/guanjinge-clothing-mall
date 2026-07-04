/**
 * 用户模块路由 - 注册/登录/个人中心/短信验证码
 */
const router = require('express').Router();
const pool = require('../config/db');
const md5 = require('../utils/md5');
const jwtUtil = require('../utils/jwt');
const auth = require('../middleware/auth');

// POST /api/user/register - 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, password, phone, code, nickname } = req.body;
        if (!username || !password || !phone) {
            return res.json({ code: 400, message: '用户名、密码、手机号不能为空', data: null });
        }
        // 检查用户名和手机号是否已存在
        const [exist] = await pool.query(
            'SELECT id FROM user WHERE username = ? OR phone = ? AND deleted = 0',
            [username, phone]
        );
        if (exist.length > 0) {
            return res.json({ code: 400, message: '用户名或手机号已存在', data: null });
        }
        // 验证短信验证码（简化处理）
        // 创建用户
        const [result] = await pool.query(
            'INSERT INTO user (username, password, phone, nickname) VALUES (?, ?, ?, ?)',
            [username, md5(password), phone, nickname || username]
        );
        // 注册成功直接生成 JWT，实现"注册即登录"
        const token = jwtUtil.generateToken(result.insertId, 'user');
        res.json({
            code: 200,
            message: '注册成功',
            data: {
                token,
                userId: result.insertId,
                nickname: nickname || username,
                avatar: null
            }
        });
    } catch (err) {
        console.error('注册失败:', err);
        res.json({ code: 500, message: '注册失败', data: null });
    }
});

// POST /api/user/login/password - 密码登录（支持手机号或用户名）
router.post('/login/password', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const account = phone; // 可能是手机号或用户名
        if (!account || !password) {
            return res.json({ code: 400, message: '请输入账号和密码', data: null });
        }
        // 判断是手机号还是用户名：11位数字开头为手机号
        const isPhone = /^1\d{10}$/.test(account);
        const sql = isPhone
            ? 'SELECT id, username, phone, password, nickname, avatar, status FROM user WHERE phone = ? AND deleted = 0'
            : 'SELECT id, username, phone, password, nickname, avatar, status FROM user WHERE username = ? AND deleted = 0';
        const [users] = await pool.query(sql, [account]);
        if (users.length === 0) {
            return res.json({ code: 400, message: '账号不存在', data: null });
        }
        const user = users[0];
        if (user.status === 0) {
            return res.json({ code: 400, message: '账号已被禁用', data: null });
        }
        if (user.password !== md5(password)) {
            return res.json({ code: 400, message: '密码错误', data: null });
        }
        // 更新最后登录时间
        await pool.query('UPDATE user SET last_login_time = NOW() WHERE id = ?', [user.id]);
        // 生成JWT
        const token = jwtUtil.generateToken(user.id, 'user');
        res.json({
            code: 200,
            message: '登录成功',
            data: {
                token,
                userId: user.id,
                nickname: user.nickname,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('登录失败:', err);
        res.json({ code: 500, message: '登录失败', data: null });
    }
});

// POST /api/user/login/sms - 短信验证码登录
router.post('/login/sms', async (req, res) => {
    try {
        const { phone, code } = req.body;
        if (!phone || !code) {
            return res.json({ code: 400, message: '手机号和验证码不能为空', data: null });
        }
        // 验证短信码（模拟：接受任意6位数字）
        // 正式环境应查询sms_code表校验
        let [users] = await pool.query(
            'SELECT id, username, phone, nickname, avatar, status FROM user WHERE phone = ? AND deleted = 0',
            [phone]
        );
        let user;
        if (users.length === 0) {
            // 手机号未注册则自动注册
            const [result] = await pool.query(
                'INSERT INTO user (username, password, phone, nickname) VALUES (?, ?, ?, ?)',
                [phone, md5('123456'), phone, '用户' + phone.slice(-4)]
            );
            user = { id: result.insertId, nickname: '用户' + phone.slice(-4), avatar: null };
        } else {
            user = users[0];
            if (user.status === 0) {
                return res.json({ code: 400, message: '账号已被禁用', data: null });
            }
        }
        await pool.query('UPDATE user SET last_login_time = NOW() WHERE id = ?', [user.id]);
        const token = jwtUtil.generateToken(user.id, 'user');
        res.json({
            code: 200,
            message: '登录成功',
            data: { token, userId: user.id, nickname: user.nickname, avatar: user.avatar }
        });
    } catch (err) {
        console.error('短信登录失败:', err);
        res.json({ code: 500, message: '登录失败', data: null });
    }
});

// POST /api/user/sms - 发送短信验证码（模拟）
router.post('/sms', async (req, res) => {
    try {
        const { phone, type } = req.body;
        if (!phone) {
            return res.json({ code: 400, message: '手机号不能为空', data: null });
        }
        // 生成6位随机验证码
        const code = String(Math.floor(100000 + Math.random() * 900000));
        // 存入数据库
        await pool.query(
            'INSERT INTO sms_code (phone, code, type, expire_time) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
            [phone, code, type || 'login']
        );
        // 模拟发送（生产环境接入真实短信服务商）
        console.log(`【模拟短信】手机号: ${phone}, 验证码: ${code}`);
        res.json({ code: 200, message: '验证码已发送', data: { code } });  // 开发环境返回验证码，生产环境去掉
    } catch (err) {
        console.error('发送短信失败:', err);
        res.json({ code: 500, message: '发送失败', data: null });
    }
});

// GET /api/user/profile - 获取个人信息（需登录）
router.get('/profile', auth, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, phone, nickname, avatar, gender, birthday, email, create_time FROM user WHERE id = ? AND deleted = 0',
            [req.user.userId]
        );
        if (users.length === 0) {
            return res.json({ code: 400, message: '用户不存在', data: null });
        }
        res.json({ code: 200, message: 'success', data: users[0] });
    } catch (err) {
        console.error('获取个人信息失败:', err);
        res.json({ code: 500, message: '获取失败', data: null });
    }
});

// PUT /api/user/profile - 修改个人信息（需登录）
router.put('/profile', auth, async (req, res) => {
    try {
        const { nickname, avatar, gender, birthday, email } = req.body;
        await pool.query(
            'UPDATE user SET nickname = ?, avatar = ?, gender = ?, birthday = ?, email = ? WHERE id = ?',
            [nickname, avatar, gender, birthday, email, req.user.userId]
        );
        res.json({ code: 200, message: '修改成功', data: null });
    } catch (err) {
        console.error('修改个人信息失败:', err);
        res.json({ code: 500, message: '修改失败', data: null });
    }
});

// PUT /api/user/password - 修改密码（需登录）
router.put('/password', auth, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.json({ code: 400, message: '旧密码和新密码不能为空', data: null });
        }
        // 验证旧密码
        const [users] = await pool.query('SELECT password FROM user WHERE id = ?', [req.user.userId]);
        if (users[0].password !== md5(oldPassword)) {
            return res.json({ code: 400, message: '旧密码错误', data: null });
        }
        await pool.query('UPDATE user SET password = ? WHERE id = ?', [md5(newPassword), req.user.userId]);
        res.json({ code: 200, message: '密码修改成功', data: null });
    } catch (err) {
        console.error('修改密码失败:', err);
        res.json({ code: 500, message: '修改失败', data: null });
    }
});

module.exports = router;
