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
        </div>        <div class="sidebar-header">
          <h3>文章目录</h3>
          <div class="header-actions">
            <button class="btn-new-article" @click="createNewArticle">
              <i class="icon-plus"></i>
              新建文章
            </button>
            <router-link to="/categories" class="btn-manage-categories" title="分类管理">
              <i class="icon-folder"></i>
              分类管理
            </router-link>          </div>
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
        </div><!-- 筛选控件 -->
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
            </div>            <div v-show="sectionExpanded.categories" class="tree-list">
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
                :category="category"ticles"
                :all-articles="allArticles"Article"
                :selected-article="selectedArticle"
                @select-article="selectArticle"y"
                @toggle-category="toggleCategory"
                @edit-article="editArticle"cle"
                @delete-article="deleteArticle"
              />v>
            </div>
          </div>
          <div class="tree-section">
          <div class="tree-section">er" @click="toggleSection('all')">
            <div class="section-header" @click="toggleSection('all')">ded' : '']"></i>
              <i :class="['icon-chevron', sectionExpanded.all ? 'expanded' : '']"></i>
              <span>所有文章</span>t">({{ allArticles.length }})</span>
              <span class="count">({{ allArticles.length }})</span>s="tree-list">
            </div>            <ul v-show="sectionExpanded.all" class="tree-list">
              <li for="article in filteredArticles" 
                v-for="article in filteredArticles" 
                :key="article.id"em', { active: selectedArticle?.id === article.id }]"
                :class="['tree-item', { active: selectedArticle?.id === article.id }]"
              > <div class="tree-item-content" @click="selectArticle(article)">
                <div class="tree-item-content" @click="selectArticle(article)">
                  <i class="icon-document"></i>{ article.title }}</span>
                  <span class="article-title">{{ article.title }}</span>edAt) }}</span>
                  <span class="article-date">{{ formatDate(article.updatedAt) }}</span>
                </div>lass="tree-item-actions">
                <div class="tree-item-actions">n" @click.stop="editArticle(article)" title="编辑">
                  <button class="tree-action-btn" @click.stop="editArticle(article)" title="编辑">
                    <i class="icon-edit"></i>
                  </button>lass="tree-action-btn delete" @click.stop="deleteArticle(article)" title="删除">
                  <button class="tree-action-btn delete" @click.stop="deleteArticle(article)" title="删除">
                    <i class="icon-delete"></i>
                  </button>
                </div>
              </li>div>
            </ul></div>
        </div>
        <!-- 分页控件 -->
        <!-- 分页控件 -->gination.total > pagination.pageSize" class="pagination-container">
        <div v-if="pagination.total > pagination.pageSize" class="pagination-container">
          <div class="pagination-info"> }} 篇文章</span>
            <span>共 {{ pagination.total }} 篇文章</span>
          </div>lass="pagination-controls">
          <div class="pagination-controls">
            <button led="pagination.current <= 1" 
              :disabled="pagination.current <= 1" current - 1)"
              @click="handlePageChange(pagination.current - 1)"
              class="pagination-btn"
            > ‹ 上一页
              ‹ 上一页n>
            </button>ss="pagination-current">
            <span class="pagination-current">ath.ceil(pagination.total / pagination.pageSize) }}
              {{ pagination.current }} / {{ Math.ceil(pagination.total / pagination.pageSize) }}
            </span> 
            <button led="pagination.current >= Math.ceil(pagination.total / pagination.pageSize)" 
              :disabled="pagination.current >= Math.ceil(pagination.total / pagination.pageSize)" 
              @click="handlePageChange(pagination.current + 1)"
              class="pagination-btn"
            > 下一页 ›
              下一页 ›n>
            </button>
          </div>
        </div>
      </aside>
      <!-- 右侧文章展示区域 -->
      <!-- 右侧文章展示区域 -->rticle-display">
      <section class="article-display">
        <!-- 加载状态 -->Loading && allArticles.length === 0" class="loading-state">
        <div v-if="isLoading && allArticles.length === 0" class="loading-state">
          <div class="loading-spinner-large"></div>
          <h3>正在加载文章...</h3>章</p>
          <p>请稍候，正在从数据库获取您的文章</p>
        </div>
        <!-- 错误状态 -->
        <!-- 错误状态 -->f="!isLoading && allArticles.length === 0" class="error-state">
        <div v-else-if="!isLoading && allArticles.length === 0" class="error-state">
          <div class="error-icon"></i>
            <i class="icon-error"></i>
          </div>文章</h3>
          <h3>暂无文章</h3>，或者服务器连接出现问题</p>
          <p>您还没有创建任何文章，或者服务器连接出现问题</p>click="loadArticles(1)">
          <button class="btn-primary" @click="loadArticles(1)">
            <i class="icon-refresh"></i>
            重新加载on>
          </button>lass="btn-secondary" @click="createNewArticle">
          <button class="btn-secondary" @click="createNewArticle">
            <i class="icon-plus"></i>
            创建第一篇文章
          </button>
        </div>
        <!-- 空选择状态 -->
        <!-- 空选择状态 -->="!selectedArticle" class="empty-state">
        <div v-else-if="!selectedArticle" class="empty-state">
          <div class="empty-icon">t-empty"></i>
            <i class="icon-document-empty"></i>
          </div>一篇文章开始阅读</h3>
          <h3>选择一篇文章开始阅读</h3>篇新的文章</p>
          <p>从左侧目录中选择文章，或者创建一篇新的文章</p>@click="createNewArticle">
          <button class="btn-primary" @click="createNewArticle">
            <i class="icon-plus"></i>
            创建新文章n>
          </button>
        </div>
        <!-- 文章内容显示 -->
        <!-- 文章内容显示 -->ss="article-content">
        <div v-else class="article-content">
          <!-- 文章头部信息 -->article-header">
          <header class="article-header">
            <div class="article-meta">">{{ selectedArticle.title }}</h1>
              <h1 class="article-title">{{ selectedArticle.title }}</h1>
              <div class="article-info">
                <span class="info-item">r"></i>
                  <i class="icon-calendar"></i>icle.createdAt) }}
                  创建于 {{ formatDate(selectedArticle.createdAt) }}
                </span>lass="info-item">
                <span class="info-item"></i>
                  <i class="icon-clock"></i>Article.updatedAt) }}
                  更新于 {{ formatDate(selectedArticle.updatedAt) }}
                </span>                <span class="info-item">
                  <i class="icon-tag"></i>ryName }}
                  {{ selectedArticleCategoryName }}
                </span>lass="info-item" :class="'status-' + selectedArticle.status">
                <span class="info-item" :class="'status-' + selectedArticle.status">
                  <i class="icon-status"></i>ticle.status) }}
                  {{ getStatusText(selectedArticle.status) }}
                </span>lass="info-item" v-if="selectedArticle.commentCount !== undefined">
                <span class="info-item" v-if="selectedArticle.commentCount !== undefined">
                  <i class="icon-comment"></i>unt || 0 }} 条评论
                  {{ selectedArticle.commentCount || 0 }} 条评论
                </span>
              </div>
            </div>
            <div class="article-actions">
            <div class="article-actions">@click="editArticle(selectedArticle)" title="编辑">
              <button class="btn-action" @click="editArticle(selectedArticle)" title="编辑">
                <i class="icon-edit"></i>
              </button>lass="btn-action" @click="shareArticle(selectedArticle)" title="分享">
              <button class="btn-action" @click="shareArticle(selectedArticle)" title="分享">
                <i class="icon-share"></i>
              </button>lass="btn-action" @click="deleteArticle(selectedArticle)" title="删除">
              <button class="btn-action" @click="deleteArticle(selectedArticle)" title="删除">
                <i class="icon-delete"></i>
              </button>
            </div>>          <!-- 文章内容 -->
          </header>          <!-- 文章内容 -->
          <div class="article-body">iew" v-html="selectedArticle.content"></div>
            <div class="content-preview" v-html="selectedArticle.content"></div>
            <!-- 评论区展开按钮 -->
            <!-- 评论区展开按钮 -->ents-toggle-section">
            <div class="comments-toggle-section">
              <button "comments-toggle-btn"
                class="comments-toggle-btn"
                @click="toggleComments"wComments }"
                :class="{ 'active': showComments }"
              > <i class="icon-comment"></i>
                <i class="icon-comment"></i>
                <span v-if="!showComments">commentCount || 0 }})
                  查看评论 ({{ selectedArticle.commentCount || 0 }})
                </span>-else>
                <span v-else>
                  收起评论>
                </span>ss="['icon-chevron', { 'expanded': showComments }]"></i>
                <i :class="['icon-chevron', { 'expanded': showComments }]"></i>
              </button>
            </div>
          </div>
          <!-- 文章评论 -->
          <!-- 文章评论 -->owComments" class="article-comments-section">
          <div v-if="showComments" class="article-comments-section">
            <ArticleCommentsArticle.id"
              v-if="selectedArticle.id"cle.id"
              :article-id="selectedArticle.id"cle.userId || selectedArticle.authorId"
              :article-author-id="selectedArticle.userId || selectedArticle.authorId"
              :allow-comment="selectedArticle.status === 'published'"
              @comment-count-change="onCommentCountChange"
            />v>
          </div>section>
        </div></section>
    </main>
    </div>
    <!-- 个人资料编辑器模态框 -->
    <!-- 个人资料编辑器模态框 -->ileEditor" class="modal-overlay" @click="closeProfileEditor">
    <div v-if="showProfileEditor" class="modal-overlay" @click="closeProfileEditor">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑个人信息</h3>"closeProfileEditor" class="close-btn">✕</button>
          <button @click="closeProfileEditor" class="close-btn">✕</button>
        </div>rofileEditor @updated="onProfileUpdated" />
        <UserProfileEditor @updated="onProfileUpdated" />
      </div>
    </div>
  </div>te>
