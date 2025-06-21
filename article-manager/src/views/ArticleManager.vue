<template>
  <div class="article-manager">
    <!-- 显示编辑器 -->
    <ArticleEditor 
      v-if="showEditor"
      :article-id="editingArticleId"
      :original-article="originalArticleData"
      @close="onEditorClose"
      @saved="onArticleSaved"
    />
    
    <!-- 显示文章管理界面 -->
    <div v-else class="manager-layout">
      <!-- 顶部导航栏 -->
      <header class="navbar">
        <div class="navbar-brand">
          <Logo class="logo" />
          <h1 class="brand-name">ArtMan</h1>
        </div>
        
        <div class="navbar-user">
          <div class="user-avatar" @click="toggleUserMenu">
            <img :src="userAvatar" :alt="userName" />
            <div class="user-status"></div>
          </div>
          
          <!-- 用户菜单下拉框 -->
          <div v-if="showUserMenu" class="user-menu" @click.stop>
            <div class="user-info">
              <img :src="userAvatar" :alt="userName" />
              <div class="user-details">
                <div class="user-name">{{ userName }}</div>
                <div class="user-email">{{ userEmail }}</div>
              </div>
            </div>
            <hr class="menu-divider">
            <ul class="menu-items">
              <li @click="editProfile">
                <i class="icon-edit"></i>
                <span>编辑个人资料</span>
              </li>
              <li @click="openSettings">
                <i class="icon-settings"></i>
                <span>设置</span>
              </li>
              <li @click="logout" class="logout-item">
                <i class="icon-logout"></i>
                <span>退出登录</span>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <!-- 主体内容区域 -->
      <main class="main-content">

        <!-- 左侧文章目录 -->
        <aside class="sidebar">
          <!-- 加载状态覆盖层 -->
          <div v-if="pagination.loading" class="loading-overlay">
            <div class="loading-spinner"></div>
          </div>
          <div class="sidebar-header">
            <h3>文章目录</h3>
            <div class="header-actions">
              <button class="btn-new-article" @click="createNewArticle">
                <i class="icon-plus"></i>
                新建文章
              </button>
              <router-link to="/categories" class="btn-manage-categories" title="分类管理">
                <i class="icon-folder"></i>
                分类管理
              </router-link>
            </div>
          </div>
          <div class="search-box">
            <i class="icon-search"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索文章... (按空格键或回车搜索)"
              @keyup.space="searchArticles"
              @keyup.enter="searchArticles"
            />
            <button 
              v-if="searchQuery.trim()" 
              class="search-clear-btn" 
              @click="clearFilters"
              title="清除搜索"
            >
              ×
            </button>
          </div>

          <!-- 搜索选项 -->
          <div class="search-options">
            <label class="search-type-label">搜索范围:</label>
            <div class="search-type-options">
              <label class="search-type-option">
                <input 
                  type="radio" 
                  v-model="searchState.type" 
                  value="simple"
                  @change="onSearchTypeChange"
                />
                <span>仅标题</span>
              </label>
              <label class="search-type-option">
                <input 
                  type="radio" 
                  v-model="searchState.type" 
                  value="complex"
                  @change="onSearchTypeChange"
                />
                <span>标题+内容</span>
              </label>
            </div>
          </div>
          
          <!-- 筛选控件 -->
          <div class="filter-controls">
            <select 
              v-model="searchState.filters.categoryId" 
              @change="filterByCategory(searchState.filters.categoryId)"
              class="filter-select"
            >
              <option value="">所有分类</option>
              <option v-for="category in flatCategories" :key="category.categoryId" :value="category.categoryId">
                {{ category.displayName }}
              </option>
            </select>
            
            <button 
              v-if="searchState.query || searchState.filters.categoryId" 
              @click="clearFilters"
              class="clear-filters-btn"
              title="清除筛选"
            >
              <i class="icon-close"></i>
            </button>
          </div>

          <!-- 文章分类和目录树 -->
          <div class="article-tree">
            <div class="tree-section">
              <div class="section-header" @click="toggleSection('recent')">
                <i :class="['icon-chevron', sectionExpanded.recent ? 'expanded' : '']"></i>
                <span>最近文章</span>
                <span class="count">({{ recentArticles.length }})</span>
              </div>
              <ul v-show="sectionExpanded.recent" class="tree-list">
                <li 
                  v-for="article in recentArticles" 
                  :key="article.id"
                  :class="['tree-item', { active: selectedArticle?.id === article.id }]"
                >
                  <div class="tree-item-content" @click="selectArticle(article)">
                    <i class="icon-document"></i>
                    <span class="article-title">{{ article.title }}</span>
                    <span class="article-date">{{ formatDate(article.updatedAt) }}</span>
                  </div>
                  <div class="tree-item-actions">
                    <button class="tree-action-btn" @click.stop="editArticle(article)" title="编辑">
                      <i class="icon-edit"></i>
                    </button>
                    <button class="tree-action-btn delete" @click.stop="deleteArticle(article)" title="删除">
                      <i class="icon-delete"></i>
                    </button>
                  </div>
                </li>
              </ul>
            </div>
            <div class="tree-section">
              <div class="section-header" @click="toggleSection('categories')">
                <i :class="['icon-chevron', sectionExpanded.categories ? 'expanded' : '']"></i>
                <span>分类</span>
                <span class="count">({{ flatCategoriesCount }})</span>
              </div>
              <div v-show="sectionExpanded.categories" class="tree-list">
                <!-- 调试信息 -->
                <div v-if="categories.length === 0" class="debug-info" style="padding: 1rem; color: #dc2626; background: #fef2f2; border-radius: 6px; margin: 0.5rem 0; font-size: 14px;">
                  <p><strong>🔍 分类树调试信息:</strong></p>
                  <p>• 分类数组长度: {{ categories.length }}</p>
                  <p>• 是否为数组: {{ Array.isArray(categories) }}</p>
                  <p>• 用户ID: {{ currentUserId }}</p>
                  <p>• 分类展开状态: {{ sectionExpanded.categories }}</p>
                  <button @click="loadCategories" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    重新加载分类
                  </button>
                </div>
                <!-- 递归分类树组件 -->
                <CategoryTreeNode 
                  v-for="category in categories" 
                  :key="category.categoryId"
                  :category="category"
                  :all-articles="allArticles"
                  :selected-article="selectedArticle"
                  @select-article="selectArticle"
                  @toggle-category="toggleCategory"
                  @edit-article="editArticle"
                  @delete-article="deleteArticle"
                />
              </div>
            </div>
            <div class="tree-section">
              <div class="section-header" @click="toggleSection('all')">
                <i :class="['icon-chevron', sectionExpanded.all ? 'expanded' : '']"></i>
                <span>所有文章</span>
                <span class="count">({{ allArticles.length }})</span>
              </div>
              <ul v-show="sectionExpanded.all" class="tree-list">
                <li 
                  v-for="article in filteredArticles" 
                  :key="article.id"
                  :class="['tree-item', { active: selectedArticle?.id === article.id }]"
                >
                  <div class="tree-item-content" @click="selectArticle(article)">
                    <i class="icon-document"></i>
                    <span class="article-title">{{ article.title }}</span>
                    <span class="article-date">{{ formatDate(article.updatedAt) }}</span>
                  </div>
                  <div class="tree-item-actions">
                    <button class="tree-action-btn" @click.stop="editArticle(article)" title="编辑">
                      <i class="icon-edit"></i>
                    </button>
                    <button class="tree-action-btn delete" @click.stop="deleteArticle(article)" title="删除">
                      <i class="icon-delete"></i>
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <!-- 分页控件 -->
          <div v-if="pagination.total > pagination.pageSize" class="pagination-container">
            <div class="pagination-info">
              <span>共 {{ pagination.total }} 篇文章</span>
            </div>
            <div class="pagination-controls">
              <button 
                :disabled="pagination.current <= 1" 
                @click="handlePageChange(pagination.current - 1)"
                class="pagination-btn"
              >
                ‹ 上一页
              </button>
              <span class="pagination-current">
                {{ pagination.current }} / {{ Math.ceil(pagination.total / pagination.pageSize) }}
              </span>
              <button 
                :disabled="pagination.current >= Math.ceil(pagination.total / pagination.pageSize)" 
                @click="handlePageChange(pagination.current + 1)"
                class="pagination-btn"
              >
                下一页 ›
              </button>
            </div>
          </div>
        </aside>
        
        <!-- 右侧文章展示区域 -->
        <section class="article-display">

          <!-- 高级搜索区域 -->
          <div class="advanced-search-section">
            <div class="search-header">
              <h4>高级搜索</h4>
              <button 
                class="search-toggle-btn" 
                @click="toggleAdvancedSearch"
                :class="{ 'active': showAdvancedSearch }"
              >
                <i :class="['icon-chevron', { 'expanded': showAdvancedSearch }]"></i>
                {{ showAdvancedSearch ? '收起' : '展开' }}
              </button>
            </div>
            
            <!-- 基础搜索框 -->
            <div class="basic-search">
              <div class="search-input-group">
                <i class="icon-search"></i>
                <input 
                  v-model="advancedSearch.keyword" 
                  type="text" 
                  placeholder="输入关键词搜索文章..."
                  @keyup.enter="executeAdvancedSearch"
                  class="search-input"
                />
                <button 
                  v-if="advancedSearch.keyword" 
                  class="search-clear-btn" 
                  @click="clearAdvancedSearch"
                  title="清除搜索"
                >
                  ×
                </button>
              </div>
            </div>
            
            <!-- 高级筛选条件 -->
            <div v-show="showAdvancedSearch" class="advanced-filters">
              <div class="filter-row">
                <div class="filter-item">
                  <label>是否共享:</label>
                  <select v-model="advancedSearch.isShared">
                    <option value="">全部</option>
                    <option :value="true">共享</option>
                    <option :value="false">未共享</option>
                  </select>
                </div>
                
                <div class="filter-item">
                  <label>文章状态:</label>
                  <select v-model="advancedSearch.status">
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="published">已发布</option>
                  </select>
                </div>
                
                <div class="filter-item">
                  <label>分类:</label>
                  <select v-model="advancedSearch.categoryId">
                    <option value="">所有分类</option>
                    <option v-for="category in flatCategories" :key="category.categoryId" :value="category.categoryId">
                      {{ category.displayName }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="filter-row">
                <div class="filter-item">
                  <label>开始日期:</label>
                  <input 
                    v-model="advancedSearch.startDate" 
                    type="date" 
                    class="date-input"
                  />
                </div>
                
                <div class="filter-item">
                  <label>结束日期:</label>
                  <input 
                    v-model="advancedSearch.endDate" 
                    type="date" 
                    class="date-input"
                  />
                </div>
                
                <div class="filter-item filter-actions">
                  <button 
                    @click="executeAdvancedSearch" 
                    class="btn-search"
                    :disabled="isLoading"
                  >
                    <i class="icon-search"></i>
                    搜索
                  </button>
                  <button 
                    @click="resetAdvancedSearch" 
                    class="btn-reset"
                  >
                    <i class="icon-refresh"></i>
                    重置
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 搜索结果提示 -->
            <div v-if="searchResultInfo.show" class="search-result-info">
              <span class="result-text">
                <i class="icon-search"></i>
                {{ searchResultInfo.text }}
              </span>
              <button @click="clearAdvancedSearch" class="clear-search-btn">
                清除搜索
              </button>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading && allArticles.length === 0" class="loading-state">
            <div class="loading-spinner-large"></div>
            <h3>正在加载文章...</h3>
            <p>请稍候，正在从数据库获取您的文章</p>
          </div>
          
          <!-- 错误状态 -->
          <div v-else-if="!isLoading && allArticles.length === 0" class="error-state">
            <div class="error-icon">
              <i class="icon-error"></i>
            </div>
            <h3>暂无文章</h3>
            <p>您还没有创建任何文章，或者服务器连接出现问题</p>
            <button class="btn-primary" @click="loadArticles(1)">
              <i class="icon-refresh"></i>
              重新加载
            </button>
            <button class="btn-secondary" @click="createNewArticle">
              <i class="icon-plus"></i>
              创建第一篇文章
            </button>
          </div>
          
          <!-- 空选择状态 -->
          <div v-else-if="!selectedArticle" class="empty-state">
            <div class="empty-icon">
              <i class="icon-document-empty"></i>
            </div>
            <h3>选择一篇文章开始阅读</h3>
            <p>从左侧目录中选择文章，或者创建一篇新的文章</p>
            <button class="btn-primary" @click="createNewArticle">
              <i class="icon-plus"></i>
              创建新文章
            </button>
          </div>
          
          <!-- 文章内容显示 -->
          <div v-else class="article-content">
            <!-- 文章头部信息 -->
            <header class="article-header">
              <div class="article-meta">
                <h1 class="article-title">{{ selectedArticle.title }}</h1>
                <div class="article-info">
                  <span class="info-item">
                    <i class="icon-calendar"></i>
                    创建于 {{ formatDate(selectedArticle.createdAt) }}
                  </span>
                  <span class="info-item">
                    <i class="icon-clock"></i>
                    更新于 {{ formatDate(selectedArticle.updatedAt) }}
                  </span>
                  <span class="info-item">
                    <i class="icon-tag"></i>
                    {{ selectedArticleCategoryName }}
                  </span>
                  <span class="info-item" :class="'status-' + selectedArticle.status">
                    <i class="icon-status"></i>
                    {{ getStatusText(selectedArticle.status) }}
                  </span>
                  <span class="info-item" v-if="selectedArticle.commentCount !== undefined">
                    <i class="icon-comment"></i>
                    {{ selectedArticle.commentCount || 0 }} 条评论
                  </span>
                </div>
              </div>
              <div class="article-actions">
                <button class="btn-action" @click="getAI(selectedArticle)" title="AI摘要" :disabled="aiLoading">
                  <i class="icon-ai" v-if="!aiLoading">🤖</i>
                  <i class="icon-loading" v-else>⏳</i>
                </button>
                <button class="btn-action" @click="editArticle(selectedArticle)" title="编辑">
                  <i class="icon-edit"></i>
                </button>
                <button class="btn-action" @click="shareArticle(selectedArticle)" title="分享">
                  <i class="icon-share"></i>
                </button>
                <button class="btn-action" @click="deleteArticle(selectedArticle)" title="删除">
                  <i class="icon-delete"></i>
                </button>
              </div>
            </header>
            
            <!-- 文章内容 -->
            <div class="article-body">
              <MarkdownRenderer 
                :content="selectedArticle.content"
                class="content-preview"
              />
              
              <!-- AI摘要展示区域 -->
              <div v-if="showAISummary" class="ai-summary-section">
                <div class="ai-summary-header">
                  <div class="ai-summary-title">
                    <i class="ai-icon">🤖</i>
                    <span>AI智能摘要</span>
                  </div>
                  <button @click="closeAISummary" class="ai-close-btn" title="关闭摘要">
                    <i>✕</i>
                  </button>
                </div>
                <div class="ai-summary-content">
                  {{ aiSummary }}
                </div>
                <div class="ai-summary-footer">
                  <span class="ai-powered">Powered by DeepSeek AI</span>
                </div>
              </div>
              
              <!-- 评论区展开按钮 -->
              <div class="comments-toggle-section">
                <button 
                  class="comments-toggle-btn"
                  @click="toggleComments"
                  :class="{ 'active': showComments }"
                >
                  <i class="icon-comment"></i>
                  <span v-if="!showComments">
                    查看评论 ({{ selectedArticle.commentCount || 0 }})
                  </span>
                  <span v-else>
                    收起评论
                  </span>
                  <i :class="['icon-chevron', { 'expanded': showComments }]"></i>
                </button>
              </div>
            </div>
            
            <!-- 文章评论 -->
            <div v-if="showComments" class="article-comments-section">
              <ArticleComments
                v-if="selectedArticle.id"
                :article-id="selectedArticle.id"
                :article-author-id="selectedArticle.userId || selectedArticle.authorId"
                :allow-comment="selectedArticle.status === 'published'"
                @comment-count-change="onCommentCountChange"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
    
    <!-- 个人资料编辑器模态框 -->
    <div v-if="showProfileEditor" class="modal-overlay" @click="closeProfileEditor">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑个人信息</h3>
          <button @click="closeProfileEditor" class="close-btn">✕</button>
        </div>
        <UserProfileEditor 
          :userInfo="currentUserInfo"
          @updated="onProfileUpdated" 
          @close="closeProfileEditor"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '@/components/Logo.vue'
import ArticleEditor from '@/components/ArticleEditor.vue'
import UserProfileEditor from '@/components/UserProfileEditor.vue'
import CategoryTreeNode from '@/components/CategoryTreeNode.vue'
import ArticleComments from '@/components/ArticleComments.vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import { articleAPI, categoryAPI, authAPI } from '@/services/api'
import { aiService } from '@/services/ai'

const router = useRouter()

// 响应式数据
const showUserMenu = ref(false)
const showProfileEditor = ref(false)
const searchQuery = ref('')
const selectedArticle = ref(null)
const allArticles = ref([])
const categories = ref([])
const isLoading = ref(false)

// 分页相关状态
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  loading: false
})

