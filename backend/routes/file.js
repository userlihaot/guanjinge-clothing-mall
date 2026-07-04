/**
 * 文件上传模块路由
 */
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');

// 配置multer存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const date = new Date();
        const dir = path.join(__dirname, '..', 'uploads',
            String(date.getFullYear()),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'));
        const fs = require('fs');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, uuidv4() + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 限制10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('仅支持jpg/png/gif/webp格式图片'));
        }
    }
});

// POST /api/file/upload - 上传文件（需登录）
router.post('/upload', auth, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.json({ code: 400, message: '请选择文件', data: null });
    }
    // 构建可访问的URL路径
    const relativePath = req.file.path.replace(/\\/g, '/');
    const urlIndex = relativePath.indexOf('uploads/');
    const url = '/' + relativePath.substring(urlIndex);
    res.json({ code: 200, message: '上传成功', data: { url, filename: req.file.filename } });
});

module.exports = router;