</template>
<script setup>
<script setup>reactive, computed, onMounted, onUnmounted } from 'vue'
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'e'
import Logo from '@/components/Logo.vue'ArticleEditor.vue'
import ArticleEditor from '@/components/ArticleEditor.vue'tor.vue'
import UserProfileEditor from '@/components/UserProfileEditor.vue'
import CategoryTreeNode from '@/components/CategoryTreeNode.vue'
import ArticleComments from '@/components/ArticleComments.vue'pi'
import { articleAPI, categoryAPI, authAPI } from '@/services/api'
const router = useRouter()
const router = useRouter()
// 响应式数据
// 响应式数据owUserMenu = ref(false)
const showUserMenu = ref(false)alse)
const showProfileEditor = ref(false)
const searchQuery = ref('')(null)
const selectedArticle = ref(null)
const allArticles = ref([])
const categories = ref([])e)
const isLoading = ref(false)
// 分页相关状态
// 分页相关状态ination = reactive({
const pagination = reactive({
  current: 1,0,
  pageSize: 20,
  total: 0,false
  loading: false
})
// 搜索相关状态
// 搜索相关状态rchState = reactive({
const searchState = reactive({
  query: '',plex',
  type: 'complex',
  filters: {Id: null,
    categoryId: null,
    status: null,ll
    dateRange: null
  }
})
// 展开状态
// 展开状态ectionExpanded = reactive({
const sectionExpanded = reactive({
  recent: true,rue,
  categories: true,
  all: false
})
// 评论展开状态
// 评论展开状态wComments = ref(false)
const showComments = ref(false)
// 编辑器相关状态
// 编辑器相关状态Editor = ref(false)
const showEditor = ref(false)null)
const editingArticleId = ref(null)ll)
const originalArticleData = ref(null)
// 用户信息
// 用户信息serName = ref('Demo User')
const userName = ref('Demo User')n.com')
const userEmail = ref('demo@artman.com')nsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face')
const userAvatar = ref('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face')
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
// 计算属性
const selectedArticleCategoryName = computed(() => {argetId) => {
  if (!selectedArticle.value) return '未分类'
  targetId || cat.categoryId === String(targetId)) {
  // 如果已经有分类名称且不是数字，直接返回
  if (selectedArticle.value.category && typeof selectedArticle.value.category === 'string') {
    return selectedArticle.value.categoryf (cat.children && cat.children.length > 0) {
  }n, targetId)
  
  // 如果有分类ID，尝试从本地分类树获取名称
  const categoryId = selectedArticle.value.categoryId || selectedArticle.value.category_id || 0
  if (categoryId && categoryId !== 0) {eturn null
    const findCategoryInTree = (cats, targetId) => {
      for (const cat of cats) {
        if (cat.categoryId === targetId || cat.categoryId === String(targetId)) {const localCategoryName = findCategoryInTree(categories.value, categoryId)
          return cat.name
        }me
        if (cat.children && cat.children.length > 0) {
          const found = findCategoryInTree(cat.children, targetId)
          if (found) return found
        }return '未分类'
      }
      return null
    }const recentArticles = computed(() => {
    
    const localCategoryName = findCategoryInTree(categories.value, categoryId)
    if (localCategoryName) {字段：updateTime 和 createTime
      return localCategoryNameupdatedAt || a.createTime || a.createdAt || 0)
    }
  }
  
  return '未分类'lice(0, 10)
})

const recentArticles = computed(() => {const filteredArticles = computed(() => {
  return allArticles.value
    .sort((a, b) => {
      // 使用API返回的正确时间字段：updateTime 和 createTime  // 文本搜索筛选
      const aTime = new Date(a.updateTime || a.updatedAt || a.createTime || a.createdAt || 0)hQuery.value) {
      const bTime = new Date(b.updateTime || b.updatedAt || b.createTime || b.createdAt || 0)ery.value.toLowerCase()
      return bTime - aTime
    })(query) ||
    .slice(0, 10)||
})).includes(query))

const filteredArticles = computed(() => {
  let filtered = allArticles.value
// 分类筛选
  // 文本搜索筛选rchState.filters.categoryId) {
  if (searchQuery.value) {=> 
    const query = searchQuery.value.toLowerCase()ilters.categoryId ||
    filtered = filtered.filter(article => ryId) ||
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||ryId)
      (article.summary && article.summary.toLowerCase().includes(query))
    )
  }
    // 状态筛选
  // 分类筛选rchState.filters.status) {
  if (searchState.filters.categoryId) {cle => 
    filtered = filtered.filter(article => rs.status
      article.categoryId === searchState.filters.categoryId ||
      article.categoryId === String(searchState.filters.categoryId) ||
      article.category_id === searchState.filters.categoryId ||
      article.category_id === String(searchState.filters.categoryId)  return filtered
    )
  }
// 计算扁平化分类数量（包括子分类）
  // 状态筛选sCount = computed(() => {
  if (searchState.filters.status) {
    filtered = filtered.filter(article => 
      article.status === searchState.filters.statuscat => {
    )
  }.children && cat.children.length > 0) {

  return filtered
})
turn count
// 计算扁平化分类数量（包括子分类）
const flatCategoriesCount = computed(() => {eturn countCategories(categories.value)
  const countCategories = (cats) => {
    let count = 0 方法
    cats.forEach(cat => { toggleSection = (section) => {
      count++nExpanded[section]
      if (cat.children && cat.children.length > 0) {
        count += countCategories(cat.children)
      }// 切换评论显示
    })gleComments = () => {
    return countmments.value
  }.value)
  return countCategories(categories.value)
})
// 方法// 扁平化分类函数
const toggleSection = (section) => {tenCategories = (cats, level = 0) => {
  sectionExpanded[section] = !sectionExpanded[section]
}t => {
repeat(level)
// 切换评论显示
const toggleComments = () => { cat.categoryId,
  showComments.value = !showComments.value
  console.log('🔄 切换评论显示状态:', showComments.value)t.name
}
 (cat.children && cat.children.length > 0) {
// 扁平化分类函数n, level + 1))
const flattenCategories = (cats, level = 0) => {
  let result = []
  cats.forEach(cat => {turn result
    const prefix = '　'.repeat(level)
    result.push({
      categoryId: cat.categoryId,// 扁平化分类计算属性
      name: prefix + cat.name,tegories = computed(() => {
      displayName: prefix + cat.namealue)
    })
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, level + 1))const selectArticle = async (article) => {
    }
  })
  return resulttitle,
}ategoryId || article.category_id,

// 扁平化分类计算属性
const flatCategories = computed(() => {
  return flattenCategories(categories.value)// 重置评论显示状态
})s.value = false

const selectArticle = async (article) => {// 处理文章分类名称
  console.log('🔍 选中文章:', {yName = article.category
    id: article.id,
    title: article.title,
    categoryId: article.categoryId || article.category_id,yId,
    category: article.categoryd,
  })tegory
  
  // 重置评论显示状态
  showComments.value = falseif (!categoryName || typeof categoryName === 'number') {
  ory_id || 0
  // 处理文章分类名称
  let categoryName = article.category
  console.log('🔍 文章原始分类信息:', {s.value.length,
    category: article.category,id: c.categoryId, name: c.name }))
    categoryId: article.categoryId,
    category_id: article.category_id,
    typeOfCategory: typeof article.categorycategoryName = await getCategoryNameById(categoryId)
  })
  
  if (!categoryName || typeof categoryName === 'number') {e.log('✅ 使用文章已有的分类名称:', categoryName)
    const categoryId = article.categoryId || article.category_id || 0
    console.log('🏷️ 正在为选中文章获取分类名称，categoryId:', categoryId)
    console.log('🌳 当前分类树状态:', {// 先设置选中的文章
      categoriesCount: categories.value.length,icle.value = { 
      categories: categories.value.map(c => ({ id: c.categoryId, name: c.name }))
    })ategoryName
    
    categoryName = await getCategoryNameById(categoryId)
    console.log('✅ 选中文章分类名称:', categoryName)// 如果文章需要加载内容，异步加载
  } else {ontentLoad && article.contentUrl) {
    console.log('✅ 使用文章已有的分类名称:', categoryName)
  }sole.log('📥 开始加载文章内容...')
  
  // 先设置选中的文章// 确保 loadArticleContent 方法存在
  selectedArticle.value = { icleContent !== 'function') {
    ...article,
    category: categoryName
  }
  
  // 如果文章需要加载内容，异步加载const content = await articleAPI.loadArticleContent(article)
  if (article.needsContentLoad && article.contentUrl) {
    try {// 更新选中文章的内容
      console.log('📥 开始加载文章内容...')cle.value = {
      e,
      // 确保 loadArticleContent 方法存在
      if (typeof articleAPI.loadArticleContent !== 'function') {
        console.error('❌ articleAPI.loadArticleContent 方法未定义')
        throw new Error('文章内容加载方法未定义')console.log('✅ 文章内容加载完成，长度:', content.length)
      }
      catch (error) {
      const content = await articleAPI.loadArticleContent(article)❌ 加载文章内容失败:', error)
      
      // 更新选中文章的内容e,
      selectedArticle.value = { + error.message
        ...selectedArticle.value,
        content: content
      }lse if (article.content) {
      , article.content.length)
      console.log('✅ 文章内容加载完成，长度:', content.length)
      e.warn('⚠️ 文章没有内容或contentUrl')
    } catch (error) {
      console.error('❌ 加载文章内容失败:', error)e,
      selectedArticle.value = {
        ...selectedArticle.value,
        content: '# 文章内容加载失败\n\n' + error.message
      }
    }
  } else if (article.content) {const createNewArticle = () => {
    console.log('📄 使用已有内容，长度:', article.content.length)
  } else {
    console.warn('⚠️ 文章没有内容或contentUrl')
    selectedArticle.value = {
      ...selectedArticle.value,const editArticle = async (article) => {
      content: '暂无内容'itle)
    }
  }// 确保有完整的文章内容再进入编辑
}article

const createNewArticle = () => {if (article.needsContentLoad && article.contentUrl && !article.content) {
  editingArticleId.value = null
  showEditor.value = truesole.log('📥 编辑前先加载文章内容...')
}
// 确保方法存在
const editArticle = async (article) => {f articleAPI.loadArticleContent !== 'function') {
  console.log('🔧 编辑文章，原始数据:', article.title)
  
  // 确保有完整的文章内容再进入编辑
  let fullArticle = article
  const content = await articleAPI.loadArticleContent(article)
  if (article.needsContentLoad && article.contentUrl && !article.content) {
    try {
      console.log('📥 编辑前先加载文章内容...')ntent
      
      // 确保方法存在onsole.log('✅ 编辑用文章内容加载完成')
      if (typeof articleAPI.loadArticleContent !== 'function') {
        console.error('❌ articleAPI.loadArticleContent 方法未定义')❌ 编辑前加载内容失败:', error)
        throw new Error('文章内容加载方法未定义')
      }
       文章内容加载失败\n\n请刷新页面重试。'
      const content = await articleAPI.loadArticleContent(article)
      fullArticle = {
        ...article,
        content: content
      }editingArticleId.value = fullArticle.id || fullArticle.articleId
      console.log('✅ 编辑用文章内容加载完成')
    } catch (error) {
      console.error('❌ 编辑前加载内容失败:', error)lArticle.categoryId || fullArticle.category_id,
      fullArticle = {
        ...article,
        content: '# 文章内容加载失败\n\n请刷新页面重试。'
      }
    }console.log('📤 传递给编辑器的数据:', {
  }
  value.title,
  editingArticleId.value = fullArticle.id || fullArticle.articleIde.content?.length || 0
  originalArticleData.value = {
    ...fullArticle,
    categoryId: fullArticle.categoryId || fullArticle.category_id,showEditor.value = true
    isShared: fullArticle.isShared || fullArticle.is_shared,
    status: fullArticle.status || 'draft'
  }// 编辑器事件处理
  itorClose = () => {
  console.log('📤 传递给编辑器的数据:', {
    id: editingArticleId.value, null
    title: originalArticleData.value.title,
    contentLength: originalArticleData.value.content?.length || 0
  })const onArticleSaved = async (savedArticle) => {
  
  showEditor.value = true null
}
rticles()  // 选中新保存的文章
// 编辑器事件处理data) {
const onEditorClose = () => {
  showEditor.value = falseData = savedArticle.data
  editingArticleId.value = nullryId || articleData.category_id || 0
}

const onArticleSaved = async (savedArticle) => {selectedArticle.value = {
  showEditor.value = false
  editingArticleId.value = nulloryName
  // 重新加载文章列表
  await loadArticles()  // 选中新保存的文章
  if (savedArticle && savedArticle.data) {
    // 确保分类名称正确显示
    const articleData = savedArticle.dataconst shareArticle = async (article) => {
    const categoryId = articleData.categoryId || articleData.category_id || 0
    const categoryName = await getCategoryNameById(categoryId)(article.isShared || article.is_shared) {
    on.origin}/article/${article.id}`)
    selectedArticle.value = {icle.id}`)
      ...articleData,
      category: categoryName
    }e.log('📤 该文章未公开分享')
  }
}atch (error) {
分享失败:', error)
const shareArticle = async (article) => {
  try {
    if (article.isShared || article.is_shared) {
      console.log('📋 复制分享链接:', `${window.location.origin}/article/${article.id}`)const deleteArticle = async (article) => {
      await navigator.clipboard.writeText(`${window.location.origin}/article/${article.id}`)？`)) {
      // 显示成功提示
    } else {
      console.log('📤 该文章未公开分享')
    }try {
  } catch (error) {it articleAPI.deleteArticle(article.id)
    console.error('分享失败:', error)
  }tion.current, !!searchState.query)
}
// 如果删除的是当前选中的文章，清空选择
const deleteArticle = async (article) => {alue && selectedArticle.value.id === article.id) {
  if (!confirm(`确定要删除文章"${article.title}"吗？`)) {
    return
  }atch (error) {
  删除文章失败:', error)
  try {
    await articleAPI.deleteArticle(article.id)
    console.log('🗑️ 文章删除成功')
    await loadArticles(pagination.current, !!searchState.query)// 用户相关方法
    tProfile = () => {
    // 如果删除的是当前选中的文章，清空选择e
    if (selectedArticle.value && selectedArticle.value.id === article.id) {true
      selectedArticle.value = null
    }
  } catch (error) {const openSettings = () => {
    console.error('删除文章失败:', error)
  }
}

// 用户相关方法const logout = async () => {
const editProfile = () => {
  showUserMenu.value = false
  showProfileEditor.value = trueit authAPI.logout()
}
)
const openSettings = () => {
  showUserMenu.value = false退出登录失败:', error)
  router.push('/settings')
}
)
const logout = async () => {
  showUserMenu.value = false
  try {
    await authAPI.logout()const closeProfileEditor = () => {
    localStorage.clear()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)const onProfileUpdated = (updatedUser) => {
    // 即使API调用失败，也清除本地存储
    localStorage.clear()lue = updatedUser.username || updatedUser.name || userName.value
    router.push('/login')
  }
}tedUser.avatar

const closeProfileEditor = () => {
  showProfileEditor.value = false// 更新localStorage中的用户信息
}ser', JSON.stringify(updatedUser))

const onProfileUpdated = (updatedUser) => {
  // 更新本地用户信息
  userName.value = updatedUser.username || updatedUser.name || userName.valueconst searchArticles = () => {
  userEmail.value = updatedUser.email || userEmail.value
  if (updatedUser.avatar) {y = searchQuery.value.trim()
    userAvatar.value = updatedUser.avatar
  }// 如果搜索关键词为空，则清除搜索
  
  // 更新localStorage中的用户信息s()
  localStorage.setItem('user', JSON.stringify(updatedUser))
    closeProfileEditor()
}
// 更新搜索状态并执行搜索
const searchArticles = () => {ery = query
  // 去除多余的空格
  const query = searchQuery.value.trim()
  tate.type,
  // 如果搜索关键词为空，则清除搜索ype === 'complex' ? ['title', 'content', 'summary'] : ['title']
  if (!query) {
    clearFilters()adArticles(1, true)
    return
  }
  // 搜索类型变化处理
  // 更新搜索状态并执行搜索rchTypeChange = () => {
  searchState.query = query
  console.log('🔍 执行搜索:', {y && searchState.query.trim()) {
    query: query,
    type: searchState.type,
    searchIn: searchState.type === 'complex' ? ['title', 'content', 'summary'] : ['title']
  })
  loadArticles(1, true)
}// 分页相关方法
dlePageChange = (page) => {
// 搜索类型变化处理uery)
const onSearchTypeChange = () => {
  // 如果当前有搜索关键词，重新执行搜索
  if (searchState.query && searchState.query.trim()) {const handlePageSizeChange = (pageSize) => {
    console.log('🔄 搜索类型变化，重新搜索:', searchState.type)
    loadArticles(1, true)
  }chState.query)
}

// 分页相关方法// 分类筛选
const handlePageChange = (page) => {ilterByCategory = (categoryId) => {
  loadArticles(page, !!searchState.query)yId
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize// 清除筛选
  pagination.current = 1learFilters = () => {
  loadArticles(1, !!searchState.query)
}
mplex' // 默认使用复杂搜索（支持内容搜索）
// 分类筛选
const filterByCategory = (categoryId) => {
  searchState.filters.categoryId = categoryId
  loadArticles(1)ll
}
oadArticles(1)
// 清除筛选
const clearFilters = () => {
  searchState.query = ''const formatDate = (dateString) => {
  searchQuery.value = ''
  searchState.type = 'complex' // 默认使用复杂搜索（支持内容搜索）h-CN', {
  searchState.filters = {
    categoryId: null,
    status: null,
    dateRange: null
  }
  loadArticles(1)
}const getStatusText = (status) => {

const formatDate = (dateString) => {
  const date = new Date(dateString)已发布',
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',eturn statusMap[status] || '未知'
    day: 'numeric'
  })
}// 加载数据
oadArticles = async (page = 1, search = false) => {
const getStatusText = (status) => {})
  const statusMap = {
    'draft': '草稿',rue
    'published': '已发布',
    'archived': '已归档'try {
  } response
  return statusMap[status] || '未知'g('🔍 开始加载用户文章:', { 
}
, 
// 加载数据earchState.query,
const loadArticles = async (page = 1, search = false) => {.getItem('userId'),
  console.log('🚀 loadArticles 函数被调用，参数:', { page, search })
  isLoading.value = true
  pagination.loading = true
  // 检查认证状态
  try {rId = localStorage.getItem('userId')
    let response
      console.log('🔍 开始加载用户文章:', { r('❌ 没有找到用户ID，可能需要重新登录')
      page, 
      search, 
      query: searchState.query, if (search && searchState.query) {
      hasUserId: !!localStorage.getItem('userId'),
      baseURL: import.meta.env.VITE_API_BASE_URL.log('🔍 执行搜索:', {
    })y,
    
    // 检查认证状态tate.filters.categoryId
    const userId = localStorage.getItem('userId')
    if (!userId) {
      console.error('❌ 没有找到用户ID，可能需要重新登录')try {
      throw new Error('未登录或登录已过期')(searchState.type === 'complex') {
    }
      if (search && searchState.query) {{
      // 执行搜索query,
      console.log('🔍 执行搜索:', {t', 'summary'], // 搜索范围包括内容
        query: searchState.query,
        type: searchState.type,
        categoryFilter: searchState.filters.categoryId
      })esponse = await articleAPI.complexSearch(searchOptions, page, pagination.pageSize)
      
      try {单搜索（只搜索标题）
        if (searchState.type === 'complex') { articleAPI.simpleSearch(searchState.query, page, pagination.pageSize)
          // 使用复杂搜索，支持标题、内容、摘要搜索
          const searchOptions = {atch (searchError) {
            keyword: searchState.query,，回退到普通获取:', searchError)
            searchIn: ['title', 'content', 'summary'], // 搜索范围包括内容ge, pagination.pageSize, searchState.filters.categoryId)
            categoryId: searchState.filters.categoryId,
            status: searchState.filters.status文章
          }('📊 调用用户文章API...', {
          response = await articleAPI.complexSearch(searchOptions, page, pagination.pageSize)
        } else {nation.pageSize,
          // 使用简单搜索（只搜索标题）s.categoryId
          response = await articleAPI.simpleSearch(searchState.query, page, pagination.pageSize)
        }sponse = await articleAPI.getAllArticles(page, pagination.pageSize, searchState.filters.categoryId)
      } catch (searchError) {
        console.warn('⚠️ 搜索失败，回退到普通获取:', searchError)
        response = await articleAPI.getAllArticles(page, pagination.pageSize, searchState.filters.categoryId)// 处理响应数据
      }} else {a = response?.data || response
      // 获取用户所有文章
      console.log('📊 调用用户文章API...', {
        pageNum: page,
        pageSize: pagination.pageSize, data,
        categoryId: searchState.filters.categoryId(data),
      })of data === 'object' && 'list' in data,
      response = await articleAPI.getAllArticles(page, pagination.pageSize, searchState.filters.categoryId)
    }
    
    // 处理响应数据// 处理PageInfo格式的响应
    const data = response?.data || response []
    console.log('📊 API响应详情:', {
      hasResponse: !!response,
      hasData: !!data,if (data && typeof data === 'object') {
      dataType: typeof data,
      isArray: Array.isArray(data),rray.isArray(data.list)) {
      hasListProperty: data && typeof data === 'object' && 'list' in data,ageNum: number, pageSize: number }
      keys: data && typeof data === 'object' ? Object.keys(data) : null
    })|| 0
    geNum || page
    // 处理PageInfo格式的响应gination.pageSize
    let articlesList = []
    let totalCount = 0,
    
    if (data && typeof data === 'object') {Num,
      // 检查是否是PageInfo格式e
      if (data.list && Array.isArray(data.list)) {
        // PageInfo格式：{ list: [], total: number, pageNum: number, pageSize: number }se if (Array.isArray(data)) {
        articlesList = data.list
        totalCount = data.total || 0ist = data
        pagination.current = data.pageNum || pageength
        pagination.pageSize = data.pageSize || pagination.pageSize')
        console.log('✅ 检测到PageInfo格式:', {
          listLength: articlesList.length,e.warn('⚠️ 未知的响应格式，尝试查找文章数组:', data)
          total: totalCount,
          pageNum: data.pageNum,cles && Array.isArray(data.articles)) {
          pageSize: data.pageSize
        })ata.articles.length
      } else if (Array.isArray(data)) {tent)) {
        // 直接数组格式
        articlesList = dataents || data.content.length
        totalCount = data.length
        console.log('✅ 检测到直接数组格式')esList = []
      } else {
        console.warn('⚠️ 未知的响应格式，尝试查找文章数组:', data)
        // 尝试其他可能的字段名
        if (data.articles && Array.isArray(data.articles)) {lse if (Array.isArray(data)) {
          articlesList = data.articles
          totalCount = data.total || data.articles.lengthist = data
        } else if (data.content && Array.isArray(data.content)) {ength
          articlesList = data.content')
          totalCount = data.totalElements || data.content.length
        } else {e.warn('⚠️ API返回了非预期的数据格式:', typeof data, data)
          articlesList = []
          totalCount = 0
        }
      } console.log('📊 提取的文章列表:', {
    } else if (Array.isArray(data)) {
      // 直接数组格式0, 2).map(a => ({
      articlesList = data
      totalCount = data.length
      console.log('✅ 检测到直接数组格式').content,
    } else {entUrl || a.content_url)
      console.warn('⚠️ API返回了非预期的数据格式:', typeof data, data)
      articlesList = []
      totalCount = 0if (articlesList.length > 0) {
    }', articlesList.length)
      console.log('📊 提取的文章列表:', {p(a => ({
      count: articlesList.length,
      sample: articlesList.slice(0, 2).map(a => ({d,
        id: a.articleId || a.id,d,
        title: a.title,
        hasContent: !!a.content,
        hasContentUrl: !!(a.contentUrl || a.content_url)
      }))// 先确保分类数据已加载
    })🌳 在处理文章前先加载分类数据...')
      if (articlesList.length > 0) {
      console.log('🔍 开始处理文章数据，文章数量:', articlesList.length)
      console.log('📝 文章样本数据:', articlesList.slice(0, 1).map(a => ({const processedArticles = await Promise.all(articlesList.map(async (article, index) => {
        articleId: a.articleId,
        categoryId: a.categoryId,
        category_id: a.category_id,ategoryId,
        title: a.titled,
      })))Id || article.category_id || 0
      
      // 先确保分类数据已加载
      console.log('🌳 在处理文章前先加载分类数据...')// 根据API文档，后端返回的字段是：articleId, createTime, updateTime
      await loadCategories()
      
      const processedArticles = await Promise.all(articlesList.map(async (article, index) => {- API返回articleId
        console.log(`🔍 处理文章 ${index + 1}:`, {ticle.id || `temp_${Date.now()}_${index}`,
          title: article.title,
          categoryId: article.categoryId,, // 简易模式可能没有content
          category_id: article.category_id, '',
          finalCategoryId: article.categoryId || article.category_id || 0|| 0,
        })
        ime,
        // 根据API文档，后端返回的字段是：articleId, createTime, updateTime
        const processed = {| new Date().toISOString(),
          ...article,
          // 确保有唯一ID - API返回articleId
          id: article.articleId || article.id || `temp_${Date.now()}_${index}`,article.content_url,
          title: article.title || '无标题',tent_url) && !article.content,
          content: article.content || '', // 简易模式可能没有content
          summary: article.summary || article.description || '',
          categoryId: article.categoryId || article.category_id || 0,ername,
          // 保持原始API字段名，同时映射为组件期望的字段名          // 通过API获取真实的分类名称
          createTime: article.createTime, || article.category_id || 0),
          updateTime: article.updateTime,
          createdAt: article.createTime || new Date().toISOString(), {
          updatedAt: article.updateTime || new Date().toISOString(),ticle.articleId,
          status: article.status || 'draft',
          contentUrl: article.contentUrl || article.content_url,ateTime,
          needsContentLoad: !!(article.contentUrl || article.content_url) && !article.content,
          isShared: article.isShared || article.is_shared || false,
          // 添加用户信息（从API响应中获取）
          username: article.username,
          nickname: article.nickname,          // 通过API获取真实的分类名称console.log(`📄 处理文章 "${processed.title}":`, {
          category: await getCategoryNameById(article.categoryId || article.category_id || 0),
          // 保留原始字段便于调试
          originalData: {ateTime,
            articleId: article.articleId,
            userId: article.userId,tedAt,
            createTime: article.createTime,
            updateTime: article.updateTime
          }ntUrl,
        }ntLoad,
        
        console.log(`📄 处理文章 "${processed.title}":`, { // 显示获取到的分类名称
          originalId: article.articleId,
          mappedId: processed.id,
          createTime: article.createTime,return processed
          updateTime: article.updateTime,
          mappedCreatedAt: processed.createdAt,
          mappedUpdatedAt: processed.updatedAt,allArticles.value = processedArticles
          hasContent: !!processed.content,
          hasContentUrl: !!processed.contentUrl,
          needsContentLoad: processed.needsContentLoad,console.log('✅ 用户文章数据加载成功:', {
          categoryId: processed.categoryId,gth,
          categoryName: processed.category, // 显示获取到的分类名称
          status: processed.statuscurrent,
        })
          return processed.filter(a => a.content).length,
      }))d).length,
      
      allArticles.value = processedArticleslesSample: processedArticles
      pagination.total = totalCount || 0) - new Date(a.updateTime || 0))
      
      console.log('✅ 用户文章数据加载成功:', {
        count: processedArticles.length,itle,
        total: pagination.total,pdateTime,
        currentPage: pagination.current,
        pageSize: pagination.pageSize,
        withContent: processedArticles.filter(a => a.content).length, else {
        needsLoading: processedArticles.filter(a => a.needsContentLoad).length,⚠️ 用户暂无文章或API返回空数据')
        // 调试最近文章排序
        recentArticlesSample: processedArticles
          .sort((a, b) => new Date(b.updateTime || 0) - new Date(a.updateTime || 0))
          .slice(0, 3)// 即使没有文章，也要加载分类数据
          .map(a => ({es()
            title: a.title,
            updateTime: a.updateTime,
            createTime: a.createTime  } catch (error) {
          }))❌ 加载用户文章失败:', error)
      })    } else {
      console.warn('⚠️ 用户暂无文章或API返回空数据')
      allArticles.value = [].status,
      pagination.total = 0tusText,
      
      // 即使没有文章，也要加载分类数据
      await loadCategories()
    }ethod,
s
  } catch (error) {
    console.error('❌ 加载用户文章失败:', error)
    console.error('API错误详情:', {
      message: error.message,// 显示用户可见的错误信息
      status: error.response?.status,ge = '加载文章失败：'
      statusText: error.response?.statusText,== 401) {
      data: error.response?.data,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,.removeItem('userId')
        headers: error.config.headers
      } : null
    })('/login')
    .status === 403) {
    // 显示用户可见的错误信息
    let errorMessage = '加载文章失败：'
    if (error.response?.status === 401) {e?.status === 404) {
      console.error('🔐 认证失败，可能需要重新登录')
      errorMessage += '认证失败，请重新登录'
      // 清除无效的认证信息RROR' || !error.response) {
      localStorage.removeItem('userId')
      localStorage.removeItem('user')
      // 可以选择跳转到登录页面
      // router.push('/login')essage += error.message
    } else if (error.response?.status === 403) {
      console.error('🚫 权限不足')
      errorMessage += '权限不足'// 在页面上显示错误（可选）
    } else if (error.response?.status === 404) { 错误提示:', errorMessage)
      console.error('🔍 API端点未找到，请检查后端服务')
      errorMessage += 'API端点不存在，请检查后端服务'// 显示错误状态，不使用模拟数据
    } else if (error.code === 'NETWORK_ERROR' || !error.response) { = []
      console.error('🌐 网络连接失败，请检查后端服务是否运行')
      errorMessage += '网络连接失败，请检查后端服务是否运行'
    } else {// 仍然尝试加载分类
      errorMessage += error.message
    }it loadCategories()
    
    // 在页面上显示错误（可选）载分类也失败:', catError)
    console.warn('💡 错误提示:', errorMessage)
    inally {
    // 显示错误状态，不使用模拟数据.value = false
    allArticles.value = []lse
    pagination.total = 0
    
    // 仍然尝试加载分类
    try {// 用户文章API测试
      await loadCategories()erArticlesAPI = async () => {
    } catch (catError) {
      console.error('❌ 加载分类也失败:', catError)st response = await articleAPI.getAllArticles(1, 10)
    }
  } finally {
    isLoading.value = false❌ 用户文章API测试失败:', error)
    pagination.loading = false
  }
}
// 直接API调用测试
// 用户文章API测试rectAPICall = async () => {
const testUserArticlesAPI = async () => {userId')
  try {
    const response = await articleAPI.getAllArticles(1, 10)
    console.log('✅ 用户文章API测试成功:', response)if (!userId) {
  } catch (error) {r('❌ 直接测试失败：没有userId')
    console.error('❌ 用户文章API测试失败:', error)
  }
}
try {
// 直接API调用测试sole.log('📡 直接调用 fetch API...')
const testDirectAPICall = async () => {v1/articles/all/1/10', {
  const userId = localStorage.getItem('userId')
  console.log('🧪 进行直接API调用测试:', { userId })
  -Type': 'application/json',
  if (!userId) {
    console.error('❌ 直接测试失败：没有userId')
    return
  }
  console.log('📥 直接API响应:', {
  try {
    console.log('📡 直接调用 fetch API...')tusText,
    const response = await fetch('/api/v1/articles/all/1/10', {
      method: 'GET',fromEntries(response.headers.entries())
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userIdif (response.ok) {
      }it response.json()
    })ata)
    
    console.log('📥 直接API响应:', {if (data && data.list && Array.isArray(data.list)) {
      status: response.status,ata.total}`)
      statusText: response.statusText,
      ok: response.ok,ata.list[0])
      headers: Object.fromEntries(response.headers.entries())
    })lse {
    e.warn('⚠️ 响应数据格式异常')
    if (response.ok) {
      const data = await response.json()lse {
      console.log('✅ 直接API测试成功，响应数据:', data)errorText = await response.text()
      )
      if (data && data.list && Array.isArray(data.list)) {
        console.log(`📝 找到 ${data.list.length} 篇文章，总数: ${data.total}`)atch (error) {
        if (data.list.length > 0) {❌ 直接API调用异常:', error)
          console.log('📄 文章样例:', data.list[0])
        }
      } else {
        console.warn('⚠️ 响应数据格式异常')// 分类API测试
      }CategoryAPI = async () => {
    } else {
      const errorText = await response.text()st response = await categoryAPI.getCategoryTree(0)
      console.error('❌ 直接API测试失败:', errorText)
    }
  } catch (error) {❌ 分类API测试失败:', error)
    console.error('❌ 直接API调用异常:', error)
  }
}
// 移除模拟数据方法，或者只在真正需要测试时使用
// 分类API测试) => {
const testCategoryAPI = async () => {API连接')
  try {
    const response = await categoryAPI.getCategoryTree(0)
    console.log('✅ 分类API测试成功:', response)
  } catch (error) {// 加载分类数据
    console.error('❌ 分类API测试失败:', error)dCategories = async () => {
  }
}sole.log('🌳 开始加载用户分类树...')

// 移除模拟数据方法，或者只在真正需要测试时使用// 检查认证状态
const getMockArticles = () => {rId = localStorage.getItem('userId')
  console.warn('⚠️ 不再使用模拟数据，请检查API连接')
  return []r('❌ 没有找到用户ID，设置测试用户ID')
}
userId', testUserId)
// 加载分类数据
const loadCategories = async () => {
  try {
    console.log('🌳 开始加载用户分类树...')console.log('🔑 使用userId加载分类:', localStorage.getItem('userId'))
    
    // 检查认证状态// 使用分类树API获取用户的所有分类
    const userId = localStorage.getItem('userId') await categoryAPI.getCategoryTree(0)
    if (!userId) {
      console.error('❌ 没有找到用户ID，设置测试用户ID')console.log('🌳 分类树API响应详情:', {
      const testUserId = '2'
      localStorage.setItem('userId', testUserId)yData,
      console.log('✅ 已设置测试用户ID:', testUserId)yData),
    } categoryData.length : 0,
     ? categoryData[0] : null,
    console.log('🔑 使用userId加载分类:', localStorage.getItem('userId'))
    
    // 使用分类树API获取用户的所有分类
    const categoryData = await categoryAPI.getCategoryTree(0)// 处理响应数据
    .isArray(categoryData) && categoryData.length > 0) {
    console.log('🌳 分类树API响应详情:', {
      hasData: !!categoryData,ats) => {
      dataType: typeof categoryData,
      isArray: Array.isArray(categoryData),
      length: Array.isArray(categoryData) ? categoryData.length : 0,d: false,
      sample: Array.isArray(categoryData) && categoryData.length > 0 ? categoryData[0] : null,ll的情况
      fullData: categoryDatad || 0,
    })CategoryExpanded(cat.children) : []
    
    // 处理响应数据
    if (Array.isArray(categoryData) && categoryData.length > 0) {
      // 递归设置展开状态，处理parentId为null的情况categories.value = setCategoryExpanded(categoryData)
      const setCategoryExpanded = (cats) => {
        return cats.map(cat => ({console.log('✅ 分类树加载成功:', {
          ...cat,es.value.length,
          expanded: false,c => ({
          // 处理parentId为null的情况
          parentId: cat.parentId || 0,
          children: cat.children ? setCategoryExpanded(cat.children) : []arentId,
        }))ldren && c.children.length > 0)
      }
      
      categories.value = setCategoryExpanded(categoryData)se if (Array.isArray(categoryData) && categoryData.length === 0) {
      
      console.log('✅ 分类树加载成功:', {
        categoriesCount: categories.value.length,
        sample: categories.value.slice(0, 2).map(c => ({e.warn('⚠️ 分类数据格式异常:', categoryData)
          categoryId: c.categoryId,
          name: c.name,
          parentId: c.parentId,// 尝试从文章构建分类作为后备方案
          hasChildren: !!(c.children && c.children.length > 0)lue.length > 0) {
        }))
      })
    } else if (Array.isArray(categoryData) && categoryData.length === 0) {
      console.warn('⚠️ 分类数据为空数组，用户可能没有创建分类')
      categories.value = []
    } else {catch (error) {
      console.warn('⚠️ 分类数据格式异常:', categoryData)❌ 加载分类树失败:', {
      categories.value = []
      e?.data,
      // 尝试从文章构建分类作为后备方案
      if (allArticles.value.length > 0) {
        console.log('📝 尝试从文章构建分类...')
        buildCategoriesFromArticles()
      }tegories.value = []
    }
    // 尝试从文章构建分类作为后备方案
  } catch (error) {lue.length > 0) {
    console.error('❌ 加载分类树失败:', {.')
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      stack: error.stack
    })// 从文章构建分类（后备方案）
    categories.value = []oriesFromArticles = () => {
    
    // 尝试从文章构建分类作为后备方案ach(article => {
    if (allArticles.value.length > 0) {'未分类'
      console.log('📝 API失败，尝试从文章构建分类...')own'
      buildCategoriesFromArticles()
    }
  }
}

// 从文章构建分类（后备方案）,
const buildCategoriesFromArticles = () => {se,
  const categoryMap = {}
  allArticles.value.forEach(article => {
    const catName = article.category || '未分类'
    const catId = article.categoryId || 'unknown'ategoryMap[catId].articles.push(article)
    if (!categoryMap[catId]) {
      categoryMap[catId] = {tegories.value = Object.values(categoryMap)
        categoryId: catId,length)
        name: catName,
        parentId: 0,
        articles: [],// 根据分类ID获取分类名称
        expanded: false,ryNameById = async (categoryId) => {
        children: []Id: ${categoryId}, 类型: ${typeof categoryId}`)
      }
    }if (!categoryId || categoryId === 0) {
    categoryMap[catId].articles.push(article)
  })
  categories.value = Object.values(categoryMap)
  console.log('📝 从文章构建的分类:', categories.value.length)
}try {
首先尝试从本地分类树中查找
// 根据分类ID获取分类名称ryInTree = (cats, targetId) => {
const getCategoryNameById = async (categoryId) => {
  console.log(`🏷️ getCategoryNameById 被调用，categoryId: ${categoryId}, 类型: ${typeof categoryId}`)
  {cat.name} (ID: ${cat.categoryId})`)
  if (!categoryId || categoryId === 0) {g(targetId)) {
    console.log(`🏷️ 分类ID为空或0，返回"未分类"`)
    return '未分类'
  }
  f (cat.children && cat.children.length > 0) {
  try {n, targetId)
    // 首先尝试从本地分类树中查找
    const findCategoryInTree = (cats, targetId) => {
      console.log(`🔍 在分类树中查找ID: ${targetId}`)
      for (const cat of cats) {eturn null
        console.log(`🔍 检查分类: ${cat.name} (ID: ${cat.categoryId})`)
        if (cat.categoryId === targetId || cat.categoryId === String(targetId)) {
          console.log(`✅ 在分类树中找到匹配: ${cat.name}`)console.log(`🌳 当前分类树内容:`, categories.value.map(c => ({ id: c.categoryId, name: c.name })))
          return cat.name
        }const localCategoryName = findCategoryInTree(categories.value, categoryId)
        if (cat.children && cat.children.length > 0) {
          const found = findCategoryInTree(cat.children, targetId)取分类名称: ${localCategoryName}`)
          if (found) return found
        }
      }
      return null// 如果本地没有找到，通过API获取分类详情
    }到，通过API获取分类ID ${categoryId} 的名称`)
    d)
    console.log(`🌳 当前分类树内容:`, categories.value.map(c => ({ id: c.categoryId, name: c.name })))
    console.log(`📥 分类API响应:`, response)
    const localCategoryName = findCategoryInTree(categories.value, categoryId)
    if (localCategoryName) {// 简化响应处理，直接取name
      console.log(`✅ 从本地分类树获取分类名称: ${localCategoryName}`)= '未分类'
      return localCategoryName) {
    }ata.name
    goryName}`)
    // 如果本地没有找到，通过API获取分类详情
    console.log(`🔍 本地分类树未找到，通过API获取分类ID ${categoryId} 的名称`)me
    const response = await categoryAPI.getCategory(categoryId)格式): ${categoryName}`)
    
    console.log(`📥 分类API响应:`, response)e.warn(`⚠️ API未返回有效的分类名称:`, response)
    
    // 简化响应处理，直接取name
    let categoryName = '未分类'return categoryName
    if (response?.data?.name) {
      categoryName = response.data.namecatch (error) {
      console.log(`✅ 从API获取分类名称: ${categoryName}`)❌ 获取分类名称失败 (ID: ${categoryId}):`, error)
    } else if (response?.name) {
      categoryName = response.name
      console.log(`✅ 从API获取分类名称(直接格式): ${categoryName}`)
    } else {
      console.warn(`⚠️ API未返回有效的分类名称:`, response)// 加载用户信息
    }dUserInfo = () => {
    ge.getItem('user')
    return categoryName
    
  } catch (error) {st user = JSON.parse(userStr)
    console.error(`❌ 获取分类名称失败 (ID: ${categoryId}):`, error)| user.name || 'Demo User'
    return '未分类'
  }
}
 = user.avatar
// 加载用户信息
const loadUserInfo = () => {atch (error) {
  const userStr = localStorage.getItem('user')解析用户信息失败:', error)
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      userName.value = user.username || user.name || 'Demo User'
      userEmail.value = user.email || 'demo@artman.com'// 点击外部关闭用户菜单
      // 加载用户头像，支持本地文件和URLlickOutside = (event) => {
      if (user.avatar) {er')) {
        userAvatar.value = user.avatar
      }
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }// 评论相关方法
  }ommentCountChange = (count) => {
}

// 点击外部关闭用户菜单value) {
const handleClickOutside = (event) => {entCount = count
  if (!event.target.closest('.navbar-user')) {
    showUserMenu.value = false
  }
}// 生命周期钩子
(async () => {
// 评论相关方法leManager组件已挂载')
const onCommentCountChange = (count) => {
  console.log('💬 评论数量变更:', count).env.VITE_API_BASE_URL,
  // 可以在这里更新文章信息中的评论数量
  if (selectedArticle.value) {
    selectedArticle.value.commentCount = count
  }
}// 首先加载用户信息
)
// 生命周期钩子
onMounted(async () => {// 然后加载文章数据（会自动先加载分类数据）
  console.log('🚀 ArticleManager组件已挂载')据...')
  console.log('🔧 环境配置:', {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    hasUserId: !!localStorage.getItem('userId'),// 添加延迟后的状态检查
    userId: localStorage.getItem('userId'), => {
    nodeEnv: import.meta.env.NODE_ENV3秒后组件状态检查:', {
  })s.value.length,
    // 首先加载用户信息ength,
  loadUserInfo()
  ,
  // 然后加载文章数据（会自动先加载分类数据）
  console.log('📊 开始加载文章数据...')
  await loadArticles(1, false)etItem('userId')
  
  // 添加延迟后的状态检查
  setTimeout(() => {if (allArticles.value.length === 0) {
    console.log('📊 3秒后组件状态检查:', {...')
      allArticlesCount: allArticles.value.length,
      recentArticlesCount: recentArticles.value.length,
      categoriesCount: categories.value.length,
      flatCategoriesCount: flatCategories.value,if (categories.value.length === 0) {
      paginationTotal: pagination.total,试...')
      isLoading: isLoading.value,
      hasUserId: !!localStorage.getItem('userId')
    })3000)
    
    if (allArticles.value.length === 0) {document.addEventListener('click', handleClickOutside)
      console.warn('⚠️ 文章列表仍然为空，进行API直接测试...')
      testDirectAPICall()
    }onUnmounted(() => {
    entListener('click', handleClickOutside)
    if (categories.value.length === 0) {
      console.warn('⚠️ 分类列表为空，进行分类API直接测试...')script>
      testCategoryAPI()
    }<style scoped>
  }, 3000)er {
  h;
  document.addEventListener('click', handleClickOutside)c;
})
: column;
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})/* 顶部导航栏 */
</script>
 10vh;
<style scoped>4px;
.article-manager {r-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  background: #f8fafc;enter;
  display: flex;ce-between;
  flex-direction: column;
}x 10px rgba(0, 0, 0, 0.1);

/* 顶部导航栏 */
.navbar {
  height: 10vh;
  min-height: 64px;.navbar-brand {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);;
  display: flex;enter;
  align-items: center;
  justify-content: space-between;te;
  padding: 0 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;.logo {
  z-index: 100;: 40px;
};
tness(0) invert(1);
.navbar-brand {
  display: flex;
  align-items: center;.brand-name {
  gap: 1rem;28px;
  color: white;;
}
cing: -0.5px;
.logo {
  width: 40px;
  height: 40px;.navbar-user {
  filter: brightness(0) invert(1);lative;
}

.brand-name {.user-avatar {
  font-size: 28px;
  font-weight: 700;;
  margin: 0;: 50%;
  letter-spacing: -0.5px;
}ve;
gba(255, 255, 255, 0.3);
.navbar-user {
  position: relative;
}

.user-avatar {.user-avatar:hover {
  width: 44px;(255, 255, 255, 0.6);
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;.user-avatar img {
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;;
  overflow: hidden;over;
}

.user-avatar:hover {.user-status {
  border-color: rgba(255, 255, 255, 0.6);solute;
  transform: scale(1.05);
}
;
.user-avatar img {;
  width: 100%;10b981;
  height: 100%;ite;
  object-fit: cover;
}

.user-status {.user-menu {
  position: absolute;absolute;
  bottom: 2px;px);
  right: 2px;
  width: 12px;d: white;
  height: 12px;x;
  background: #10b981;0px rgba(0, 0, 0, 0.15);
  border: 2px solid white;
  border-radius: 50%;
} solid #e2e8f0;

.user-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;.user-info {
  background: white;.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);enter;
  min-width: 280px;
  padding: 0;: #f8fafc;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  z-index: 1000;.user-info img {
}
;
.user-info {: 50%;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;.user-details {
  background: #f8fafc;
}

.user-info img {.user-name {
  width: 50px;t: 600;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;4px;
}

.user-details {.user-email {
  flex: 1;48b;
};

.user-name {
  font-weight: 600;.menu-divider {
  font-size: 16px;
  color: #1a202c;ne;
  margin-bottom: 4px;
}#e2e8f0;

.user-email {
  color: #64748b;.menu-items {
  font-size: 14px; none;
};

.menu-divider {
  margin: 0;
  border: none;.menu-items li {
  height: 1px;
  background: #e2e8f0;enter;
}
rem 1.5rem;
.menu-items {
  list-style: none;ground 0.2s ease;
  padding: 0.5rem 0;
  margin: 0;;
}

.menu-items li {.menu-items li:hover {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;.menu-items li.logout-item:hover {
  cursor: pointer;
  transition: background 0.2s ease;
  color: #374151;
  font-size: 14px;
}.menu-items li i {

.menu-items li:hover {;
  background: #f1f5f9;
}
/* 主体内容区域 */
.menu-items li.logout-item:hover {t {
  background: #fef2f2;
  color: #dc2626; flex;
}00vh - 80px);

.menu-items li i {
  width: 16px; 2rem;
  height: 16px;;
}

/* 主体内容区域 *//* 左侧边栏 */
.main-content {
  flex: 1;60px;
  display: flex;hite;
  height: calc(100vh - 80px);x;
  margin-top: 20px;px rgba(0, 0, 0, 0.05);
  gap: 20px;
  padding: 0 2rem;
  overflow: hidden;: column;
}

/* 左侧边栏 */
.sidebar {.sidebar-header {
  width: 360px;;
  background: white;px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);enter;
  overflow: hidden;ce-between;
  display: flex;
  flex-direction: column;
  position: relative;
}
.sidebar-header h3 {
.sidebar-header {
  padding: 1.5rem; 18px;
  border-bottom: 1px solid #e2e8f0;;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  gap: 1rem;.header-actions {
}

.sidebar-header h3 {
  margin: 0;on: column;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;.btn-new-article,
  width: 100%;ories {
}dient(135deg, #667eea 0%, #764ba2 100%);

.header-actions {
  display: flex;em 1rem;
  gap: 0.5rem;
  width: 100%;
  flex-direction: column;;
}

.btn-new-article,enter;
.btn-manage-categories {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);all 0.2s ease;
  color: white;
  border: none;r;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 14px;.btn-manage-categories {
  font-weight: 500;dient(135deg, #4ecdc4 0%, #44a08d 100%);
  cursor: pointer;
  display: flex;
  align-items: center;.btn-new-article:hover {
  gap: 0.5rem;-1px);
  transition: all 0.2s ease;102, 126, 234, 0.4);
  text-decoration: none;
  justify-content: center;
}.search-box {
m 1.5rem;
.btn-manage-categories {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}
.search-box i {
.btn-new-article:hover {olute;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}: translateY(-50%);

.search-box {
  margin: 1rem 1.5rem;
  position: relative;
}.search-box input {

.search-box i {5rem 2.5rem 0.75rem 2.5rem;
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);er-color 0.2s ease;
  color: #64748b;
  z-index: 2;
}
.search-box input:focus {
.search-box input {
  width: 100%;#667eea;
  padding: 0.75rem 2.5rem 0.75rem 2.5rem;rgba(102, 126, 234, 0.1);
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;.search-clear-btn {
  transition: border-color 0.2s ease;e;
  box-sizing: border-box;
}
: translateY(-50%);
.search-box input:focus {
  outline: none;
  border-color: #667eea;b;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);;
}d;

.search-clear-btn {;
  position: absolute;x;
  right: 8px;s ease;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;.search-clear-btn:hover {
  color: #64748b;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  padding: 4px 6px;/* 搜索选项 */
  border-radius: 4px;tions {
  transition: all 0.2s ease;m 0.5rem;
  z-index: 2;
}afc;

.search-clear-btn:hover {e2e8f0;
  background: #f1f5f9;
  color: #374151;
}.search-type-label {

/* 搜索选项 */
.search-options {0.25rem;
  margin: 0 1.5rem 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 6px;.search-type-options {
  border: 1px solid #e2e8f0;
}

.search-type-label {
  font-size: 12px;.search-type-option {
  color: #64748b;
  margin-bottom: 0.25rem;enter;
  display: block;
}px;

.search-type-options {;
  display: flex;
  gap: 1rem;
}.search-type-option input[type="radio"] {

.search-type-option {inter;
  display: flex;
  align-items: center;
  gap: 0.25rem;.search-type-option:hover {
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}/* 筛选控件 */
ntrols {
.search-type-option input[type="radio"] { 1rem;
  margin: 0;
  cursor: pointer;enter;
}

.search-type-option:hover {
  color: #667eea;.filter-select {
}
 0.5rem 0.75rem;
/* 筛选控件 */b;
.filter-controls {
  margin: 0 1.5rem 1rem;
  display: flex;e;
  align-items: center;
  gap: 0.5rem;;
}er-color 0.2s ease;

.filter-select {
  flex: 1;.filter-select:focus {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;#667eea;
  border-radius: 6px;rgba(102, 126, 234, 0.1);
  font-size: 12px;
  background: white;
  color: #374151;.clear-filters-btn {
  cursor: pointer;
  transition: border-color 0.2s ease;d #d1d5db;
}

.filter-select:focus {
  outline: none;;
  border-color: #667eea;0.2s ease;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}enter;
ter;
.clear-filters-btn {
  padding: 0.5rem;;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;.clear-filters-btn:hover {
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;.clear-filters-btn i {
  justify-content: center;
  width: 32px;;
  height: 32px;
}
/* 文章树 */
.clear-filters-btn:hover {tree {
  background: #f3f4f6;
  color: #374151;-y: auto;
} 1.5rem;

.clear-filters-btn i {
  width: 14px;.tree-section {
  height: 14px;: 1rem;
}

/* 文章树 */.section-header {
.article-tree {
  flex: 1;enter;
  overflow-y: auto;
  padding: 0 1.5rem 1.5rem;
};

.tree-section {ne;
  margin-bottom: 1rem;0.2s ease;
}

.section-header {.section-header:hover {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  cursor: pointer;.icon-chevron {
  font-weight: 600;
  color: #374151;;
  user-select: none; 0.5rem;
  transition: color 0.2s ease; 0.2s ease;
}

.section-header:hover {
  color: #667eea;.icon-chevron.expanded {
}g);

.icon-chevron {
  width: 16px;.count {
  height: 16px;-left: auto;
  margin-right: 0.5rem;
  transition: transform 0.2s ease;
  display: inline-block;0;
}

.icon-chevron.expanded {.tree-list, .category-articles {
  transform: rotate(90deg);
}

.count {
  margin-left: auto;
  font-size: 12px;.tree-item {
  color: #64748b;lex;
  font-weight: 400;enter;
}rem;

.tree-list, .category-articles {px;
  list-style: none;
  padding: 0;s ease;
  margin: 0;
};
space-between;
.tree-item {
  display: flex;
  align-items: center;.tree-item:hover {
  padding: 0.5rem 0.75rem;5f9;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 2px;.tree-item.active {
  transition: all 0.2s ease;r-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 14px;
  min-height: 40px;
  justify-content: space-between;
}.tree-item-content {

.tree-item:hover {enter;
  background: #f1f5f9;
}pointer;

.tree-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);.tree-item-actions {
  color: white;
}

.tree-item-content { opacity 0.2s ease;
  display: flex;
  align-items: center;
  flex: 1;.tree-item:hover .tree-item-actions {
  cursor: pointer;
}

.tree-item-actions {.tree-action-btn {
  display: flex;
  gap: 0.25rem;;
  opacity: 0;
  transition: opacity 0.2s ease;gba(255, 255, 255, 0.9);
}

.tree-item:hover .tree-item-actions {
  opacity: 1;enter;
}ter;
e;
.tree-action-btn {
  width: 24px;
  height: 24px;
  border: none;.tree-action-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;.1);
  cursor: pointer;
  display: flex;
  align-items: center;.tree-action-btn.delete:hover {
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;
}
.tree-item.active .tree-action-btn {
.tree-action-btn:hover {2);
  background: white;
  transform: scale(1.1);
}
.tree-item.active .tree-action-btn:hover {
.tree-action-btn.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}.tree-item.active .tree-action-btn.delete:hover {

.tree-item.active .tree-action-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}.tree-item i {

.tree-item.active .tree-action-btn:hover {;
  background: rgba(255, 255, 255, 0.3); 0.5rem;
}

.tree-item.active .tree-action-btn.delete:hover {
  background: rgba(220, 38, 38, 0.2);.article-title {
  color: #fca5a5;
}ace: nowrap;

.tree-item i {lipsis;
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
  flex-shrink: 0;.article-date {
}px;

.article-title {0.5rem;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;.category-header {
  text-overflow: ellipsis;
  font-weight: 500;enter;
}rem;

.article-date {px;
  font-size: 12px;und 0.2s ease;
  opacity: 0.7;
  margin-left: 0.5rem;;
}

.category-header {.category-header:hover {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;.category-articles {
  border-radius: 6px;m;
  transition: background 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}/* 右侧文章展示区域 */
ay {
.category-header:hover {
  background: #f1f5f9;nd: white;
}x;
px rgba(0, 0, 0, 0.05);
.category-articles {
  margin-left: 1.5rem;
  margin-top: 0.25rem;: column;
}
alc(100vh - 120px);
/* 右侧文章展示区域 */
.article-display {
  flex: 1;.empty-state {
  background: white;
  border-radius: 12px; flex;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);: column;
  overflow: hidden;
  display: flex;ter;
  flex-direction: column;
  height: 100%;
  max-height: calc(100vh - 120px);
}

.empty-state {.empty-icon {
  flex: 1;x;
  display: flex;;
  flex-direction: column;1f5f9;
  align-items: center;
  justify-content: center;
  text-align: center;enter;
  padding: 4rem 2rem;ter;
  color: #64748b;
}

.empty-icon {.empty-icon i {
  width: 120px;px;
  height: 120px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;.empty-state h3 {
  align-items: center;;
  justify-content: center;rem;
  margin-bottom: 2rem;
}

.empty-icon i {.empty-state p {
  font-size: 48px;x;
  color: #cbd5e1;rem;
}

.empty-state h3 {
  font-size: 24px;.btn-primary {
  margin-bottom: 1rem;linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #374151;
}
rem 1.5rem;
.empty-state p {
  font-size: 16px;
  margin-bottom: 2rem;;
  max-width: 400px;
}
enter;
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);all 0.2s ease;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;.btn-primary:hover {
  border-radius: 8px;teY(-1px);
  font-size: 16px;102, 126, 234, 0.4);
  font-weight: 500;
  cursor: pointer;
  display: flex;/* 文章内容样式 */
  align-items: center;tent {
  gap: 0.5rem;
  transition: all 0.2s ease; flex;
}: column;

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);.article-header {
}rem 1rem;
 #e2e8f0;
/* 文章内容样式 */
.article-content {t: space-between;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}.article-meta {

.article-header {
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e2e8f0;.article-title {
  display: flex;x;
  justify-content: space-between;;
  align-items: flex-start;
  gap: 2rem;m 0;
}

.article-meta {
  flex: 1;.article-info {
};
p;
.article-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;.info-item {
  margin: 0 0 1rem 0;lex;
  line-height: 1.2;enter;
}
4px;
.article-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;.info-item i {
}
;
.info-item {
  display: flex;
  align-items: center;.status-published {
  gap: 0.5rem;
  font-size: 14px;
  color: #64748b;
}.status-draft {
b;
.info-item i {
  width: 16px;
  height: 16px;.status-archived {
}

.status-published {
  color: #10b981;.article-actions {
}

.status-draft {-y: auto;
  color: #f59e0b;
}vh;
x solid #e5e7eb;
.status-archived {
  color: #64748b;
}/* 评论切换按钮区域 */
le-section {
.article-actions {
.article-body {;
  flex: 2;lid #e5e7eb;
  overflow-y: auto;
  padding: 2rem;
  max-height: 60vh;
  border-bottom: 1px solid #e5e7eb;.comments-toggle-btn {
};

/* 评论切换按钮区域 */
.comments-toggle-section { 2rem;
  margin-top: 3rem;gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;: 2rem;
}
;
.comments-toggle-btn {
  display: inline-flex;0.3s ease;
  align-items: center;a(102, 126, 234, 0.3);
  gap: 0.75rem;
  padding: 1rem 2rem;center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;.comments-toggle-btn:hover {
  border-radius: 2rem;);
  font-size: 1rem;102, 126, 234, 0.4);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;.comments-toggle-btn.active {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);(135deg, #10b981 0%, #059669 100%);
  min-width: 200px;
  justify-content: center;
}
.comments-toggle-btn.active:hover {
.comments-toggle-btn:hover {85, 129, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}.comments-toggle-btn .icon-chevron {

.comments-toggle-btn.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);.comments-toggle-btn .icon-chevron.expanded {
}

.comments-toggle-btn.active:hover {olid #e2e8f0;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
};

.comments-toggle-btn .icon-chevron {
  transition: transform 0.3s ease;enter;
}ter;
e;
.comments-toggle-btn .icon-chevron.expanded {
  transform: rotate(180deg);
} height: 40px;
  border: 1px solid #e2e8f0;.btn-action:hover {
  background: white;fc;
  border-radius: 8px;1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;.btn-action.danger:hover {
  transition: all 0.2s ease;
  color: #64748b;a;
}

.btn-action:hover {
  background: #f8fafc;.article-body {
  border-color: #cbd5e1;
  color: #374151;-y: auto;
}
vh;
.btn-action.danger:hover {x solid #e5e7eb;
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;.content-preview {
};

.article-body {;
  flex: 2;
  overflow-y: auto;
  padding: 2rem;.content-preview h1,
  max-height: 60vh;
  border-bottom: 1px solid #e5e7eb;
}

.content-preview {{
  line-height: 1.7;
  color: #374151;m;
  font-size: 16px;em;
}

.content-preview h1,
.content-preview h2,.content-preview h2 {
.content-preview h3,
.content-preview h4,px solid #e2e8f0;
.content-preview h5,
.content-preview h6 {
  color: #1a202c;
  margin-top: 2rem;.content-preview p {
  margin-bottom: 1rem;m;
  font-weight: 600;
}
/* 图标样式 (使用CSS伪元素模拟图标) */
.content-preview h2 {ent: '+'; font-weight: bold; }
  font-size: 24px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem; }
}
 '📋'; }
.content-preview p {
  margin-bottom: 1rem;
}
}
/* 图标样式 (使用CSS伪元素模拟图标) */
.icon-plus::before { content: '+'; font-weight: bold; }}
.icon-search::before { content: '🔍'; } }
.icon-chevron::before { content: '▶'; }}
.icon-document::before { content: '📄'; }
.icon-folder::before { content: '📁'; }
.icon-document-empty::before { content: '📋'; }; }
.icon-calendar::before { content: '📅'; }
.icon-clock::before { content: '🕒'; }
.icon-tag::before { content: '🏷️'; }/* 分页控件样式 */
.icon-status::before { content: '⚪'; }container {
.icon-edit::before { content: '✏️'; }
.icon-share::before { content: '🔗'; } #e2e8f0;
.icon-delete::before { content: '🗑️'; }
.icon-settings::before { content: '⚙️'; }
.icon-logout::before { content: '🚪'; }
.icon-error::before { content: '❌'; }
.icon-refresh::before { content: '🔄'; }.pagination-info {
.icon-close::before { content: '✕'; }er;

/* 分页控件样式 */;
.pagination-container {.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;.pagination-controls {
  margin-top: auto;
}enter;
ce-between;
.pagination-info {
  text-align: center;
  color: #64748b;
  font-size: 12px;.pagination-btn {
  margin-bottom: 0.5rem; 0.75rem;
}b;

.pagination-controls {
  display: flex;
  align-items: center;;
  justify-content: space-between;
  gap: 0.5rem;0.2s ease;
}

.pagination-btn {.pagination-btn:hover:not(:disabled) {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;f;
  border-radius: 6px;
  background: white;
  color: #374151;.pagination-btn:disabled {
  font-size: 12px;
  cursor: pointer;llowed;
  transition: all 0.2s ease;
}
.pagination-current {
.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;0;
};

.pagination-btn:disabled {
  opacity: 0.5;/* 加载状态 */
  cursor: not-allowed;verlay {
}te;

.pagination-current {;
  font-size: 12px;;
  color: #6b7280;;
  font-weight: 500;: rgba(255, 255, 255, 0.8);
  padding: 0 0.5rem;
}enter;
ter;
/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;.loading-spinner {
  left: 0;
  right: 0;;
  bottom: 0;olid #e5e7eb;
  background: rgba(255, 255, 255, 0.8);eea;
  display: flex;
  align-items: center;linear infinite;
  justify-content: center;
  z-index: 10;
}@keyframes spin {
 rotate(0deg); }
.loading-spinner {); }
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;/* 新增：加载和错误状态样式 */
  border-top: 2px solid #667eea;rror-state {
  border-radius: 50%;
  animation: spin 1s linear infinite; flex;
}: column;

@keyframes spin {ter;
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 新增：加载和错误状态样式 */
.loading-state, .error-state {.loading-spinner-large {
  flex: 1;
  display: flex;;
  flex-direction: column;olid #e5e7eb;
  align-items: center;eea;
  justify-content: center;
  text-align: center;linear infinite;
  padding: 4rem 2rem;
  color: #64748b;
}
.error-icon {
.loading-spinner-large {x;
  width: 48px;;
  height: 48px;ef2f2;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #667eea;
  border-radius: 50%;enter;
  animation: spin 1s linear infinite;ter;
  margin-bottom: 2rem;
}

.error-icon {.error-icon i {
  width: 120px;px;
  height: 120px;
  background: #fef2f2;
  border-radius: 50%;
  display: flex;.btn-secondary {
  align-items: center;1f5f9;
  justify-content: center;
  margin-bottom: 2rem;id #e2e8f0;
}

.error-icon i {
  font-size: 48px;;
  color: #ef4444;
}
enter;
.btn-secondary {
  background: #f1f5f9;all 0.2s ease;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;.btn-secondary:hover {
  font-size: 16px;
  font-weight: 500;1;
  cursor: pointer;
  display: flex;
  align-items: center;/* 模态框样式修复 */
  gap: 0.5rem;y {
  transition: all 0.2s ease;d;
  margin-left: 1rem;
};
;
.btn-secondary:hover {;
  background: #e2e8f0;: rgba(0, 0, 0, 0.5);
  border-color: #cbd5e1;
}enter;
ter;
/* 模态框样式修复 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;.modal-content {
  right: 0;ite;
  bottom: 0;x;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;90vh;
  justify-content: center;
  z-index: 1000;e;
  padding: 20px;
}
.modal-header {
.modal-content {;
  background: white;enter;
  border-radius: 16px;ce-between;
  max-width: 600px;
  width: 100%;solid #e5e7eb;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;.modal-header h3 {
}
 18px;
.modal-header {;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;.close-btn {
  border-bottom: 1px solid #e5e7eb;: none;
}
px;
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;: 4px;
  color: #1f2937;s;
}

.close-btn {.close-btn:hover {
  background: none;4f6;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;/* 响应式设计 */
  padding: 4px;-width: 1024px) {
  border-radius: 4px;
  transition: all 0.2s;em;
}

.close-btn:hover {.sidebar {
  background: #f3f4f6;80px;
  color: #374151;
}

/* 响应式设计 */@media (max-width: 768px) {
@media (max-width: 1024px) {
  .main-content {: 0 1rem;
    padding: 0 1rem;
  }
  .brand-name {
  .sidebar {24px;
    width: 280px;
  }
}.main-content {
n: column;
@media (max-width: 768px) {
  .navbar {
    padding: 0 1rem;
  }.sidebar {
  00%;
  .brand-name {x;
    font-size: 24px;
  }
  .article-title {
  .main-content {x;
    flex-direction: column;
    gap: 1rem;
  }.article-header {
   column;
  .sidebar {
    width: 100%;
    height: 300px;
  }
  .article-actions {
  .article-title {-end;
    font-size: 24px;
  }
  
  .article-header {/* 滚动条样式 */
    flex-direction: column;ee::-webkit-scrollbar,
    align-items: stretch;{
    gap: 1rem;
  }
  
  .article-actions {.article-tree::-webkit-scrollbar-track,
    align-self: flex-end;{
  }
}

/* 滚动条样式 */
.article-tree::-webkit-scrollbar,.article-tree::-webkit-scrollbar-thumb,
.article-body::-webkit-scrollbar {{
  width: 6px;
}

.article-tree::-webkit-scrollbar-track,
.article-body::-webkit-scrollbar-track {.article-tree::-webkit-scrollbar-thumb:hover,
  background: #f1f5f9;{
  border-radius: 3px;
}

.article-tree::-webkit-scrollbar-thumb,/* 评论区域样式 */
.article-body::-webkit-scrollbar-thumb {ments-section {
  background: #cbd5e1;
  border-radius: 3px;afafa;
} 0.3s ease-out;

.article-tree::-webkit-scrollbar-thumb:hover,
.article-body::-webkit-scrollbar-thumb:hover {@keyframes slideDown {
  background: #94a3b8;
}ity: 0;
translateY(-20px);
/* 评论区域样式 */
.article-comments-section {o {
  padding: 2rem;acity: 1;
  background: #fafafa;translateY(0);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {.icon-comment::before {
  from {
    opacity: 0;
    transform: translateY(-20px);/style>  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon-comment::before {
  content: "💬";
}
</style>