// 搜索相关状态
const searchState = reactive({
  query: '',
  type: 'complex',
  filters: {
    categoryId: null,
    status: null,
    dateRange: null
  }
})

// 展开状态
const sectionExpanded = reactive({
  recent: true,
  categories: true,
  all: false
})

// 评论展开状态
const showComments = ref(false)

// AI摘要相关状态
const aiLoading = ref(false)
const aiSummary = ref('')
const showAISummary = ref(false)

// 高级搜索相关状态
const showAdvancedSearch = ref(false)
const advancedSearch = reactive({
  keyword: '',
  isShared: '',
  status: '',
  categoryId: '',
  startDate: '',
  endDate: ''
})

// 搜索结果信息
const searchResultInfo = reactive({
  show: false,
  text: ''
})

// 编辑器相关状态
const showEditor = ref(false)
const editingArticleId = ref(null)
const originalArticleData = ref(null)

// 用户信息
const userName = ref('Demo User')
const userEmail = ref('demo@artman.com')
const userAvatar = ref('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face')
const currentUserInfo = ref(null) // 存储完整的用户信息对象

// 计算属性
// 安全获取用户ID的计算属性
const currentUserId = computed(() => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null
  } catch (error) {
    console.warn('无法访问 localStorage:', error)
    return null
  }
})

