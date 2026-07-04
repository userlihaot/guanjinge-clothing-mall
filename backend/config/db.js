/*
 * @Author: 李浩 lihao@example.com
 * @Date: 2026-06-15 09:57:51
 * @LastEditors: 李浩 lihao@example.com
 * @LastEditTime: 2026-06-15 10:07:56
 * @FilePath: \观锦阁\backend\config\db.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 数据库连接配置 - MySQL2 连接池
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'guanjinge',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

module.exports = pool;
