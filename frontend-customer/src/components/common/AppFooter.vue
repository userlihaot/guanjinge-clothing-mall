<template>
  <!-- 观锦阁页脚 - 国风设计 -->
  <footer class="app-footer">
    <div class="footer-container">
      <!-- 链接区域 - 四列布局 -->
      <div class="footer-links">
        <!-- 购物指南 -->
        <div class="footer-column">
          <h4 class="column-title">购物指南</h4>
          <ul class="column-list">
            <li><router-link to="/products">全部商品</router-link></li>
            <li><router-link to="/products?category=hanfu">汉服专区</router-link></li>
            <li><router-link to="/products?category=cheongsam">旗袍专区</router-link></li>
            <li><router-link to="/products?category=tang">唐装专区</router-link></li>
            <li><router-link to="/products?sort=new">新品上市</router-link></li>
          </ul>
        </div>

        <!-- 客户服务 -->
        <div class="footer-column">
          <h4 class="column-title">客户服务</h4>
          <ul class="column-list">
            <li><router-link to="/profile">个人中心</router-link></li>
            <li><router-link to="/orders">我的订单</router-link></li>
            <li><router-link to="/cart">购物车</router-link></li>
            <li><a href="#">退换货政策</a></li>
            <li><a href="#">尺码指南</a></li>
          </ul>
        </div>

        <!-- 关于我们 -->
        <div class="footer-column">
          <h4 class="column-title">关于观锦阁</h4>
          <ul class="column-list">
            <li><a href="#">品牌故事</a></li>
            <li><a href="#">工艺传承</a></li>
            <li><a href="#">联系我们</a></li>
            <li><a href="#">加入我们</a></li>
            <li><a href="#">隐私政策</a></li>
          </ul>
        </div>

        <!-- 联系方式 -->
        <div class="footer-column">
          <h4 class="column-title">联系方式</h4>
          <div class="contact-info">
            <p class="contact-item">
              <el-icon><Phone /></el-icon>
              <span>400-888-6688</span>
            </p>
            <p class="contact-item">
              <el-icon><Message /></el-icon>
              <span>service@guanjinge.com</span>
            </p>
            <p class="contact-item">
              <el-icon><Clock /></el-icon>
              <span>周一至周日 9:00 - 21:00</span>
            </p>
            <p class="contact-item address">
              <el-icon><Location /></el-icon>
              <span>浙江省杭州市西湖区古韵路88号</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="footer-divider"></div>

      <!-- 版权信息 -->
      <div class="footer-copyright">
        <p class="copyright-text">
          Copyright &copy; {{ currentYear }} 观锦阁 GuanJinGe. All Rights Reserved.
        </p>
        <p class="copyright-sub">
          观锦阁 | 传承华夏之美，锦绣中华衣裳
        </p>
        <p class="copyright-beian">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">浙ICP备2024000000号-1</a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { Phone, Message, Clock, Location } from '@element-plus/icons-vue'

// 当前年份，自动更新
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
/* ========== 页脚整体 ========== */
.app-footer {
  background: linear-gradient(180deg, #3D2B1F 0%, #2B1D14 100%);
  color: #C4B5A5;
  margin-top: var(--spacing-xxl);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xxl) var(--spacing-lg) var(--spacing-lg);
}

/* ========== 链接区域 ========== */
.footer-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-xl);
}

.column-title {
  font-family: var(--font-family-serif);
  font-size: 18px;
  color: var(--color-accent);
  margin-bottom: var(--spacing-md);
  position: relative;
  padding-bottom: var(--spacing-sm);
}

.column-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 30px;
  height: 2px;
  background: var(--color-accent);
  border-radius: 1px;
}

.column-list li {
  margin-bottom: 10px;
}

.column-list a {
  color: #B5A595;
  font-size: 14px;
  transition: color 0.3s ease;
}

.column-list a:hover {
  color: var(--color-accent-light);
}

/* ========== 联系方式 ========== */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #B5A595;
}

.contact-item .el-icon {
  color: var(--color-accent);
  font-size: 16px;
  flex-shrink: 0;
}

/* ========== 分割线 ========== */
.footer-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-accent),
    transparent
  );
  margin: var(--spacing-xl) 0;
}

/* ========== 版权信息 ========== */
.footer-copyright {
  text-align: center;
}

.copyright-text {
  font-size: 13px;
  color: #8B7B6B;
  margin-bottom: 4px;
}

.copyright-sub {
  font-family: var(--font-family-serif);
  font-size: 14px;
  color: var(--color-accent);
  margin-bottom: 4px;
}

.copyright-beian a {
  font-size: 12px;
  color: #7B6B5B;
}

.copyright-beian a:hover {
  color: var(--color-accent-light);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .footer-links {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
  }

  .footer-container {
    padding: var(--spacing-xl) var(--spacing-md) var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .footer-links {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .column-title::after {
    left: 50%;
    transform: translateX(-50%);
  }

  .contact-item {
    justify-content: center;
  }
}
</style>