const selectedArticleCategoryName = computed(() => {
  if (!selectedArticle.value) return '未分类'
  
  // 如果已经有分类名称且不是数字，直接返回
  if (selectedArticle.value.category && typeof selectedArticle.value.category === 'string') {
    return selectedArticle.value.category
  }
  
  // 如果有分类ID，尝试从本地分类树获取名称
  const categoryId = selectedArticle.value.categoryId || selectedArticle.value.category_id || 0
  if (categoryId && categoryId !== 0) {
    const findCategoryInTree = (cats, targetId) => {
      for (const cat of cats) {
        if (cat.categoryId === targetId || cat.categoryId === String(targetId)) {
          return cat.name
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategoryInTree(cat.children, targetId)
          if (found) return found
        }
      }
      return null
    }
    
    const localCategoryName = findCategoryInTree(categories.value, categoryId)
    if (localCategoryName) {
      return localCategoryName
    }
  }
  
  return '未分类'
})

const recentArticles = computed(() => {
  return allArticles.value
    .sort((a, b) => {
      // 使用API返回的正确时间字段：updateTime 和 createTime
      const aTime = new Date(a.updateTime || a.updatedAt || a.createTime || a.createdAt || 0)
      const bTime = new Date(b.updateTime || b.updatedAt || b.createTime || b.createdAt || 0)
      return bTime - aTime
    })
    .slice(0, 10)
})

const filteredArticles = computed(() => {
  let filtered = allArticles.value
  
  // 文本搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(article => 
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||
      (article.summary && article.summary.toLowerCase().includes(query))
    )
  }
  
  // 分类筛选
  if (searchState.filters.categoryId) {
    filtered = filtered.filter(article => 
      article.categoryId === searchState.filters.categoryId ||
      article.categoryId === String(searchState.filters.categoryId) ||
      article.category_id === searchState.filters.categoryId ||
      article.category_id === String(searchState.filters.categoryId)
    )
  }
  
  // 状态筛选
  if (searchState.filters.status) {
    filtered = filtered.filter(article => 
      article.status === searchState.filters.status
    )
  }
  
  return filtered
})

// 计算扁平化分类数量（包括子分类）
const flatCategoriesCount = computed(() => {
  const countCategories = (cats) => {
    let count = 0
    cats.forEach(cat => {
      count++
      if (cat.children && cat.children.length > 0) {
        count += countCategories(cat.children)
      }
    })
    return count
  }
  return countCategories(categories.value)
})

// 方法
const toggleSection = (section) => {
  sectionExpanded[section] = !sectionExpanded[section]
}

// 切换评论显示
const toggleComments = () => {
  showComments.value = !showComments.value
}

// 高级搜索相关方法
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value
}

const executeAdvancedSearch = async () => {
  console.log('🔍 执行高级搜索:', advancedSearch)
  
  // 构建搜索参数
  const searchParams = {
    keyword: advancedSearch.keyword.trim(),
    isShared: advancedSearch.isShared !== '' ? advancedSearch.isShared : null,
    status: advancedSearch.status || null,
    categoryId: advancedSearch.categoryId || null,
    startDate: advancedSearch.startDate || null,
    endDate: advancedSearch.endDate || null
  }
  
  // 移除空值参数
  Object.keys(searchParams).forEach(key => {
    if (searchParams[key] === null || searchParams[key] === '') {
      delete searchParams[key]
    }
  })
  
  console.log('📤 搜索参数:', searchParams)
  
  try {
    isLoading.value = true
    pagination.loading = true
    
    let response
    if (Object.keys(searchParams).length === 0) {
      // 如果没有搜索条件，加载所有文章
      response = await articleAPI.getAllArticles(1, pagination.pageSize)
      searchResultInfo.show = false
    } else {
      // 执行高级搜索
      response = await articleAPI.complexSearch(searchParams, 1, pagination.pageSize)
      
      // 更新搜索结果提示
      const conditions = []
      if (searchParams.keyword) conditions.push(`关键词: ${searchParams.keyword}`)
      if (searchParams.isShared !== undefined) conditions.push(`共享: ${searchParams.isShared ? '是' : '否'}`)
      if (searchParams.status) conditions.push(`状态: ${getStatusText(searchParams.status)}`)
      if (searchParams.categoryId) {
        const categoryName = await getCategoryNameById(searchParams.categoryId)
        conditions.push(`分类: ${categoryName}`)
      }
      if (searchParams.startDate) conditions.push(`开始: ${searchParams.startDate}`)
      if (searchParams.endDate) conditions.push(`结束: ${searchParams.endDate}`)
      
      searchResultInfo.show = true
      searchResultInfo.text = `搜索条件: ${conditions.join(', ')}`
    }
    
    // 处理搜索结果
    const data = response?.data || response
    let articlesList = []
    let totalCount = 0
    
    if (data && typeof data === 'object') {
      if (data.list && Array.isArray(data.list)) {
        articlesList = data.list
        totalCount = data.total || 0
        pagination.current = data.pageNum || 1
        pagination.pageSize = data.pageSize || pagination.pageSize
      } else if (Array.isArray(data)) {
        articlesList = data
        totalCount = data.length
      }
    }
    
    // 处理文章数据（复用现有逻辑）
    if (articlesList.length > 0) {
      await loadCategories()
      
      const processedArticles = await Promise.all(articlesList.map(async (article, index) => {
        return {
          ...article,
          id: article.articleId || article.id || `temp_${Date.now()}_${index}`,
          title: article.title || '无标题',
          content: article.content || '',
          summary: article.summary || article.description || '',
          categoryId: article.categoryId || article.category_id || 0,
          createTime: article.createTime,
          updateTime: article.updateTime,
          createdAt: article.createTime || new Date().toISOString(),
          updatedAt: article.updateTime || new Date().toISOString(),
          status: article.status || 'draft',
          contentUrl: article.contentUrl || article.content_url,
          needsContentLoad: !!(article.contentUrl || article.content_url) && !article.content,
          isShared: article.isShared || article.is_shared || false,
          username: article.username,
          nickname: article.nickname,
          category: await getCategoryNameById(article.categoryId || article.category_id || 0)
        }
      }))
      
      allArticles.value = processedArticles
      pagination.total = totalCount || 0
      
      console.log('✅ 高级搜索完成:', {
        找到文章: processedArticles.length,
        总数: pagination.total,
        搜索条件数: Object.keys(searchParams).length
      })
    } else {
      allArticles.value = []
      pagination.total = 0
      
      if (searchResultInfo.show) {
        searchResultInfo.text += ` (未找到匹配文章)`
      }
    }
    
  } catch (error) {
    console.error('❌ 高级搜索失败:', error)
    allArticles.value = []
    pagination.total = 0
    
    if (searchResultInfo.show) {
      searchResultInfo.text += ` (搜索失败)`
    }
  } finally {
    isLoading.value = false
    pagination.loading = false
  }
}

const resetAdvancedSearch = () => {
  // 重置搜索条件
  Object.keys(advancedSearch).forEach(key => {
    advancedSearch[key] = ''
  })
  
  // 隐藏搜索结果提示
  searchResultInfo.show = false
  searchResultInfo.text = ''
  
  // 重新加载所有文章
  loadArticles(1, false)
  
  console.log('🔄 已重置高级搜索条件')
}

const clearAdvancedSearch = () => {
  resetAdvancedSearch()
}

// 扁平化分类函数
const flattenCategories = (cats, level = 0) => {
  let result = []
  cats.forEach(cat => {
    const prefix = '　'.repeat(level)
    result.push({
      categoryId: cat.categoryId,
      name: prefix + cat.name,
      displayName: prefix + cat.name
    })
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, level + 1))
    }
  })
  return result
}

// 扁平化分类计算属性
const flatCategories = computed(() => {
  return flattenCategories(categories.value)
})

