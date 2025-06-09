<template>
  <div class="category-manager-view">
    <!-- 顶部导航 -->
    <nav class="top-nav">
      <div class="nav-brand">
        <h1>📚 分类管理系统</h1>
      </div>
      <div class="nav-links">
        <router-link to="/articles" class="nav-link">📝 文章管理</router-link>
        <router-link to="/categories" class="nav-link active">📁 分类管理</router-link>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <CategoryManager />
    </main>
  </div>
</template>

<script setup>
import CategoryManager from '@/components/CategoryManager.vue'
</script>

<style scoped>
.category-manager-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.top-nav {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-brand h1 {
  color: white;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.main-content {
  padding: 2rem;
  display: flex;
  justify-content: center;
}
</style>
