<template>
  <div class="article-manager">    <!-- 显示编辑器 -->
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
        <div class="user-avatar" @click="showUserMenu = !showUserMenu">
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
    <main class="main-content">      <!-- 左侧文章目录 -->
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
            placeholder="搜索文章..."
            @input="searchArticles"
            @keyup.enter="searchArticles"
          />
        </div>        <!-- 筛选控件 -->
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
            </div>            <ul v-show="sectionExpanded.recent" class="tree-list">
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
          </div>          <div class="tree-section">
            <div class="section-header" @click="toggleSection('categories')">
              <i :class="['icon-chevron', sectionExpanded.categories ? 'expanded' : '']"></i>
              <span>分类</span>
              <span class="count">({{ flatCategoriesCount }})</span>
            </div>
            <div v-show="sectionExpanded.categories" class="tree-list">
              <!-- 递归分类树组件 -->              <CategoryTreeNode 
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
            </div>            <ul v-show="sectionExpanded.all" class="tree-list">
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
            </ul></div>
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
                  {{ selectedArticle.category || '未分类' }}
                </span>
                <span class="info-item" :class="'status-' + selectedArticle.status">
                  <i class="icon-status"></i>
                  {{ getStatusText(selectedArticle.status) }}
                </span>
              </div>
            </div>
            
            <div class="article-actions">
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
            <div class="content-preview" v-html="selectedArticle.content"></div>
          </div>        </div>      </section>
    </main>
    </div>
    
    <!-- 个人资料编辑器模态框 -->
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '@/components/Logo.vue'
import ArticleEditor from '@/components/ArticleEditor.vue'
import UserProfileEditor from '@/components/UserProfileEditor.vue'
import CategoryTreeNode from '@/components/CategoryTreeNode.vue'
import { articleAPI, categoryAPI, authAPI } from '@/services/api'

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
  type: 'simple', // 'simple' | 'complex'
  filters: {
    categoryId: null,
    status: null,
    dateRange: null
  }
})

// 编辑器相关状态
const showEditor = ref(false)
const editingArticleId = ref(null)
const originalArticleData = ref(null)

// 用户信息
const userName = ref('Demo User')
const userEmail = ref('demo@artman.com')
const userAvatar = ref('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face')

// 展开状态
const sectionExpanded = reactive({
  recent: true,
  categories: true,
  all: false
})

// 计算属性
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

// 扁平化分类列表，用于筛选下拉框
const flatCategories = computed(() => {
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
  return flattenCategories(categories.value)
})

// 方法
const toggleSection = (section) => {
  sectionExpanded[section] = !sectionExpanded[section]
}

const toggleCategory = (categoryId) => {
  const findAndToggleCategory = (cats) => {
    for (let cat of cats) {
      if (cat.categoryId === categoryId) {
        cat.expanded = !cat.expanded
        return true
      }
      if (cat.children && cat.children.length > 0) {
        if (findAndToggleCategory(cat.children)) {
          return true
        }
      }
    }
    return false
  }
  
  findAndToggleCategory(categories.value)
}