const selectArticle = async (article) => {
  console.log('🔍 选中文章:', {
    id: article.id,
    title: article.title,
    categoryId: article.categoryId || article.category_id,
    category: article.category,
  })
  
  // 重置评论显示状态和AI摘要状态
  showComments.value = false
  showAISummary.value = false
  aiSummary.value = ''
  
  // 处理文章分类名称
  let categoryName = article.category
  console.log('🔍 文章原始分类信息:', {
    category: article.category,
    categoryId: article.categoryId,
    category_id: article.category_id,
    typeOfCategory: typeof article.category
  })
  
  if (!categoryName || typeof categoryName === 'number') {
    const categoryId = article.categoryId || article.category_id || 0
    console.log('🏷️ 正在为选中文章获取分类名称，categoryId:', categoryId)
    console.log('🌳 当前分类树状态:', {
      categoriesCount: categories.value.length,
      categories: categories.value.map(c => ({ id: c.categoryId, name: c.name }))
    })
    
    categoryName = await getCategoryNameById(categoryId)
    console.log('✅ 选中文章分类名称:', categoryName)
  } else {
    console.log('✅ 使用文章已有的分类名称:', categoryName)
  }
  
  // 先设置选中的文章
  selectedArticle.value = { 
    ...article,
    category: categoryName
  }
  
  // 如果文章需要加载内容，异步加载
  if (article.needsContentLoad && article.contentUrl) {
    try {
      console.log('📥 开始加载文章内容...')
      
      // 确保 loadArticleContent 方法存在
      if (typeof articleAPI.loadArticleContent !== 'function') {
        console.error('❌ articleAPI.loadArticleContent 方法未定义')
        throw new Error('文章内容加载方法未定义')
      }
      
      const content = await articleAPI.loadArticleContent(article)
      
      // 更新选中文章的内容
      selectedArticle.value = {
        ...selectedArticle.value,
        content: content
      }
      console.log('✅ 文章内容加载完成，长度:', content.length)
    } catch (error) {
      console.error('❌ 加载文章内容失败:', error)
      selectedArticle.value = {
        ...selectedArticle.value,
        content: '# 文章内容加载失败\n\n' + error.message
      }
    }
  } else if (article.content) {
    console.log('📄 使用已有内容，长度:', article.content.length)
  } else {
    console.warn('⚠️ 文章没有内容或contentUrl')
    selectedArticle.value = {
      ...selectedArticle.value,
      content: '暂无内容'
    }
  }
}

const createNewArticle = () => {
  editingArticleId.value = null
  showEditor.value = true
}

const editArticle = async (article) => {
  console.log('🔧 编辑文章，原始数据:', article.title)
  
  // 确保有完整的文章内容再进入编辑
  let fullArticle = article
  if (article.needsContentLoad && article.contentUrl && !article.content) {
    try {
      console.log('📥 编辑前先加载文章内容...')
      
      // 确保方法存在
      if (typeof articleAPI.loadArticleContent !== 'function') {
        console.error('❌ articleAPI.loadArticleContent 方法未定义')
        throw new Error('文章内容加载方法未定义')
      }
      
      const content = await articleAPI.loadArticleContent(article)
      fullArticle = {
        ...article,
        content: content
      }
      console.log('✅ 编辑用文章内容加载完成')
    } catch (error) {
      console.error('❌ 编辑前加载内容失败:', error)
      fullArticle = {
        ...article,
        content: '# 文章内容加载失败\n\n请刷新页面重试。'
      }
    }
  }
  
  editingArticleId.value = fullArticle.id || fullArticle.articleId
  originalArticleData.value = {
    ...fullArticle,
    categoryId: fullArticle.categoryId || fullArticle.category_id,
    isShared: fullArticle.isShared || fullArticle.is_shared,
    status: fullArticle.status || 'draft'
  }
  
  console.log('📤 传递给编辑器的数据:', {
    id: editingArticleId.value,
    title: originalArticleData.value.title,
    contentLength: originalArticleData.value.content?.length || 0
  })
  
  showEditor.value = true
}

// 编辑器事件处理
const onEditorClose = () => {
  showEditor.value = false
  editingArticleId.value = null
}

const onArticleSaved = async (savedArticle) => {
  showEditor.value = false
  editingArticleId.value = null
  
  // 重新加载文章列表
  await loadArticles()
  
  // 选中新保存的文章
  if (savedArticle && savedArticle.data) {
    // 确保分类名称正确显示
    const articleData = savedArticle.data
    const categoryId = articleData.categoryId || articleData.category_id || 0
    const categoryName = await getCategoryNameById(categoryId)
    
    selectedArticle.value = { 
      ...articleData,
      category: categoryName
    }
  }
}

const shareArticle = async (article) => {
  try {
    if (article.isShared || article.is_shared) {
      console.log('📋 复制分享链接:', `${window.location.origin}/article/${article.id}`)
      await navigator.clipboard.writeText(`${window.location.origin}/article/${article.id}`)
      // 显示成功提示
    } else {
      console.log('📤 该文章未公开分享')
    }
  } catch (error) {
    console.error('分享失败:', error)
  }
}

const deleteArticle = async (article) => {
  if (!confirm(`确定要删除文章"${article.title}"吗？`)) {
    return
  }
  
  try {
    await articleAPI.deleteArticle(article.id)
    console.log('🗑️ 文章删除成功')
    await loadArticles(pagination.current, !!searchState.query)
    
    // 如果删除的是当前选中的文章，清空选择
    if (selectedArticle.value && selectedArticle.value.id === article.id) {
      selectedArticle.value = null
    }
  } catch (error) {
    console.error('删除文章失败:', error)
  }
}

// AI摘要功能
const getAI = async (article) => {
  if (!article) {
    console.error('❌ 文章数据为空')
    return
  }
  
  // 检查API Key配置
  if (!aiService.isConfigured()) {
    const apiKey = prompt('请输入您的DeepSeek API Key (将保存在本地)：')
    if (!apiKey || apiKey.trim() === '') {
      // 显示提示信息在页面上
      aiSummary.value = '❌ 未提供API Key，无法使用AI摘要功能\n\n💡 请重新点击AI按钮并输入您的DeepSeek API Key'
      showAISummary.value = true
      return
    }
    
    // 保存API Key到localStorage
    localStorage.setItem('deepseek_api_key', apiKey)
    aiService.setApiKey(apiKey)
  }
  
  try {
    aiLoading.value = true
    console.log('🤖 开始生成AI摘要:', {
      articleId: article.id,
      title: article.title,
      contentLength: article.content?.length || 0
    })
    
    // 调用AI服务生成摘要
    const summary = await aiService.generateSummary(article.title, article.content)
    
    // 显示摘要结果
    aiSummary.value = summary
    showAISummary.value = true
    
    console.log('✅ AI摘要生成完成:', {
      articleId: article.id,
      summaryLength: summary.length
    })
    
  } catch (error) {
    console.error('❌ AI摘要生成失败:', error)
    
    // 显示错误信息在页面上
    aiSummary.value = `❌ AI摘要生成失败：${error.message}`
    showAISummary.value = true
    
    // 如果是API Key问题，重新提示输入
    if (error.message.includes('API Key') || error.message.includes('密钥')) {
      localStorage.removeItem('deepseek_api_key')
      aiSummary.value += '\n\n💡 请重新点击AI按钮并输入正确的API Key'
    }
  } finally {
    aiLoading.value = false
  }
}

// 关闭AI摘要
const closeAISummary = () => {
  showAISummary.value = false
  aiSummary.value = ''
  console.log('🔒 AI摘要已关闭')
}

// 用户相关方法
const editProfile = async () => {
  console.log('🎯 ===== 编辑个人资料被点击 =====')
  console.log('✏️ 打开个人信息编辑器...')
  showUserMenu.value = false
  
  // 在打开编辑器之前，先加载最新的用户信息
  try {
    const userInfo = await loadUserInfo()
    console.log('✅ 用户信息已刷新，当前用户信息:', currentUserInfo.value)
    console.log('🔧 即将传递给UserProfileEditor的用户信息:', userInfo)
  } catch (error) {
    console.warn('⚠️ 刷新用户信息失败，仍然打开编辑器:', error.message)
  }
  
  showProfileEditor.value = true
}

const openSettings = () => {
  showUserMenu.value = false
  router.push('/settings')
}

const logout = async () => {
  showUserMenu.value = false
  try {
    await authAPI.logout()
    localStorage.clear()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    // 即使API调用失败，也清除本地存储
    localStorage.clear()
    router.push('/login')
  }
}

const closeProfileEditor = () => {
  showProfileEditor.value = false
}

const onProfileUpdated = (updatedUser) => {
  console.log('📝 用户信息已更新:', updatedUser)
  
  // 更新本地用户信息显示
  userName.value = updatedUser.username || updatedUser.nickname || userName.value
  userEmail.value = updatedUser.email || userEmail.value
  if (updatedUser.avatar) {
    userAvatar.value = updatedUser.avatar
  }
  
  // 更新完整的用户信息对象
  currentUserInfo.value = updatedUser
  
  // 更新localStorage中的用户信息
  localStorage.setItem('user', JSON.stringify(updatedUser))
  
  // 关闭编辑器
  closeProfileEditor()
}

