<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-content">
        <div class="brand">
          <Logo />
        </div>
        <nav class="nav-menu">
          <a href="#" class="nav-item active">📊 仪表板</a>
          <a href="#" class="nav-item">📝 文章管理</a>
          <a href="#" class="nav-item">⚙️ 设置</a>
        </nav>        <div class="user-menu">
          <div class="user-avatar-section" @click="toggleUserDropdown">
            <div class="user-avatar">
              <img 
                v-if="userInfo.avatar" 
                :src="userInfo.avatar" 
                :alt="userInfo.nickname || userInfo.username"
                @error="onAvatarError"
              >
              <div v-else class="avatar-placeholder">
                {{ (userInfo.nickname || userInfo.username || '用户').charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="user-info">
              <span class="user-name">{{ userInfo.nickname || userInfo.username || '用户' }}</span>
              <span class="user-email">{{ userInfo.email || '邮箱未设置' }}</span>
            </div>
            <div class="dropdown-arrow">
              <span :class="{ 'rotated': showUserDropdown }">▼</span>
            </div>
          </div>
          
          <!-- 用户下拉菜单 -->
          <div v-if="showUserDropdown" class="user-dropdown" @click.stop>
            <div class="dropdown-item" @click="showProfileEditor = true">
              <span class="dropdown-icon">⚙️</span>
              <span>编辑个人资料</span>
            </div>
            <div class="dropdown-item" @click="viewProfile">
              <span class="dropdown-icon">👤</span>
              <span>查看个人主页</span>
            </div>
            <div class="dropdown-item" @click="openSettings">
              <span class="dropdown-icon">🛠️</span>
              <span>账户设置</span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item logout" @click="handleLogout">
              <span class="dropdown-icon">🔓</span>
              <span>退出登录</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="dashboard-main">
      <div class="welcome-section">
        <h1>欢迎回来，{{ userInfo.username || '用户' }}！</h1>
        <p class="welcome-subtitle">这里是您的文章管理仪表板</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <h3>文章总数</h3>
            <div class="stat-number">{{ stats.totalArticles }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">👀</div>
          <div class="stat-info">
            <h3>总浏览量</h3>
            <div class="stat-number">{{ stats.totalViews }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💭</div>
          <div class="stat-info">
            <h3>评论数</h3>
            <div class="stat-number">{{ stats.totalComments }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-info">
            <h3>获赞数</h3>
            <div class="stat-number">{{ stats.totalLikes }}</div>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="recent-articles">
          <h2>最近文章</h2>
          <div class="article-list">
            <div v-for="article in recentArticles" :key="article.id" class="article-item">
              <div class="article-meta">
                <h3>{{ article.title }}</h3>
                <p>{{ article.excerpt }}</p>
                <div class="article-stats">
                  <span>👀 {{ article.views }}</span>
                  <span>💭 {{ article.comments }}</span>
                  <span>📅 {{ formatDate(article.date) }}</span>
                </div>
              </div>
              <div class="article-actions">
                <button class="action-btn edit" @click="editArticle(article)">编辑</button>
                <button class="action-btn view" @click="viewArticle(article)">查看</button>
              </div>
            </div>
          </div>
          <div v-if="recentArticles.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>还没有文章</h3>
            <p>开始创建您的第一篇文章吧！</p>
            <button class="create-btn" @click="createArticle">创建文章</button>
          </div>
        </div>

        <div class="quick-actions">
          <h2>快捷操作</h2>
          <div class="action-list">
            <button class="quick-action-btn" @click="createArticle">
              <span class="action-icon">✏️</span>
              <span class="action-text">写新文章</span>
            </button>
            <button class="quick-action-btn" @click="viewStats">
              <span class="action-icon">📊</span>
              <span class="action-text">查看统计</span>
            </button>
            <button class="quick-action-btn" @click="openSettings">
              <span class="action-icon">🔧</span>
              <span class="action-text">管理设置</span>
            </button>
            <button class="quick-action-btn" @click="exportData">
              <span class="action-icon">💾</span>
              <span class="action-text">导出数据</span>
            </button>
          </div>        </div>
      </div>
    </main>

    <!-- 用户信息编辑模态框 -->
    <div v-if="showProfileEditor" class="modal-overlay" @click="closeProfileEditor">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑个人信息</h3>
          <button @click="closeProfileEditor" class="close-btn">✕</button>
        </div>
        <UserProfileEditor @updated="onProfileUpdated" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '@/components/Logo.vue'
import UserProfileEditor from '@/components/UserProfileEditor.vue'

const router = useRouter()

const userInfo = reactive({
  username: '',
  nickname: '',
  email: '',
  avatar: ''
})

const showProfileEditor = ref(false)
const showUserDropdown = ref(false)

const stats = reactive({
  totalArticles: 0,
  totalViews: 0,
  totalComments: 0,
  totalLikes: 0
})

const recentArticles = ref([])

onMounted(() => {
  loadUserInfo()
  loadStats()
  loadRecentArticles()
  
  // 添加点击外部关闭下拉菜单的事件监听器
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('click', handleClickOutside)
})

const loadUserInfo = () => {
  // 从 localStorage 加载用户信息
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    const user = JSON.parse(savedUser)
    userInfo.username = user.username || user.name || '用户'
    userInfo.nickname = user.nickname || ''
    userInfo.email = user.email || '邮箱未设置'
    userInfo.avatar = user.avatar || ''
  }
}

const loadStats = () => {
  // 模拟加载统计数据 - 后续可以从 API 获取
  stats.totalArticles = 12
  stats.totalViews = 1456
  stats.totalComments = 89
  stats.totalLikes = 234
}

const loadRecentArticles = () => {
  // 模拟加载最近文章 - 后续可以从 API 获取
  recentArticles.value = [
    {
      id: 1,
      title: 'Vue3 组合式 API 实践',
      excerpt: '探讨 Vue3 组合式 API 的最佳实践和使用技巧...',
      views: 156,
      comments: 12,
      date: new Date('2024-01-15')
    },
    {
      id: 2,
      title: 'JavaScript 异步编程深度解析',
      excerpt: '从 Promise 到 async/await，全面理解 JS 异步编程...',
      views: 234,
      comments: 18,
      date: new Date('2024-01-10')
    },
    {
      id: 3,
      title: 'CSS Grid 布局完全指南',
      excerpt: 'CSS Grid 是现代网页布局的强大工具，本文将详细介绍...',
      views: 189,
      comments: 8,
      date: new Date('2024-01-05')
    }
  ]
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

// 切换用户下拉菜单
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  const userAvatarSection = event.target.closest('.user-avatar-section')
  const userDropdown = event.target.closest('.user-dropdown')
  
  if (!userAvatarSection && !userDropdown) {
    showUserDropdown.value = false
  }
}

// 头像加载错误处理
const onAvatarError = (event) => {
  event.target.style.display = 'none'
}

// 查看个人主页
const viewProfile = () => {
  showUserDropdown.value = false
  // 这里可以跳转到个人主页
  console.log('查看个人主页')
}

// 打开设置
const openSettings = () => {
  showUserDropdown.value = false
  // 这里可以跳转到设置页面
  console.log('打开设置')
}

// 关闭用户信息编辑器
const closeProfileEditor = () => {
  showProfileEditor.value = false
}

// 用户信息更新成功回调
const onProfileUpdated = () => {
  // 重新加载用户信息
  loadUserInfo()
  // 关闭编辑器
  closeProfileEditor()
}

const handleLogout = () => {
  // 清除本地存储的用户信息和 token
  localStorage.removeItem('userId')
  localStorage.removeItem('user')
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  
  // 跳转到登录页
  router.push('/login')
}

// 添加缺失的方法
const createArticle = () => {
  router.push('/articles')
}

const editArticle = (article) => {
  router.push(`/articles?edit=${article.id}`)
}

const viewArticle = (article) => {
  router.push(`/articles?view=${article.id}`)
}

const viewStats = () => {
  router.push('/statistics')
}

const exportData = () => {
  console.log('导出数据功能待实现')
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f8fafc;
}

.dashboard-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.brand {
  display: flex;
  align-items: center;
}

.nav-menu {
  display: flex;
  gap: 32px;
}

.nav-item {
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-item.active,
.nav-item:hover {
  color: #3b82f6;
  background: #eff6ff;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

/* 用户头像区域样式 */
.user-avatar-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.user-avatar-section:hover {
  background: #f8fafc;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e2e8f0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.dropdown-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.dropdown-arrow span.rotated {
  transform: rotate(180deg);
}

/* 用户下拉菜单样式 */
.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1001;
  overflow: hidden;
  animation: dropdownFadeIn 0.2s ease-out;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: #374151;
  font-size: 14px;
}

.dropdown-item:hover {
  background: #f9fafb;
}

.dropdown-item.logout {
  color: #dc2626;
}

.dropdown-item.logout:hover {
  background: #fef2f2;
}

.dropdown-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.dropdown-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 4px 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.user-email {
  font-size: 12px;
  color: #64748b;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-profile-btn {
  padding: 6px 12px;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 6px;
  color: #0ea5e9;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.edit-profile-btn:hover {
  background: #0ea5e9;
  color: white;
}

.logout-btn {
  padding: 6px 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #dc2626;
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

.welcome-section {
  margin-bottom: 32px;
}

.welcome-section h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.welcome-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e2e8f0;
}

.stat-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-info h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

.recent-articles,
.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.recent-articles h2,
.quick-actions h2 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.article-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
}

.article-item:last-child {
  border-bottom: none;
}

.article-meta h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.article-meta p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.4;
}

.article-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #64748b;
}

.article-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #64748b;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f8fafc;
}

.action-btn.edit:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.action-btn.view:hover {
  border-color: #10b981;
  color: #10b981;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #1e293b;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #64748b;
}

.create-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.create-btn:hover {
  background: #2563eb;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.quick-action-btn:hover {
  background: #f1f5f9;
  border-color: #d1d5db;
}

.action-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.action-text {
  font-weight: 500;
  color: #1e293b;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
    flex-wrap: wrap;
    height: auto;
    min-height: 64px;
  }
  
  .nav-menu {
    order: 3;
    width: 100%;
    justify-content: center;
    padding: 8px 0;
  }
  
  .dashboard-main {
    padding: 16px;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .article-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .article-actions {
    align-self: flex-start;
  }
}
</style>