const selectArticle = async (article) => {
  console.log('🔍 选中文章:', {
    id: article.id,
    title: article.title,
    hasContentUrl: !!article.contentUrl,
    needsContentLoad: article.needsContentLoad
  })
  
  // 先设置选中的文章
  selectedArticle.value = { ...article }
  
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
    selectedArticle.value = savedArticle.data
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

// 用户相关方法
const editProfile = () => {
  showUserMenu.value = false
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
  // 更新本地用户信息
  userName.value = updatedUser.username || updatedUser.name || userName.value
  userEmail.value = updatedUser.email || userEmail.value
  if (updatedUser.avatar) {
    userAvatar.value = updatedUser.avatar
  }
  
  // 更新localStorage中的用户信息
  localStorage.setItem('user', JSON.stringify(updatedUser))
    closeProfileEditor()
}

const searchArticles = () => {
  searchState.query = searchQuery.value
  loadArticles(1, true)
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
  isLoading.value = true
  pagination.loading = true
  
  try {
    let response
      console.log('🔍 开始加载用户文章:', { 
      page, 
      search, 
      query: searchState.query,
      hasUserId: !!localStorage.getItem('userId'),
      baseURL: import.meta.env.VITE_API_BASE_URL
    })
    
    // 检查认证状态
    const userId = localStorage.getItem('userId')
    if (!userId) {
      console.error('❌ 没有找到用户ID，可能需要重新登录')
      throw new Error('未登录或登录已过期')
    }
    
    if (search && searchState.query) {
      // 执行搜索
      console.log('🔍 执行搜索:', searchState.query)
      try {
        response = await articleAPI.simpleSearch(searchState.query, page, pagination.pageSize)
      } catch (searchError) {
        console.warn('⚠️ 搜索失败，回退到普通获取:', searchError)
        response = await articleAPI.getAllArticles(page, pagination.pageSize, searchState.filters.categoryId)
      }    } else {
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
      const processedArticles = articlesList.map((article, index) => {
        // 根据API文档，后端返回的字段是：articleId, createTime, updateTime
        const processed = {
          ...article,
          // 确保有唯一ID - API返回articleId
          id: article.articleId || article.id || `temp_${Date.now()}_${index}`,
          title: article.title || '无标题',
          content: article.content || '', // 简易模式可能没有content
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
          // 分类名称将通过分类数据关联获取
          category: '未分类',
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
          status: processed.status
        })
        
        return processed
      })
      
      allArticles.value = processedArticles
      pagination.total = totalCount
      
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
    }

    // 加载分类数据
    await loadCategories()
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

// 移除模拟数据方法，或者只在真正需要测试时使用
const getMockArticles = () => {
  console.warn('⚠️ 不再使用模拟数据，请检查API连接')
  return []
}

// 加载分类数据
const loadCategories = async () => {
  try {
    console.log('🌳 开始加载用户分类树...')
    
    // 检查认证状态
    const userId = localStorage.getItem('userId')
    if (!userId) {
      console.error('❌ 没有找到用户ID，无法加载分类')
      categories.value = []
      return
    }
    
    console.log('🔑 使用userId加载分类:', userId)
    
    // 使用分类树API获取用户的所有分类（传递参数0）
    const categoryData = await categoryAPI.getCategoryTree(0)
    
    console.log('🌳 分类树API响应:', {
      hasData: !!categoryData,
      dataType: typeof categoryData,
      isArray: Array.isArray(categoryData),
      length: Array.isArray(categoryData) ? categoryData.length : 0,
      sample: Array.isArray(categoryData) && categoryData.length > 0 ? categoryData[0] : null
    })
    
    // API直接返回数组，不需要解包装
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
    } else {
      console.warn('⚠️ 分类数据为空')
      categories.value = []
      
      // 尝试从文章构建分类作为后备方案
      if (allArticles.value.length > 0) {
        console.log('📝 尝试从文章构建分类...')
        buildCategoriesFromArticles()
      }
    }
    
  } catch (error) {
    console.error('❌ 加载分类树失败:', error)
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

// 加载用户信息
const loadUserInfo = () => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      userName.value = user.username || user.name || 'Demo User'
      userEmail.value = user.email || 'demo@artman.com'
      // 加载用户头像，支持本地文件和URL
      if (user.avatar) {
        userAvatar.value = user.avatar
      }
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
}

// 点击外部关闭用户菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.navbar-user')) {
    showUserMenu.value = false
  }
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
  
  // 首先加载用户信息
  loadUserInfo()
  
  // 然后加载文章数据
  console.log('📊 开始加载文章数据...')
  await loadArticles(1, false)
  
  // 单独加载分类数据（即使文章加载失败也要尝试）
  console.log('🌳 开始加载分类数据...')
  await loadCategories()
  
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
  color: white;
}

.logo {
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1);
}

.brand-name {
  font-size: 28px;
  font-weight: 700;
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
  display: flex;
  height: calc(90vh - 20px);
  margin-top: 20px;
  gap: 20px;
  padding: 0 2rem;
}

/* 左侧边栏 */
.sidebar {
  width: 320px;
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
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
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
}

.empty-state {
  flex: 1;
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
}

.article-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
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

.btn-action.danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.article-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
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
}

.content-preview p {
  margin-bottom: 1rem;
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
</style>