// 搜索相关方法
const searchArticles = () => {
  // 去除多余的空格
  const query = searchQuery.value.trim()
  
  // 如果搜索关键词为空，则清除搜索
  if (!query) {
    clearFilters()
    return
  }
  
  // 更新搜索状态并执行搜索
  searchState.query = query
  console.log('🔍 执行搜索:', {
    query: query,
    type: searchState.type,
    searchIn: searchState.type === 'complex' ? ['title', 'content', 'summary'] : ['title']
  })
  loadArticles(1, true)
}

// 搜索类型变化处理
const onSearchTypeChange = () => {
  // 如果当前有搜索关键词，重新执行搜索
  if (searchState.query && searchState.query.trim()) {
    console.log('🔄 搜索类型变化，重新搜索:', searchState.type)
    loadArticles(1, true)
  }
}

// 分页相关方法
const handlePageChange = (page) => {
  loadArticles(page, !!searchState.query)
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  loadArticles(1, !!searchState.query)
}

// 分类筛选
const filterByCategory = (categoryId) => {
  searchState.filters.categoryId = categoryId
  loadArticles(1)
}

// 清除筛选
const clearFilters = () => {
  searchState.query = ''
  searchQuery.value = ''
  searchState.type = 'complex' // 默认使用复杂搜索（支持内容搜索）
  searchState.filters = {
    categoryId: null,
    status: null,
    dateRange: null
  }
  loadArticles(1)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusText = (status) => {
  const statusMap = {
    'draft': '草稿',
    'published': '已发布',
    'archived': '已归档'
  }
  return statusMap[status] || '未知'
}

// 加载数据
const loadArticles = async (page = 1, search = false) => {
  console.log('🚀 loadArticles 函数被调用，参数:', { page, search })
  isLoading.value = true
  pagination.loading = true
  
  // 检查认证状态
  try {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      console.error('❌ 没有找到用户ID，可能需要重新登录')
      throw new Error('未登录或登录已过期')
    }
    
    let response
    if (search && searchState.query) {
      // 执行搜索
      console.log('🔍 执行搜索:', {
        query: searchState.query,
        type: searchState.type,
        categoryFilter: searchState.filters.categoryId
      })
      
      try {
        if (searchState.type === 'complex') {
          // 使用复杂搜索，支持标题、内容、摘要搜索
          const searchOptions = {
            keyword: searchState.query,
            searchIn: ['title', 'content', 'summary'], // 搜索范围包括内容
            categoryId: searchState.filters.categoryId,
            status: searchState.filters.status
          }
          response = await articleAPI.complexSearch(searchOptions, page, pagination.pageSize)
        } else {
          // 使用简单搜索（只搜索标题）
          response = await articleAPI.simpleSearch(searchState.query, page, pagination.pageSize)
        }
      } catch (searchError) {
        console.warn('⚠️ 搜索失败，回退到普通获取:', searchError)
        response = await articleAPI.getAllArticles(page, pagination.pageSize, searchState.filters.categoryId)
      }
    } else {
      // 获取用户所有文章
      console.log('📊 调用用户文章API...', {
        pageNum: page,
        pageSize: pagination.pageSize,
        categoryId: searchState.filters.categoryId
      })
      response = await articleAPI.getAllArticles(page, pagination.pageSize, searchState.filters.categoryId)
    }
    
    // 处理响应数据
    const data = response?.data || response
    console.log('📊 API响应详情:', {
      hasResponse: !!response,
      hasData: !!data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      hasListProperty: data && typeof data === 'object' && 'list' in data,
      keys: data && typeof data === 'object' ? Object.keys(data) : null
    })
    
    // 处理PageInfo格式的响应
    let articlesList = []
    let totalCount = 0
    
    if (data && typeof data === 'object') {
      // 检查是否是PageInfo格式
      if (data.list && Array.isArray(data.list)) {
        // PageInfo格式：{ list: [], total: number, pageNum: number, pageSize: number }
        articlesList = data.list
        totalCount = data.total || 0
        pagination.current = data.pageNum || page
        pagination.pageSize = data.pageSize || pagination.pageSize
        console.log('✅ 检测到PageInfo格式:', {
          listLength: articlesList.length,
          total: totalCount,
          pageNum: data.pageNum,
          pageSize: data.pageSize
        })
      } else if (Array.isArray(data)) {
        // 直接数组格式
        articlesList = data
        totalCount = data.length
        console.log('✅ 检测到直接数组格式')
      } else {
        console.warn('⚠️ 未知的响应格式，尝试查找文章数组:', data)
        // 尝试其他可能的字段名
        if (data.articles && Array.isArray(data.articles)) {
          articlesList = data.articles
          totalCount = data.total || data.articles.length
        } else if (data.content && Array.isArray(data.content)) {
          articlesList = data.content
          totalCount = data.totalElements || data.content.length
        } else {
          articlesList = []
          totalCount = 0
        }
      }
    } else if (Array.isArray(data)) {
      // 直接数组格式
      articlesList = data
      totalCount = data.length
      console.log('✅ 检测到直接数组格式')
    } else {
      console.warn('⚠️ API返回了非预期的数据格式:', typeof data, data)
      articlesList = []
      totalCount = 0
    }
    
    console.log('📊 提取的文章列表:', {
      count: articlesList.length,
      sample: articlesList.slice(0, 2).map(a => ({
        id: a.articleId || a.id,
        title: a.title,
        hasContent: !!a.content,
        hasContentUrl: !!(a.contentUrl || a.content_url)
      }))
    })
    
    if (articlesList.length > 0) {
      console.log('🔍 开始处理文章数据，文章数量:', articlesList.length)
      console.log('📝 文章样本数据:', articlesList.slice(0, 1).map(a => ({
        articleId: a.articleId,
        categoryId: a.categoryId,
        category_id: a.category_id,
        title: a.title,
      })))
      
      // 先确保分类数据已加载
      console.log('🌳 在处理文章前先加载分类数据...')
      await loadCategories()
      
      const processedArticles = await Promise.all(articlesList.map(async (article, index) => {
        console.log(`🔍 处理文章 ${index + 1}:`, {
          title: article.title,
          categoryId: article.categoryId,
          category_id: article.category_id,
          finalCategoryId: article.categoryId || article.category_id || 0,
        })
        
        // 根据API文档，后端返回的字段是：articleId, createTime, updateTime
        const processed = {
          ...article,
          // 确保有唯一ID - API返回articleId
          id: article.articleId || article.id || `temp_${Date.now()}_${index}`,
          title: article.title || '无标题', // 简易模式可能没有content
          content: article.content || '',
          summary: article.summary || article.description || '',
          categoryId: article.categoryId || article.category_id || 0,
          // 保持原始API字段名，同时映射为组件期望的字段名
          createTime: article.createTime,
          updateTime: article.updateTime,
          createdAt: article.createTime || new Date().toISOString(),
          updatedAt: article.updateTime || new Date().toISOString(),
          status: article.status || 'draft',
          contentUrl: article.contentUrl || article.content_url,
          needsContentLoad: !!(article.contentUrl || article.content_url) && !article.content,
          isShared: article.isShared || article.is_shared || false,
          // 添加用户信息（从API响应中获取）
          username: article.username,
          nickname: article.nickname,
          // 通过API获取真实的分类名称
          category: await getCategoryNameById(article.categoryId || article.category_id || 0),
          // 保留原始字段便于调试
          originalData: {
            articleId: article.articleId,
            userId: article.userId,
            createTime: article.createTime,
            updateTime: article.updateTime
          }
        }
        
        console.log(`📄 处理文章 "${processed.title}":`, {
          originalId: article.articleId,
          mappedId: processed.id,
          createTime: article.createTime,
          updateTime: article.updateTime,
          mappedCreatedAt: processed.createdAt,
          mappedUpdatedAt: processed.updatedAt,
          hasContent: !!processed.content,
          hasContentUrl: !!processed.contentUrl,
          needsContentLoad: processed.needsContentLoad,
          categoryId: processed.categoryId,
          categoryName: processed.category, // 显示获取到的分类名称
          status: processed.status,
        })
        return processed
      }))
      
      allArticles.value = processedArticles
      pagination.total = totalCount || 0
      
      console.log('✅ 用户文章数据加载成功:', {
        count: processedArticles.length,
        total: pagination.total,
        currentPage: pagination.current,
        pageSize: pagination.pageSize,
        withContent: processedArticles.filter(a => a.content).length,
        needsLoading: processedArticles.filter(a => a.needsContentLoad).length,
        // 调试最近文章排序
        recentArticlesSample: processedArticles
          .sort((a, b) => new Date(b.updateTime || 0) - new Date(a.updateTime || 0))
          .slice(0, 3)
          .map(a => ({
            title: a.title,
            updateTime: a.updateTime,
            createTime: a.createTime
          }))
      })
    } else {
      console.warn('⚠️ 用户暂无文章或API返回空数据')
      allArticles.value = []
      pagination.total = 0
      
      // 即使没有文章，也要加载分类数据
      await loadCategories()
    }
  } catch (error) {
    console.error('❌ 加载用户文章失败:', error)
    console.error('API错误详情:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      } : null
    })
    
    // 显示用户可见的错误信息
    let errorMessage = '加载文章失败：'
    if (error.response?.status === 401) {
      console.error('🔐 认证失败，可能需要重新登录')
      errorMessage += '认证失败，请重新登录'
      // 清除无效的认证信息
      localStorage.removeItem('userId')
      localStorage.removeItem('user')
      // 可以选择跳转到登录页面
      // router.push('/login')
    } else if (error.response?.status === 403) {
      console.error('🚫 权限不足')
      errorMessage += '权限不足'
    } else if (error.response?.status === 404) {
      console.error('🔍 API端点未找到，请检查后端服务')
      errorMessage += 'API端点不存在，请检查后端服务'
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      console.error('🌐 网络连接失败，请检查后端服务是否运行')
      errorMessage += '网络连接失败，请检查后端服务是否运行'
    } else {
      errorMessage += error.message
    }
    
    // 在页面上显示错误（可选）
    console.warn('💡 错误提示:', errorMessage)
    // 显示错误状态，不使用模拟数据
    allArticles.value = []
    pagination.total = 0
    
    // 仍然尝试加载分类
    try {
      await loadCategories()
    } catch (catError) {
      console.error('❌ 加载分类也失败:', catError)
    }
  } finally {
    isLoading.value = false
    pagination.loading = false
  }
}

// 加载分类数据
const loadCategories = async () => {
  try {
    console.log('🌳 开始加载用户分类树...')
    
    // 检查认证状态
    const userId = localStorage.getItem('userId')
    if (!userId) {
      console.error('❌ 没有找到用户ID，用户未登录')
      // 跳转到登录页面
      window.location.href = '/login'
      return
    }
    console.log('🔑 使用userId加载分类:', localStorage.getItem('userId'))
    
    // 使用分类树API获取用户的所有分类
    const categoryData = await categoryAPI.getCategoryTree(0)
    console.log('🌳 分类树API响应详情:', {
      hasData: !!categoryData,
      dataType: typeof categoryData,
      isArray: Array.isArray(categoryData),
      length: Array.isArray(categoryData) ? categoryData.length : 0,
      sample: Array.isArray(categoryData) && categoryData.length > 0 ? categoryData[0] : null,
      fullData: categoryData
    })
    
    // 处理响应数据
    if (Array.isArray(categoryData) && categoryData.length > 0) {
      // 递归设置展开状态，处理parentId为null的情况
      const setCategoryExpanded = (cats) => {
        return cats.map(cat => ({
          ...cat,
          expanded: false,
          // 处理parentId为null的情况
          parentId: cat.parentId || 0,
          children: cat.children ? setCategoryExpanded(cat.children) : []
        }))
      }
      
      categories.value = setCategoryExpanded(categoryData)
      
      console.log('✅ 分类树加载成功:', {
        categoriesCount: categories.value.length,
        sample: categories.value.slice(0, 2).map(c => ({
          categoryId: c.categoryId,
          name: c.name,
          parentId: c.parentId,
          hasChildren: !!(c.children && c.children.length > 0)
        }))
      })
    } else if (Array.isArray(categoryData) && categoryData.length === 0) {
      console.warn('⚠️ 分类数据为空数组，用户可能没有创建分类')
      categories.value = []
    } else {
      console.warn('⚠️ 分类数据格式异常:', categoryData)
      categories.value = []
      // 尝试从文章构建分类作为后备方案
      if (allArticles.value.length > 0) {
        console.log('📝 尝试从文章构建分类...')
        buildCategoriesFromArticles()
      }
    }
    // 尝试从文章构建分类作为后备方案
  } catch (error) {
    console.error('❌ 加载分类树失败:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      stack: error.stack
    })
    categories.value = []
    
    // 尝试从文章构建分类作为后备方案
    if (allArticles.value.length > 0) {
      console.log('📝 API失败，尝试从文章构建分类...')
      buildCategoriesFromArticles()
    }
  }
}

// 从文章构建分类（后备方案）
const buildCategoriesFromArticles = () => {
  const categoryMap = {}
  allArticles.value.forEach(article => {
    const catName = article.category || '未分类'
    const catId = article.categoryId || 'unknown'
    if (!categoryMap[catId]) {
      categoryMap[catId] = {
        categoryId: catId,
        name: catName,
        parentId: 0,
        articles: [],
        expanded: false,
        children: []
      }
    }
    categoryMap[catId].articles.push(article)
  })
  categories.value = Object.values(categoryMap)
  console.log('📝 从文章构建的分类:', categories.value.length)
}

// 根据分类ID获取分类名称
const getCategoryNameById = async (categoryId) => {
  console.log(`🏷️ getCategoryNameById 被调用，categoryId: ${categoryId}, 类型: ${typeof categoryId}`)
  if (!categoryId || categoryId === 0) {
    console.log(`🏷️ 分类ID为空或0，返回"未分类"`)
    return '未分类'
  }
  
  try {
    // 首先尝试从本地分类树中查找
    const findCategoryInTree = (cats, targetId) => {
      console.log(`🔍 在分类树中查找ID: ${targetId}`)
      for (const cat of cats) {
        console.log(`🔍 检查分类: ${cat.name} (ID: ${cat.categoryId})`)
        if (cat.categoryId === targetId || cat.categoryId === String(targetId)) {
          console.log(`✅ 在分类树中找到匹配: ${cat.name}`)
          return cat.name
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategoryInTree(cat.children, targetId)
          if (found) return found
        }
      }
      return null
    }
    
    console.log(`🌳 当前分类树内容:`, categories.value.map(c => ({ id: c.categoryId, name: c.name })))
    const localCategoryName = findCategoryInTree(categories.value, categoryId)
    if (localCategoryName) {
      console.log(`✅ 从本地分类树获取分类名称: ${localCategoryName}`)
      return localCategoryName
    }
    
    // 如果本地没有找到，通过API获取分类详情
    console.log(`🔍 本地分类树未找到，通过API获取分类ID ${categoryId} 的名称`)
    const response = await categoryAPI.getCategory(categoryId)
    
    console.log(`📥 分类API响应:`, response)
    
    // 简化响应处理，直接取name
    let categoryName = '未分类'
    if (response?.data?.name) {
      categoryName = response.data.name
      console.log(`✅ 从API获取分类名称: ${categoryName}`)
    } else if (response?.name) {
      categoryName = response.name
      console.log(`✅ 从API获取分类名称(直接格式): ${categoryName}`)
    } else {
      console.warn(`⚠️ API未返回有效的分类名称:`, response)
    }
    
    return categoryName
  } catch (error) {
    console.error(`❌ 获取分类名称失败 (ID: ${categoryId}):`, error)
    return '未分类'
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  console.log('👤 开始加载用户信息...')
  
  // 首先检查用户是否登录
  const userId = localStorage.getItem('userId')
  console.log('🔍 localStorage中的userId:', userId)
  console.log('🔍 localStorage中的所有内容:', Object.keys(localStorage).map(key => ({key, value: localStorage.getItem(key)})))
  
  // 首先尝试从API获取最新的用户信息
  try {
    if (userId) {
      console.log('🔍 从API获取用户信息，userId:', userId)
      const response = await authAPI.getUserInfo(userId)
      
      console.log('📥 API原始响应:', response)
      
      // 检查两种可能的响应格式
      const responseData = response.data || response
      console.log('📥 响应数据部分:', responseData)
      
      if (responseData && responseData.code === 200 && responseData.data) {
        const user = responseData.data
        console.log('✅ 成功获取用户信息:', user)
        
        // 更新页面显示的用户信息
        userName.value = user.username || user.nickname || 'Demo User'
        userEmail.value = user.email || 'demo@artman.com'
        
        // 更新头像
        if (user.avatar) {
          userAvatar.value = user.avatar
        }
        
        // 将最新的用户信息保存到localStorage
        localStorage.setItem('user', JSON.stringify(user))
        
        // 更新完整的用户信息对象
        currentUserInfo.value = user
        
        return user // 返回用户信息供其他地方使用
      } else {
        throw new Error(`API返回错误: code=${responseData?.code}, message=${responseData?.message}`)
      }
    } else {
      throw new Error('用户ID不存在，可能未登录')
    }
  } catch (error) {
    console.warn('⚠️ 从API获取用户信息失败:', error.message)
    
    // 如果API调用失败，尝试从localStorage读取
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        userName.value = user.username || user.nickname || user.name || 'Demo User'
        userEmail.value = user.email || 'demo@artman.com'
        // 加载用户头像，支持本地文件和URL
        if (user.avatar) {
          userAvatar.value = user.avatar
        }
        console.log('📋 从localStorage加载用户信息成功')
        currentUserInfo.value = user
        return user
      } catch (parseError) {
        console.error('❌ 解析localStorage中的用户信息失败:', parseError)
      }
    }
    
    // 如果都失败了，使用默认值
    userName.value = 'Demo User'
    userEmail.value = 'demo@artman.com'
    return null
  }
}

// 点击外部关闭用户菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.navbar-user')) {
    showUserMenu.value = false
  }
}

// 评论相关方法
const onCommentCountChange = (count) => {
  console.log('💬 评论数量变更:', count)
  // 可以在这里更新文章信息中的评论数量
  if (selectedArticle.value) {
    selectedArticle.value.commentCount = count
  }
}

// 用户菜单相关方法
const toggleUserMenu = () => {
  console.log('🖱️ 点击了用户头像')
  console.log('🔧 当前showUserMenu状态:', showUserMenu.value)
  showUserMenu.value = !showUserMenu.value
  console.log('🔧 切换后showUserMenu状态:', showUserMenu.value)
}

// 调试用户信息的函数
const debugUserInfo = async () => {
  console.log('🔍 ===== 开始调试用户信息 =====')
  showUserMenu.value = false
  
  // 1. 检查localStorage
  const userId = localStorage.getItem('userId')
  const userStr = localStorage.getItem('user')
  console.log('📱 localStorage内容:')
  console.log('  userId:', userId)
  console.log('  user:', userStr)
  
  // 2. 直接调用API
  if (userId) {
    try {
      console.log('📡 直接调用API...')
      const response = await authAPI.getUserInfo(userId)
      console.log('📥 API原始响应:', response)
      console.log('📥 响应数据:', response.data)
      
      // 检查两种可能的响应格式
      const responseData = response.data || response
      console.log('📥 实际响应数据部分:', responseData)
      
      if (responseData && responseData.code === 200) {
        console.log('✅ API调用成功，用户数据:', responseData.data)
        
        // 直接更新显示
        if (responseData.data) {
          const user = responseData.data
          userName.value = user.username || user.nickname || '❌ 无用户名'
          userEmail.value = user.email || '❌ 无邮箱'
          console.log('🔄 已更新显示:', {
            userName: userName.value,
            userEmail: userEmail.value
          })
        }
      } else {
        console.log('❌ API返回错误:', responseData)
      }
    } catch (error) {
      console.log('❌ API调用失败:', error)
    }
  } else {
    console.log('❌ 没有userId，无法调用API')
  }
  
  console.log('🔍 ===== 调试结束 =====')
}

// 生命周期钩子
onMounted(async () => {
  console.log('🚀 ArticleManager组件已挂载')
  console.log('🔧 环境配置:', {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    hasUserId: !!localStorage.getItem('userId'),
    userId: localStorage.getItem('userId'),
    nodeEnv: import.meta.env.NODE_ENV
  })
  
  // 调试响应式数据的初始状态
  console.log('📊 初始响应式数据状态:', {
    showUserMenu: showUserMenu.value,
    showProfileEditor: showProfileEditor.value,
    userName: userName.value,
    userEmail: userEmail.value,
    currentUserInfo: currentUserInfo.value
  })
  
  // 首先加载用户信息
  await loadUserInfo()
  
  // 初始化AI服务配置
  const savedApiKey = localStorage.getItem('deepseek_api_key')
  if (savedApiKey) {
    aiService.setApiKey(savedApiKey)
    console.log('🔑 已从本地存储加载DeepSeek API Key')
  }
  
  // 然后加载文章数据（会自动先加载分类数据）
  console.log('📊 开始加载文章数据...')
  await loadArticles(1, false)
  
  // 添加延迟后的状态检查
  setTimeout(() => {
    console.log('📊 3秒后组件状态检查:', {
      allArticlesCount: allArticles.value.length,
      recentArticlesCount: recentArticles.value.length,
      categoriesCount: categories.value.length,
      flatCategoriesCount: flatCategories.value,
      paginationTotal: pagination.total,
      isLoading: isLoading.value,
      hasUserId: !!localStorage.getItem('userId')
    })
    
    if (allArticles.value.length === 0) {
      console.warn('⚠️ 文章列表仍然为空，进行API直接测试...')
      testDirectAPICall()
    }
    
    if (categories.value.length === 0) {
      console.warn('⚠️ 分类列表为空，进行分类API直接测试...')
      testCategoryAPI()
    }
  }, 3000)
  
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 直接API调用测试
// 用户文章API测试
const testUserArticlesAPI = async () => {
  try {
    const response = await articleAPI.getAllArticles(1, 10)
    console.log('✅ 用户文章API测试成功:', response)
  } catch (error) {
    console.error('❌ 用户文章API测试失败:', error)
  }
}

// 直接API调用测试
const testDirectAPICall = async () => {
  const userId = localStorage.getItem('userId')
  console.log('🧪 进行直接API调用测试:', { userId })
  if (!userId) {
    console.error('❌ 直接测试失败：没有userId')
    return
  }
  try {
    console.log('📡 直接调用 fetch API...')
    const response = await fetch('/api/v1/articles/all/1/10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      }
    })
    
    console.log('📥 直接API响应:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ 直接API测试成功，响应数据:', data)
      if (data && data.list && Array.isArray(data.list)) {
        console.log(`📝 找到 ${data.list.length} 篇文章，总数: ${data.total}`)
        if (data.list.length > 0) {
          console.log('📄 文章样例:', data.list[0])
        }
      } else {
        console.warn('⚠️ 响应数据格式异常')
      }
    } else {
      const errorText = await response.text()
      console.error('❌ 直接API测试失败:', errorText)
    }
  } catch (error) {
    console.error('❌ 直接API调用异常:', error)
  }
}

// 分类API测试
const testCategoryAPI = async () => {
  try {
    const response = await categoryAPI.getCategoryTree(0)
    console.log('✅ 分类API测试成功:', response)
  } catch (error) {
    console.error('❌ 分类API测试失败:', error)
  }
}
</script>

<style scoped>
.article-manager {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.navbar {
  height: 10vh;
  min-height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 100;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1);
}

.brand-name {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.5px;
}

.navbar-user {
  position: relative;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
}

.user-avatar:hover {
  border-color: rgba(255, 255, 255, 0.6);
  transform: scale(1.05);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
}

.user-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  padding: 0;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  z-index: 1000;
}

.user-info {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
}

.user-info img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 16px;
  color: #1a202c;
  margin-bottom: 4px;
}

.user-email {
  color: #64748b;
  font-size: 14px;
}

.menu-divider {
  margin: 0;
  border: none;
  height: 1px;
  background: #e2e8f0;
}

.menu-items {
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
}

.menu-items li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s ease;
  color: #374151;
  font-size: 14px;
}

.menu-items li:hover {
  background: #f1f5f9;
}

.menu-items li.logout-item:hover {
  background: #fef2f2;
  color: #dc2626;
}

.menu-items li i {
  width: 16px;
  height: 16px;
}

/* 主体内容区域 */
.main-content {
  flex: 1;
  height: calc(100vh - 80px);
  display: flex;
  gap: 20px;
  padding: 0 2rem;
  overflow: hidden;
  margin-top: 20px;
}

/* 左侧边栏 */
.sidebar {
  width: 360px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  flex-direction: column;
}

.btn-new-article,
.btn-manage-categories {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  text-decoration: none;
  justify-content: center;
}

.btn-manage-categories {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}

.btn-new-article:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.search-box {
  margin: 1rem 1.5rem;
  position: relative;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  z-index: 2;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.search-box input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #64748b;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
  z-index: 2;
}

.search-clear-btn:hover {
  background: #f1f5f9;
  color: #374151;
}

/* 搜索选项 */
.search-options {
  margin: 0 1.5rem 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.search-type-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 0.25rem;
  display: block;
}

.search-type-options {
  display: flex;
  gap: 1rem;
}

.search-type-option {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.search-type-option input[type="radio"] {
  margin: 0;
  cursor: pointer;
}

.search-type-option:hover {
  color: #667eea;
}

/* 筛选控件 */
.filter-controls {
  margin: 0 1.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-select {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.clear-filters-btn {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.clear-filters-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.clear-filters-btn i {
  width: 14px;
  height: 14px;
}

/* 文章树 */
.article-tree {
  flex: 1;
  overflow-y: auto;
  padding: 0 1.5rem 1.5rem;
}

.tree-section {
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  cursor: pointer;
  font-weight: 600;
  color: #374151;
  user-select: none;
  transition: color 0.2s ease;
}

.section-header:hover {
  color: #667eea;
}

.icon-chevron {
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
  transition: transform 0.2s ease;
  display: inline-block;
}

.icon-chevron.expanded {
  transform: rotate(90deg);
}

.count {
  margin-left: auto;
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
}

.tree-list, .category-articles {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tree-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 2px;
  transition: all 0.2s ease;
  font-size: 14px;
  min-height: 40px;
  justify-content: space-between;
}

.tree-item:hover {
  background: #f1f5f9;
}

.tree-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tree-item-content {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
}

.tree-item-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tree-item:hover .tree-item-actions {
  opacity: 1;
}

.tree-action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;
}

.tree-action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.tree-action-btn.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.tree-item.active .tree-action-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.tree-item.active .tree-action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tree-item.active .tree-action-btn.delete:hover {
  background: rgba(220, 38, 38, 0.2);
  color: #fca5a5;
}

.tree-item i {
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.article-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.article-date {
  font-size: 12px;
  opacity: 0.7;
  margin-left: 0.5rem;
}

.category-header {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.category-header:hover {
  background: #f1f5f9;
}

.category-articles {
  margin-left: 1.5rem;
  margin-top: 0.25rem;
}

/* 右侧文章展示区域 */
.article-display {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(100vh - 100px);
  min-height: calc(100vh - 140px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.empty-icon {
  width: 120px;
  height: 120px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.empty-icon i {
  font-size: 48px;
  color: #cbd5e1;
}

.empty-state h3 {
  font-size: 24px;
  margin-bottom: 1rem;
  color: #374151;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 2rem;
  max-width: 400px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 文章内容样式 */
.article-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* 确保子元素可以正确缩放 */
}

.article-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.article-meta {
  flex: 1;
}

.article-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 1rem 0;
  line-height: 1.2;
}

.article-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  color: #64748b;
}

.info-item i {
  width: 16px;
  height: 16px;
}

.status-published {
  color: #10b981;
}

.status-draft {
  color: #f59e0b;
}

.status-archived {
  color: #64748b;
}

.article-actions {
  display: flex;
  gap: 0.5rem;
}

.article-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  min-height: 40vh;
  max-height: 75vh;
  border-bottom: 1px solid #e5e7eb;
}

/* 评论切换按钮区域 */
.comments-toggle-section {
  margin-top: 2rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  background: #f8fafc;
  flex-shrink: 0;
}

.comments-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  min-width: 200px;
  justify-content: center;
}

.comments-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.comments-toggle-btn.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.comments-toggle-btn.active:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.comments-toggle-btn .icon-chevron {
  transition: transform 0.3s ease;
}

.comments-toggle-btn .icon-chevron.expanded {
  transform: rotate(180deg);
}

.btn-action {
  width: 40px;
  height: 40px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #64748b;
}

.btn-action:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #374151;
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f1f5f9;
}

.btn-action.danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

/* AI按钮特殊样式 */
.btn-action .icon-ai {
  font-size: 16px;
}

.btn-action .icon-loading {
  font-size: 14px;
  animation: spin 1s linear infinite;
}

.content-preview {
  line-height: 1.7;
  color: #374151;
  font-size: 16px;
}

.content-preview h1,
.content-preview h2,
.content-preview h3,
.content-preview h4,
.content-preview h5,
.content-preview h6 {
  color: #1a202c;
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.content-preview h2 {
  font-size: 24px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
  color: #3b82f6; /* 设置 h2 标题为蓝色 */
}

.content-preview p {
  margin-bottom: 1rem;
}

/* 分页控件样式 */
.pagination-container {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  margin-top: auto;
}

.pagination-info {
  text-align: center;
  color: #64748b;
  font-size: 12px;
  margin-bottom: 0.5rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-current {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  padding: 0 0.5rem;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 新增：加载和错误状态样式 */
.loading-state, .error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.loading-spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 2rem;
}

.error-icon {
  width: 120px;
  height: 120px;
  background: #fef2f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.error-icon i {
  font-size: 48px;
  color: #ef4444;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  margin-left: 1rem;
}

.btn-secondary:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

/* 模态框样式修复 */
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
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
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
@media (max-width: 1024px) {
  .main-content {
    padding: 0 1rem;
  }
  .sidebar {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 1rem;
  }
  .brand-name {
    font-size: 24px;
  }
  .main-content {
    flex-direction: column;
    gap: 1rem;
  }
  .sidebar {
    width: 100%;
    height: 300px;
  }
  .article-title {
    font-size: 24px;
  }
  .article-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  .article-actions {
    align-self: flex-end;
  }
}

/* 滚动条样式 */
.article-tree::-webkit-scrollbar,
.article-body::-webkit-scrollbar {
  width: 6px;
}

.article-tree::-webkit-scrollbar-track,
.article-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.article-tree::-webkit-scrollbar-thumb,
.article-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.article-tree::-webkit-scrollbar-thumb:hover,
.article-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* AI摘要区域样式 */
.ai-summary-section {
  margin: 2rem 0;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  animation: slideInDown 0.4s ease-out;
}

.ai-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.ai-summary-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
}

.ai-icon {
  font-size: 1.2rem;
  animation: pulse 2s infinite;
}

.ai-close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.ai-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ai-summary-content {
  padding: 1.5rem;
  line-height: 1.7;
  color: #1e40af;
  font-size: 0.95rem;
  white-space: pre-line;
  background: white;
  margin: 0;
}

.ai-summary-footer {
  padding: 0.75rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  text-align: right;
}

.ai-powered {
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1); 
  }
  50% { 
    transform: scale(1.1); 
  }
}

/* 评论区域样式 */
.article-comments-section {
  max-height: 50vh;
  overflow-y: auto;
  padding: 1rem 2rem 2rem;
  background: #fafafa;
  animation: slideDown 0.3s ease-out;
  border-radius: 0 0 12px 12px;
}

/* 评论区滚动条样式 */
.article-comments-section::-webkit-scrollbar {
  width: 8px;
}

.article-comments-section::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.article-comments-section::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.article-comments-section::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 高级搜索区域样式 */
.advanced-search-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.search-header h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.search-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #64748b;
  transition: all 0.2s ease;
}

.search-toggle-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

.search-toggle-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.basic-search {
  padding: 1rem 2rem;
}

.search-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-group i {
  position: absolute;
  left: 1rem;
  color: #9ca3af;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 0.875rem 3rem 0.875rem 2.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #fafbfc;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.search-clear-btn {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.search-clear-btn:hover {
  background: #f3f4f6;
  color: #6b7280;
}

.advanced-filters {
  padding: 1rem 2rem 2rem;
  background: #fafbfc;
  border-top: 1px solid #f3f4f6;
}

.filter-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  min-width: 160px;
  flex: 1;
}

.filter-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.filter-item select,
.date-input {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  color: #374151;
  transition: border-color 0.2s ease;
}

.filter-item select:focus,
.date-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: 0.5rem;
}

.btn-search,
.btn-reset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-search {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-search:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-search:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-reset {
  background: #f8fafc;
  color: #6b7280;
  border: 1px solid #e2e8f0;
}

.btn-reset:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #374151;
}

.search-result-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #ecfccb 0%, #d9f99d 100%);
  border-top: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.result-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #365314;
  font-weight: 500;
}

.clear-search-btn {
  background: none;
  border: 1px solid #84cc16;
  color: #65a30d;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: #84cc16;
  color: white;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-header {
    padding: 1rem 1.5rem 0.75rem;
  }
  
  .basic-search {
    padding: 0.75rem 1.5rem;
  }
  
  .advanced-filters {
    padding: 0.75rem 1.5rem 1.5rem;
  }
  
  .filter-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filter-item {
    min-width: auto;
  }
  
  .filter-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-search,
  .btn-reset {
    justify-content: center;
  }
  
  .search-result-info {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }
}

/* 图标样式 (使用CSS伪元素模拟图标) */
.icon-plus::before { content: '+'; font-weight: bold; }
.icon-search::before { content: '🔍'; }
.icon-chevron::before { content: '▶'; }
.icon-document::before { content: '📄'; }
.icon-folder::before { content: '📁'; }
.icon-document-empty::before { content: '📋'; }
.icon-calendar::before { content: '📅'; }
.icon-clock::before { content: '🕒'; }
.icon-tag::before { content: '🏷️'; }
.icon-status::before { content: '⚪'; }
.icon-edit::before { content: '✏️'; }
.icon-share::before { content: '🔗'; }
.icon-delete::before { content: '🗑️'; }
.icon-settings::before { content: '⚙️'; }
.icon-logout::before { content: '🚪'; }
.icon-error::before { content: '❌'; }
.icon-refresh::before { content: '🔄'; }
.icon-close::before { content: '✕'; }
.icon-comment::before { content: "💬"; }
</style>